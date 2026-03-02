# Minute × Minute — App Icon Production Spec B1v1 (Master)

> Source: `Minute_x_Minute_Icon_Production_Spec_B1v1.docx`
> Version: 1.0 | Scope: Dark mode master. Light mode derived later.

---

## 1. Canvas & Container

- **Base shape:** Rounded square
- **Corner radius:** 22–25% of side length
- **Inner vignette:** Optional, ≤4% opacity (must not create fabric softness)
- **Safe area padding:** 14–16% — no stroke, node, or texture crosses this boundary

---

## 2. Stroke System (Critical)

### Primary Stroke — Identity / Dry-erase hybrid
- **Width:** 1.0x baseline
- **Texture:** Dry-erase with chalk grain; broken edges; directional drag; no paint pooling; no splatter
- **Motion:** Single confident motion; no retracing; no needle-point tapers

### Secondary Stroke — Structural
- **Width:** 0.55–0.6x of primary
- **Texture:** Minimal grain; slightly rough "diagram pen" edge
- **Role:** Supports planning structure; never competes with primary

---

## 3. The "X" (Mandatory)

- **Meaning:** Minute × Minute
- Must exist structurally via stroke intersection (preferred)
- Optional explicit X glyph: allowed only if same width as secondary (or thinner), same color family, medium salience, not attention-grabbing

---

## 4. Nodes ("O"s)

- Max 3 nodes
- Size: ~0.75x primary stroke width
- Mix of solid + hollow allowed
- No glow, no drop shadow, no decorative flourishes

---

## 5. Color (Dark Mode)

- **Background:** Near-black charcoal (avoid pure black)
- **Accents:** Desaturated neon green (primary) + muted teal (secondary)
- **Rule:** Green leads; teal supports; avoid gradient feathering that reads "ribbon/fabric"

---

## 6. Minimum Sizes

| Size | Requirement |
|---|---|
| 32×32 | X remains readable; grain still visible |
| 24×24 | Texture may collapse; silhouette must remain legible. Reduce grain — do not thicken strokes |

---

## 7. Exports

- **Source of truth:** SVG (when available)
- **PNG sizes:** 1024, 512, 192, 180, 32
- **Naming:** `icon-{size}x{size}.png`
- Dark mode only for production master. Light mode derived once mark is frozen.

### Current assets in `frontend/public/`
| File | Status |
|---|---|
| `icon-1024x1024.png` | Master — do not use directly in UI |
| `icon-512x512.png` | App logo (signup/login pages) |
| `icon-192x192.png` | PWA manifest |
| `icon-180x180.png` | Apple touch icon |
| `icon-32x32.png` | Favicon |

---

## 8. Non-Negotiables

**Must include:**
- Dry-erase brush stroke
- X somewhere in the design

**Must avoid:**
- Fabric softness / ribbon gradients
- Literal sports equipment
- Excessive busyness
- Symmetric "polish" that kills human intent
