# Quality Reference

Goal: the game holds its frame budget on the target device, survives real-world edge cases, and feels finished on every screen.

## 1. Performance budgets

| Target | Frame time | Notes |
|--------|-----------|-------|
| 60 fps | 16.6 ms | Leave ~2 ms headroom |
| 120/144 fps | 8.3 / 6.9 ms | Competitive and high-refresh desktop |
| Mobile 30/60 | 33.3 / 16.6 ms | Leave thermal headroom; test after 10 minutes of play |
| Web | 16.6 ms | Plus first-load size and time-to-interactive |

Per-system budget at T3 (example for 16.6 ms): simulation 4, rendering submit 5, animation 2, audio 1, UI 1.5, scripting/AI 2, headroom 1.

Rules:
- Profile before and after any performance claim and quote the measurement (engine profiler, Chrome Performance panel, RenderDoc, Xcode/Android GPU tools).
- Watch draw calls/batches, overdraw (particles, transparent UI), shader variants, and physics body counts.
- Test on the weakest target device, not the dev machine.

## 2. Memory and garbage

- Zero allocations in the per-frame hot path: no `new` vectors, closures, arrays, strings, or LINQ inside update loops.
- Object pools for projectiles, particles, damage numbers, enemies in waves, audio sources.
- Reuse temporary math objects (`_tmpVec`), especially in JS and C#.
- Unload scenes and assets you leave; watch for texture leaks on level reloads.

## 3. Determinism and reproducibility

- Seeded RNG per system (world gen, loot, AI, cosmetic) - log the seed with bug reports.
- Replays or input recording at T2+ for hard-to-reproduce bugs.
- No reading wall-clock time inside the simulation.

## 4. Robustness checklist

- [ ] Pause on window focus loss / app backgrounding; audio stops; no time skip on return (clamped delta).
- [ ] Resolution and aspect: 16:9, 16:10, 21:9, 4:3, mobile portrait and landscape; UI anchors hold; no stretched art.
- [ ] Window resize and fullscreen toggle at runtime.
- [ ] Controller disconnect pauses the game and shows a prompt.
- [ ] Save system: atomic writes (write temp, then rename), version field, migrations for old versions, recovery from corruption.
- [ ] Missing asset fallback and a clear error, never a silent crash.
- [ ] Network loss and reconnect handled for online features.
- [ ] Very long sessions (memory stable after 1 hour).
- [ ] Very fast inputs (button mashing, frame-perfect inputs) do not break state machines.
- [ ] Localization: longest language and CJK checked in every screen.

## 5. Code quality for games

- Simulation separated from presentation (see `large-projects.md`).
- State machines (or behaviour trees) for characters, enemies, and game flow, not nests of booleans.
- Data-driven content: enemies, items, levels, waves, and tuning in data files or assets with validation.
- Files under ~500 lines unless there is a reason; no god objects.
- Clear naming: units in names where ambiguous (`speedMps`, `cooldownSec`).
- Errors and warnings fixed, not suppressed; no console spam in release.

## 6. Testing

- Unit tests for pure logic: damage formulas, stat calculations, inventory, crafting, economy, save migration, procedural generation invariants.
- Deterministic simulation tests: fixed seed + scripted inputs → expected state hash.
- Smoke test that every scene/level loads without errors (CI at T3).
- Written playtest checklist per release: core loop, every menu, every input device, every resolution, first-time user experience.
- Real playtests with people who did not build it; watch silently, note where they hesitate.

## 7. Game feel and polish pass

Before "done", walk every player action and every screen:

- Every action has visual + audio feedback within one frame.
- Every hit has impact (hit-stop, flash, knockback, sound, particles) scaled to its weight.
- Every screen transition is animated; no hard cuts unless stylistic.
- Camera: smoothing, look-ahead, no jitter (camera updated after physics interpolation).
- Onboarding: the first 60 seconds teach the core verb through play, not text walls.
- Difficulty: an early win, a fair first failure, readable enemy telegraphs (wind-up animation + sound before attacks).
- No placeholder text, art, or sounds left (check `docs/PLACEHOLDERS.md`).
- Credits complete.

## 8. Build and release (T2+)

- Reproducible builds from a clean checkout; build instructions in the README.
- CI at T3: build all targets, run tests, run the audit script.
- Version number visible in the main menu and in crash reports.
- Crash reporting and basic telemetry (with consent) for shipped games.

## 9. Quality scoring hints
- 5: measured budgets met on target hardware, pooled hot paths, robust edge cases, tests and CI, full polish pass.
- 3: runs smoothly on dev hardware, some edge cases untested, little automated testing.
- 1: stutters, crashes on resize or focus loss, god files, no pause or settings.
