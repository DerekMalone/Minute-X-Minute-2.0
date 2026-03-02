# Minute × Minute — shadcn + Tailwind Style Rules

> Source: `Minute_x_Minute_shadcn_Tailwind_Styles.docx`

---

## Theme Variables (`globals.css`)

Dark mode is **class-based** — `.dark` on `<html>`. Default `:root` is light mode.

```css
/* Light mode */
:root {
  --mx-bg:          255 255 255;
  --mx-surface:     245 247 250;
  --mx-surface-2:   236 240 246;
  --mx-text:         12  18  28;
  --mx-muted:        92 106 115;
  --mx-green:       166 214  74;
  --mx-teal:         70 183 166;
  --mx-stroke:       14  20  28;
  --mx-stroke-soft:  14  20  28 / 0.35;
}

/* Dark mode (primary design surface) */
.dark {
  --mx-bg:          11  15  20;
  --mx-surface:     16  23  34;
  --mx-surface-2:   22  33  48;
  --mx-text:       234 240 247;
  --mx-muted:      167 179 194;
  --mx-green:      166 214  74;
  --mx-teal:        70 183 166;
  --mx-stroke:     234 240 247;
  --mx-stroke-soft: 234 240 247 / 0.25;
}
```

Note: `--mx-green`, `--mx-teal`, `--mx-amber`, `--mx-red` are identical in both modes.

---

## Tailwind Color Extension

Tailwind 4 uses `@theme` in CSS (no `tailwind.config.js`):

```css
@theme {
  --color-mx-bg:          rgb(var(--mx-bg));
  --color-mx-surface:     rgb(var(--mx-surface));
  --color-mx-surface-2:   rgb(var(--mx-surface-2));
  --color-mx-text:        rgb(var(--mx-text));
  --color-mx-muted:       rgb(var(--mx-muted));
  --color-mx-green:       rgb(var(--mx-green));
  --color-mx-teal:        rgb(var(--mx-teal));
  --color-mx-stroke:      rgb(var(--mx-stroke));
  --color-mx-stroke-soft: rgb(var(--mx-stroke-soft));
}
```

Usage: `bg-mx-surface`, `text-mx-green`, `border-mx-stroke-soft`

---

## Brand Utility Classes

Define these in `globals.css` as `@layer utilities` or `@layer components`.

### Surface / Layout
- `mxSurface` — card/panel surface (`bg-mx-surface`, border, radius)
- `mxSurface2` — elevated/nested surface (`bg-mx-surface-2`)
- `mxElev` — elevation shadow (soft, low-contrast only — no glow)
- `mxDivider` — divider line (`border-mx-stroke-soft`)

### Focus / Text
- `mxFocus` — focus ring (`focus-visible:ring-2 focus-visible:ring-mx-teal`)
- `mxAccentText` — primary accent text (`text-mx-green`)

### Buttons
- `mxBtnPrimary` — charcoal fill, green accent on focus/active
- `mxBtnSecondary` — outline using stroke weight; no neon glow
- `mxBtnGhost` — ghost/text variant

### Card
- `mxCard` — card container (surface bg, rounded corners, stroke border)
- `mxCardHeader` — card header region
- `mxCardTitle` — card title typography

### Tabs
- `mxTabsList` — tab bar container
- `mxTabsTrigger` — individual tab trigger

### Input
- `mxInput` — form input (surface bg, stroke border, teal focus ring)

### Badges
- `mxBadgeGreen` — green accent badge
- `mxBadgeTeal` — teal accent badge
- `mxBadgeNeutral` — muted neutral badge

### SVG / Canvas Strokes
- `.mx-chalk-path` — primary stroke (dry-erase/chalk texture for canvas)
- `.mx-pen-path` — secondary stroke (diagram pen, structural lines)

### Layout
- `mxAppShell` — root app layout wrapper
- `mxSidebar` — sidebar navigation panel
- `mxMain` — main content area
- `mxTimelineRow` — practice timeline row
- `mxTimePill` — time allocation pill/badge
