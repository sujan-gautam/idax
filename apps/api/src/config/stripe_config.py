"""
Stripe Configuration and Pricing
Production-ready billing system
"""

import os
from enum import Enum
from typing import Dict, List

# Stripe API Keys
STRIPE_SECRET_KEY = os.getenv("STRIPE_SECRET_KEY")
STRIPE_PUBLISHABLE_KEY = os.getenv("STRIPE_PUBLISHABLE_KEY")
STRIPE_WEBHOOK_SECRET = os.getenv("STRIPE_WEBHOOK_SECRET")

# Price IDs from Stripe Dashboard
class StripePriceId(str, Enum):
    """Stripe Price IDs"""
    PRO_MONTHLY = "price_1SrMhiIscbXq4baSfGQ1Hbnu"   # $19/month
    PRO_YEARLY = "price_1SrMmwIscbXq4baS1BDK8RA3"    # $190/year
    PREMIUM_MONTHLY = "price_1SrMoaIscbXq4baS3xo5ihEs"  # $49/month
    PREMIUM_YEARLY = "price_1SrMpbIscbXq4baSFK5A1wmv"   # $490/year


# Plan Configuration
PLAN_CONFIG = {
    "FREE": {
        "name": "Free",
        "price": 0,
        "features": {
            "datasets": 1,
            "storage_gb": 0.1,  # 100 MB
            "api_calls_per_month": 100,
            "eda_runs_per_month": 10,
            "features": ["overview", "preview_limited"],
        },
        "stripe_price_id": None,
    },
    "PRO": {
        "name": "Pro",
        "monthly": {
            "price": 19,
            "stripe_price_id": StripePriceId.PRO_MONTHLY,
            "interval": "month",
        },
        "yearly": {
            "price": 190,
            "stripe_price_id": StripePriceId.PRO_YEARLY,
            "interval": "year",
            "savings": "17%",  # (19*12 - 190) / (19*12) * 100
        },
        "features": {
            "datasets": 10,
            "storage_gb": 10,
            "api_calls_per_month": 10000,
            "eda_runs_per_month": 100,
            "features": [
                "overview",
                "preview",
                "distributions",
                "correlations",
                "outliers",
                "preprocessing",
                "export",
            ],
        },
    },
    "PREMIUM": {
        "name": "Premium",
        "monthly": {
            "price": 49,
            "stripe_price_id": StripePriceId.PREMIUM_MONTHLY,
            "interval": "month",
        },
        "yearly": {
            "price": 490,
            "stripe_price_id": StripePriceId.PREMIUM_YEARLY,
            "interval": "year",
            "savings": "17%",  # (49*12 - 490) / (49*12) * 100
        },
        "features": {
            "datasets": -1,  # unlimited
            "storage_gb": 100,
            "api_calls_per_month": 100000,
            "eda_runs_per_month": -1,  # unlimited
            "features": [
                "overview",
                "preview",
                "distributions",
                "correlations",
                "outliers",
                "preprocessing",
                "data_quality",
                "versions",
                "api_access",
                "approval_workflows",
                "audit_logs",
                "priority_support",
                "export",
            ],
        },
    },
}


def get_plan_from_price_id(price_id: str) -> tuple[str, str]:
    """
    Get plan and interval from Stripe price ID
    Returns: (plan_name, interval)
    """
    if price_id == StripePriceId.PRO_MONTHLY:
        return ("PRO", "monthly")
    elif price_id == StripePriceId.PRO_YEARLY:
        return ("PRO", "yearly")
    elif price_id == StripePriceId.PREMIUM_MONTHLY:
        return ("PREMIUM", "monthly")
    elif price_id == StripePriceId.PREMIUM_YEARLY:
        return ("PREMIUM", "yearly")
    else:
        return ("FREE", None)


def get_price_id(plan: str, interval: str) -> str:
    """Get Stripe price ID for plan and interval"""
    if plan == "PRO":
        return (
            StripePriceId.PRO_MONTHLY
            if interval == "monthly"
            else StripePriceId.PRO_YEARLY
        )
    elif plan == "PREMIUM":
        return (
            StripePriceId.PREMIUM_MONTHLY
            if interval == "monthly"
            else StripePriceId.PREMIUM_YEARLY
        )
    return None


def check_feature_access(plan: str, feature: str) -> bool:
    """Check if a plan has access to a feature"""
    if plan not in PLAN_CONFIG:
        return False
    
    plan_features = PLAN_CONFIG[plan]["features"].get("features", [])
    return feature in plan_features


def check_quota(plan: str, metric: str, current_usage: int) -> bool:
    """Check if usage is within quota"""
    if plan not in PLAN_CONFIG:
        return False
    
    quota = PLAN_CONFIG[plan]["features"].get(metric, 0)
    
    # -1 means unlimited
    if quota == -1:
        return True
    
    return current_usage < quota


# Webhook event types to handle
STRIPE_WEBHOOK_EVENTS = [
    "customer.subscription.created",
    "customer.subscription.updated",
    "customer.subscription.deleted",
    "invoice.paid",
    "invoice.payment_failed",
    "customer.subscription.trial_will_end",
]
