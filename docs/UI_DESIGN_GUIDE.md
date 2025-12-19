# SocialFlow UI Design Guide

## Overview

Modern, accessible design system built on **iOS 26 Liquid Glass + Material 3 Expressive** principles.

**Tech Stack:** React 19 + Tailwind CSS 3.4 + Radix UI + CVA (Class Variance Authority)

**Location:** `socialflow-ui/src/`

---

## Brand Colors

| Role | Light Mode | Dark Mode | HSL |
|------|------------|-----------|-----|
| **Primary (Teal)** | `#14b8a6` | `#2dd4bf` | `173 80% 40%` / `174 72% 56%` |
| **Accent (Cyan)** | `#06b6d4` | `#22d3ee` | `186 94% 41%` / `186 93% 52%` |
| **Background** | `#f8fafc` | `#0a0d12` | `210 20% 98%` / `222 47% 5%` |
| **Card** | `#ffffff` | `#111827` | `0 0% 100%` / `222 47% 8%` |
| **Destructive** | `#ef4444` | `#f87171` | `0 84% 60%` |

---

## Status Colors (Content Workflow)

| Status | Color | HSL | Icon | Auto-Pulse |
|--------|-------|-----|------|------------|
| `PENDING` | Slate | `220 9% 46%` | Clock | No |
| `NEEDS_AI` | Violet | `262 83% 58%` | Sparkles | **Yes** |
| `NEEDS_REVIEW` | Amber | `38 92% 50%` | Eye | **Yes** |
| `APPROVED` | Emerald | `158 64% 52%` | Check | No |
| `SCHEDULED` | Sky | `199 89% 48%` | Calendar | No |
| `FAILED` | Rose | `350 89% 60%` | X | No |
| `BLOCKED` | Orange | `24 94% 53%` | AlertTriangle | No |

---

## Spacing & Radius

**Border Radius:**
| Name | Value | Use |
|------|-------|-----|
| `rounded-sm` | 6px | XS elements |
| `rounded-md` | 8px | Buttons, inputs |
| `rounded-lg` | 12px | Cards (**default**) |
| `rounded-xl` | 16px | Panels, modals |
| `rounded-2xl` | 24px | Hero cards |

**Spacing (Tailwind scale):**
- `gap-1` (4px), `gap-2` (8px), `gap-3` (12px), `gap-4` (16px)
- `p-3` (12px), `p-4` (16px), `p-6` (24px)

---

## Shadows

| Name | Use Case | Value |
|------|----------|-------|
| `shadow-sm` | Subtle depth | `0 1px 2px rgba(0,0,0,0.05)` |
| `shadow-md` | Cards, buttons | `0 4px 12px rgba(0,0,0,0.08)` |
| `shadow-lg` | Elevated panels | `0 8px 24px rgba(0,0,0,0.12)` |
| `shadow-glow` | Primary focus | `0 0 24px rgba(20, 184, 166, 0.25)` |
| `shadow-glass` | Glass panels | `0 8px 32px rgba(0,0,0,0.08), inset 0 1px 0 rgba(255,255,255,0.4)` |

---

## Glass Effects (Glassmorphism)

```css
/* Default glass panel */
background: rgba(255, 255, 255, 0.75);
backdrop-filter: blur(16px);
border: 1px solid rgba(255, 255, 255, 0.2);

/* Dark mode */
background: rgba(15, 23, 42, 0.85);
border: 1px solid rgba(255, 255, 255, 0.1);
```

**Blur levels:** `sm` (4px), `md` (8px), `lg` (12px), `xl` (16px - default)

**Glass Panel Variants:**
| Variant | Opacity | Use |
|---------|---------|-----|
| `default` | 0.75 | Standard panels |
| `subtle` | 0.50 | Background elements |
| `solid` | 0.90 | High contrast areas |

---

## Button Variants

| Variant | Style | Use Case |
|---------|-------|----------|
| `default` | Teal→Cyan gradient | Primary actions |
| `destructive` | Rose gradient | Delete, cancel |
| `outline` | Teal border, no fill | Secondary actions |
| `secondary` | Gray background | Tertiary actions |
| `ghost` | No background | Inline actions |
| `glass` | Frosted glass | On glass panels |
| `success` | Emerald→Teal gradient | Confirm, approve |

**Sizes:**
| Size | Height | Use |
|------|--------|-----|
| `sm` | 32px | Compact UI |
| `default` | 40px | Standard buttons |
| `lg` | 48px | Prominent CTAs |
| `xl` | 56px | Hero sections |
| `icon` | 40x40px | Icon-only buttons |
| `icon-sm` | 32x32px | Compact icon buttons |
| `icon-lg` | 48x48px | Large icon buttons |

---

## Animation Patterns

| Effect | Duration | Easing |
|--------|----------|--------|
| **Hover scale** | 200ms | `ease-out` |
| **Active press** | instant | - |
| **Fade in** | 200ms | `cubic-bezier(0.2, 0, 0, 1)` |
| **Bounce** | 500ms | `cubic-bezier(0.34, 1.56, 0.64, 1)` |
| **Shimmer** | 2s infinite | linear |

**Interactive states:**
- Hover: `scale(1.01-1.02)`, shadow increase
- Active: `scale(0.98)`
- Focus: `ring-2` with brand color
- Disabled: `opacity-50`, `pointer-events-none`

---

## Component Architecture (CVA)

All components use Class Variance Authority for type-safe variants:

```tsx
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const componentVariants = cva(
  "base-classes", // Always applied
  {
    variants: {
      variant: {
        default: "bg-primary text-white",
        destructive: "bg-destructive text-white",
      },
      size: {
        sm: "h-8 text-sm",
        default: "h-10",
        lg: "h-12 text-lg",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default"
    }
  }
);

interface ComponentProps extends VariantProps<typeof componentVariants> {
  className?: string;
}

// Usage with cn() for class merging
<button className={cn(componentVariants({ variant, size }), className)} />
```

**Utility Function:**
```ts
// src/lib/utils.ts
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
```

---

## Dark Mode

**Implementation:** Class-based (`.dark` on `<html>`)

**CSS Variables:** All colors defined as HSL in `:root` and `.dark`

**Pattern:**
```tsx
// Light/dark responsive classes
className="bg-white dark:bg-slate-900 text-slate-900 dark:text-slate-100"

// Status badges with transparency
className="bg-violet-100 dark:bg-violet-900/50"
```

**Dark mode adjustments:**
- Backgrounds: Darker base colors
- Text: Lighter for contrast
- Borders: Subtle white (10-20% opacity)
- Status badges: 50% opacity backgrounds

---

## Dark Mode Toggle Implementation

When adding dark mode toggle:

1. **Toggle mechanism:** Add state to toggle `.dark` class on `document.documentElement`
2. **Persistence:** Store preference in `localStorage`
3. **System preference:** Check `prefers-color-scheme: dark`
4. **Button location:** Settings page or header/sidebar
5. **Icons:** Sun/Moon from Lucide (`Sun`, `Moon`)

**Recommended Implementation:**
```tsx
import { useState, useEffect } from 'react';
import { Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function ThemeToggle() {
  const [isDark, setIsDark] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('theme') === 'dark' ||
        (!localStorage.getItem('theme') &&
         window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  return (
    <Button
      variant="ghost"
      size="icon"
      onClick={() => setIsDark(!isDark)}
      aria-label="Toggle dark mode"
    >
      {isDark ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
    </Button>
  );
}
```

---

## Gradients

| Name | Colors | Use |
|------|--------|-----|
| `gradient-primary` | Teal → Cyan | Primary buttons |
| `gradient-success` | Emerald → Teal | Success buttons |
| `gradient-destructive` | Rose → Red | Destructive buttons |
| `shimmer` | Transparent → White/10% → Transparent | Loading skeletons |

**CSS:**
```css
.gradient-primary {
  background: linear-gradient(135deg, hsl(174, 72%, 56%), hsl(186, 94%, 41%));
}
```

---

## Key Files

| File | Purpose |
|------|---------|
| `tailwind.config.js` | Design tokens, colors, spacing, animations |
| `src/index.css` | CSS variables, utility classes |
| `src/components/ui/button.tsx` | Button variants |
| `src/components/ui/card.tsx` | Card variants |
| `src/components/ui/badge.tsx` | Status badges |
| `src/components/ui/glass-panel.tsx` | Glass effect containers |
| `src/components/ui/progress.tsx` | Progress bars (bar + circular) |
| `src/components/ui/status-indicator.tsx` | Status dots/labels |
| `src/components/ui/skeleton.tsx` | Loading placeholders |
| `src/components/scheduling/` | Scheduling calendar components |
| `src/lib/utils.ts` | `cn()` helper function |

---

## Compound Components

**Card:**
```tsx
<Card variant="elevated">
  <CardHeader>
    <CardTitle>Title</CardTitle>
    <CardDescription>Description</CardDescription>
  </CardHeader>
  <CardContent>Content</CardContent>
  <CardFooter>Footer</CardFooter>
</Card>
```

**Status Indicator:**
```tsx
// Full indicator with label
<StatusIndicator status="NEEDS_REVIEW" size="md" showLabel />

// Dot only
<StatusDot status="APPROVED" />
```

**Skeleton Patterns:**
```tsx
<SkeletonCard />        // Image + text placeholder
<SkeletonList count={5} /> // Repeated rows
<SkeletonTable rows={5} cols={4} />
<SkeletonContentGrid count={8} /> // Grid of content cards
```

---

## Scheduling Calendar Component

**Location:** `src/components/scheduling/`

A feature-rich calendar for scheduling approved content with week/month views.

### Component Structure

| File | Purpose |
|------|---------|
| `index.tsx` | Main container with tabs, preview, save button |
| `WeekView.tsx` | Weekday toggle buttons (Mon-Sun) + start date |
| `MonthView.tsx` | Full calendar grid with date selection |
| `TimeConfig.tsx` | Feed/Story time pickers, max items per day |
| `SchedulePreview.tsx` | Preview table grouped by date |
| `scheduleUtils.ts` | Distribution algorithm, date helpers |
| `types.ts` | TypeScript interfaces |

### Usage

```tsx
import { SchedulingCalendar } from '@/components/scheduling';

<SchedulingCalendar
  clientSlug="client-name"
  batchSlug="batch-name"
  approvedItems={items.filter(i => i.status === 'APPROVED')}
  onScheduleSave={async (items) => {
    await scheduleItems.mutateAsync(items);
  }}
  isSaving={scheduleItems.isPending}
/>
```

### Styling

**Week Day Button:**
```tsx
// Unselected
className="border-border bg-card hover:bg-accent"

// Selected
className="border-primary bg-primary text-primary-foreground"
```

**Month Calendar Cell:**
```tsx
// Normal day
className="bg-card hover:bg-accent"

// Selected
className="bg-primary text-primary-foreground"

// Today (unselected)
className="ring-2 ring-primary/50"

// Past/disabled
className="opacity-30 cursor-not-allowed"
```

**Preview Card (overflow warning):**
```tsx
className="border-amber-200 bg-amber-50/50 dark:border-amber-800 dark:bg-amber-900/20"
```

### Configuration Defaults

| Setting | Default | Range |
|---------|---------|-------|
| Feed Time | `20:00` | 24-hour format |
| Story Time | `18:30` | 24-hour format |
| Max Per Day | `2` | 1-5 |
| Default Weekdays | Mon, Wed, Fri | Any combination |

### Distribution Algorithm

1. Sort items alphabetically by `file_name`
2. Sort dates chronologically
3. Assign feed items first, then story items
4. Respect `maxPerDay` limit per date
5. Overflow items shown in warning panel

---

## Accessibility

- All interactive components use **Radix UI** primitives (keyboard nav, ARIA)
- Focus rings: `focus:ring-2 focus:ring-offset-2`
- Color contrast: WCAG AA compliant
- Motion: Respects `prefers-reduced-motion`
- Labels: All buttons have `aria-label` when icon-only

---

## Icon Library

**Lucide React** - Consistent icon set

Common icons:
| Icon | Use |
|------|-----|
| `Sun`, `Moon` | Theme toggle |
| `Play`, `Sparkles` | Workflow actions |
| `Check`, `X` | Status indicators |
| `Eye`, `Clock` | Status icons |
| `Trash2`, `RefreshCw` | Actions |
| `ChevronDown`, `ArrowRight` | Navigation |

---

**Last Updated:** 2025-12-12
