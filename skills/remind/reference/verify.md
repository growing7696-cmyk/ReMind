# Verify Reference

Goal: every score in the scorecard rests on something you ran, saw, or measured - not on reading the code and imagining the game. A game that was never launched after the change is not done.

## 1. Evidence levels

Label each pillar's evidence in the scorecard with the strongest level you reached:

| Level | Meaning | Example |
|-------|---------|---------|
| **run** | Launched the game and observed it (screenshot, frame timing, logs) | "p95 14.1 ms over 5 s in Chrome; screenshots at 16:9 and 9:16" |
| **test** | Automated test or headless run passed | "save migration v1->v3 test passes; scene smoke test loads all 12 levels" |
| **read** | Code and data read only | "fixed step present in `loop.ts`; not launched" |

`read`-only evidence caps that pillar at 3 in the scorecard. Say so instead of guessing.

## 2. Web games (canvas, Three.js, Phaser, PixiJS, Babylon, Kaplay)

1. Start the project's own dev server (`npm run dev` or the README's command). If there is none, serve the folder statically.
2. Open it in a browser you can drive (browser automation tools, Playwright, or the agent's built-in browser).
3. **Console**: zero errors and zero warnings spam on load and after one minute of play.
4. **Screenshots** at 1920x1080, 1280x800 (16:10), 2560x1080 (21:9), and 390x844 (phone portrait) if mobile is a target. Check: HUD anchored, no stretched art, text readable, safe areas respected.
5. **Frame time**: run the probe from `recipes.md` §10 during the busiest moment you can reach (wave spawn, explosion, many particles). Quote p95/p99.
6. **Focus loss**: switch tabs for 10 s, return. The game should be paused and must not fast-forward.
7. **Input**: drive the core verb with synthetic key events for a few seconds (move, jump, attack) and screenshot mid-action. Confirm feedback is visible (particles, flash, number pop).
8. **Network**: open the network panel - first-load size against the budget in `assets.md` §4, no secrets in request headers or bundles, score/progress requests carry inputs or tokens rather than bare results.

Do not wire automation hooks into shipping code. If you need a test hook (for example `window.__game` for state inspection), gate it behind a dev flag.

## 3. Godot 4

- Headless import and smoke run: `godot --headless --import` then `godot --headless --quit-after 300 res://main.tscn` (or the main scene); fail on any `ERROR:` in output.
- Unit tests with GUT or gdUnit4 headless if the project has them.
- Screenshots: a dev-only autoload that saves `get_viewport().get_texture().get_image()` to `user://` after N frames, run with a non-headless display.
- Frame time: `Performance.get_monitor(Performance.TIME_PROCESS)` and `TIME_PHYSICS_PROCESS` logged in a dev build, or the editor profiler.

## 4. Unity

- Edit mode and play mode tests: `Unity -batchmode -projectPath . -runTests -testPlatform EditMode -testResults results.xml` (then `PlayMode`).
- Build smoke test in CI with `-executeMethod` on a build script; fail on compile errors and missing references.
- Frame time and GC: Profiler or `ProfilerRecorder` for `Main Thread` and `GC.Alloc` in a development build; the hot loop should show 0 B GC alloc per frame.

## 5. Unreal

- Automation tests: `UnrealEditor-Cmd <Project>.uproject -ExecCmds="Automation RunTests <Filter>;Quit" -unattended -nullrhi`.
- `stat unit` / `stat fps` and Unreal Insights captures for frame time; quote game, draw, and GPU times separately.

## 6. Other engines

- **Bevy**: `cargo test` for systems with a minimal `App`; `cargo run --release` with a frame-time diagnostic plugin (`FrameTimeDiagnosticsPlugin`).
- **LÖVE**: `love .` with a dev-only overlay printing `love.timer.getAverageDelta()`; busted for pure Lua logic.
- **Roblox**: Studio play test with the MicroProfiler; TestEZ/Jest-Lua for module logic; a second play-test client for replication checks.
- **GameMaker / Defold**: run the target from the IDE/CLI (`bob.jar` for Defold) and use the built-in profiler; note when you could only read the project.

## 7. When you cannot run it

Some environments cannot launch a GPU window or install the engine. Then:
- Run whatever is runnable: the audit script, pure-logic tests, data validation, a headless build.
- Mark affected pillars as `read` evidence and cap them at 3.
- List the exact commands the user should run to close the gap (one per line).

## 8. Before and after

For polish or fix work, capture the same evidence before and after the change (same scene, same seed, same resolution). A before/after pair of screenshots or frame-time numbers is the most convincing line in the report.
