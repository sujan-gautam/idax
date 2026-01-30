
import { prisma } from '@project-ida/db';

async function resetBilling() {
    try {
        console.log('Resetting billing data...');

        // Delete all invoices & subscriptions
        await prisma.invoice.deleteMany({});
        await prisma.subscription.deleteMany({});

        // Reset all tenants to FREE
        await prisma.tenant.updateMany({
            data: { plan: 'FREE' }
        });

        console.log('Billing data reset successfully. You are now on FREE plan.');
    } catch (error) {
        console.error('Error resetting billing:', error);
    }
}

resetBilling();
