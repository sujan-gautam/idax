# Billing Service Setup Guide

## Overview
The billing service provides full Stripe integration for subscription management, payment processing, and usage tracking.

## Prerequisites
1. Stripe account (sign up at https://stripe.com)
2. Stripe CLI for webhook testing (optional but recommended)

## Environment Variables

Add the following to your `.env` file:

```env
# Stripe Configuration
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_publishable_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here

# Stripe Price IDs (create these in your Stripe Dashboard)
STRIPE_PRICE_PRO_MONTHLY=price_xxx
STRIPE_PRICE_PRO_YEARLY=price_xxx
STRIPE_PRICE_ENTERPRISE_MONTHLY=price_xxx
STRIPE_PRICE_ENTERPRISE_YEARLY=price_xxx

# Frontend URL for redirects
FRONTEND_URL=http://localhost:3000
```

## Stripe Setup Steps

### 1. Get API Keys
1. Log in to your Stripe Dashboard
2. Go to Developers → API keys
3. Copy your **Secret key** (starts with `sk_test_`)
4. Copy your **Publishable key** (starts with `pk_test_`)

### 2. Create Products and Prices
1. Go to Products in your Stripe Dashboard
2. Create two products:
   - **Professional Plan**
   - **Enterprise Plan**

3. For each product, create two prices:
   - Monthly recurring price
   - Yearly recurring price

4. Copy the Price IDs (start with `price_`) and add them to your `.env` file

### 3. Set Up Webhooks (for production)
1. Go to Developers → Webhooks
2. Click "Add endpoint"
3. Enter your webhook URL: `https://yourdomain.com/api/v1/billing/webhook`
4. Select events to listen to:
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.paid`
   - `invoice.payment_failed`
5. Copy the **Signing secret** (starts with `whsec_`)

### 4. Test Webhooks Locally (Development)
```bash
# Install Stripe CLI
# https://stripe.com/docs/stripe-cli

# Login to Stripe
stripe login

# Forward webhooks to your local server
stripe listen --forward-to localhost:8000/api/v1/billing/webhook

# This will output a webhook signing secret - add it to your .env
```

## Database Migration

Run the Prisma migration to create billing tables:

```bash
npm run db:push
```

This will create:
- `Subscription` table
- `PaymentMethod` table
- `Invoice` table
- `UsageRecord` table

## Testing

### Test Cards
Use these test card numbers in Stripe Checkout:

- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **3D Secure**: `4000 0025 0000 3155`

Use any future expiry date and any 3-digit CVC.

### Test Subscription Flow
1. Navigate to `/billing` in your app
2. Click "Upgrade" on a plan
3. Complete checkout with a test card
4. Verify subscription is created in Stripe Dashboard
5. Check that your database is updated with subscription info

## API Endpoints

### GET /billing/subscription
Get current subscription details

### GET /billing/usage
Get usage statistics for current billing period

### GET /billing/payment-methods
Get saved payment methods

### GET /billing/invoices
Get billing history

### POST /billing/create-checkout-session
Create Stripe Checkout session for upgrades
```json
{
  "plan": "PRO",
  "billingInterval": "MONTH"
}
```

### POST /billing/create-portal-session
Create Stripe Customer Portal session for subscription management

### POST /billing/webhook
Stripe webhook endpoint (called by Stripe, not your app)

## Features

✅ **Subscription Management**
- Create, update, and cancel subscriptions
- Support for monthly and yearly billing
- Trial periods
- Proration for plan changes

✅ **Payment Processing**
- Stripe Checkout integration
- Customer Portal for self-service
- Multiple payment methods
- Automatic retry for failed payments

✅ **Usage Tracking**
- Track datasets, storage, API calls, users
- Real-time usage monitoring
- Plan limit enforcement

✅ **Billing History**
- Invoice generation
- PDF receipts
- Payment history

✅ **Webhooks**
- Real-time subscription updates
- Automatic plan upgrades/downgrades
- Failed payment handling

## Security Best Practices

1. **Never expose secret keys** - Keep `STRIPE_SECRET_KEY` server-side only
2. **Verify webhooks** - Always verify webhook signatures
3. **Use HTTPS** - Required for production webhooks
4. **Validate amounts** - Always verify payment amounts server-side
5. **Handle errors** - Implement proper error handling for failed payments

## Troubleshooting

### Webhook not receiving events
- Check webhook URL is publicly accessible
- Verify webhook secret is correct
- Check Stripe Dashboard → Webhooks → Event logs

### Subscription not updating
- Check webhook events are being received
- Verify database connection
- Check server logs for errors

### Checkout session fails
- Verify price IDs are correct
- Check Stripe API keys are valid
- Ensure customer email is valid

## Production Checklist

- [ ] Replace test API keys with live keys
- [ ] Set up production webhook endpoint
- [ ] Configure proper error monitoring
- [ ] Set up email notifications for failed payments
- [ ] Test subscription lifecycle end-to-end
- [ ] Configure tax collection (if applicable)
- [ ] Set up billing alerts
- [ ] Review Stripe Dashboard settings

## Support

For Stripe-specific issues, refer to:
- [Stripe Documentation](https://stripe.com/docs)
- [Stripe Support](https://support.stripe.com)

For application issues, contact your development team.
