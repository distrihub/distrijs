# Distri Theme Customization

This guide explains how to customize the visual theme for applications using `@distri/react`.

## Quick Start

```tsx
import '@distri/react/styles.css';   // default theme + utilities in one file
```

or, separately:

```tsx
import '@distri/react/theme.css';    // Default color variables (optional)
import '@distri/react/globals.css';  // Tailwind utilities + scoped resets (required)
```

## Scoping

The stylesheets never touch the host app. Tailwind's preflight is disabled;
the resets Distri needs (box sizing, borders, button/heading/list resets,
fonts) apply only inside a Distri root, with zero-specificity `:where()` so
utility classes still win:

| Root | Where |
|------|-------|
| `.distri-chat` | `<Chat>`, `<TaskView>` (added automatically) |
| `.distri-root` | Any other Distri component you mount standalone; portalled dropdowns/selects/sheets carry it |
| `[data-distri]` | Same as `.distri-root`, as an attribute |

`theme.css` sets its variables on these roots too, not on `:root`. The build
fails if any selector could match bare host elements.

## Design Tokens

Set any of these on `.distri-chat` (or any ancestor). Colour tokens take any
CSS colour; each falls back to the shadcn variable shown.

| Token | Falls back to | Used for |
|-------|---------------|----------|
| `--distri-font` | system UI stack | Font family |
| `--distri-font-size` | `0.875rem` transcript, `1rem` elsewhere | Text size |
| `--distri-line-height` | `1.5` | Line height |
| `--distri-fg` | `--foreground` | Text (`text-foreground`) |
| `--distri-bg` | `--background` | Background (`bg-background`) |
| `--distri-muted` | `--muted-foreground` | Secondary text (`text-muted-foreground`) |
| `--distri-surface` | `--muted` | Subtle fills (`bg-muted`) |
| `--distri-border` | `--border` | Borders |
| `--distri-accent` | `--primary` | Links, primary buttons (`*-primary`) |
| `--distri-accent-fg` | `--primary-foreground` | Text on accent |
| `--distri-radius` | `--radius` | Corner radius (`rounded-lg/md/sm`) |
| `--distri-bubble-user-bg` | `--muted` at 60% | User message bubble |
| `--distri-bubble-user-fg` | `--distri-fg` | User bubble text |
| `--distri-bubble-radius` | `1rem` | User bubble radius |

```css
.distri-chat {
  --distri-font: "Inter", sans-serif;
  --distri-font-size: 15px;
  --distri-accent: #e0603c;
  --distri-bubble-user-bg: #fff4ee;
  --distri-radius: 12px;
}
```

## Custom Theme

**Option 1: Design tokens** (recommended) — see above.

**Option 2: Override shadcn variables** on the Distri root:

```css
/* your-app.css */
@import '@distri/react/globals.css';

.distri-chat, .distri-root {
  --primary: 220 90% 50%;  /* Custom blue primary */
}

.dark .distri-chat, .dark .distri-root {
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

- `styles.css` - `theme.css` + `globals.css` in one file
- `globals.css` - Tailwind utilities, scoped resets, component styles (required)
- `theme.css` - Default color variables, scoped to the Distri roots (optional)
