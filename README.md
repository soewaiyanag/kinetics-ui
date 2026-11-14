# kinetics-ui

An agent skill that decides which animation to use when building web UIs: easing, duration, origin and technique.

[![npm version](https://img.shields.io/npm/v/kinetics-ui.svg)](https://www.npmjs.com/package/kinetics-ui)
[![license](https://img.shields.io/npm/l/kinetics-ui.svg)](./LICENSE)

## What it does

The skill makes the agent decide **whether** to animate, **which** pattern to use and **what values** to apply. It goes through three steps in order:

1. **Motion budget by frequency.** How often the user sees the element decides how much motion it gets.

   | How often the user sees it | Motion budget |
   |---|---|
   | Constantly (typing, tab switch, hover on list rows, keyboard nav, command palette) | None or near-instant (0–100ms, opacity only) |
   | Often (dropdowns, popovers, toggles, button presses) | Snappy and subtle, 150–250ms, no bounce |
   | Occasionally (modals, page/route transitions, drawers) | Up to ~300ms, can use staging and stagger |
   | Rarely / milestone (success, onboarding, empty→first item, payment done) | Room for flourish: pulse, sparkle, follow-through |

   Hard rules: feedback starts within 100ms of input and the full response lands within 400ms (Doherty threshold), no bounce or underdamped springs on everyday UI, and `prefers-reduced-motion` is always respected.

2. **Classify the motion type.** Each element is matched to one of ten motion types (A–J), and each type has a recipe for easing, duration, origin and technique. See the [skill reference](#skill-reference).

3. **Pre-ship checklist.** The result is checked against a nine-point list before it ships.

## Install

Global install, into `~/.claude/skills`:

```sh
npx kinetics-ui
```

Project install, into `./.claude/skills` of the current project:

```sh
npx kinetics-ui --project
```

Install into a custom skills directory:

```sh
npx kinetics-ui --dir <path>
```

Overwrite an existing install:

```sh
npx kinetics-ui --force
```

Uninstall (takes the same `--project` and `--dir` options):

```sh
npx kinetics-ui uninstall
```

### Claude Code plugin marketplace

```
/plugin marketplace add soewaiyanag/kinetics-ui
/plugin install kinetics-ui@kinetics-ui
```

### Claude.ai

Zip the `skills/kinetics-ui` folder and upload it in the skills settings:

```sh
git clone https://github.com/soewaiyanag/kinetics-ui.git
cd kinetics-ui/skills
zip -r kinetics-ui.zip kinetics-ui
```

### Manual

Copy `skills/kinetics-ui/` into any agent's skills folder:

```sh
git clone https://github.com/soewaiyanag/kinetics-ui.git
cp -r kinetics-ui/skills/kinetics-ui <your-agent-skills-folder>/
```

Restart your agent session after installing. The skill loads when you work on UI animation.

## Usage

The skill triggers when you add, choose or review animations and transitions in a web UI (CSS, Tailwind, Framer Motion, Vue/React). Example prompts:

- "Add an open/close animation to this dropdown"
- "Review the transitions in this component"
- "Animate this list when the items load"
- "Give the copy button some feedback when the text is copied"

For each prompt the agent will:

1. Name the motion type(s) from the skill for each UI element involved.
2. State the chosen easing, duration, origin and technique with the numbers.
3. Give code in the project's stack (CSS/Tailwind, Framer Motion, Vue `<Transition>`).
4. Flag anything that breaks the checklist, especially bounce on frequent UI, linear easing, center-origin popovers, or lag while dragging.

## Skill reference

### Motion types

| | Motion type | Easing | Duration | Key rule |
|---|---|---|---|---|
| A | Element entering | ease-out: `cubic-bezier(0.16, 1, 0.3, 1)` or `cubic-bezier(0.22, 1, 0.36, 1)` | 150–250ms (small), up to 300ms (large panels) | Never animate from `scale(0)`. Start at `scale(0.95)` + `opacity: 0`. |
| B | Element exiting | ease-in (or ease-out with a short duration) | About 20% shorter than the entrance (e.g. 250ms in → 200ms out) | Exit toward where it came from. |
| C | Popover / dropdown / menu / tooltip | ease-out | Enter 150–200ms, exit ~120–160ms, dropdown total 150–250ms | `transform-origin` is the trigger's side, not center. Enter `scale(0.95)→1` with `opacity 0→1`, exit reverses back into the trigger. |
| D | Moving an element from A to B | ease-in-out, never linear | Not specified | Subtle arc (~32px offset at the midpoint) for long travel. Shared layout transition when it is the same logical object. |
| E | Lists and groups appearing | Not specified | 30ms stagger per row | Stop staggering after ~8–10 items. Primary content first, secondary details settle slightly after. |
| F | Direct manipulation (drag, slider, swipe, scroll-linked) | None while held | Tracks the pointer 1:1 | Animate only on release. Rubber band past bounds. Optional ~12% area-preserving stretch on moving knobs. |
| G | Press and tap feedback | ease-out | ~100ms, release about the same | `scale(0.97)` on `:active`. Hit area at least 44×44px. |
| H | State changes inside an element | Not specified | ~150–200ms for an icon swap | Icon swap: crossfade + `scale(0.8↔1)` + `blur(2–4px↔0)`. Color/fill/reveal: prefer `clip-path` / `mask` wipes. View A → B: overlap exit and entrance. |
| I | Success / confirmation / error | Not specified | Success pulse ~250ms, error shake ~300ms, squash and stretch ~80ms | Success: single pulse `scale 1→1.05→1`. Error: 4 cycles of ±6px shake plus a color change, and keep the text message. |
| J | 3D tilt / flip | Not specified | Not specified | `perspective` (600–1200px) on the parent and `transform-style: preserve-3d`. Keep hover tilt angles ≤10–15°. |

"Not specified" means `SKILL.md` gives no value for that cell. The skill also ships CSS tokens and snippets (popover, button press, staggered list, icon crossfade, rubber band). See [`skills/kinetics-ui/SKILL.md`](./skills/kinetics-ui/SKILL.md).

### Pre-ship checklist

- [ ] Nothing uses `linear` easing except progress bars, spinners and marquees.
- [ ] Primary transitions ≤300ms; dropdowns 150–250ms; exits ~20% shorter than entrances.
- [ ] Popovers start at 0.95 scale and grow from and shrink back to the trigger.
- [ ] No bounce on high-frequency UI.
- [ ] Dragging tracks the pointer with no lag.
- [ ] Only `transform`, `opacity`, `filter`, `clip-path` animated (no `width`/`height`/`top`/`left` – use FLIP or layout animations instead).
- [ ] `prefers-reduced-motion` handled.
- [ ] Interruptible: re-triggering mid-animation reverses from the current position (CSS transitions do this; keyframe `animation` does not).
- [ ] Familiar patterns kept (Jakob's law): menus drop from their trigger, modals center, toasts come from a consistent edge.

## CLI reference

```
npx kinetics-ui [install] [options]
npx kinetics-ui uninstall [options]
```

| Flag | What it does |
|---|---|
| `-g`, `--global` | Install to `~/.claude/skills` (default) |
| `-p`, `--project` | Install to `./.claude/skills` in the current project |
| `-d`, `--dir <path>` | Install into a custom skills directory |
| `-f`, `--force` | Overwrite an existing install |
| `-h`, `--help` | Show the help |
| `-v`, `--version` | Show the version |

Installing over an existing copy fails unless you pass `--force`.

## Repo structure

```
kinetics-ui/
├── .claude-plugin/
│   ├── marketplace.json
│   └── plugin.json
├── bin/cli.js
├── skills/kinetics-ui/SKILL.md
├── .gitignore
├── LICENSE
├── package.json
└── README.md
```

## Releasing

For maintainers:

```sh
npm version patch   # or: npm version minor
# set the same version in .claude-plugin/plugin.json and commit it
git push --follow-tags
npm publish
```

## Credits

Principles adapted from video content by `@charles.unemployed`, plus classic animation principles and UX laws (Fitts, Hick, Miller, Doherty, Postel, Jakob).

## License

MIT © Soe Wai Yan Aung
