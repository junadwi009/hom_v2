# 18 - Design System Without Figma

## Purpose

This document defines how to keep UI consistent when there is no Figma file.

## Source of Truth

The source of truth is code:

```text
Tailwind tokens
CSS variables
component props
Storybook stories
Playwright screenshots
Motion presets
```

## Design Tokens

Create tokens for:

```text
color
spacing
radius
shadow
typography
motion
z-index
status colors
chart colors
```

## Color System

Suggested semantic tokens:

```text
--background-app
--background-sidebar
--background-card
--foreground-primary
--foreground-muted
--accent-gold
--accent-gold-muted
--border-subtle
--status-success
--status-warning
--status-danger
--status-info
```

Do not hardcode colors inside feature components.

## Typography

Define:

```text
page-title
section-title
card-title
metric-value
metric-label
body
caption
table-header
chat-message
```

## Component Naming

Use this structure:

```text
components/ui/        generic shadcn-based primitives
components/hom/       HOM-specific reusable components
components/agent/     AI/chat/knowledge components
features/             page-specific feature modules
```

## Storybook Requirements

Each reusable component should have stories for:

```text
default
loading
empty
error
long text
mobile/narrow container
permission denied where relevant
```

Storybook is important because, without Figma, it becomes the visible catalog of the design system.

## Motion Guidelines

Create motion presets:

```text
fadeInSubtle
slideUpCard
sidebarCollapse
messageIn
modalScale
processingStep
```

Every motion must support reduced motion preferences.

## Data Visualization Guidelines

Dashboard charts should emphasize clarity over decoration.

Use:

```text
line chart for trends
bar chart for comparisons
table for exact financial numbers
status badges for operational state
attention cards for action required
```

Avoid:

```text
3D charts
too many colors
unlabeled axes
charts without period labels
mixing revenue and client count without clear axes
```

## Accessibility Checklist

```text
keyboard navigation works
visible focus state
aria labels for icon buttons
sufficient color contrast
forms have labels
errors are explained in text
motion can be reduced
chat bubbles readable by screen readers
```

## Editable Later

Because the UI is code-first, future edits can be made by changing:

```text
design tokens
component variants
Storybook examples
page configuration
copy/content in database
business rules in Knowledge Studio
```

This makes the system editable without needing a complete Figma rebuild.
