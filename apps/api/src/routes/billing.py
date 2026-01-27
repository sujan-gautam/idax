"""
Billing API Routes - Stripe Integration
Handles subscription management and payments
"""

from fastapi import APIRouter, Depends, HTTPException, Request, Header
from sqlalchemy.orm import Session
from typing import Optional
import logging

from ..database import get_db
from ..models import User, Tenant, Subscription
from ..auth import get_current_user
from ..services.stripe_service import StripeService
from ..config.stripe_config import STRIPE_WEBHOOK_SECRET, PLAN_CONFIG, get_price_id
from ..schemas import (
    CheckoutSessionRequest,
    CheckoutSessionResponse,
    SubscriptionResponse,
    InvoiceResponse,
)

router = APIRouter(prefix="/billing", tags=["Billing"])
logger = logging.getLogger(__name__)
stripe_service = StripeService()


@router.post("/checkout")
async def create_checkout_session(
    request: CheckoutSessionRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create Stripe Checkout session for subscription
    """
    # Get or create Stripe customer
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    
    if not subscription:
        # Create new customer
        customer = await stripe_service.create_customer(
            email=current_user.email,
            name=current_user.tenant.name,
            tenant_id=current_user.tenant_id
        )
        
        # Create subscription record
        subscription = Subscription(
            tenant_id=current_user.tenant_id,
            stripe_customer_id=customer.id,
            plan="FREE",
            status="ACTIVE"
        )
        db.add(subscription)
        db.commit()
    
    # Get price ID
    price_id = get_price_id(request.plan, request.interval)
    if not price_id:
        raise HTTPException(status_code=400, detail="Invalid plan or interval")
    
    # Create checkout session
    session = await stripe_service.create_checkout_session(
        customer_id=subscription.stripe_customer_id,
        price_id=price_id,
        success_url=request.success_url,
        cancel_url=request.cancel_url,
        trial_days=request.trial_days or 0,
        metadata={
            "tenant_id": current_user.tenant_id,
            "plan": request.plan,
            "interval": request.interval,
        }
    )
    
    return {
        "session_id": session.id,
        "url": session.url
    }


@router.post("/portal")
async def create_portal_session(
    return_url: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Create Stripe billing portal session
    """
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    
    if not subscription or not subscription.stripe_customer_id:
        raise HTTPException(status_code=404, detail="No subscription found")
    
    session = await stripe_service.create_billing_portal_session(
        customer_id=subscription.stripe_customer_id,
        return_url=return_url
    )
    
    return {"url": session.url}


@router.get("/subscription")
async def get_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Get current subscription details
    """
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    
    if not subscription:
        return {
            "plan": "FREE",
            "status": "ACTIVE",
            "features": PLAN_CONFIG["FREE"]["features"]
        }
    
    # Get latest from Stripe if active subscription
    if subscription.stripe_subscription_id:
        try:
            stripe_sub = await stripe_service.get_subscription(
                subscription.stripe_subscription_id
            )
            
            # Update local record
            sub_data = stripe_service.format_subscription_data(stripe_sub)
            for key, value in sub_data.items():
                setattr(subscription, key, value)
            db.commit()
            
        except Exception as e:
            logger.error(f"Failed to sync subscription: {e}")
    
    return {
        "plan": subscription.plan,
        "status": subscription.status,
        "billing_interval": subscription.billing_interval,
        "current_period_start": subscription.current_period_start,
        "current_period_end": subscription.current_period_end,
        "cancel_at_period_end": subscription.cancel_at_period_end,
        "features": PLAN_CONFIG.get(subscription.plan, {}).get("features", {})
    }


@router.post("/subscription/cancel")
async def cancel_subscription(
    at_period_end: bool = True,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Cancel subscription
    """
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    
    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(status_code=404, detail="No active subscription")
    
    # Cancel in Stripe
    stripe_sub = await stripe_service.cancel_subscription(
        subscription.stripe_subscription_id,
        at_period_end=at_period_end
    )
    
    # Update local record
    subscription.cancel_at_period_end = at_period_end
    if not at_period_end:
        subscription.status = "CANCELED"
        subscription.plan = "FREE"
    
    db.commit()
    
    return {"message": "Subscription canceled successfully"}


@router.post("/subscription/reactivate")
async def reactivate_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Reactivate a canceled subscription
    """
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    
    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(status_code=404, detail="No subscription found")
    
    if not subscription.cancel_at_period_end:
        raise HTTPException(status_code=400, detail="Subscription is not canceled")
    
    # Reactivate in Stripe
    await stripe_service.reactivate_subscription(subscription.stripe_subscription_id)
    
    # Update local record
    subscription.cancel_at_period_end = False
    db.commit()
    
    return {"message": "Subscription reactivated successfully"}


@router.post("/subscription/upgrade")
async def upgrade_subscription(
    plan: str,
    interval: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upgrade/downgrade subscription
    """
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    
    if not subscription or not subscription.stripe_subscription_id:
        raise HTTPException(status_code=404, detail="No active subscription")
    
    # Get new price ID
    new_price_id = get_price_id(plan, interval)
    if not new_price_id:
        raise HTTPException(status_code=400, detail="Invalid plan or interval")
    
    # Update in Stripe
    stripe_sub = await stripe_service.update_subscription(
        subscription.stripe_subscription_id,
        new_price_id
    )
    
    # Update local record
    sub_data = stripe_service.format_subscription_data(stripe_sub)
    for key, value in sub_data.items():
        setattr(subscription, key, value)
    db.commit()
    
    return {"message": "Subscription updated successfully"}


@router.get("/invoices")
async def list_invoices(
    limit: int = 10,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    List invoices for current user
    """
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == current_user.tenant_id
    ).first()
    
    if not subscription or not subscription.stripe_customer_id:
        return []
    
    invoices = await stripe_service.list_invoices(
        subscription.stripe_customer_id,
        limit=limit
    )
    
    return [
        {
            "id": inv.id,
            "amount": inv.amount_due / 100,  # Convert cents to dollars
            "currency": inv.currency,
            "status": inv.status,
            "period_start": inv.period_start,
            "period_end": inv.period_end,
            "invoice_url": inv.hosted_invoice_url,
            "pdf_url": inv.invoice_pdf,
        }
        for inv in invoices
    ]


@router.post("/webhook")
async def stripe_webhook(
    request: Request,
    stripe_signature: str = Header(None, alias="stripe-signature"),
    db: Session = Depends(get_db)
):
    """
    Handle Stripe webhooks
    """
    payload = await request.body()
    
    try:
        event = stripe_service.construct_webhook_event(
            payload,
            stripe_signature,
            STRIPE_WEBHOOK_SECRET
        )
    except Exception as e:
        logger.error(f"Webhook signature verification failed: {e}")
        raise HTTPException(status_code=400, detail="Invalid signature")
    
    # Handle different event types
    if event.type == "customer.subscription.created":
        await handle_subscription_created(event.data.object, db)
    elif event.type == "customer.subscription.updated":
        await handle_subscription_updated(event.data.object, db)
    elif event.type == "customer.subscription.deleted":
        await handle_subscription_deleted(event.data.object, db)
    elif event.type == "invoice.paid":
        await handle_invoice_paid(event.data.object, db)
    elif event.type == "invoice.payment_failed":
        await handle_invoice_payment_failed(event.data.object, db)
    
    return {"status": "success"}


async def handle_subscription_created(subscription_data, db: Session):
    """Handle subscription.created webhook"""
    tenant_id = subscription_data.metadata.get("tenant_id")
    if not tenant_id:
        return
    
    subscription = db.query(Subscription).filter(
        Subscription.tenant_id == tenant_id
    ).first()
    
    if subscription:
        sub_data = stripe_service.format_subscription_data(subscription_data)
        for key, value in sub_data.items():
            setattr(subscription, key, value)
        
        # Update tenant plan
        tenant = db.query(Tenant).filter(Tenant.id == tenant_id).first()
        if tenant:
            tenant.plan = sub_data["plan"]
        
        db.commit()
        logger.info(f"Subscription created for tenant {tenant_id}")


async def handle_subscription_updated(subscription_data, db: Session):
    """Handle subscription.updated webhook"""
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_data.id
    ).first()
    
    if subscription:
        sub_data = stripe_service.format_subscription_data(subscription_data)
        for key, value in sub_data.items():
            setattr(subscription, key, value)
        
        # Update tenant plan
        tenant = db.query(Tenant).filter(Tenant.id == subscription.tenant_id).first()
        if tenant:
            tenant.plan = sub_data["plan"]
        
        db.commit()
        logger.info(f"Subscription updated: {subscription.id}")


async def handle_subscription_deleted(subscription_data, db: Session):
    """Handle subscription.deleted webhook"""
    subscription = db.query(Subscription).filter(
        Subscription.stripe_subscription_id == subscription_data.id
    ).first()
    
    if subscription:
        subscription.status = "CANCELED"
        subscription.plan = "FREE"
        
        # Downgrade tenant to FREE
        tenant = db.query(Tenant).filter(Tenant.id == subscription.tenant_id).first()
        if tenant:
            tenant.plan = "FREE"
        
        db.commit()
        logger.info(f"Subscription deleted: {subscription.id}")


async def handle_invoice_paid(invoice_data, db: Session):
    """Handle invoice.paid webhook"""
    logger.info(f"Invoice paid: {invoice_data.id}")
    # Could store invoice record in database here


async def handle_invoice_payment_failed(invoice_data, db: Session):
    """Handle invoice.payment_failed webhook"""
    logger.warning(f"Invoice payment failed: {invoice_data.id}")
    # Could send notification to user
