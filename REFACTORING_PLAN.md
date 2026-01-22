# PROJECT IDA: PRODUCTION REFACTORING PLAN
## From Demo to Real SaaS Platform

**Objective:** Transform Project IDA from a prototype with placeholder content into a fully functional, production-grade SaaS platform with real end-to-end features.

---

## 📋 AUDIT FINDINGS: DEMO CONTENT TO REMOVE

### Frontend Issues Identified

#### ❌ **Dashboard.tsx** (Lines 14-31)
**Problem:** Hardcoded fake statistics
```tsx
<Typography variant="h3">12</Typography>  // Fake project count
<Typography variant="h3">4.2 GB</Typography>  // Fake storage
<Typography variant="h3">1.5k</Typography>  // Fake API calls
```
**Action:** Replace with real API calls to `/api/v1/tenants/me/stats` endpoint

#### ❌ **Projects.tsx**
**Problem:** Empty placeholder with non-functional "New Project" button
**Action:** Build complete CRUD with real project list, create modal, delete confirmation

#### ❌ **Layout.tsx** (Lines 16-18)
**Problem:** Hardcoded menu items with non-existent routes
```tsx
{ text: 'API Keys', icon: <Api />, path: '/api-keys' },  // Route doesn't exist
{ text: 'Billing', icon: <CreditCard />, path: '/billing' },  // Route doesn't exist
{ text: 'Admin', icon: <Settings />, path: '/admin' },  // Route doesn't exist
```
**Action:** Remove or implement these pages with real functionality

#### ❌ **PreprocessingTab.tsx**
**Problem:** Displays hardcoded fake recipe recommendations
**Action:** Replace with real recipe generation from backend analysis

#### ⚠️ **UploadComponent.tsx**
**Problem:** Hardcoded tenantId and projectId
```tsx
tenantId: 'test-tenant',  // HARDCODED
projectId: 'test-project'  // HARDCODED
```
**Action:** Get from authenticated user context

### Backend Issues Identified

#### ❌ **No Authentication Integration**
- Gateway service doesn't validate tokens
- Services don't enforce tenant isolation
- No session management

#### ❌ **Incomplete Job Orchestration**
- Job orchestrator is minimal placeholder
- No event-driven workflow
- No retry/DLQ handling

#### ❌ **Missing Services**
- No recipe generation service
- No transform service
- No billing service
- No admin service

#### ❌ **Incomplete EDA**
- No correlation calculations
- No outlier detection algorithms
- No data quality rules engine

---

## 🎯 REFACTORING STRATEGY

### Phase 1: Foundation Hardening (Days 1-2)
**Goal:** Remove all demo content, implement real auth flow

#### 1.1 Authentication & Context
- [ ] Create `AuthContext` provider with login/logout/token refresh
- [ ] Create `Login.tsx` and `Register.tsx` pages
- [ ] Implement `ProtectedRoute` wrapper
- [ ] Add token interceptor to axios
- [ ] Store tokens in httpOnly cookies (not localStorage for security)
- [ ] Implement auto-refresh before token expiry

#### 1.2 User Context & Tenant Resolution
- [ ] Create `useAuth()` hook returning `{ user, tenant, logout, isLoading }`
- [ ] Update all components to use real user/tenant data
- [ ] Remove all hardcoded IDs

#### 1.3 Gateway Service Enhancement
- [ ] Add auth middleware to all routes
- [ ] Add tenant isolation checks
- [ ] Add rate limiting (express-rate-limit)
- [ ] Add request correlation IDs
- [ ] Add structured error responses

#### 1.4 Delete Demo Content
- [ ] Remove hardcoded stats from Dashboard
- [ ] Remove fake menu items or implement pages
- [ ] Remove placeholder text everywhere
- [ ] Remove unused routes

---

### Phase 2: Real Data Pipeline (Days 3-5)
**Goal:** End-to-end working upload → parse → EDA → display

#### 2.1 Projects CRUD (Real)
- [ ] Backend: `POST /projects`, `GET /projects`, `PUT /projects/:id`, `DELETE /projects/:id`
- [ ] Frontend: Projects list with cards/table
- [ ] Create project modal with validation
- [ ] Delete confirmation with cascade warning
- [ ] Empty state with illustration + CTA

#### 2.2 Upload Flow (Production)
- [ ] Add file type validation (MIME + extension)
- [ ] Add file size validation against tenant quota
- [ ] Add malware scan placeholder (ClamAV or AWS GuardDuty)
- [ ] Progress tracking with WebSocket or polling
- [ ] Error handling with retry logic
- [ ] Success redirect to dataset details

#### 2.3 Parser Service (Complete)
- [ ] Implement XLSX parsing with proper binary handling
- [ ] Add PDF table extraction (AWS Textract integration)
- [ ] Implement robust schema inference
- [ ] Add data type detection (dates, emails, URLs, etc.)
- [ ] Store parsed artifact with compression
- [ ] Emit `dataset.parsed` event

#### 2.4 EDA Service (Complete Algorithms)
- [ ] **Distributions:**
  - Numeric: Histogram bins (Freedman-Diaconis rule), KDE optional
  - Categorical: Top-K with "Other" bucket, frequency tables
- [ ] **Correlations:**
  - Numeric: Pearson, Spearman, Kendall
  - Categorical: Cramér's V, Chi-square test
  - Mixed: Point-biserial correlation
  - Missingness correlation matrix
- [ ] **Outliers:**
  - IQR method with configurable multiplier
  - Modified Z-score (MAD-based)
  - Isolation Forest (optional, compute-intensive)
  - Store outlier indices and counts
- [ ] **Data Quality:**
  - Null spike detection (>50% missing)
  - Constant columns (variance = 0)
  - High cardinality detection
  - Duplicate row detection
  - Invalid range detection (negative ages, future dates)
  - Date parsing failures
  - Severity scoring (Critical/High/Medium/Low)
- [ ] Store results in S3 + summary in Postgres
- [ ] Emit `eda.completed` event

#### 2.5 Real Frontend Tabs
- [ ] **OverviewTab:** Fetch real stats, show skeleton while loading
- [ ] **PreviewTab:** Virtualized table (react-window), column search, type badges
- [ ] **DistributionsTab:** Real histograms from backend bins, categorical bars
- [ ] **CorrelationsTab:** Heatmap with method selector, click for details
- [ ] **OutliersTab:** Per-column outlier cards, view outlier rows
- [ ] **DataQualityTab:** Issue cards with severity badges, fix suggestions
- [ ] **PreprocessingTab:** Real recommendations from backend

---

### Phase 3: Transformations & Versioning (Days 6-8)
**Goal:** Recipe generation, application, rollback

#### 3.1 Recipe Generation Service
- [ ] Analyze EDA results to generate recommendations:
  - High missingness → Imputation strategies (mean/median/mode/forward-fill)
  - Categorical columns → Encoding suggestions (one-hot/label/target)
  - Numeric columns → Scaling suggestions (standard/minmax/robust)
  - Outliers detected → Capping/winsorization/removal
  - Skewed distributions → Log/sqrt transformation
  - High cardinality → Grouping/binning
  - Duplicates → Deduplication
  - Type mismatches → Type casting
- [ ] Generate "impact preview" showing before/after stats
- [ ] Store recipe as JSON with provenance

#### 3.2 Transform Service
- [ ] Implement transformation engine:
  - Imputation (mean, median, mode, constant, forward-fill, backward-fill)
  - Encoding (one-hot, label, ordinal, target, frequency)
  - Scaling (standard, minmax, robust, maxabs)
  - Outlier handling (cap, winsorize, remove)
  - Type casting (string→numeric, string→date, etc.)
  - Column operations (drop, rename, derive)
  - Row operations (filter, deduplicate)
  - Text operations (lowercase, trim, regex)
- [ ] Apply transformations deterministically
- [ ] Create new dataset version with lineage
- [ ] Compute diff summary (rows changed, columns changed, stats delta)
- [ ] Emit `transform.completed` event

#### 3.3 Versioning & Rollback
- [ ] Version timeline UI component
- [ ] Version comparison view (side-by-side stats)
- [ ] Rollback button with confirmation
- [ ] Rollback implementation (update activeVersionId, invalidate cache)
- [ ] Audit log entry for rollback

#### 3.4 Approval Workflow
- [ ] Admin policy model: `{ requireApprovalFor: ['drop_columns', 'remove_rows', 'target_encoding'] }`
- [ ] Job status: `WAITING_APPROVAL`
- [ ] Admin approval queue UI
- [ ] Approve/deny endpoints with reason
- [ ] Notification to user on approval/denial

---

### Phase 4: Job Orchestration (Days 9-10)
**Goal:** Event-driven pipeline with SQS/EventBridge

#### 4.1 Event System
- [ ] Choose: SQS + worker polling OR EventBridge + Lambda triggers
- [ ] Define events:
  - `upload.finalized`
  - `dataset.parsed`
  - `eda.completed`
  - `recipe.generated`
  - `transform.requested`
  - `transform.completed`
  - `approval.required`
  - `approval.granted`
- [ ] Implement event publishers in each service
- [ ] Implement event consumers/handlers

#### 4.2 Job Management
- [ ] Job status tracking with progress percentage
- [ ] Job cancellation endpoint
- [ ] Retry policy (exponential backoff)
- [ ] Dead letter queue for failed jobs
- [ ] Job logs stored in S3
- [ ] Real-time job status via WebSocket or polling

#### 4.3 Idempotency
- [ ] Idempotency key: `${tenantId}:${datasetId}:${versionId}:${stage}:${inputHash}`
- [ ] Store in Redis with TTL
- [ ] Return cached result if duplicate request

---

### Phase 5: Admin Panel (Days 11-13)
**Goal:** Complete admin control center

#### 5.1 Tenant Management
- [ ] List all tenants with search/filter
- [ ] Create tenant (manual provisioning)
- [ ] Edit tenant (name, plan, status)
- [ ] Suspend/reactivate tenant
- [ ] View tenant usage stats
- [ ] Tenant detail page with users, projects, datasets, jobs

#### 5.2 User Management
- [ ] List users per tenant
- [ ] Invite user (send email with signup link)
- [ ] Change user role
- [ ] Suspend/reactivate user
- [ ] Revoke all user sessions
- [ ] View user activity log

#### 5.3 Feature Flags
- [ ] Feature flag editor (JSON or form)
- [ ] Per-tenant overrides
- [ ] Feature flag history/audit
- [ ] Bulk enable/disable for plan tier

#### 5.4 Quotas & Limits
- [ ] Quota editor per tenant
- [ ] Default quotas per plan
- [ ] Usage vs quota visualization
- [ ] Quota exceeded alerts

#### 5.5 Approval Queue
- [ ] List pending approvals
- [ ] Filter by type, tenant, date
- [ ] Approve/deny with reason
- [ ] Bulk actions

#### 5.6 Audit Logs
- [ ] Searchable audit log viewer
- [ ] Filters: tenant, user, action, entity type, date range
- [ ] Export to CSV
- [ ] Diff viewer for changes

#### 5.7 System Operations
- [ ] Job queue dashboard (pending, running, failed)
- [ ] Retry failed jobs
- [ ] Cancel running jobs
- [ ] Worker health metrics
- [ ] Cost metrics (S3 storage, compute time estimates)

#### 5.8 Security Controls
- [ ] Allowed file types configuration
- [ ] Export permissions toggle
- [ ] Watermark policy
- [ ] Session timeout settings
- [ ] MFA enforcement toggle

---

### Phase 6: API & Billing (Days 14-16)
**Goal:** Developer portal, API keys, Stripe integration

#### 6.1 API Keys Service
- [ ] Generate API key (hash with bcrypt, store hash only)
- [ ] Scope permissions per key
- [ ] Revoke key
- [ ] Rotate key
- [ ] Usage tracking per key
- [ ] Rate limiting per key

#### 6.2 Developer Portal
- [ ] API documentation (OpenAPI UI)
- [ ] Get API key page
- [ ] View usage stats
- [ ] Code examples (curl, Python, JavaScript)
- [ ] Rate limit information
- [ ] Webhook configuration (future)

#### 6.3 Billing Integration
- [ ] Stripe customer creation on tenant signup
- [ ] Plan selection/upgrade UI
- [ ] Stripe checkout session
- [ ] Webhook handler for subscription events
- [ ] Usage metering (API calls, storage, compute)
- [ ] Invoice generation
- [ ] Payment method management
- [ ] Billing history

#### 6.4 Plan Enforcement
- [ ] Server-side plan checks on every feature
- [ ] Quota enforcement with clear error messages
- [ ] Upgrade prompts in UI
- [ ] Grace period for quota overages

---

### Phase 7: Professional Frontend (Days 17-18)
**Goal:** Production-quality UX

#### 7.1 Design System
- [ ] Consistent spacing scale (4px base)
- [ ] Typography scale (h1-h6, body1-2, caption)
- [ ] Color palette (primary, secondary, error, warning, success, info)
- [ ] Dark/light mode toggle
- [ ] Component library documentation

#### 7.2 Empty States
- [ ] Professional illustrations or icons
- [ ] Clear CTAs
- [ ] Helpful copy explaining next steps

#### 7.3 Loading States
- [ ] Skeleton loaders for all data-heavy components
- [ ] Spinner for actions
- [ ] Progress bars for uploads/jobs

#### 7.4 Error Handling
- [ ] Error boundary component
- [ ] Toast notifications (success, error, warning, info)
- [ ] Inline validation errors
- [ ] Network error retry UI

#### 7.5 Responsive Design
- [ ] Mobile-first approach
- [ ] Breakpoints: xs, sm, md, lg, xl
- [ ] Touch-friendly targets (44px minimum)
- [ ] Hamburger menu for mobile

#### 7.6 Accessibility
- [ ] ARIA labels
- [ ] Keyboard navigation
- [ ] Focus indicators
- [ ] Screen reader support

---

### Phase 8: Testing & Quality (Days 19-20)
**Goal:** Comprehensive test coverage

#### 8.1 Unit Tests
- [ ] Transformation functions
- [ ] EDA algorithms
- [ ] Permission checks
- [ ] Quota calculations

#### 8.2 Integration Tests
- [ ] Upload → Parse → EDA flow
- [ ] Recipe generation → Transform → Rollback
- [ ] Auth flow (register, login, refresh, logout)
- [ ] Tenant isolation (cross-tenant access attempts)

#### 8.3 E2E Tests
- [ ] User signup → Create project → Upload dataset → View EDA → Apply recipe
- [ ] Admin: Create tenant → Invite user → Approve recipe

#### 8.4 Security Tests
- [ ] SQL injection attempts
- [ ] XSS attempts
- [ ] CSRF protection
- [ ] Rate limit bypass attempts
- [ ] Tenant isolation violations

#### 8.5 Performance Tests
- [ ] Load test: 100 concurrent uploads
- [ ] Large file handling (1GB+)
- [ ] EDA on 1M+ row datasets
- [ ] API response times (<200ms p95)

---

### Phase 9: Deployment & DevOps (Days 21-22)
**Goal:** Production infrastructure

#### 9.1 Infrastructure as Code (AWS CDK)
```typescript
// Stack components:
- VPC with public/private subnets
- ECS Fargate clusters for services
- Application Load Balancer
- RDS PostgreSQL (Multi-AZ)
- ElastiCache Redis (cluster mode)
- S3 buckets (uploads, artifacts, logs)
- SQS queues + DLQs
- EventBridge event bus
- Secrets Manager
- CloudWatch log groups + alarms
- WAF with rate limiting rules
- CloudFront distribution
- Route53 DNS
```

#### 9.2 CI/CD Pipeline (GitHub Actions)
```yaml
# Workflow:
1. Lint (ESLint, Prettier)
2. Type check (tsc --noEmit)
3. Unit tests
4. Build Docker images
5. Push to ECR
6. Run integration tests
7. Deploy to staging (auto)
8. Run E2E tests
9. Deploy to production (manual approval)
10. Run smoke tests
11. Rollback on failure
```

#### 9.3 Monitoring & Observability
- [ ] CloudWatch dashboards
- [ ] Custom metrics (upload count, EDA duration, etc.)
- [ ] Alarms (error rate, latency, queue depth)
- [ ] X-Ray tracing
- [ ] Log aggregation
- [ ] Uptime monitoring (Pingdom/UptimeRobot)

#### 9.4 Security Hardening
- [ ] Secrets in Secrets Manager (not env vars)
- [ ] IAM least-privilege roles
- [ ] VPC endpoints for S3
- [ ] Encryption at rest (S3 SSE-KMS, RDS encryption)
- [ ] TLS everywhere
- [ ] WAF rules (SQL injection, XSS, rate limiting)
- [ ] DDoS protection (Shield Standard)
- [ ] Regular security scans (Snyk, Dependabot)

---

## 📊 DEFINITION OF DONE CHECKLIST

### Core Functionality
- [ ] User can register, login, logout with real JWT auth
- [ ] User can create projects (CRUD)
- [ ] User can upload CSV/XLSX/JSON files
- [ ] Parser correctly infers schema and stores artifact
- [ ] EDA computes real statistics (not mocked)
- [ ] All 7 tabs display computed data from backend
- [ ] Correlations heatmap shows real Pearson/Spearman values
- [ ] Outliers tab shows real IQR-based outliers
- [ ] Data quality tab shows real rule-based issues
- [ ] Preprocessing tab shows AI-generated recommendations
- [ ] User can apply a recipe to create new version
- [ ] User can rollback to previous version
- [ ] Admin can approve/deny recipes requiring approval
- [ ] Tenant isolation is enforced (tested)
- [ ] RBAC permissions work correctly (tested)
- [ ] Feature flags gate features server-side
- [ ] Quotas are enforced with clear errors
- [ ] Audit logs capture all mutations

### Admin Panel
- [ ] Admin can manage tenants (CRUD, suspend)
- [ ] Admin can manage users (invite, role change, suspend)
- [ ] Admin can edit feature flags per tenant
- [ ] Admin can edit quotas per tenant
- [ ] Admin can view/approve approval queue
- [ ] Admin can search audit logs
- [ ] Admin can view job queues and retry failed jobs
- [ ] Admin can view system metrics

### API & Billing
- [ ] OpenAPI spec is complete and accurate
- [ ] Developer portal displays API docs
- [ ] User can generate API key
- [ ] API keys are rate-limited
- [ ] Usage is metered
- [ ] Stripe integration works (test mode)
- [ ] Plan upgrades/downgrades work
- [ ] Quota enforcement respects plan limits

### Quality & Performance
- [ ] No hardcoded data anywhere
- [ ] No "coming soon" placeholders
- [ ] All buttons have working backend
- [ ] Loading states everywhere
- [ ] Error handling everywhere
- [ ] Empty states are professional
- [ ] Mobile responsive
- [ ] Dark mode works
- [ ] Unit test coverage >70%
- [ ] Integration tests pass
- [ ] E2E tests pass
- [ ] Security tests pass
- [ ] Performance tests pass (p95 <500ms)

### Deployment
- [ ] Docker images build successfully
- [ ] CDK stack deploys to AWS
- [ ] CI/CD pipeline runs successfully
- [ ] Staging environment works
- [ ] Production environment works
- [ ] Monitoring dashboards show data
- [ ] Alarms are configured
- [ ] Secrets are in Secrets Manager
- [ ] TLS certificates are valid
- [ ] DNS is configured

---

## 🚀 EXECUTION ORDER

### Week 1: Foundation
- Day 1-2: Auth, context, remove demo content
- Day 3-5: Real data pipeline (upload → parse → EDA)

### Week 2: Intelligence
- Day 6-8: Recipes, transforms, versioning
- Day 9-10: Job orchestration, events

### Week 3: Control & Monetization
- Day 11-13: Admin panel
- Day 14-16: API keys, billing

### Week 4: Polish & Deploy
- Day 17-18: Frontend UX, testing
- Day 19-20: Security, performance
- Day 21-22: Deployment, monitoring

---

## 📁 FILE CHANGES SUMMARY

### Files to DELETE
```
None - we'll refactor in place
```

### Files to CREATE
```
Frontend:
- apps/web/src/contexts/AuthContext.tsx
- apps/web/src/hooks/useAuth.ts
- apps/web/src/pages/Login.tsx
- apps/web/src/pages/Register.tsx
- apps/web/src/components/ProtectedRoute.tsx
- apps/web/src/components/EmptyState.tsx
- apps/web/src/components/SkeletonLoader.tsx
- apps/web/src/pages/admin/* (10+ admin pages)
- apps/web/src/pages/Billing.tsx
- apps/web/src/pages/ApiKeys.tsx

Backend:
- services/recipe-service/
- services/transform-service/
- services/billing-service/
- services/admin-service/
- packages/events/ (event bus client)
- packages/queue/ (SQS client)
- infrastructure/ (CDK code)
- .github/workflows/ci-cd.yml
```

### Files to REFACTOR
```
- apps/web/src/pages/Dashboard.tsx (remove fake stats)
- apps/web/src/pages/Projects.tsx (add real CRUD)
- apps/web/src/components/Layout.tsx (add real routes or remove)
- apps/web/src/components/UploadComponent.tsx (use auth context)
- apps/web/src/components/tabs/PreprocessingTab.tsx (real recommendations)
- services/gateway-service/src/index.ts (add auth middleware)
- services/eda-service/src/index.ts (add real algorithms)
- All services: add tenant isolation
```

---

**READY TO BEGIN IMPLEMENTATION?**

I will now start executing this plan systematically, beginning with Phase 1: Foundation Hardening.
