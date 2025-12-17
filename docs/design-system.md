# Design System & Styling Guide

The "Gen-4" aesthetic is defined by **Dark Glassmorphism**, **Vibrant Gradients**, and **Fluid Layouts**.

## 1. Global Variables (`styles.css`)

### Colors
| Variable | Value | Usage |
| :--- | :--- | :--- |
| `--bg-core` | `#0f172a` | Main background (Deep Slate). |
| `--bg-glass` | `rgba(30, 41, 59, 0.4)` | Panels (Sidebar, Controls). |
| `--bg-card` | `rgba(255, 255, 255, 0.03)` | Inner cards, slots. |
| `--text-primary` | `#f8fafc` | Main Headings. |
| `--text-secondary`| `#94a3b8` | Subtitles, labels. |

### Magic Gradient
*   **Variable**: `--gradient-magic`
*   **Value**: `linear-gradient(135deg, #3b82f6 0%, #a855f7 100%)`
*   **Usage**: Primary Buttons, Hero Text, Active Icons.

### Radius
*   `--radius-xl`: `24px` (Panels, Modal Windows)
*   `--radius-lg`: `16px` (Buttons, Cards)
*   `--radius-md`: `12px` (Inputs, Chips)

## 2. Common CSS Classes

### Containers
*   `.glass-panel`: Adds the standard blurred background, border, and padding. Used for the Control Panel.
*   `.studio-viewport`: The black/clean area where results appear.

### Buttons
*   `.primary-btn`: The "Magic" button. Glows on hover.
    ```html
    <button class="primary-btn">Compute <i class="icon"></i></button>
    ```
*   `.secondary-btn`: Glass button for secondary actions (Upload, Cancel).

### Inputs
*   `textarea`, `input[type="text"]`: Styled with glass background, white text, and blue focus ring.
*   `.template-chip`: Selectable pills for style presets.

## 3. Icons
*   We use raw **SVG** icons to avoid external font dependencies.
*   Icons are 24x24px, usually strops (outline) style.
*   Check `sidebar.js` references for examples of SVG paths.
