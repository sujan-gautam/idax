#!/usr/bin/env node

/**
 * ROUTE CONSOLIDATION SCRIPT
 * Helps consolidate routes from microservices into unified API
 */

const fs = require('fs');
const path = require('path');

console.log('🔄 Project IDA - Route Consolidation Helper\n');

const servicesDir = path.join(__dirname, '..', 'services');
const apiRoutesDir = path.join(__dirname, '..', 'api', 'routes');

// Create api/routes directory if it doesn't exist
if (!fs.existsSync(apiRoutesDir)) {
    fs.mkdirSync(apiRoutesDir, { recursive: true });
    console.log('✅ Created api/routes directory\n');
}

const serviceMapping = {
    'auth-service': 'auth.ts',
    'admin-service': 'admin.ts',
    'ai-service': 'ai.ts',
    'billing-service': 'billing.ts',
    'upload-service': 'upload.ts',
    'tenant-service': 'tenant.ts',
    'eda-service': 'eda.ts',
    'job-orchestrator-service': 'jobs.ts',
    'parser-service': 'parser.ts',
};

console.log('📋 Services to consolidate:\n');

Object.entries(serviceMapping).forEach(([service, routeFile]) => {
    const servicePath = path.join(servicesDir, service);
    
    if (fs.existsSync(servicePath)) {
        console.log(`  ✓ ${service} → api/routes/${routeFile}`);
    } else {
        console.log(`  ✗ ${service} (not found)`);
    }
});

console.log('\n📝 Manual Steps Required:\n');
console.log('1. Copy route handlers from each service to api/routes/');
console.log('2. Update imports to use shared packages (@project-ida/auth, @project-ida/db)');
console.log('3. Remove service-specific middleware (already in main server)');
console.log('4. Test each route in the unified API');
console.log('5. Update frontend API calls to use /api/v1/* prefix\n');

console.log('💡 Example Route Structure:\n');
console.log(`
// api/routes/auth.ts
import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@project-ida/auth';

const router = express.Router();
const prisma = new PrismaClient();

// POST /api/v1/auth/login
router.post('/login', async (req, res) => {
    // Login logic
});

// POST /api/v1/auth/register
router.post('/register', async (req, res) => {
    // Register logic
});

export default router;
`);

console.log('\n🚀 Next Steps:\n');
console.log('1. Run: cd api && npm install');
console.log('2. Copy routes from services to api/routes/');
console.log('3. Test: npm run dev');
console.log('4. Deploy: vercel --prod or railway up\n');

// Create template route files
const routeTemplate = `import express from 'express';
import { PrismaClient } from '@prisma/client';
import { authMiddleware } from '@project-ida/auth';

const router = express.Router();
const prisma = new PrismaClient();

// TODO: Add your routes here

export default router;
`;

Object.values(serviceMapping).forEach(routeFile => {
    const routePath = path.join(apiRoutesDir, routeFile);
    if (!fs.existsSync(routePath)) {
        fs.writeFileSync(routePath, routeTemplate);
        console.log(`✅ Created template: api/routes/${routeFile}`);
    }
});

console.log('\n✨ Route consolidation helper complete!\n');
