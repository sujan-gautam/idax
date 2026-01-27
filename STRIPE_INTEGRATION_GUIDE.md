# Stripe Integration - Complete Implementation Guide

## ✅ COMPLETED COMPONENTS

### 1. Database Schema (`subscription_schema.prisma`)
**Status**: ✅ Ready to merge

**Models Created**:
- `Subscription` - Main subscription record
- `Invoice` - Invoice history
- `PaymentMethod` - Stored payment methods
- `UsageRecord` - Usage tracking for quotas

**Next Step**: Merge into main `schema.prisma` and run migration

---

### 2. Stripe Configuration (`stripe_config.py`)
**Status**: ✅ Production-Ready

**Price IDs Configured**:
```python
PRO_MONTHLY = "price_1SrMhiIscbXq4baSfGQ1Hbnu"   # $19/month
PRO_YEARLY = "price_1SrMmwIscbXq4baS1BDK8RA3"    # $190/year (17% savings)
PREMIUM_MONTHLY = "price_1SrMoaIscbXq4baS3xo5ihEs"  # $49/month
PREMIUM_YEARLY = "price_1SrMpbIscbXq4baSFK5A1wmv"   # $490/year (17% savings)
```

**Plan Features**:
- **FREE**: 1 dataset, 100MB, overview + limited preview
- **PRO**: 10 datasets, 10GB, all analysis features
- **PREMIUM**: Unlimited datasets, 100GB, enterprise features

---

### 3. Stripe Service (`stripe_service.py`)
**Status**: ✅ Production-Ready

**Methods Implemented**:
- ✅ `create_customer()` - Create Stripe customer
- ✅ `create_checkout_session()` - Start subscription flow
- ✅ `create_billing_portal_session()` - Manage subscription
- ✅ `get_subscription()` - Fetch subscription details
- ✅ `cancel_subscription()` - Cancel with/without proration
- ✅ `reactivate_subscription()` - Undo cancellation
- ✅ `update_subscription()` - Upgrade/downgrade
- ✅ `get_upcoming_invoice()` - Preview next charge
- ✅ `list_invoices()` - Invoice history
- ✅ `construct_webhook_event()` - Verify webhooks
- ✅ `get_payment_methods()` - List cards
- ✅ `set_default_payment_method()` - Update default card

---

### 4. Billing API (`billing.py`)
**Status**: ✅ Production-Ready

**Endpoints**:
```
POST   /billing/checkout           - Create checkout session
POST   /billing/portal             - Open billing portal
GET    /billing/subscription       - Get current subscription
POST   /billing/subscription/cancel - Cancel subscription
POST   /billing/subscription/reactivate - Reactivate subscription
POST   /billing/subscription/upgrade - Change plan
GET    /billing/invoices           - List invoices
POST   /billing/webhook            - Stripe webhook handler
```

**Webhook Events Handled**:
- ✅ `customer.subscription.created`
- ✅ `customer.subscription.updated`
- ✅ `customer.subscription.deleted`
- ✅ `invoice.paid`
- ✅ `invoice.payment_failed`

---

### 5. Pricing Page (`Pricing.tsx`)
**Status**: ✅ Production-Ready

**Features**:
- ✅ Professional pricing table
- ✅ Monthly/yearly toggle
- ✅ Savings badge (17% for yearly)
- ✅ Feature comparison
- ✅ Stripe Checkout integration
- ✅ 14-day free trial
- ✅ Loading states
- ✅ Dark mode support

---

## 🔧 SETUP INSTRUCTIONS

### Step 1: Environment Variables

Add to `.env`:
```bash
# Stripe Keys (from Stripe Dashboard)
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

**Where to find**:
1. Go to https://dashboard.stripe.com/apikeys
2. Copy "Secret key" → `STRIPE_SECRET_KEY`
3. Copy "Publishable key" → `STRIPE_PUBLISHABLE_KEY`
4. Go to https://dashboard.stripe.com/webhooks
5. Create endpoint: `https://yourdomain.com/api/billing/webhook`
6. Copy "Signing secret" → `STRIPE_WEBHOOK_SECRET`

---

### Step 2: Database Migration

```bash
# 1. Merge subscription schema into main schema.prisma
# Add the models from subscription_schema.prisma

# 2. Create migration
npx prisma migrate dev --name add_subscriptions

# 3. Generate Prisma client
npx prisma generate
```

---

### Step 3: Stripe Dashboard Configuration

#### 1. Create Products (if not already created)
- Go to https://dashboard.stripe.com/products
- Verify products exist:
  - "Pro Monthly" - $19/month
  - "Pro Yearly" - $190/year
  - "Premium Monthly" - $49/month
  - "Premium Yearly" - $490/year

#### 2. Configure Webhook
- Go to https://dashboard.stripe.com/webhooks
- Click "Add endpoint"
- Endpoint URL: `https://yourdomain.com/api/billing/webhook`
- Events to send:
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.paid`
  - `invoice.payment_failed`
  - `customer.subscription.trial_will_end`

#### 3. Configure Billing Portal
- Go to https://dashboard.stripe.com/settings/billing/portal
- Enable customer portal
- Configure allowed actions:
  - ✅ Update payment method
  - ✅ Cancel subscription
  - ✅ Update subscription (upgrade/downgrade)
  - ✅ View invoice history

---

### Step 4: Test Mode

**Use Stripe Test Cards**:
```
Success: 4242 4242 4242 4242
Decline: 4000 0000 0000 0002
3D Secure: 4000 0025 0000 3155
```

**Test Flow**:
1. Go to `/pricing`
2. Click "Start Pro Trial"
3. Use test card: `4242 4242 4242 4242`
4. Expiry: Any future date
5. CVC: Any 3 digits
6. ZIP: Any 5 digits

---

## 📊 USAGE EXAMPLES

### Frontend: Subscribe to Pro

```tsx
import { api } from '../services/api';

const handleSubscribe = async () => {
  const response = await api.post('/billing/checkout', {
    plan: 'PRO',
    interval: 'monthly',
    success_url: `${window.location.origin}/dashboard?checkout=success`,
    cancel_url: `${window.location.origin}/pricing`,
    trial_days: 14,
  });

  // Redirect to Stripe Checkout
  window.location.href = response.data.url;
};
```

---

### Frontend: Open Billing Portal

```tsx
const handleManageBilling = async () => {
  const response = await api.post('/billing/portal', {
    return_url: window.location.href,
  });

  // Redirect to Stripe portal
  window.location.href = response.data.url;
};
```

---

### Frontend: Check Subscription

```tsx
const { data: subscription } = useQuery(['subscription'], async () => {
  const response = await api.get('/billing/subscription');
  return response.data;
});

// subscription.plan = "PRO" | "PREMIUM" | "FREE"
// subscription.status = "ACTIVE" | "CANCELED" | "PAST_DUE"
```

---

### Backend: Check Feature Access

```python
from ..config.stripe_config import check_feature_access

# In your endpoint
if not check_feature_access(current_user.tenant.plan, "distributions"):
    raise HTTPException(
        status_code=403,
        detail="This feature requires PRO or PREMIUM tier"
    )
```

---

### Backend: Check Quota

```python
from ..config.stripe_config import check_quota

# Check if user can create more datasets
if not check_quota(current_user.tenant.plan, "datasets", current_count):
    raise HTTPException(
        status_code=403,
        detail="Dataset limit reached. Upgrade to create more."
    )
```

---

## 🎯 MONETIZATION FLOW

### New User Journey

1. **Sign Up** → FREE plan
2. **Explore** → Use overview + limited preview
3. **Hit Paywall** → Try to use distributions
4. **See Value** → Understand what PRO offers
5. **Start Trial** → 14-day free trial (no card required)
6. **Convert** → Card charged after trial

---

### Upgrade Flow

1. User clicks "Upgrade to PRO"
2. Redirect to Stripe Checkout
3. Enter payment details
4. Subscription created
5. Webhook updates database
6. User immediately gets PRO features

---

### Cancellation Flow

1. User clicks "Manage Billing"
2. Opens Stripe billing portal
3. Clicks "Cancel subscription"
4. Choose: Cancel now OR at period end
5. Webhook updates database
6. User downgraded to FREE (now or at period end)

---

## 🔒 SECURITY BEST PRACTICES

### ✅ Implemented

1. **Webhook Signature Verification**
   - All webhooks verified with `STRIPE_WEBHOOK_SECRET`
   - Prevents fake webhook attacks

2. **Customer Metadata**
   - `tenant_id` stored in Stripe customer metadata
   - Links Stripe customer to your database

3. **Idempotency**
   - Webhook handlers check existing records
   - Prevents duplicate processing

4. **Error Handling**
   - All Stripe API calls wrapped in try/catch
   - Detailed logging for debugging

---

### 🔐 Additional Recommendations

1. **Rate Limiting**
   - Add rate limits to billing endpoints
   - Prevent abuse

2. **Audit Logging**
   - Log all subscription changes
   - Track who upgraded/downgraded

3. **Email Notifications**
   - Send emails on subscription events
   - Payment failed, trial ending, etc.

---

## 📈 ANALYTICS & METRICS

### Key Metrics to Track

1. **Conversion Rate**
   - FREE → PRO: Target 5%
   - PRO → PREMIUM: Target 10%

2. **Churn Rate**
   - Monthly churn: Target < 5%
   - Yearly churn: Target < 3%

3. **MRR (Monthly Recurring Revenue)**
   - Track growth month-over-month
   - Target: 20% MoM growth

4. **LTV (Lifetime Value)**
   - Average revenue per customer
   - Calculate: (ARPU × Gross Margin) / Churn Rate

---

### Stripe Dashboard Metrics

Available at https://dashboard.stripe.com/dashboard:
- Total revenue
- Active subscriptions
- Failed payments
- Churn rate
- MRR growth

---

## 🚀 GO-LIVE CHECKLIST

### Before Production

- [ ] Switch to live Stripe keys
- [ ] Update webhook URL to production domain
- [ ] Test all subscription flows in production
- [ ] Verify webhook events are received
- [ ] Test payment failure scenarios
- [ ] Configure email notifications
- [ ] Set up monitoring/alerts
- [ ] Document customer support procedures

---

### Post-Launch

- [ ] Monitor webhook delivery
- [ ] Track conversion rates
- [ ] Analyze failed payments
- [ ] Gather user feedback
- [ ] Optimize pricing if needed
- [ ] A/B test trial lengths

---

## 💡 FUTURE ENHANCEMENTS

### Phase 2 Features

1. **Usage-Based Billing**
   - Charge per dataset or API call
   - Implement with Stripe metered billing

2. **Add-Ons**
   - Extra storage: $5/10GB
   - Extra datasets: $2/dataset
   - Priority support: $10/month

3. **Team Plans**
   - Per-seat pricing
   - Team management UI
   - Role-based billing

4. **Annual Discounts**
   - Offer custom discounts
   - Promotional codes
   - Referral program

---

## 📞 SUPPORT

### Stripe Resources

- Dashboard: https://dashboard.stripe.com
- Documentation: https://stripe.com/docs
- API Reference: https://stripe.com/docs/api
- Support: https://support.stripe.com

### Internal Resources

- Billing API: `/api/billing/*`
- Stripe Config: `apps/api/src/config/stripe_config.py`
- Stripe Service: `apps/api/src/services/stripe_service.py`

---

**Status**: ✅ Production-Ready
**Last Updated**: 2026-01-22
**Integration Complexity**: Complete
**Estimated Setup Time**: 2-3 hours
