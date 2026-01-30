
const { PrismaClient } = require('@project-ida/db');
const prisma = new PrismaClient();

async function resetBilling() {
  try {
    console.log('Resetting billing data...');
    
    // Delete all subscriptions (cascade delete will handle invoices/usage if setup, but let's be safe)
    await prisma.invoice.deleteMany({});
    await prisma.subscription.deleteMany({});
    
    // Reset all tenants to FREE
    await prisma.tenant.updateMany({
      data: { plan: 'FREE' }
    });

    console.log('Billing data reset successfully. You are now on FREE plan.');
  } catch (error) {
    console.error('Error resetting billing:', error);
  } finally {
    await prisma.$disconnect();
  }
}

resetBilling();
