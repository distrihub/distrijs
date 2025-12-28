# Distri Theme Customization

This guide explains how to customize the visual theme for applications using `@distri/react`.

## Quick Start

```tsx
// Import both files for default theme
import '@distri/react/theme.css';    // Default color variables
import '@distri/react/globals.css';  // Tailwind utilities (required)
```

The `theme.css` provides default light/dark mode colors. The `globals.css` provides Tailwind utilities and component styles.

## Custom Theme

**Option 1: Override specific variables** (recommended)

```css
/* your-app.css */
@import '@distri/react/globals.css';

/* Override specific variables */
:root {
  --primary: 220 90% 50%;  /* Custom blue primary */
}

.dark {
  --primary: 220 80% 60%;  /* Lighter blue for dark mode */
}
```

## CSS Variables Reference

### Core Colors

| Variable | Light Default | Dark Default | Description |
|----------|---------------|--------------|-------------|
| `--background` | `0 0% 100%` | `220 16% 8%` | Page background |
| `--foreground` | `222.2 84% 4.9%` | `210 33% 95%` | Main text color |
| `--card` | `0 0% 100%` | `220 17% 12%` | Card backgrounds |
| `--card-foreground` | Same as foreground | Same as foreground | Card text |
| `--popover` | Same as card | Same as card | Popover/dropdown bg |
| `--popover-foreground` | Same as foreground | Same as foreground | Popover text |

### Brand Colors

| Variable | Light Default | Dark Default | Description |
|----------|---------------|--------------|-------------|
| `--primary` | `188 100% 28%` | `188 100% 28%` | Primary brand color (#007C91) |
| `--primary-foreground` | `0 0% 100%` | `0 0% 100%` | Text on primary |
| `--highlight` | `188 70% 45%` | `188 70% 45%` | Accent highlight (rgb(34,174,195)) |

### Secondary & Muted

| Variable | Light Default | Dark Default | Description |
|----------|---------------|--------------|-------------|
| `--secondary` | `210 40% 96%` | `220 18% 16%` | Secondary backgrounds |
| `--secondary-foreground` | `222.2 84% 4.9%` | `210 33% 95%` | Secondary text |
| `--muted` | `210 40% 96%` | `220 18% 16%` | Muted/disabled backgrounds |
| `--muted-foreground` | `215.4 16.3% 46.9%` | `215 20% 65%` | Muted text |

### Accent & Destructive

| Variable | Light Default | Dark Default | Description |
|----------|---------------|--------------|-------------|
| `--accent` | `188 55% 92%` | `188 30% 22%` | Accent color |
| `--accent-foreground` | `188 80% 20%` | `188 70% 85%` | Accent text |
| `--destructive` | `0 84.2% 60.2%` | `0 62.8% 30.6%` | Error/delete actions |
| `--destructive-foreground` | `210 40% 98%` | `210 40% 98%` | Destructive text |

### Borders & Input

| Variable | Light Default | Dark Default | Description |
|----------|---------------|--------------|-------------|
| `--border` | `214.3 31.8% 91.4%` | `220 18% 20%` | Border color (#2a2f3a dark) |
| `--input` | Same as border | Same as border | Input field borders |
| `--ring` | `188 100% 28%` | `188 70% 45%` | Focus ring color |

### Sidebar

| Variable | Light Default | Dark Default | Description |
|----------|---------------|--------------|-------------|
| `--sidebar` | `0 0% 98%` | `216 18% 6%` | Sidebar bg (#0c0e11 dark) |
| `--sidebar-foreground` | `240 5.3% 26.1%` | `210 33% 95%` | Sidebar text |
| `--sidebar-primary` | `188 100% 28%` | `188 70% 45%` | Active nav item |
| `--sidebar-accent` | `240 4.8% 95.9%` | `220 18% 14%` | Hover states |
| `--sidebar-border` | `220 13% 91%` | `220 18% 18%` | Sidebar borders |

### Layout

| Variable | Default | Description |
|----------|---------|-------------|
| `--radius` | `0.5rem` | Border radius |
| `--thread-content-max-width` | `768px` | Max width for chat content |

## Color Format

All colors use HSL format without the `hsl()` wrapper:

```css
--primary: 188 100% 28%;  /* H S% L% */
```

This allows using opacity modifiers:

```css
background: hsl(var(--primary) / 0.5);  /* 50% opacity */
```

## Dark Mode

Dark mode is activated by adding the `dark` class to `<html>` or a parent element:

```html
<html class="dark">
```

Or toggle via JavaScript:

```js
document.documentElement.classList.toggle('dark');
```

## Files

- `globals.css` - Tailwind utilities + component styles (required)
- `theme.css` - Default color variables (imported by globals.css)
