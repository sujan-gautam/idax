# Quick Start Script - Get EDA Tabs Working (Windows PowerShell)
# Run this to integrate the backend and make tabs show data

Write-Host "🚀 Project IDA - Backend Integration Quick Start" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Install Python dependencies
Write-Host "📦 Step 1/5: Installing Python dependencies..." -ForegroundColor Yellow
Set-Location apps\api
pip install scipy scikit-learn pandas numpy
Write-Host "✅ Dependencies installed" -ForegroundColor Green
Write-Host ""

# Step 2: Add environment variables
Write-Host "🔧 Step 2/5: Setting up environment variables..." -ForegroundColor Yellow
if (-not (Test-Path .env)) {
    @"
# Database
DATABASE_URL=postgresql://user:password@localhost:5432/projectida

# Stripe (replace with your keys)
STRIPE_SECRET_KEY=sk_test_your_key_here
STRIPE_PUBLISHABLE_KEY=pk_test_your_key_here
STRIPE_WEBHOOK_SECRET=whsec_your_secret_here

# JWT
JWT_SECRET=your-super-secret-jwt-key-change-this
"@ | Out-File -FilePath .env -Encoding UTF8
    Write-Host "✅ Created .env file (update with your keys)" -ForegroundColor Green
} else {
    Write-Host "⚠️  .env already exists, skipping" -ForegroundColor Yellow
}
Write-Host ""

# Step 3: Database migration
Write-Host "🗄️  Step 3/5: Running database migration..." -ForegroundColor Yellow
Set-Location ..\..\packages\db

# Check if EDAResult model exists
$schemaContent = Get-Content prisma\schema.prisma -Raw
if ($schemaContent -notmatch "model EDAResult") {
    @"

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
"@ | Add-Content -Path prisma\schema.prisma
    Write-Host "✅ Added EDAResult model to schema" -ForegroundColor Green
} else {
    Write-Host "⚠️  EDAResult model already exists" -ForegroundColor Yellow
}

# Run migration
npx prisma migrate dev --name add_eda_results
npx prisma generate
Write-Host "✅ Database migration complete" -ForegroundColor Green
Write-Host ""

# Step 4: Manual step reminder
Write-Host "🔌 Step 4/5: Register API routes..." -ForegroundColor Yellow
Write-Host "⚠️  Manual step required:" -ForegroundColor Yellow
Write-Host ""
Write-Host "Edit apps\api\src\main.py and add:" -ForegroundColor White
Write-Host ""
Write-Host "  from .routes import eda, billing" -ForegroundColor Cyan
Write-Host ""
Write-Host "  app.include_router(eda.router)" -ForegroundColor Cyan
Write-Host "  app.include_router(billing.router)" -ForegroundColor Cyan
Write-Host ""
Read-Host "Press Enter when done"
Write-Host ""

# Step 5: Test instructions
Write-Host "🧪 Step 5/5: Testing backend..." -ForegroundColor Yellow
Write-Host ""
Write-Host "Run in a separate terminal:" -ForegroundColor White
Write-Host "  cd apps\api" -ForegroundColor Cyan
Write-Host "  uvicorn src.main:app --reload --port 8000" -ForegroundColor Cyan
Write-Host ""
Write-Host "Then test with:" -ForegroundColor White
Write-Host "  curl http://localhost:8000/health" -ForegroundColor Cyan
Write-Host "  curl http://localhost:8000/datasets/test-id/eda/status" -ForegroundColor Cyan
Write-Host ""

Write-Host "================================================" -ForegroundColor Cyan
Write-Host "✅ Integration Complete!" -ForegroundColor Green
Write-Host ""
Write-Host "Next steps:" -ForegroundColor Yellow
Write-Host "1. Start backend: cd apps\api && uvicorn src.main:app --reload --port 8000" -ForegroundColor White
Write-Host "2. Start frontend: cd apps\web && npm run dev" -ForegroundColor White
Write-Host "3. Upload a dataset and trigger EDA analysis" -ForegroundColor White
Write-Host "4. View results in the Overview, Distributions, and Correlations tabs" -ForegroundColor White
Write-Host ""
Write-Host "📚 Documentation:" -ForegroundColor Yellow
Write-Host "- SESSION_SUMMARY.md - Complete overview" -ForegroundColor White
Write-Host "- BACKEND_INTEGRATION_REQUIRED.md - Detailed integration guide" -ForegroundColor White
Write-Host "- STRIPE_INTEGRATION_GUIDE.md - Billing setup" -ForegroundColor White
Write-Host ""
Write-Host "🎉 Happy coding!" -ForegroundColor Green
