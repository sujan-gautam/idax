#!/bin/bash
# Quick Start Script - Get EDA Tabs Working
# Run this to integrate the backend and make tabs show data

set -e  # Exit on error

echo "🚀 Project IDA - Backend Integration Quick Start"
echo "================================================"
echo ""

# Step 1: Install Python dependencies
echo "📦 Step 1/5: Installing Python dependencies..."
cd apps/api
pip install scipy scikit-learn pandas numpy
echo "✅ Dependencies installed"
echo ""

# Step 2: Add environment variables
echo "🔧 Step 2/5: Setting up environment variables..."
if [ ! -f .env ]; then
    cat > .env << 'EOF'
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/projectida

# Stripe (replace with your keys)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
EOF
    echo "✅ Created .env file (update with your keys)"
else
    echo "⚠️  .env already exists, skipping"
fi
echo ""

# Step 3: Database migration
echo "🗄️  Step 3/5: Running database migration..."
cd ../../packages/db

# Add EDAResult model to schema if not exists
if ! grep -q "model EDAResult" prisma/schema.prisma; then
    cat >> prisma/schema.prisma << 'EOF'

model EDAResult {
  id            String   @id @default(uuid())
  datasetId     String
  dataset       Dataset  @relation(fields: [datasetId], references: [id])
  status        String   @default("pending")
  results       Json?
  errorMessage  String?
  triggeredBy   String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  @@index([datasetId])
}
EOF
    echo "✅ Added EDAResult model to schema"
else
    echo "⚠️  EDAResult model already exists"
fi

# Run migration
npx prisma migrate dev --name add_eda_results
npx prisma generate
echo "✅ Database migration complete"
echo ""

# Step 4: Update FastAPI main.py
echo "🔌 Step 4/5: Registering API routes..."
cd ../../apps/api

# Check if routes are already registered
if ! grep -q "from .routes import eda" src/main.py; then
    # Backup original
    cp src/main.py src/main.py.backup
    
    # Add imports after existing route imports
    sed -i '/from .routes import/a from .routes import eda, billing' src/main.py
    
    # Add router registrations after existing routers
    sed -i '/app.include_router/a app.include_router(eda.router)\napp.include_router(billing.router)' src/main.py
    
    echo "✅ Registered EDA and Billing routes"
else
    echo "⚠️  Routes already registered"
fi
echo ""

# Step 5: Test backend
echo "🧪 Step 5/5: Testing backend..."
echo "Starting FastAPI server..."
echo ""
echo "Run in a separate terminal:"
echo "  cd apps/api"
echo "  uvicorn src.main:app --reload --port 8000"
echo ""
echo "Then test with:"
echo "  curl http://localhost:8000/health"
echo "  curl http://localhost:8000/datasets/test-id/eda/status"
echo ""

echo "================================================"
echo "✅ Integration Complete!"
echo ""
echo "Next steps:"
echo "1. Start backend: cd apps/api && uvicorn src.main:app --reload --port 8000"
echo "2. Start frontend: cd apps/web && npm run dev"
echo "3. Upload a dataset and trigger EDA analysis"
echo "4. View results in the Overview, Distributions, and Correlations tabs"
echo ""
echo "📚 Documentation:"
echo "- SESSION_SUMMARY.md - Complete overview"
echo "- BACKEND_INTEGRATION_REQUIRED.md - Detailed integration guide"
echo "- STRIPE_INTEGRATION_GUIDE.md - Billing setup"
echo ""
echo "🎉 Happy coding!"
