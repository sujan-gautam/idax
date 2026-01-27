# Project IDA Design System - Quick Reference

**Version**: 1.0.0  
**Last Updated**: 2026-01-27

---

## 🎨 Colors

### Primary (Indigo)
```css
--primary-50: #eef2ff;
--primary-500: #6366f1;  /* Main brand color */
--primary-600: #4f46e5;  /* Hover state */
--primary-700: #4338ca;  /* Active state */
```

### Neutral (Slate)
```css
--neutral-0: #ffffff;    /* White */
--neutral-50: #f8fafc;   /* Subtle background */
--neutral-100: #f1f5f9;  /* Muted background */
--neutral-500: #64748b;  /* Muted text */
--neutral-900: #0f172a;  /* Primary text */
```

### Semantic
```css
--success-500: #10b981;  /* Green */
--warning-500: #f59e0b;  /* Amber */
--error-500: #ef4444;    /* Red */
--info-500: #3b82f6;     /* Blue */
```

---

## 📝 Typography

### Font Families
```tsx
font-sans  // Inter
font-mono  // JetBrains Mono
```

### Font Sizes
```tsx
text-xs    // 12px
text-sm    // 14px
text-base  // 16px
text-lg    // 18px
text-xl    // 20px
text-2xl   // 24px
text-3xl   // 30px
text-4xl   // 36px
```

### Font Weights
```tsx
font-normal    // 400
font-medium    // 500
font-semibold  // 600
font-bold      // 700
```

---

## 📏 Spacing

```tsx
space-1   // 4px
space-2   // 8px
space-3   // 12px
space-4   // 16px
space-6   // 24px
space-8   // 32px
space-12  // 48px
```

---

## 🧩 Component Usage

### PageHeader
```tsx
import { PageHeader } from '@/components/common';

<PageHeader
  title="Page Title"
  description="Optional description"
  actions={<Button>Action</Button>}
  breadcrumbs={<Breadcrumbs items={[...]} />}
/>
```

### EmptyState
```tsx
import { EmptyState } from '@/components/common';
import { FolderTree } from 'lucide-react';

<EmptyState
  icon={FolderTree}
  title="No projects yet"
  description="Create your first project to get started"
  action={{
    label: 'Create Project',
    onClick: () => setDialogOpen(true)
  }}
/>
```

### LoadingState
```tsx
import { LoadingState } from '@/components/common';

// Spinner variant
<LoadingState variant="spinner" message="Loading..." />

// Skeleton variant
<LoadingState variant="skeleton" />

// Full page variant
<LoadingState variant="page" message="Loading dashboard..." />
```

### StatusIndicator
```tsx
import { StatusIndicator } from '@/components/common';

<StatusIndicator status="success" label="Active" />
<StatusIndicator status="error" label="Failed" />
<StatusIndicator status="processing" label="Running" />
```

### StatCard
```tsx
import { StatCard } from '@/components/data';
import { Database } from 'lucide-react';

<StatCard
  title="Datasets"
  value={42}
  subtitle="5 processing"
  icon={Database}
  trend={{ value: '+12%', positive: true }}
  onClick={() => navigate('/datasets')}
/>
```

### MetricCard
```tsx
import { MetricCard } from '@/components/data';

<MetricCard
  label="Total Rows"
  value="1,234,567"
  unit="rows"
  description="Across all datasets"
  variant="highlight"
/>
```

### ProjectCard
```tsx
import { ProjectCard } from '@/components/project';

<ProjectCard
  project={{
    id: '123',
    name: 'My Project',
    description: 'Project description',
    datasetCount: 5,
    createdAt: '2026-01-01',
    updatedAt: '2026-01-27'
  }}
  onDelete={(id) => handleDelete(id)}
/>
```

### CreateProjectDialog
```tsx
import { CreateProjectDialog } from '@/components/project';

<CreateProjectDialog
  open={isOpen}
  onOpenChange={setIsOpen}
  onCreateProject={async (name, description) => {
    await api.post('/projects', { name, description });
  }}
/>
```

---

## 🎭 CSS Classes

### Layout
```css
.page-container      /* Max-width container with padding */
.page-header         /* Page header spacing */
.page-title          /* Page title styling */
.page-description    /* Page description styling */
```

### Cards
```css
.card                /* Base card */
.card-header         /* Card header */
.card-title          /* Card title */
.card-content        /* Card content */
.card-footer         /* Card footer */
```

### Stats & Metrics
```css
.stat-card           /* Stat card container */
.stat-label          /* Stat label */
.stat-value          /* Stat value */
.stat-change         /* Stat change indicator */
```

### Badges
```css
.badge               /* Base badge */
.badge-primary       /* Primary badge */
.badge-success       /* Success badge */
.badge-warning       /* Warning badge */
.badge-error         /* Error badge */
.badge-neutral       /* Neutral badge */
```

### States
```css
.empty-state         /* Empty state container */
.empty-state-icon    /* Empty state icon */
.empty-state-title   /* Empty state title */
.empty-state-description  /* Empty state description */

.skeleton            /* Skeleton loader */
.spinner             /* Spinner loader */
```

### Alerts
```css
.alert               /* Base alert */
.alert-success       /* Success alert */
.alert-warning       /* Warning alert */
.alert-error         /* Error alert */
.alert-info          /* Info alert */
```

### Forms
```css
.form-group          /* Form field group */
.form-label          /* Form label */
.form-helper         /* Helper text */
.form-error          /* Error message */
```

### Utilities
```css
.animate-fade-in     /* Fade in animation */
.animate-slide-in    /* Slide in animation */
.gradient-text       /* Gradient text */
.glass               /* Glass effect */
.line-clamp-2        /* Truncate to 2 lines */
.line-clamp-3        /* Truncate to 3 lines */
```

---

## 🌙 Dark Mode

All components support dark mode automatically. Use the `dark:` prefix for dark mode styles:

```tsx
<div className="bg-white dark:bg-neutral-900">
  <p className="text-neutral-900 dark:text-neutral-50">
    This text adapts to dark mode
  </p>
</div>
```

---

## 📱 Responsive Design

Use Tailwind's responsive prefixes:

```tsx
<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3">
  {/* 1 column on mobile, 2 on tablet, 3 on desktop */}
</div>
```

Breakpoints:
- `sm`: 640px
- `md`: 768px
- `lg`: 1024px
- `xl`: 1280px
- `2xl`: 1536px

---

## ♿ Accessibility

### Focus States
All interactive elements have focus states:
```tsx
<button className="focus:outline-none focus:ring-2 focus:ring-primary-500">
  Click me
</button>
```

### ARIA Labels
Use ARIA labels for screen readers:
```tsx
<button aria-label="Close dialog">
  <X className="h-4 w-4" />
</button>
```

### Semantic HTML
Use proper HTML elements:
```tsx
<nav>...</nav>
<main>...</main>
<article>...</article>
<section>...</section>
```

---

## 🎬 Animations

### Fade In
```tsx
<div className="animate-fade-in">
  Content fades in
</div>
```

### Slide In
```tsx
<div className="animate-slide-in">
  Content slides in from bottom
</div>
```

### Custom Transitions
```tsx
<div className="transition-all duration-200 hover:shadow-md">
  Smooth hover effect
</div>
```

---

## 🔧 Customization

### Extending Colors
Add custom colors in `tailwind.config.js`:
```js
colors: {
  brand: {
    50: '#...',
    500: '#...',
    // ...
  }
}
```

### Custom Components
Create new components following the pattern:
```tsx
/**
 * Component Name - Description
 */

import React from 'react';
import { cn } from '@/lib/utils';

interface ComponentProps {
  // Props
}

export const Component: React.FC<ComponentProps> = ({
  // Destructure props
}) => {
  return (
    // JSX
  );
};

export default Component;
```

---

## 📚 Resources

- **Tailwind CSS**: https://tailwindcss.com/docs
- **Radix UI**: https://www.radix-ui.com/
- **Lucide Icons**: https://lucide.dev/
- **Inter Font**: https://rsms.me/inter/

---

## 🐛 Troubleshooting

### Dark mode not working
Ensure the `dark` class is on the `<html>` element:
```tsx
document.documentElement.classList.add('dark');
```

### Styles not applying
1. Check if Tailwind is configured correctly
2. Ensure `globals.css` is imported in `main.tsx`
3. Verify class names are correct

### Component not found
Check the import path:
```tsx
import { Component } from '@/components/common';
```

---

**Last Updated**: 2026-01-27  
**Questions?**: Refer to component source code for detailed implementation
