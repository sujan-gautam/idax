# Project IDA - Frontend Architecture

## Design Philosophy

This frontend is built to **enterprise standards**, inspired by:
- **Stripe Dashboard** - Clean, professional, trustworthy
- **Vercel Dashboard** - Minimal, fast, data-dense
- **Linear** - Typography-first, strong hierarchy
- **GitHub** - Professional data tables, clear navigation
- **AWS Console** - Power tools, not pretty charts

### Core Principles

1. **Trustworthy over Flashy** - Professional appearance builds confidence
2. **Data Density** - Show information efficiently, respect user's time
3. **Typography > Decoration** - Use font weight and spacing for hierarchy
4. **No Hidden Magic** - Every backend capability has a UI surface
5. **Permission-First** - If user can't do it, don't show it

---

## Design System

### Color Palette

**Neutrals** (Primary UI)
- App background: `neutral-50` / `neutral-950` (dark)
- Surface: `neutral-0` / `neutral-900`
- Text: `neutral-900` / `neutral-50`

**Brand** (Restrained Indigo)
- Primary: `indigo-600` / `indigo-500` (dark)
- Used sparingly for CTAs and active states

**Semantic**
- Success: Muted green (`green-600`)
- Warning: Amber (`amber-600`)
- Error: Desaturated red (`red-600`)
- Info: Blue (`blue-600`)

### Typography

**Font Family**
- Sans: Inter (primary)
- Mono: JetBrains Mono (code/data)

**Hierarchy**
- H1: Page title (30px, bold)
- H2: Section (24px, semibold)
- H3: Subsection (20px, semibold)
- H4-H6: Decreasing importance
- Body: 14px (professional, data-dense)

### Spacing System

Based on 4px grid:
- `space-1`: 4px
- `space-2`: 8px
- `space-3`: 12px
- `space-4`: 16px
- `space-6`: 24px
- `space-8`: 32px

---

## Layout Structure

### App Shell

```
┌─────────────────────────────────────────────┐
│  Top Bar (56px)                             │
│  [Breadcrumbs] [Status] [User Menu]         │
├──────────┬──────────────────────────────────┤
│          │                                  │
│ Sidebar  │  Main Content                    │
│ (240px)  │  [Page Header]                   │
│          │  [Content Area]                  │
│          │                                  │
│          │                                  │
└──────────┴──────────────────────────────────┘
```

**Sidebar** (Collapsible to 64px)
- Projects
- Datasets
- Jobs & Pipelines
- Developer / API
- Billing
- Admin (role-gated)

**Top Bar**
- Breadcrumb navigation
- Global status indicators
- User profile menu

---

## Feature-to-UI Mapping

Every backend capability MUST have:

| Backend Feature | UI Surface | Permission Gate | Feature Flag |
|----------------|------------|-----------------|--------------|
| Upload dataset | Upload button | MEMBER+ | - |
| Run EDA | Analyze button | MEMBER+ | autoEDA |
| Apply recipe | Apply button | ADMIN+ | advancedCleansing |
| Rollback version | Rollback button | ADMIN+ | - |
| Delete project | Delete action | OWNER | - |
| Manage users | Admin panel | ADMIN+ | - |
| View audit logs | Admin panel | ADMIN+ | - |

---

## Dataset Experience (Core Product)

### Tab Structure (Fixed Order)

1. **Overview** - KPIs, warnings, quick stats
2. **Preview** - Virtualized data table
3. **Distributions** - Histograms & bar charts
4. **Correlations** - Heatmap analysis
5. **Outliers** - Anomaly detection
6. **Data Quality** - Issues & recommendations
7. **Preprocessing** - Recipe management
8. **Versions** - Timeline & rollback

### Tab Design Rules

- Each tab answers **ONE question** clearly
- No dashboard clutter
- Charts use **backend-provided bins** only
- Show methodology used (IQR, Pearson, etc.)
- Empty states with clear CTAs

---

## Permission & Feature Control

### PermissionGate Component

```tsx
<PermissionGate requiredRole="ADMIN">
  <Button>Delete Project</Button>
</PermissionGate>
```

**Role Hierarchy**
- VIEWER (0) - Read-only
- MEMBER (1) - Upload, analyze
- ADMIN (2) - Manage, approve
- OWNER (3) - Full control

### FeatureGate Component

```tsx
<FeatureGate feature="advancedCleansing">
  <Button>AI Data Cleansing</Button>
</FeatureGate>
```

**Server-Driven Flags**
- Fetched from `/tenants/:id/metadata`
- UI auto-adapts to available features
- Disabled features **completely hidden**

---

## Admin Panel (Control Room)

### Admin Pages

1. **Tenants** - Organization management
2. **Users** - Role assignment
3. **Feature Flags** - System capabilities
4. **Quotas** - Resource limits
5. **Approvals** - Pending actions
6. **Audit Logs** - Full system trail
7. **Jobs Ops** - Pipeline monitoring
8. **System Health** - Status dashboard

### Admin Principles

- Every toggle is **real** (no fake controls)
- Every change is **logged**
- Destructive actions require **confirmation**
- Diffs shown before approval

---

## State Management

### Zustand Stores

**useAuthStore**
- User session
- Tenant context
- Role information

**useFeatureStore**
- Feature flags (server-driven)
- Quota information
- Auto-fetched on app load

### TanStack Query

- All API calls
- Automatic caching
- Optimistic updates
- Error handling

---

## Performance Requirements

- **Lighthouse Score**: > 90
- **Table Virtualization**: All tables > 100 rows
- **Lazy Loading**: Admin routes code-split
- **Memoization**: Charts and heavy components
- **Bundle Size**: < 500KB initial

---

## Component Patterns

### Empty States

```tsx
<div className="empty-state">
  <Icon className="empty-state-icon" />
  <h3 className="empty-state-title">No datasets yet</h3>
  <p className="empty-state-description">
    Upload your first dataset to begin analysis
  </p>
  <Button>Upload Dataset</Button>
</div>
```

### Loading States

```tsx
<div className="skeleton-loader h-8 w-full" />
```

### Error States

```tsx
<Alert variant="error">
  <AlertTitle>Failed to load data</AlertTitle>
  <AlertDescription>
    Connection timeout. <Button variant="link">Retry</Button>
  </AlertDescription>
</Alert>
```

---

## Data Table Standards

### Professional Styling

- Header: Uppercase, 12px, medium weight
- Rows: 14px, hover state
- Borders: Subtle, neutral-200
- Pagination: Server-side only
- Sorting: Visual indicators

### Virtualization

Use `@tanstack/react-virtual` for tables > 100 rows:

```tsx
const rowVirtualizer = useVirtualizer({
  count: data.length,
  getScrollElement: () => parentRef.current,
  estimateSize: () => 40,
});
```

---

## Chart Standards

### Library Choice

**Recharts** - Preferred for simplicity
- Bar charts (distributions)
- Heatmaps (correlations)
- Line charts (trends)

### Chart Rules

1. Use **backend-provided bins** only
2. Muted color palette (no rainbow)
3. Show methodology in subtitle
4. Tooltips with precise values
5. Responsive sizing

---

## Accessibility

- **WCAG 2.1 AA** compliance
- Keyboard navigation
- Screen reader support
- Focus indicators (2px ring)
- Reduced motion support

---

## File Structure

```
src/
├── components/
│   ├── layout/
│   │   └── AppShell.tsx         # Main app wrapper
│   ├── ui/                      # shadcn/ui primitives
│   ├── PermissionGate.tsx       # Role-based control
│   └── FeatureGate.tsx          # Feature flag control
├── pages/
│   ├── Dashboard.tsx
│   ├── Projects.tsx
│   ├── DatasetDetails.tsx       # Core product page
│   └── Admin.tsx                # Control room
├── store/
│   ├── useAuthStore.ts
│   └── useFeatureStore.ts
├── styles/
│   ├── design-tokens.css        # Design system
│   ├── base.css                 # Base styles
│   └── index.css                # Tailwind + utilities
└── lib/
    └── utils.ts                 # Helpers
```

---

## Development Guidelines

### DO

✅ Use design tokens consistently
✅ Gate features by role and flags
✅ Show loading/empty/error states
✅ Virtualize large data sets
✅ Log all admin actions
✅ Confirm destructive operations

### DON'T

❌ Show disabled buttons without explanation
❌ Use rainbow colors or gradients
❌ Create fake demo data
❌ Hide backend capabilities
❌ Skip permission checks
❌ Use generic error messages

---

## Testing Checklist

- [ ] All roles tested (Viewer → Owner)
- [ ] Feature flags toggle correctly
- [ ] Empty states render properly
- [ ] Error states are actionable
- [ ] Tables virtualize at scale
- [ ] Dark mode works identically
- [ ] Keyboard navigation works
- [ ] Screen reader announces correctly

---

## Deployment

### Environment Variables

```env
VITE_API_URL=https://api.projectida.com
VITE_ENABLE_ANALYTICS=true
```

### Build Command

```bash
npm run build
```

### Performance Checks

```bash
npm run lighthouse
```

---

## Support

For questions about UI architecture or design decisions:
- Review this README
- Check design tokens in `styles/design-tokens.css`
- Examine component patterns in `components/`

**Remember**: This is a production SaaS product. Every UI decision should build trust and enable power users.
