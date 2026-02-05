/**
 * Seed Admin User
 * Creates an admin user with specified credentials
 */

import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding admin user...');

    const email = 'sujaan1919@gmail.com';
    const password = 'sujan.sujan';
    const name = 'Sujan Gautam';

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({
        where: { email }
    });

    if (existingUser) {
        console.log(`✅ User ${email} already exists!`);
        console.log(`   ID: ${existingUser.id}`);
        console.log(`   Role: ${existingUser.role}`);
        console.log(`   Tenant ID: ${existingUser.tenantId}`);
        return;
    }

    // Find or create tenant
    let tenant = await prisma.tenant.findFirst({
        where: { name: 'Sujan\'s Organization' }
    });

    if (!tenant) {
        console.log('📦 Creating tenant...');
        tenant = await prisma.tenant.create({
            data: {
                name: 'Sujan\'s Organization',
                plan: 'ENTERPRISE',
                status: 'ACTIVE'
            }
        });
        console.log(`✅ Tenant created: ${tenant.id}`);

        // Create default quotas
        await prisma.quotas.create({
            data: {
                tenantId: tenant.id,
                maxProjects: 100,
                maxStorageBytes: BigInt(107374182400), // 100GB
                maxUploadsPerMonth: 5000,
                maxApiCallsPerMonth: 100000,
                maxAiTokensPerMonth: 5000000
            }
        });
        console.log('✅ Quotas created');

        // Create default feature flags
        await prisma.featureFlags.create({
            data: {
                tenantId: tenant.id,
                flagsJson: {
                    autoEDA: true,
                    distributions: true,
                    correlations: true,
                    outliers: true,
                    quality: true,
                    advancedCleansing: true,
                    aiAssistant: true,
                    apiAccess: true,
                    customBranding: true,
                    ssoEnabled: true,
                    auditLogs: true,
                    dataExport: true,
                    scheduledReports: true,
                    webhooks: true,
                    advancedAnalytics: true
                }
            }
        });
        console.log('✅ Feature flags created');
    } else {
        console.log(`✅ Using existing tenant: ${tenant.id}`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash(password, 10);

    // Create admin user
    const user = await prisma.user.create({
        data: {
            email,
            name,
            passwordHash,
            role: 'ADMIN',
            status: 'ACTIVE',
            tenantId: tenant.id,
            lastLoginAt: new Date()
        }
    });

    console.log('\n🎉 Admin user created successfully!');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log(`📧 Email:     ${user.email}`);
    console.log(`🔑 Password:  ${password}`);
    console.log(`👤 Name:      ${user.name}`);
    console.log(`🛡️  Role:      ${user.role}`);
    console.log(`🏢 Tenant:    ${tenant.name}`);
    console.log(`📦 Plan:      ${tenant.plan}`);
    console.log(`🆔 User ID:   ${user.id}`);
    console.log(`🆔 Tenant ID: ${tenant.id}`);
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('\n✅ You can now login with these credentials!');
}

main()
    .catch((e) => {
        console.error('❌ Error seeding database:', e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
