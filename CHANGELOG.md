# Changelog

## 1.1.0 - 2026-10-11

### Skill
- Modes: **build**, **review** (no edits, scorecard and ranked fixes), and **polish** (raise the weakest pillar, before/after evidence).
- Verify step: new `reference/verify.md` with per-engine ways to launch, screenshot, and measure the game. Scores carry `[run]`, `[test]`, or `[read]` evidence tags; `[read]`-only pillars are capped at 3.
- New `reference/recipes.md`: seeded RNG, object pool, damped smoothing and springs, trauma shake, hit-stop, input buffer and coyote time, sound variations, versioned saves, state machine, frame-time probe.
- Camera section in `reference/physics.md` (update order, dead zone, look-ahead, spring arm, pixel snapping) and a matching core rule.
- `reference/engines.md` covers Roblox (Luau), LÖVE, GameMaker, Defold, PlayCanvas, Kaplay, and Excalibur.
- Scorecard template adds mode, evidence tags, before->after scores, and reproduce commands.

### Audit script
- Detects Roblox, LÖVE, GameMaker, Defold, PlayCanvas, Kaplay, and Excalibur; scans `.luau`, `.gml`, and Defold scripts.
- Prints a tier guess (T1-T3) and includes it in `--json`.
- New rules: `frame-lerp` (constant-factor lerp), Roblox `remote-trust`, `invoke-client`, `deprecated-api`.
- Suppression: `remind-ignore[: rule]` comments and a `.remindignore` file of paths and globs.
- Fix: `-h` printed an error instead of usage.

## 1.0.0 - 2026-10-10
- First release as game-taste: five pillars, scale tiers, audit scanner, npx installer. Renamed to ReMind.
