# Minute × Minute — UI Translation Rules + CSS/Tailwind Style Rules

> Source: `Minute_x_Minute_UI_Translation_and_Styles.docx` (Draft)
> Purpose: Translate B1 v1 icon language into UI components without drifting the brand.

---

## 1. Translation Rules

Use the icon's language: **confident human stroke + disciplined structure.**

Default to restraint. Anything that feels "sporty" or "gamer" is out.

### Stroke Mapping
| Stroke | UI Role |
|---|---|
| Primary stroke | Hero accent only — charts, primary highlights, key flows |
| Secondary stroke | Standard UI linework — dividers, outlines, diagram paths |
| Nodes | States/waypoints — steps, milestones, drill steps |
| X motif | "Time intersection" — use sparingly (e.g., current minute marker) |

**Do not use:** ribbon gradients, soft straps, stitched patterns, dense play-diagram clutter.

---

## 2. Component Rules

### Buttons
- **Primary:** Charcoal fill, subtle highlight edge, green accent on focus/active
- **Secondary:** Outline using secondary-stroke weight; no neon glow
- **Hover:** Brighten text + 1-step increase in border contrast

### Cards
- Rounded corners match icon family
- Faint grain/noise background: optional, extremely subtle
- Dividers use secondary stroke thickness

### Practice Timeline
- Timeline path uses secondary stroke
- "Current minute" is the X intersection marker (medium salience)
- Drill blocks use nodes as anchors (solid = confirmed, hollow = draft)

### Drill Drawing Canvas
- Default pen = dry-erase hybrid (primary stroke texture)
- Diagram/assist lines = secondary pen (cleaner)
- Keep max 2 stroke styles visible at once

---

## 3. Tailwind / CSS Style Rules

### Color Tokens (canonical values — confirm by visual testing)

| Token | Hex | RGB | Note |
|---|---|---|---|
| `--mx-bg` | `#0B0F14` | `11 15 20` | Near-black charcoal |
| `--mx-surface` | `#101722` | `16 23 34` | Card/panel |
| `--mx-surface-2` | `#162130` | `22 33 48` | Elevated surface |
| `--mx-text` | `#EAF0F7` | `234 240 247` | Primary text |
| `--mx-muted` | `#A7B3C2` | `167 179 194` | Secondary text |
| `--mx-green` | `#A6D64A` | `166 214 74` | Primary accent |
| `--mx-teal` | `#46B7A6` | `70 183 166` | Secondary accent |
| `--mx-red` | `#C85050` | `200 80 80` | Error/destructive (canonical) |

### Radius Scale
| Name | Value |
|---|---|
| `sm` | 10px |
| `md` | 14px |
| `lg` | 18px |
| `xl` | 22px — closest to icon feel |

### Shadow Rules
- **Elevation 1:** Soft, low-contrast
- **Elevation 2:** Slightly tighter, still subtle
- **Never:** Glow effects, high-contrast drop shadows

### Typography
- Warm geometric/humanist sans-serif (e.g., Geist Sans — already installed)
- Avoid futuristic fonts
- Headings: tighter tracking, heavier weight
- Body: normal weight
