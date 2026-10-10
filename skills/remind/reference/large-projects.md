# Large Projects Reference

Goal: keep a big game (many systems, many scenes, tens of thousands of lines, several contributors) coherent while an AI agent works inside it, and design new projects so they can grow without a rewrite.

## 1. Before touching a large codebase

1. **Map it first.** Read the README, `docs/`, the folder tree two levels deep, the entry point, the main loop, and the scene/level loader. Identify the existing architecture style (ECS, component composition, MVC-ish, scene graph scripts).
2. **Find or create the map documents** (T3):
   - `docs/ARCHITECTURE.md` - systems, ownership, data flow, module boundaries.
   - `docs/GAME_BIBLE.md` - pillars of the design, core loop, tone.
   - `docs/ART_BIBLE.md` - see `assets.md`.
   - `docs/FEEL.md` - tuned physics and juice values with reasons.
   - `docs/DECISIONS.md` - short dated log of architectural decisions.
   Update them when you change what they describe. They are how the next session (yours or a human's) understands the project without re-reading everything.
3. **Respect the house style.** Match existing patterns, naming, and folder conventions even if you would have chosen differently. Propose architectural changes separately; do not smuggle them into feature work.
4. **Local changes over wide rewrites.** Touch the fewest files that solve the problem. If a change needs more than ~10 files, write the plan first and confirm.
5. **Run the audit script** and existing tests before and after.

## 2. Architecture for growth

### Simulation vs presentation
- The simulation (rules, physics state, AI, economy) does not import rendering, audio, or UI.
- Presentation observes simulation state or events and renders, animates, and plays sounds.
- Benefits: server can run the simulation headless, tests run without a renderer, replays and netcode become possible.

### Composition over inheritance
- Prefer components (Unity components, Godot nodes/scenes, ECS components) over deep class trees like `Entity > Character > Enemy > FlyingEnemy > FlyingFireEnemy`.
- At high entity counts (thousands of units, bullet hell), use an ECS or data-oriented arrays for the hot systems.

### Data-driven content
- Enemies, items, abilities, levels, waves, dialogue, and loot are data (ScriptableObjects, Godot Resources, Unreal DataAssets/DataTables, JSON with a schema).
- Validate data at build time or load time with clear errors (missing references, out-of-range values).
- Designers (or you, later) add content without code changes.

### Communication between systems
- Direct references inside a module; typed events or messages across modules.
- An event bus is useful for decoupled notifications (achievement unlocked, enemy died) but not for request/response flows; do not route everything through it or control flow becomes invisible.
- Avoid a single `GameManager` singleton that owns everything. Use a small set of services (audio, save, input, scene loading) with explicit initialisation order.

### Folder structure by feature
```
src/
  core/        loop, time, rng, events, service setup
  sim/         combat/, movement/, ai/, economy/   (no rendering imports)
  view/        rendering, vfx, camera, animation
  ui/          kit/ (components), screens/, hud/
  audio/
  data/        schemas and content
  net/         (if online) protocol, client, server-shared
  tools/       debug console, cheats (dev builds only), editors
assets/
docs/
tests/
```
Engine projects adapt the same idea (Unity: `Assets/_Project/Features/...`; Godot: `res://features/...`).

### Cross-cutting systems to design early (T3)
- Save system with versioned schema and migrations.
- Localization: string tables keyed by id, never literals in code or scenes.
- Input abstraction: actions, not keys; rebinding-ready.
- Scene/level loading with async loading screen and memory release.
- Settings persisted and applied at startup.
- Debug tools: in-game console, cheat commands, overlays (dev builds only, compiled out of release).

## 3. Milestones for large builds

1. **Core loop prototype** - grey boxes, the core verb feels good (physics pillar first).
2. **Vertical slice** - one level/area at final quality across all five pillars. This defines the bar.
3. **Production** - content at the slice's bar, systems extended, not rewritten.
4. **Polish and hardening** - performance, robustness, localization, accessibility, security review.

Never skip the vertical slice in a large project; it is where art direction, UI kit, and feel get locked.

## 4. Working agreement for AI agents on big games

- One slice per change: a change should leave the game runnable.
- State the files you will touch before editing more than a handful.
- Do not rename, move, or reformat unrelated code.
- Keep public interfaces between modules stable; if you must change one, update every caller in the same change.
- Never delete assets or data you did not create without listing them and confirming.
- After each slice: run tests, run the audit script, update the relevant `docs/` file.
- When context is limited, rely on the map documents and targeted reads, not on re-reading the whole repo.

## 5. Performance at scale

- Budgets per system (see `quality.md`) and a performance test scene with worst-case counts.
- Spatial partitioning (grids, quadtrees, BVH) for queries over many entities.
- Time-slicing for expensive AI or pathfinding (spread across frames); job systems or workers for heavy work (Unity Jobs/Burst, Web Workers, Godot threads).
- Streaming worlds: chunked loading, LODs, impostors for distant objects.

## 6. Large-project scoring notes
A large project scores high on Quality only if its architecture lets the team add content without fighting the code: clear boundaries, data-driven content, versioned saves, tests on core logic, and current docs.
