---
name: remind
description: Anti-slop skill for games. Use when building, extending, reviewing, or polishing a game or game prototype in any engine (Unity, Godot, Unreal, Roblox, Three.js, Babylon.js, Phaser, PixiJS, Kaplay, LÖVE, GameMaker, Defold, Bevy, raw canvas/WebGL), including requests like "make it feel better", "fix the jank", "review my game", or "게임 만들어줘". Judges and raises five pillars - physics feel, asset utilization, premium UI/HUD, security, and production quality - and scales its rules from a weekend jam to a large multi-system production. Not for non-game websites (use a frontend taste skill for those).
---

# ReMind: Anti-Slop Skill for Games

> Games that look and feel AI-generated share the same tells: floaty physics tied to frame rate, mismatched asset packs, an Arial "Score: 0" in the corner, a client that trusts itself, and one 3,000-line `main.js`.
> This skill exists to make the output look like a team with taste shipped it.
> Every rule is **contextual**. Read the game first, set the scale tier, then pull only the rules that apply.

The five pillars this skill judges, in this order:

| # | Pillar | Question it answers | Reference |
|---|--------|---------------------|-----------|
| 1 | **Physics** | Does movement and collision *feel* authored, stable, and frame-rate independent? | `reference/physics.md` |
| 2 | **Assets** | Are assets cohesive, fully used, optimized, licensed, and squeezed for value? | `reference/assets.md` |
| 3 | **UI** | Does the UI/HUD look premium, read instantly, and belong to *this* game's world? | `reference/ui.md` |
| 4 | **Security** | Is the threat model right for the game, and does the client never get trusted with outcomes? | `reference/security.md` |
| 5 | **Quality** | Does it hold its frame budget, survive edge cases, and feel polished end to end? | `reference/quality.md` |

Supporting references: `reference/verify.md` (run and measure the game; evidence levels), `reference/recipes.md` (copy-ready RNG, pools, shake, hit-stop, input buffer, sound variations, saves, state machines), `reference/large-projects.md` (architecture and working in big codebases), `reference/engines.md` (per-engine idioms), `reference/ai-tells.md` (the full tell catalogue), `audit/scorecard.md` (scoring rubric).

---

## 0. READ THE GAME FIRST

Before writing a line, extract these. If the user did not say, infer from the repo; ask only when a wrong guess would waste real work.

1. **Genre and core verb** - platformer (jump), shooter (aim), racer (steer), puzzle (place), sim (manage), RPG (choose). The core verb is what physics and feel serve.
2. **Camera and dimension** - 2D side, 2D top-down, isometric, 2.5D, 3D third-person, 3D first-person.
3. **Engine and language** - detect from files: `ProjectSettings/` (Unity), `project.godot` (Godot), `*.uproject` (Unreal), `default.project.json` or `.luau` files (Roblox/Rojo), `main.lua` calling `love.` (LÖVE), `*.yyp` (GameMaker), `game.project` (Defold), `package.json` deps like `three`, `phaser`, `pixi.js`, `@babylonjs/core`, `playcanvas`, `kaplay`, `excalibur`, `@dimforge/rapier*`, `matter-js`, `cannon-es` (web), `Cargo.toml` with `bevy`.
4. **Platform** - desktop, web, mobile, console. This changes input, performance budgets, UI scale, and asset compression.
5. **Online surface** - none / leaderboards / accounts and cloud saves / real-time multiplayer / real-money economy. This sets the security tier.
6. **Art direction** - pixel art, low-poly, hand-painted, realistic PBR, vector, voxel. If none exists, you must define one before adding assets (see Pillar 2).
7. **Scale tier** - see section 1.

Write these down in 7 lines at the top of your plan. In existing projects, also run the audit script (section 5) before proposing changes; it prints a tier guess and the detected engine.

### Pick the mode

| Mode | Trigger | What you do |
|------|---------|-------------|
| **Build** | "make a game", new feature, new prototype | Full workflow (section 4). Feel and core loop first. |
| **Review** | "review", "audit", "score", "what is wrong with" | Read, audit, run (`reference/verify.md`), score. **No edits** unless asked. Deliver the scorecard plus a ranked fix list. |
| **Polish** | "make it feel better", "make it look premium", "fix the jank" | Score first, then raise the lowest pillar that is below its floor, then the cheapest high-impact item. Capture before/after evidence. |

When the request is ambiguous, Review first, then offer Polish.

---

## 1. SCALE TIER (rules scale with the project)

| Tier | Signals | What changes |
|------|---------|--------------|
| **T1 Jam / prototype** | single scene, < ~3k lines, one developer, days | Feel and readability first. Single-file is acceptable. Security only if anything goes online. Placeholder art allowed but must be *consistent* placeholder art. |
| **T2 Vertical slice** | several systems, 3k-30k lines, real art direction | Fixed timestep mandatory. Data-driven tuning. Settings menu, pause, audio buses. Asset manifest. Tests for pure logic. |
| **T3 Production / large** | many scenes and systems, > 30k lines, multiple contributors, live or commercial | Everything in T2 plus: simulation/presentation split, module boundaries, save versioning, localization pipeline, CI build, perf budgets per system, authoritative server if online, `docs/` map kept current. Read `reference/large-projects.md` in full. |

When in doubt, pick the higher tier for architecture and the lower tier for scope.

---

## 2. THE TELLS (what makes a game look AI-made)

Kill these on sight. The full catalogue with fixes is in `reference/ai-tells.md`.

- **Physics**: movement without `delta`/`dt`; physics in render update; instant velocity with no acceleration or friction curve; symmetric floaty jump; no coyote time or jump buffer; fast bullets tunnelling through walls; collider equals sprite rectangle.
- **Assets**: three asset packs with three pixel densities; coloured rectangles with no art direction; one sound per action played identically every time; 40 MB of WAVs in a web build; assets in the folder never referenced; no credits or license file.
- **UI**: emoji as icons; default system font; `Score: 0` top-left in white Arial; centred `GAME OVER` plus a `Restart` button and nothing else; purple-to-blue gradient menus; glassmorphism and `rounded-xl` SaaS cards inside a fantasy game; `alert()` for game events; no hover/press/focus states; no sound on UI.
- **Security**: score submitted as a plain number from the client; API keys or database credentials in the client bundle; open Firebase/Supabase rules; `innerHTML` with player names; `eval` on level or mod data; enemy positions sent to clients that cannot see them.
- **Quality**: one god file or `GameManager` that does everything; `Math.random()` everywhere with no seeded RNG; allocations every frame causing GC hitches; no pause, no settings, no rebinding, no volume sliders; no feedback on hits (no hit-stop, shake, particles, sound); untested resolution changes.

---

## 3. THE FIVE PILLARS (core rules)

Each pillar has a short core here. Load its reference file when the task touches it.

### 3.1 Physics - authored, stable, frame-independent
1. **Fixed timestep simulation** with an accumulator, and render interpolation between the last two states. Never scale physics by a raw variable frame delta. Engine physics callbacks (`FixedUpdate`, `_physics_process`) count as fixed.
2. **Derive, do not guess, the numbers.** For jumps: pick apex height `h` and time-to-apex `t`, then `gravity = 2h / t^2` and `jumpVelocity = 2h / t`. Use a stronger fall gravity (1.5-3x), variable jump height on release, coyote time (~80-120 ms), jump buffer (~100-150 ms), and a terminal velocity.
3. **Acceleration and deceleration curves** for movement, separate for ground and air. Instant top speed is a tell unless the genre demands it (some precision platformers) and you say so.
4. **Correct body type** - kinematic character controller for player characters in most action games; dynamic rigidbodies for props, ragdolls, vehicles. Never teleport a dynamic body via transform.
5. **Collision hygiene** - simplified collider shapes, collision layers and masks, continuous collision detection (or raycast sweeps) for fast projectiles, sleeping enabled, consistent world units (1 unit = 1 metre in 3D, a documented px-per-unit in 2D).
6. **Juice belongs to physics feel**: hit-stop 40-120 ms, trauma-based screen shake (shake = trauma^2, decays over time, reducible in settings), knockback, squash and stretch, landing dust.
7. **The camera follows interpolated positions** in the late/render phase, with genre framing (dead zone and look-ahead in 2D, collision-aware spring arm in 3D) and damped, frame-independent smoothing. See `reference/physics.md` §6.
8. **All tuning values in data** (ScriptableObject, Resource, JSON, config table), never scattered magic numbers. Add a debug draw toggle for colliders and velocities.

### 3.2 Assets - cohesive, fully used, optimized, legal
1. **Art bible before assets**: a 5-8 colour core palette plus 1-2 accents, one pixel density or texel density, one line weight, one light direction, silhouettes readable at gameplay zoom. Write it to `docs/ART_BIBLE.md` in T2+.
2. **Cohesion over quantity**: prefer one source per category. When mixing packs is unavoidable, unify them with palette remapping, shared outline, shared lighting, or a post-process grade.
3. **Squeeze every asset**: palette swaps, modular kits, trim sheets, tinting, scale and rotation variants, procedural combination, reuse of sprite frames for VFX. An asset used once is a cost; used five ways is a style.
4. **Audio is half the feel**: 3-5 variations per frequent sound with ±5% pitch randomisation, mixer buses (master, music, sfx, ui, voice), consistent loudness, compressed formats for shipping (Ogg/Opus; AAC fallback on Safari/iOS).
5. **Pipeline**: an asset manifest or addressables system; atlases or sprite sheets; GPU texture compression (KTX2/Basis, ASTC, BCn) where supported; mipmaps for 3D; point filtering for pixel art; LODs for 3D at T2+; streaming instead of loading everything up front.
6. **Zero dead weight**: every file in assets is referenced; every referenced file exists; no duplicate imports of the same image.
7. **Licensing**: track source, author, and licence per external asset in `CREDITS.md` or `THIRD_PARTY_NOTICES.md`. "Free for personal use" never ships in a commercial build. CC-BY requires attribution in game.

### 3.3 UI - premium, readable, of this world
1. **Pick the UI mode per element**: diegetic (in the world), spatial, meta, or non-diegetic overlay. Premium games use more than plain overlays.
2. **The HUD shows only what the current second needs.** Everything else is contextual: appears on change, fades when stable.
3. **Typography**: one display face that carries the game's identity plus one highly legible UI face. Never the browser or engine default. Support CJK and the longest target language (+30-40% length).
4. **A themed component kit**: 9-slice panels, one icon family at one stroke weight, button states (idle, hover, focus, pressed, disabled) each with sound, consistent spacing scale. The kit is designed from the art bible, not from web UI conventions.
5. **Motion with restraint**: 120-250 ms transitions, ease-out on enter, faster on exit, delayed "ghost" bar on health loss, number tick-up on score.
6. **Input parity**: mouse, keyboard, controller, and touch where the platform has them. Visible focus for controller navigation. Rebindable controls in T2+.
7. **Required screens in T2+**: title, pause, settings (audio buses, display, controls, accessibility, language), loading with real progress, and game-over or results with something worth reading.
8. **Accessibility floor**: text contrast at least 4.5:1 (outline or backing plate over the world), scalable text, subtitle options, reduce-shake and reduce-flash toggles, hold/toggle options, colour-blind safe signalling (shape plus colour, not colour alone).

### 3.4 Security - right-sized threat model, never trust the client
1. **Classify first** (from section 0, item 5). Offline single-player: protect save integrity lightly and spend effort elsewhere. Anything with a shared leaderboard, economy, accounts, or multiplayer: the server decides outcomes.
2. **Clients send inputs and intents, not results.** The server validates movement speed, cooldowns, ammo, damage, inventory changes, and score plausibility, or re-simulates from inputs.
3. **No secrets in the client.** Everything shipped to a player is public. Keys that must stay private live on a server or edge function. Firebase/Supabase: rules and row-level security reviewed, never test-mode open.
4. **Validate every message**: schema validation, size limits, rate limits, auth on every socket and request, nonces or sequence numbers against replay.
5. **Never render or execute untrusted data**: no `innerHTML` with player-provided text, no `eval`/`new Function`/`loadstring` on level, mod, or network data. Sandbox mod scripting.
6. **Do not leak hidden information**: interest management and fog-of-war on the server, so wallhacks have nothing to read.
7. **Store and payments**: verify purchase receipts server-side. Minimise collected personal data; analytics opt-in where law requires.

### 3.5 Quality - budgets, robustness, polish
1. **Frame budget**: 16.6 ms at 60 fps, 8.3 ms at 120 fps; mobile targets 30 or 60 with thermal headroom. Profile before claiming performance; quote the number.
2. **Zero allocations in the hot loop**: object pools for bullets, particles, damage numbers, audio voices.
3. **Determinism where it matters**: seeded RNG per system (world gen, loot, AI) so bugs and runs are reproducible.
4. **Separation**: simulation code does not know about rendering or UI; data-driven content; no file beyond ~500 lines without a reason.
5. **Robustness**: pause on focus loss, resolution and aspect changes (16:9, 21:9, 16:10, 4:3, mobile portrait and landscape), save versioning with migration, graceful handling of missing assets and network loss.
6. **Tests**: unit tests for pure logic (damage, inventory, economy, save migration); a deterministic simulation test where feasible; a written playtest checklist.
7. **Polish pass** before calling it done: feedback on every player action (visual + audio), transitions between every screen, no placeholder text, no console spam, consistent naming in UI copy.

---

## 4. WORKFLOW

1. **Read** - section 0 answers, tier, and the audit output for existing projects.
2. **Plan** - list changes grouped by pillar. For T2+, also name the files and systems touched and confirm module boundaries.
3. **Build in slices** - one playable slice at a time (core loop first, then feel, then UI, then content). Each slice must run.
4. **Feel pass** - tune physics and juice values in data, not code; record the final values.
5. **Verify by running** - launch the game and collect evidence per `reference/verify.md`: console clean, screenshots at the target aspect ratios, p95/p99 frame time at the busiest moment, focus-loss behaviour, the core verb exercised. If it cannot be launched here, say so and run what can be run.
6. **Gate** - run the audit script again, fill in the scorecard, and fix anything below its floor.
7. **Report** - deliver the scorecard (section 6) with the change summary and the commands the user can run to reproduce your checks.

Reach for `reference/recipes.md` before writing a shake, pool, RNG, buffer, save, or state machine from scratch.

For large existing codebases, read `reference/large-projects.md` before editing: map the project, respect its architecture, and never rewrite across many files when a local change works.

---

## 5. AUDIT SCRIPT

A dependency-free scanner ships with this skill. It detects the engine and flags tells per pillar (frame-dependent loops, physics in render callbacks, secrets in the client, unsafe `innerHTML`/`eval`, unused and oversized assets, missing credits, god files, missing pause/settings/volume, emoji UI, default fonts).

```bash
node <skill-dir>/scripts/audit.mjs <project-dir>
node <skill-dir>/scripts/audit.mjs <project-dir> --json
```

`<skill-dir>` is the folder this file lives in. The script is heuristic: treat findings as leads, confirm by reading the code, and say which findings were false positives. Exit code 1 means at least one `error` (for example a committed secret).

Confirmed false positives: add `remind-ignore` (all rules) or `remind-ignore: <rule>` in a comment on that line or the line above, or list paths/globs in a `.remindignore` file at the project root. Never suppress a `secret` finding without confirming the value is not a real key.

---

## 6. SCORECARD (required in the final report)

Score each pillar 0-5 using `audit/scorecard.md`. Report in this shape:

```
ReMind scorecard  (mode: polish, tier: T2, engine: Godot 4, online: leaderboard)
Physics   4/5  [run]  fixed step + interpolation, derived jump arc; missing CCD on arrows
Assets    3/5  [read] cohesive 16px set; 11 unused files removed; audio lacks variations
UI        4/5  [run]  themed kit, controller focus, settings complete; no subtitles yet
Security  4/5  [test] server validates score from input log; rate limited
Quality   3/5  [run]  p95 15.2 ms on target; GC spike on wave spawn (pool pending)
Floors: PASS   Overall: 3.6
Next: pool wave spawns, add audio variations, CCD on arrows
```

Evidence tags come from `reference/verify.md`: `[run]`, `[test]`, or `[read]`. A `[read]`-only pillar is capped at 3. In Polish mode, add the previous score: `UI 2->4/5`.

**Floors** (any failure blocks "done"):
- Physics >= 3 when the core verb is physics-driven.
- Security >= 3 when anything goes online; any committed secret is an automatic 0.
- UI >= 3 always - the player sees it every second.
- Quality >= 3 always.
- No pillar at 0 or 1 without an explicit, user-accepted reason.

---

## 7. PRE-FLIGHT CHECKLIST

- [ ] Section 0 answers and tier written in the plan
- [ ] Physics on fixed step; tuning values in data; fast objects use CCD or sweeps
- [ ] Jump/move numbers derived and recorded; coyote time and buffer where the genre wants them
- [ ] Art bible exists (T2+) and every new asset follows it
- [ ] No unused assets; credits and licences recorded
- [ ] Audio has buses and variations on frequent sounds
- [ ] No default fonts, no emoji icons, no web-SaaS styling in-game
- [ ] Pause, settings, and focus navigation work (T2+)
- [ ] No secrets in the client; server owns outcomes for anything shared
- [ ] No `innerHTML`/`eval` on untrusted data
- [ ] Camera follows interpolated positions; smoothing is frame-independent
- [ ] Hot loop allocation-free; frame time measured on the target (p95/p99)
- [ ] Game launched after the last change; console clean; screenshots at target aspects
- [ ] Resolution and aspect changes tested
- [ ] Audit script re-run; scorecard delivered with honest scores and evidence tags
