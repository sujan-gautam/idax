# Project IDA

> **Production-Grade, Multi-Tenant SaaS Data Analysis Platform**

A comprehensive data analysis platform built with Node.js, TypeScript, React, and AWS services. Upload datasets, get automated insights, apply AI-driven preprocessing, and access everything via API.

---

## 🚀 Quick Start

```bash
# 1. Install dependencies
npm install

# 2. Start infrastructure (PostgreSQL, MinIO, Redis)
docker-compose up -d

# 3. Generate Prisma client
npm run generate

# 4. Push database schema
npm run db:push

# 5. Start all services
npm run dev
```

**Access the application:**
- Frontend: http://localhost:5173
- API Gateway: http://localhost:8000
- Auth Service: http://localhost:8006

---

## 📋 Features

### ✅ Implemented
- **Multi-tenant SaaS architecture** with strict data isolation
- **JWT-based authentication** with refresh tokens
- **Role-based access control** (OWNER, ADMIN, MEMBER, VIEWER)
- **File upload & parsing** (CSV, JSON, Excel)
- **Automated EDA** with statistical analysis
- **Interactive visualizations** (distributions, outliers, data quality)
- **Feature flags** for plan-based feature gating
- **Audit logging** with correlation tracking
- **Quota enforcement** framework
- **S3-compatible storage** (MinIO for local dev)

### 🔄 In Progress
- Recipe generation & transformation pipeline
- Approval workflow system
- API keys & billing integration
- Admin panel UI
- Comprehensive observability

### ⏳ Planned
- PDF parsing with table extraction
- Advanced correlation analysis
- Automated data cleaning
- OpenAPI documentation
- AWS deployment (CDK)
- CI/CD pipeline

---

## 🏗️ Architecture

```
Frontend (React + MUI)
        ↓
Gateway Service (8000)
        ↓
    ┌───┴────┬────────┬─────────┬─────────┬──────────┐
    ↓        ↓        ↓         ↓         ↓          ↓
  Auth    Tenant   Upload   Parser     EDA      Job Orch
 (8006)   (8001)   (8002)   (8003)   (8004)    (8005)
    ↓        ↓        ↓         ↓         ↓          ↓
    └────────┴────────┴─────────┴─────────┴──────────┘
                        ↓
              PostgreSQL + S3 + Redis
```

### Services

| Service | Port | Purpose |
|---------|------|---------|
| **Gateway** | 8000 | API routing, auth validation |
| **Auth** | 8006 | JWT auth, user management |
| **Tenant** | 8001 | Tenant/project/dataset metadata |
| **Upload** | 8002 | S3 presigned URLs, upload handling |
| **Parser** | 8003 | File parsing, schema inference |
| **EDA** | 8004 | Statistical analysis, insights |
| **Job Orchestrator** | 8005 | Pipeline management, approvals |

---

## 🔐 Security Features

1. **Authentication & Authorization**
   - Secure password hashing (bcrypt)
   - JWT with access + refresh tokens
   - Role-based permissions
   - Feature flag enforcement

2. **Multi-Tenancy**
   - Strict tenant isolation middleware
   - Cross-tenant access prevention
   - Tenant-scoped queries enforced

3. **Audit & Compliance**
   - Complete audit trail
   - IP and user agent tracking
   - Correlation IDs for distributed tracing
   - Diff tracking for all mutations

4. **Data Security**
   - S3 encryption at rest (SSE-KMS in production)
   - Presigned URLs with expiry
   - Content-type validation
   - File size limits

---

## 📊 Database Schema

**Core Models:**
- `Tenant` - Organization/company
- `User` - Users with roles and permissions
- `Project` - Data project container
- `Dataset` - Dataset with versioning
- `DatasetVersion` - Immutable dataset snapshots
- `Upload` - File upload tracking
- `Job` - Pipeline job execution
- `EDAResult` - Statistical analysis results
- `Recipe` - Data transformation recipes
- `AuditLog` - Complete audit trail
- `ApiKey` - API access keys
- `Quotas` - Plan-based limits
- `FeatureFlags` - Feature toggles

---

## 🛠️ Tech Stack

**Backend:**
- Node.js 18+ with TypeScript
- Express.js for REST APIs
- Prisma ORM with PostgreSQL
- JWT for authentication
- AWS SDK for S3 operations

**Frontend:**
- React 18 with TypeScript
- Material-UI (MUI) components
- Recharts for visualizations
- Axios for API calls
- React Router for navigation

**Infrastructure:**
- PostgreSQL 14+ (RDS in production)
- MinIO (S3-compatible, local dev)
- Redis (ElastiCache in production)
- Docker for local services

**Planned:**
- AWS ECS Fargate for services
- AWS Step Functions for orchestration
- CloudWatch for observability
- WAF for security

---

## 📝 Development

### Project Structure

```
antigrav-ai/
├── apps/
│   └── web/                 # React frontend
├── services/
│   ├── gateway-service/     # API gateway
│   ├── auth-service/        # Authentication
│   ├── tenant-service/      # Tenant management
│   ├── upload-service/      # File uploads
│   ├── parser-service/      # Data parsing
│   ├── eda-service/         # Statistical analysis
│   └── job-orchestrator-service/  # Pipeline orchestration
├── packages/
│   ├── db/                  # Prisma schema & client
│   ├── logger/              # Structured logging
│   ├── auth-middleware/     # Auth & RBAC middleware
│   └── shared-types/        # Shared TypeScript types
├── docker-compose.yml       # Local infrastructure
├── .env                     # Environment variables
└── package.json             # Monorepo root
```

### Available Scripts

```bash
# Development
npm run dev                  # Start all services + frontend
npm run dev -w <service>     # Start specific service

# Database
npm run generate             # Generate Prisma client
npm run db:push              # Push schema to database

# Build
npm run build --workspaces   # Build all packages
```

### Environment Variables

See `.env` for full configuration. Key variables:

- `DATABASE_URL` - PostgreSQL connection string
- `JWT_SECRET` - JWT signing secret
- `JWT_REFRESH_SECRET` - Refresh token secret
- `S3_BUCKET_NAME` - S3 bucket for uploads
- `AWS_S3_ENDPOINT` - S3 endpoint (MinIO for local)

---

## 🧪 Testing

```bash
# Unit tests (coming soon)
npm test

# Integration tests (coming soon)
npm run test:integration

# E2E tests (coming soon)
npm run test:e2e
```

---

## 🚢 Deployment

### Local Development
1. Use `docker-compose up -d` for infrastructure
2. Run `npm run dev` for all services

### Production (Planned)
- AWS CDK for infrastructure as code
- ECS Fargate for service deployment
- RDS for PostgreSQL
- S3 for file storage
- ElastiCache for Redis
- CloudFront for frontend CDN
- Route53 for DNS
- WAF for security

---

## 📖 API Documentation

### Authentication

**Register:**
```bash
POST /api/v1/auth/register
{
  "email": "user@example.com",
  "password": "secure-password",
  "name": "John Doe",
  "tenantName": "Acme Corp"
}
```

**Login:**
```bash
POST /api/v1/auth/login
{
  "email": "user@example.com",
  "password": "secure-password"
}
```

**Response:**
```json
{
  "user": { "id": "...", "email": "...", "role": "OWNER" },
  "tenant": { "id": "...", "name": "Acme Corp", "plan": "FREE" },
  "accessToken": "eyJ...",
  "refreshToken": "eyJ..."
}
```

### Datasets

**Upload File:**
```bash
POST /api/v1/uploads/presigned
Authorization: Bearer <token>
{
  "filename": "data.csv",
  "contentType": "text/csv",
  "tenantId": "...",
  "projectId": "..."
}
```

**Get Dataset:**
```bash
GET /api/v1/datasets/:id
Authorization: Bearer <token>
```

**Get EDA Results:**
```bash
GET /api/v1/datasets/:id/eda
Authorization: Bearer <token>
```

---

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## 📄 License

This project is proprietary software. All rights reserved.

---

## 🆘 Support

For issues, questions, or feature requests:
- Open an issue on GitHub
- Contact: support@project-ida.com
- Documentation: https://docs.project-ida.com (coming soon)

---

## 🗺️ Roadmap

**Phase 1: Foundation** ✅
- Multi-tenant architecture
- Authentication & RBAC
- File upload & parsing
- Basic EDA

**Phase 2: Intelligence** 🔄
- Recipe generation
- Automated transformations
- Approval workflows
- Version control

**Phase 3: Monetization** ⏳
- API keys
- Billing integration
- Usage metering
- Plan tiers

**Phase 4: Enterprise** ⏳
- Admin panel
- Audit logs UI
- Advanced analytics
- SSO integration

**Phase 5: Scale** ⏳
- AWS deployment
- Auto-scaling
- Global CDN
- 99.9% SLA

---

**Built with ❤️ by the Project IDA Team**

*Last updated: 2026-01-21*
