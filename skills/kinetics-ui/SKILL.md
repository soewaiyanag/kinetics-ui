---
name: kinetics-ui
description: Use when adding, choosing or reviewing animations and transitions in a web UI (CSS, Tailwind, Framer Motion, Vue/React) to pick easing, duration, origin and technique.
---

# Kinetics UI: Web UI Animation Decisions

Use this to decide **whether** to animate, **which** pattern to use, and **what values** to apply. Go through the steps in order.

## Step 1: Should this animate at all?

Frequency of use decides how much motion to add.

| How often the user sees it | Motion budget |
|---|---|
| Constantly (typing, tab switch, hover on list rows, keyboard nav, command palette) | None or near-instant (0–100ms, opacity only) |
| Often (dropdowns, popovers, toggles, button presses) | Snappy and subtle, 150–250ms, no bounce |
| Occasionally (modals, page/route transitions, drawers) | Up to ~300ms, can use staging and stagger |
| Rarely / milestone (success, onboarding, empty→first item, payment done) | Room for flourish: pulse, sparkle, follow-through |

Hard rules:
- Feedback must start within **100ms** of input. The full response must land within **400ms** (Doherty threshold). If work takes longer, show a skeleton or optimistic state immediately.
- Never add bounce or underdamped springs to everyday UI.
- Always respect `prefers-reduced-motion`: replace movement and scale with an opacity fade or no animation.

## Step 2: Classify the motion, then use its recipe

### A. Element entering (appears on screen)
- Easing: **ease-out** (fast start, gentle landing). `cubic-bezier(0.16, 1, 0.3, 1)` or `cubic-bezier(0.22, 1, 0.36, 1)`.
- Duration: 150–250ms (small) / up to 300ms (large panels).
- Never animate from `scale(0)`. Start at **`scale(0.95)` + `opacity: 0`**.

### B. Element exiting
- About **20% shorter** than its entrance (e.g. 250ms in → 200ms out).
- Easing: **ease-in** (or ease-out with a short duration; exits shouldn't linger).
- Exit toward where it came from (see C).

### C. Popover / dropdown / menu / tooltip
- `transform-origin` = **the trigger's side** (e.g. `top right` for a menu under a top-right avatar), not center. Radix/Headless UI expose this as `--radix-popover-content-transform-origin` etc.
- Enter: `scale(0.95)→1`, `opacity 0→1`, 150–200ms, ease-out.
- Exit: reverse back into the trigger, ~120–160ms.
- Dropdown total: **150–250ms**.

### D. Moving an element from A to B (reorder, drag-to-drop landing, file moved to folder)
- Easing: **ease-in-out** (slow in, slow out). Never linear.
- For long travel, use a **subtle arc** (~32px offset at the midpoint) instead of a straight line.
- If it's the *same logical object* changing place or size (card → detail view, tab indicator, list item → modal): use a **shared layout transition** (Framer Motion `layoutId`, View Transitions API `view-transition-name`, Vue `<TransitionGroup>` FLIP).

### E. Lists and groups appearing
- Stagger rows by **30ms** (cap the total, e.g. stop staggering after ~8–10 items so the last row isn't late).
- Show one focal thing at a time (staging). Primary content first, secondary details (badges, meta, avatars) settle slightly after (follow-through).

### F. Direct manipulation (drag, slider, swipe, scroll-linked)
- **No tween while held.** Track the pointer 1:1. Animate only on release (snap or settle).
- Past bounds: **rubber band** with diminishing resistance (e.g. `offset = limit + (overflow * 0.3)` or a log curve) instead of a hard stop.
- Moving knobs/thumbs: optional **~12% stretch along the axis of motion**, area-preserving (`scaleX(1.12) scaleY(0.89)`), relaxing when motion stops.

### G. Press and tap feedback
- Buttons: `scale(0.97)` on `:active`, ~100ms, ease-out. Release returns over about the same time.
- Make the hit area bigger than the visual (min 44×44px; use padding or a `::before` inset). Put frequent targets large and close (Fitts's law).

### H. State changes inside an element
- **Icon swap** (play↔pause, copy→check, menu↔close): crossfade + `scale(0.8↔1)` + `blur(2–4px↔0)`, ~150–200ms. Use `AnimatePresence mode="popLayout"` or absolute stacking so the two overlap.
- **Color / fill / reveal changes** (toggle fill, progress, theme switch, text reveal): prefer `clip-path` / `mask` wipes over plain crossfades.
- **View A → view B**: **overlap** the exit and the entrance; don't wait for A to fully leave before B enters.

### I. Success / confirmation / error (rare, high-meaning moments)
- Success: a single **pulse** (`scale 1→1.05→1`, ~250ms). Optionally add a secondary action like a small sparkle or check-draw that backs up the main one.
- Error: an **exaggerated** horizontal shake on the input (e.g. 4 cycles of ±6px over ~300ms) plus a color change. Never rely on motion alone; keep the text message.
- Weight/impact: brief squash and stretch on landing (e.g. `scaleY(0.95) scaleX(1.05)` for ~80ms) only for playful or rare moments.

### J. 3D tilt / flip
- Set `perspective` on the parent (600–1200px) and `transform-style: preserve-3d` so it reads as a real object, not a flat skew. Keep angles small (≤10–15°) for hover tilt.

## Step 3: Pre-ship checklist

- [ ] Nothing uses `linear` easing except progress bars, spinners and marquees.
- [ ] Primary transitions ≤300ms; dropdowns 150–250ms; exits ~20% shorter than entrances.
- [ ] Popovers start at 0.95 scale and grow from and shrink back to the trigger.
- [ ] No bounce on high-frequency UI.
- [ ] Dragging tracks the pointer with no lag.
- [ ] Only `transform`, `opacity`, `filter`, `clip-path` animated (no `width`/`height`/`top`/`left` – use FLIP or layout animations instead).
- [ ] `prefers-reduced-motion` handled.
- [ ] Interruptible: re-triggering mid-animation reverses from the current position (CSS transitions do this; keyframe `animation` does not).
- [ ] Familiar patterns kept (Jakob's law): menus drop from their trigger, modals center, toasts come from a consistent edge.

## Related UX laws (not motion, but check while you're there)
- **Hick's law**: fewer choices → faster decisions. Trim menus before you animate them.
- **Miller's law**: chunk long values (card `4242 4242 4242 4242`, phone numbers) into groups.
- **Postel's law**: accept messy input (spaces, dashes, case) and normalize it to clean output.

## Snippets

### CSS tokens
```css
:root {
  --ease-out: cubic-bezier(0.16, 1, 0.3, 1);
  --ease-in: cubic-bezier(0.7, 0, 0.84, 0);
  --ease-in-out: cubic-bezier(0.65, 0, 0.35, 1);
  --dur-press: 100ms;
  --dur-fast: 150ms;   /* dropdown, tooltip */
  --dur-base: 200ms;   /* popover, icon swap */
  --dur-slow: 280ms;   /* modal, drawer */
  --stagger: 30ms;
}
@media (prefers-reduced-motion: reduce) {
  *, *::before, *::after {
    animation-duration: 1ms !important;
    transition-duration: 1ms !important;
  }
}
```

### Popover (CSS, data-state driven)
```css
.popover {
  transform-origin: var(--radix-popover-content-transform-origin, top right);
  transition: opacity var(--dur-base) var(--ease-out), transform var(--dur-base) var(--ease-out);
}
.popover[data-state="closed"] {
  opacity: 0; transform: scale(0.95);
  transition-duration: 160ms; transition-timing-function: var(--ease-in);
}
```

### Button press
```css
.btn { transition: transform var(--dur-press) var(--ease-out); }
.btn:active { transform: scale(0.97); }
```

### Staggered list (Framer Motion)
```tsx
const list = { show: { transition: { staggerChildren: 0.03 } } };
const item = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.2, ease: [0.16, 1, 0.3, 1] } },
};
```

### Icon crossfade (Framer Motion)
```tsx
<AnimatePresence mode="popLayout" initial={false}>
  <motion.span key={copied ? 'check' : 'copy'}
    initial={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
    animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
    exit={{ opacity: 0, scale: 0.8, filter: 'blur(4px)' }}
    transition={{ duration: 0.18 }}>
    {copied ? <Check /> : <Copy />}
  </motion.span>
</AnimatePresence>
```

### Rubber band
```ts
const rubberband = (overflow: number, dim: number, c = 0.55) =>
  (1 - 1 / ((overflow * c) / dim + 1)) * dim;
```

## How to respond when using this skill
1. Name the motion type(s) from Step 2 for each UI element involved.
2. State the chosen easing, duration, origin and technique with the numbers.
3. Give code in the project's stack (CSS/Tailwind, Framer Motion, Vue `<Transition>`).
4. Flag anything that breaks the checklist, especially bounce on frequent UI, linear easing, center-origin popovers, or lag while dragging.