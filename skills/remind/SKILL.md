---
name: remind
description: Anti-slop skill for games in any engine (Unity, Godot, Unreal, Roblox, web canvas/Three/Phaser/Pixi, LÖVE, GameMaker, Defold, Bevy). Use when building, reviewing, or polishing a game ("make it feel better", "fix the jank", "게임 만들어줘"). Scores physics feel, assets, UI, security, and quality, scaled from jam to large production. Not for non-game websites.
---

# ReMind: Anti-Slop Skill for Games

AI-made games share tells: frame-rate-tied floaty physics, clashing asset packs, Arial `Score: 0`, a client that trusts itself, one 3,000-line `main.js`. Make it look like a team with taste shipped it. Every rule is contextual: read the game, set the tier, apply only what fits.

## 1. Read the game (write these 7 lines at the top of the plan)

Genre + core verb · camera/dimension · engine (run the audit; it detects it) · platform · online surface (none / leaderboard / accounts / realtime MP / economy) · art direction (define one if missing) · tier.

| Tier | Signals | Bar |
|------|---------|-----|
| T1 jam | one scene, < 3k lines | Feel and readability. Single file OK. Consistent placeholder art. Security only if online. |
| T2 slice | 3k-30k lines, real art | + fixed step, data-driven tuning, pause/settings/audio buses, asset manifest, logic tests. |
| T3 production | > 30k lines, team, commercial | + sim/view split, module boundaries, save versioning, localization, CI, per-system budgets, authoritative server, `docs/` map. |

Higher tier for architecture, lower tier for scope.

| Mode | Trigger | Do |
|------|---------|----|
| Build | make / add a feature | Workflow §3. Core loop and feel first. |
| Review | review, audit, score | Audit, run, score. **No edits.** Scorecard + ranked fixes. |
| Polish | feel better, premium, fix jank | Score, raise the lowest pillar under its floor, then the cheapest big win. Before/after evidence. |

Ambiguous request: Review, then offer Polish.

## 2. Load only what the task needs

References are long; never read all of them. Pick by task:

| Task touches | Read |
|--------------|------|
| movement, jump, collision, camera, juice | `reference/physics.md` |
| art, sprites, models, audio, licences | `reference/assets.md` |
| HUD, menus, fonts, input, accessibility | `reference/ui.md` |
| anything online, saves, payments, mods | `reference/security.md` |
| performance, robustness, tests, polish | `reference/quality.md` |
| engine API specifics | `reference/engines/<engine>.md` (only the detected one) |
| writing shake / pool / RNG / buffer / save / FSM | `reference/recipes.md` (copy the section, not the file) |
| running and measuring the game | `reference/verify.md` |
| T3 or unfamiliar large codebase | `reference/large-projects.md` |
| Review mode: tell-by-tell sweep | `reference/ai-tells.md` |
| scoring | `audit/scorecard.md` |

For big files, `grep -n '^## '` first and read only the relevant section. The rules below are enough for small tasks without any reference.

## 3. Core rules (the high-value 20%)

**Physics.** Fixed-step sim with accumulator + render interpolation (`FixedUpdate`/`_physics_process` count). Derive numbers: `g = 2h/t²`, `vJump = 2h/t`, fall gravity ×1.5-3, release-cut, coyote 80-120 ms, buffer 100-150 ms, terminal velocity. Accel/decel curves, separate air. Kinematic controller for players, dynamic for props; never move dynamic bodies by transform. Simple colliders, layer matrix, CCD/sweeps for anything moving > half its size per step. Juice: hit-stop 40-120 ms, trauma² shake (toggleable), knockback, squash. Camera follows the *interpolated* position in late update with dead zone/look-ahead (2D) or collision spring arm (3D); smoothing is `1 - exp(-k·dt)`, never `lerp(a,b,0.1)`. Tuning in data, debug draw toggle.

**Assets.** Art bible first (5-8 colour palette + accents, one pixel/texel density, one outline, one light direction; `docs/ART_BIBLE.md` at T2+). One source per category, or unify by palette/outline/grade. Squeeze: palette swaps, modular kits, tint/scale/flip variants, decals, VFX from existing frames. Audio: 3-5 variations ± pitch, buses (master/music/sfx/ui/voice), voice caps, Ogg/Opus (+AAC for Safari). Atlases, GPU texture compression, mipmaps (3D), point filtering (pixel). No unreferenced files. `CREDITS.md` with licence per external asset; no NC or personal-use assets in commercial builds.

**UI.** Belongs to this game's world, not a SaaS dashboard: no emoji icons, default fonts, purple gradients, glassmorphism, `alert()`. One display face + one legible UI face, CJK support, +30-40% text room. Themed kit (9-slice panels, one icon family, five button states each with sound, spacing scale). HUD shows only what this second needs. Motion 120-250 ms, ghost health bar, tick-up numbers. Mouse/keys/controller/touch parity with visible focus; rebinding at T2+. T2+ screens: title, pause, settings (audio, display, controls, accessibility, language), loading with real progress, results worth reading. Accessibility: 4.5:1 contrast, text scale, subtitles, reduce shake/flash, never colour alone.

**Security.** Classify (offline → light save validation only; anything shared → server decides). Clients send inputs, never results (score, damage, currency). No secrets in client bundles; Firebase/Supabase rules and RLS locked. Validate schema, size, rate, auth, replay on every message. Never `innerHTML`/`eval`/`loadstring` untrusted data. Interest management against wallhacks. Receipts verified server-side.

**Quality.** Budget 16.6 ms (60) / 8.3 ms (120); quote measured p95/p99. Zero allocations in the hot loop; pools. Seeded RNG per system. Sim independent of rendering; no file > ~500 lines without reason; state machines over boolean soup. Pause on focus loss, all aspect ratios, versioned atomic saves, graceful missing-asset and network loss. Unit tests for pure logic. Polish: feedback on every action, transitions on every screen, no placeholders, no console spam.

## 4. Workflow

1. **Read** - §1 lines, tier, mode; existing projects: `node <skill-dir>/scripts/audit.mjs <dir> --brief`.
2. **Plan** - changes grouped by pillar; T2+ names files and module boundaries. Large codebases: local changes over rewrites; confirm before touching > ~10 files.
3. **Build in slices** - core loop → feel → UI → content. Each slice runs.
4. **Feel pass** - tune in data; record final values (`docs/FEEL.md` at T2+).
5. **Verify** - launch it: console clean, screenshots at target aspects, p95/p99 frame time at the busiest moment, focus loss, core verb exercised (`reference/verify.md`). If it cannot run here, say so and run what can.
6. **Gate** - re-run the audit, score, fix anything under a floor.
7. **Report** - scorecard + short change summary. No essay.

## 5. Audit script

```bash
node <skill-dir>/scripts/audit.mjs <dir> --brief           # one line per rule: start here
node <skill-dir>/scripts/audit.mjs <dir> --pillar physics  # full findings for one pillar
node <skill-dir>/scripts/audit.mjs <dir> --json            # machine-readable
```

`<skill-dir>` is this file's folder. Heuristic: confirm leads in code and name false positives. Exit 1 = an `error` (e.g. committed secret). Suppress confirmed false positives with `remind-ignore[: rule]` on the line or the line above, or paths/globs in `.remindignore`. Never suppress `secret` without confirming the key is fake.

## 6. Scorecard (required)

```
ReMind scorecard  (mode: polish, tier: T2, engine: Godot 4, online: leaderboard)
Physics   4/5  [run]  fixed step + interpolation, derived jump; no CCD on arrows
Assets    3/5  [read] cohesive 16px set; 11 unused removed; audio lacks variations
UI      2->4/5 [run]  themed kit, controller focus; no subtitles
Security  4/5  [test] server re-simulates score from input log; rate limited
Quality   3/5  [run]  p95 15.2 ms on target; GC spike on wave spawn
Floors: PASS   Overall: 3.6
Next: pool wave spawns, audio variations, CCD on arrows
```

Evidence: `[run]` launched and observed, `[test]` automated check, `[read]` code only (**caps the pillar at 3**). Rubric in `audit/scorecard.md`.

**Floors** (fail = not done): Physics ≥ 3 if the core verb is physical · Security ≥ 3 if online; committed secret = 0 · UI ≥ 3 · Quality ≥ 3 · no 0-1 without a user-accepted reason.
