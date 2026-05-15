# Design System & UI Standards — dark mode fixes, responsive layout, form alignment, icon visibility

## Raw user request

We need coherent design standards across the app. Specific issues identified:

1. **Search bar** — text is not cleared after search/reset actions.
2. **Dark mode — icons** — icons appear black (nearly invisible) in dark mode; they must be white or use a theme-aware colour.
3. **Dark mode — Login & Register forms** — fonts/labels render black on dark backgrounds; they must be white/light.
4. **Register form — Repeat Password field** — stays hidden and is misaligned, causing it to show the password value unexpectedly. Must be properly shown and aligned.
5. **General design standards** — define and enforce a coherent visual system: colour tokens, typography scale, spacing, component states (default/hover/focus/disabled/error), and dark/light mode switching rules.
6. **Responsive layout** — the app must work correctly on mobile, tablet, and desktop. QA testing must cover all three breakpoints thoroughly.

The goal is a consistent, accessible, responsive UI with properly functioning dark mode throughout.
