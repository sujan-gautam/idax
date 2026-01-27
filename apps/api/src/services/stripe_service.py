"""
Stripe Service - Subscription Management
Handles all Stripe operations for billing
"""

import stripe
from typing import Optional, Dict, Any
from datetime import datetime
import logging

from ..config.stripe_config import (
    STRIPE_SECRET_KEY,
    PLAN_CONFIG,
    get_plan_from_price_id,
    get_price_id,
)

stripe.api_key = STRIPE_SECRET_KEY
logger = logging.getLogger(__name__)


class StripeService:
    """Service for managing Stripe subscriptions"""
    
    @staticmethod
    async def create_customer(
        email: str,
        name: str,
        tenant_id: str,
        metadata: Optional[Dict] = None
    ) -> stripe.Customer:
        """Create a Stripe customer"""
        try:
            customer = stripe.Customer.create(
                email=email,
                name=name,
                metadata={
                    "tenant_id": tenant_id,
                    **(metadata or {})
                }
            )
            logger.info(f"Created Stripe customer: {customer.id}")
            return customer
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create customer: {e}")
            raise
    
    @staticmethod
    async def create_checkout_session(
        customer_id: str,
        price_id: str,
        success_url: str,
        cancel_url: str,
        trial_days: int = 0,
        metadata: Optional[Dict] = None
    ) -> stripe.checkout.Session:
        """Create a Stripe Checkout session"""
        try:
            session_params = {
                "customer": customer_id,
                "payment_method_types": ["card"],
                "line_items": [{
                    "price": price_id,
                    "quantity": 1,
                }],
                "mode": "subscription",
                "success_url": success_url,
                "cancel_url": cancel_url,
                "metadata": metadata or {},
            }
            
            if trial_days > 0:
                session_params["subscription_data"] = {
                    "trial_period_days": trial_days
                }
            
            session = stripe.checkout.Session.create(**session_params)
            logger.info(f"Created checkout session: {session.id}")
            return session
            
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create checkout session: {e}")
            raise
    
    @staticmethod
    async def create_billing_portal_session(
        customer_id: str,
        return_url: str
    ) -> stripe.billing_portal.Session:
        """Create a billing portal session for customer to manage subscription"""
        try:
            session = stripe.billing_portal.Session.create(
                customer=customer_id,
                return_url=return_url,
            )
            return session
        except stripe.error.StripeError as e:
            logger.error(f"Failed to create portal session: {e}")
            raise
    
    @staticmethod
    async def get_subscription(subscription_id: str) -> stripe.Subscription:
        """Get subscription details"""
        try:
            return stripe.Subscription.retrieve(subscription_id)
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve subscription: {e}")
            raise
    
    @staticmethod
    async def cancel_subscription(
        subscription_id: str,
        at_period_end: bool = True
    ) -> stripe.Subscription:
        """Cancel a subscription"""
        try:
            if at_period_end:
                subscription = stripe.Subscription.modify(
                    subscription_id,
                    cancel_at_period_end=True
                )
            else:
                subscription = stripe.Subscription.delete(subscription_id)
            
            logger.info(f"Canceled subscription: {subscription_id}")
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to cancel subscription: {e}")
            raise
    
    @staticmethod
    async def reactivate_subscription(subscription_id: str) -> stripe.Subscription:
        """Reactivate a canceled subscription"""
        try:
            subscription = stripe.Subscription.modify(
                subscription_id,
                cancel_at_period_end=False
            )
            logger.info(f"Reactivated subscription: {subscription_id}")
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to reactivate subscription: {e}")
            raise
    
    @staticmethod
    async def update_subscription(
        subscription_id: str,
        new_price_id: str,
        proration_behavior: str = "create_prorations"
    ) -> stripe.Subscription:
        """Update subscription to a different plan"""
        try:
            subscription = stripe.Subscription.retrieve(subscription_id)
            
            subscription = stripe.Subscription.modify(
                subscription_id,
                items=[{
                    "id": subscription["items"]["data"][0].id,
                    "price": new_price_id,
                }],
                proration_behavior=proration_behavior,
            )
            
            logger.info(f"Updated subscription {subscription_id} to price {new_price_id}")
            return subscription
        except stripe.error.StripeError as e:
            logger.error(f"Failed to update subscription: {e}")
            raise
    
    @staticmethod
    async def get_upcoming_invoice(customer_id: str) -> Optional[stripe.Invoice]:
        """Get the upcoming invoice for a customer"""
        try:
            return stripe.Invoice.upcoming(customer=customer_id)
        except stripe.error.InvalidRequestError:
            # No upcoming invoice
            return None
        except stripe.error.StripeError as e:
            logger.error(f"Failed to retrieve upcoming invoice: {e}")
            raise
    
    @staticmethod
    async def list_invoices(
        customer_id: str,
        limit: int = 10
    ) -> list[stripe.Invoice]:
        """List invoices for a customer"""
        try:
            invoices = stripe.Invoice.list(
                customer=customer_id,
                limit=limit
            )
            return invoices.data
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list invoices: {e}")
            raise
    
    @staticmethod
    def construct_webhook_event(
        payload: bytes,
        sig_header: str,
        webhook_secret: str
    ) -> stripe.Event:
        """Construct and verify webhook event"""
        try:
            event = stripe.Webhook.construct_event(
                payload, sig_header, webhook_secret
            )
            return event
        except ValueError as e:
            logger.error(f"Invalid payload: {e}")
            raise
        except stripe.error.SignatureVerificationError as e:
            logger.error(f"Invalid signature: {e}")
            raise
    
    @staticmethod
    async def get_payment_methods(customer_id: str) -> list[stripe.PaymentMethod]:
        """Get customer's payment methods"""
        try:
            payment_methods = stripe.PaymentMethod.list(
                customer=customer_id,
                type="card",
            )
            return payment_methods.data
        except stripe.error.StripeError as e:
            logger.error(f"Failed to list payment methods: {e}")
            raise
    
    @staticmethod
    async def set_default_payment_method(
        customer_id: str,
        payment_method_id: str
    ) -> stripe.Customer:
        """Set default payment method for customer"""
        try:
            customer = stripe.Customer.modify(
                customer_id,
                invoice_settings={
                    "default_payment_method": payment_method_id
                }
            )
            return customer
        except stripe.error.StripeError as e:
            logger.error(f"Failed to set default payment method: {e}")
            raise
    
    @staticmethod
    def format_subscription_data(subscription: stripe.Subscription) -> Dict[str, Any]:
        """Format Stripe subscription data for database"""
        plan, interval = get_plan_from_price_id(
            subscription["items"]["data"][0]["price"]["id"]
        )
        
        return {
            "stripe_subscription_id": subscription.id,
            "stripe_price_id": subscription["items"]["data"][0]["price"]["id"],
            "plan": plan,
            "status": subscription.status.upper(),
            "billing_interval": interval.upper() if interval else None,
            "current_period_start": datetime.fromtimestamp(subscription.current_period_start),
            "current_period_end": datetime.fromtimestamp(subscription.current_period_end),
            "cancel_at_period_end": subscription.cancel_at_period_end,
            "canceled_at": datetime.fromtimestamp(subscription.canceled_at) if subscription.canceled_at else None,
            "trial_end": datetime.fromtimestamp(subscription.trial_end) if subscription.trial_end else None,
        }
    
    @staticmethod
    def format_invoice_data(invoice: stripe.Invoice) -> Dict[str, Any]:
        """Format Stripe invoice data for database"""
        return {
            "stripe_invoice_id": invoice.id,
            "stripe_invoice_url": invoice.hosted_invoice_url,
            "stripe_pdf_url": invoice.invoice_pdf,
            "amount_due": invoice.amount_due,
            "amount_paid": invoice.amount_paid,
            "currency": invoice.currency,
            "status": invoice.status,
            "period_start": datetime.fromtimestamp(invoice.period_start),
            "period_end": datetime.fromtimestamp(invoice.period_end),
            "due_date": datetime.fromtimestamp(invoice.due_date) if invoice.due_date else None,
            "paid_at": datetime.fromtimestamp(invoice.status_transitions.paid_at) if invoice.status_transitions.paid_at else None,
        }
