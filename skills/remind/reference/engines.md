# Engine Idioms

Short, engine-specific notes so the pillars translate into the right code. Follow the project's engine version; check APIs against it.

## Unity (C#)
- Physics in `FixedUpdate`; input in `Update` (or the Input System's callbacks) stored for the next fixed step. Rigidbody interpolation on for the player and camera targets.
- Move dynamic bodies with `Rigidbody.MovePosition`/`linearVelocity` (Unity 6) or `velocity` (older); never write `transform.position` on them.
- Character: `CharacterController` or a custom kinematic controller with `Physics.CapsuleCast`.
- Fast projectiles: `CollisionDetectionMode.ContinuousDynamic` or raycasts.
- Data: ScriptableObjects for tuning and content; Addressables for asset loading at T2+.
- UI: UI Toolkit or uGUI with a Canvas Scaler (Scale With Screen Size, 1920x1080 reference); TextMeshPro with a proper font asset (include Korean/CJK atlas or dynamic font).
- Audio: AudioMixer with exposed bus volumes.
- Pooling: `UnityEngine.Pool.ObjectPool<T>`.
- Avoid: `FindObjectOfType`/`GameObject.Find` in loops, `GetComponent` per frame, string-based `SendMessage`, LINQ in hot paths.
- Security: IL2CPP for release; never trust client in Netcode for GameObjects/Mirror/Fish-Net - use server RPC validation.

## Godot 4 (GDScript / C#)
- `_physics_process(delta)` for movement and `move_and_slide()`; `_process` for visuals only. Physics interpolation project setting (4.3+) or manual visual smoothing.
- `CharacterBody2D/3D` for characters; `RigidBody` for props; `ShapeCast`/`RayCast` for sweeps; enable CCD on fast rigidbodies.
- Tuning in custom `Resource` classes (`@export` values); content as `.tres` resources.
- Static typing in GDScript (`var speed: float`) for performance and safety.
- UI: Control nodes with a project `Theme` resource (the component kit lives here); containers for layout; stretch mode `canvas_items` with aspect `expand`.
- Audio: AudioBus layout with master/music/sfx/ui; `AudioStreamRandomizer` for variations.
- Autoloads only for true services (audio, save, settings); not a god autoload.
- Avoid: `get_node` paths with deep strings everywhere (use `@onready` and unique names `%Node`), physics in `_process`.

## Unreal Engine 5 (C++ / Blueprints)
- `CharacterMovementComponent` for characters; Chaos with substepping for physics-heavy games.
- Gameplay Ability System for abilities and attributes at T3; DataAssets/DataTables for content.
- Enhanced Input for actions and rebinding.
- UI with UMG / CommonUI (CommonUI gives controller navigation and input routing).
- Replication: server-authoritative by default; validate RPCs (`WithValidation`); use relevancy for interest management.
- Performance: Unreal Insights; Nanite/Lumen budgets per platform.

## Web: Three.js / Babylon.js
- Own the fixed-step loop (see `physics.md`); physics via Rapier (`@dimforge/rapier3d-compat`), cannon-es, or Babylon's Havok plugin.
- Assets: glTF/GLB with Draco or Meshopt; KTX2 textures via `KTX2Loader`; dispose geometries/materials/textures on unload.
- Renderer: cap pixel ratio (`Math.min(devicePixelRatio, 2)`), instancing for repeated props, avoid per-frame object allocation (`new THREE.Vector3()` in loops).
- UI: HTML/CSS overlay or in-canvas UI; if HTML, apply the game's kit (custom fonts, themed panels) and never `innerHTML` with player data.
- Audio: Web Audio API (or Howler.js) with a gain node per bus; resume `AudioContext` on first user gesture.

## Web: Phaser / PixiJS / canvas 2D
- Phaser: Arcade physics with `fixedStep`; Matter for complex shapes; scenes for menu/game/UI separation; texture atlases from TexturePacker or free equivalents.
- PixiJS: rendering only - bring your own loop, physics (Matter, Rapier2D, or custom AABB), and input.
- Pixel art: `image-rendering: pixelated`, integer scaling, `roundPixels`, nearest filtering.
- Bundle with Vite; code-split heavy scenes; compress audio to Ogg/AAC.

## Bevy (Rust)
- Systems in `FixedUpdate` for simulation; `Update` for presentation; physics via avian or bevy_rapier.
- ECS-first: components for data, systems for behaviour, events for cross-system messages, states for game flow.
- Assets via `AssetServer` with loading states; `bevy_asset_loader` for loading screens.

## Roblox (Luau)
- Every client is hostile. `RemoteEvent.OnServerEvent` / `RemoteFunction.OnServerInvoke` handlers receive `player` from the engine plus arguments the client chose: validate type, range, ownership, distance, and cooldown on the server for every argument. Never set `leaderstats`, currency, or damage from a client-sent value.
- Never use `RemoteFunction:InvokeClient` for anything the server waits on (a client can hang it forever).
- Server scripts in `ServerScriptService`, secrets and server modules in `ServerStorage`; anything in `ReplicatedStorage` or `Workspace` is readable by clients.
- `task.wait`/`task.spawn`/`task.delay` instead of deprecated `wait`/`spawn`/`delay`; `RunService.Heartbeat`/`Stepped` with the passed `dt`.
- Physics: network ownership decides who simulates a part; set it to the server for anything gameplay-critical (`SetNetworkOwner(nil)`), and sanity-check client-owned character movement (speed, teleport).
- Data: `DataStoreService` calls wrapped in `pcall` with retries and session locking (or ProfileStore); never save on every change.
- Typed Luau (`--!strict`) for modules; Rojo for file-based projects; TestEZ or Jest-Lua for pure logic.
- UI: build a themed kit from `UIStroke`, `UICorner`, `9-slice` `ImageLabel`s and a custom font (`Font.new`); `UIScale` + `UIAspectRatioConstraint` for devices; never ship default `SourceSans` buttons.

## LÖVE (Lua)
- Own the fixed step in `love.run` or with an accumulator in `love.update(dt)`; `love.physics` (Box2D) worlds stepped with a fixed `dt`.
- Pixel art: `love.graphics.setDefaultFilter('nearest', 'nearest')`, render to a low-res canvas and scale by integers.
- Audio: `love.audio.newSource(path, 'static')` for SFX, `'stream'` for music; clone sources for overlapping variations.
- Avoid globals; modules return tables. No `loadstring`/`load` on save or mod files - parse data, do not execute it.

## GameMaker (GML)
- Use delta time (`delta_time / 1000000`) or a fixed game speed set deliberately; do not mix the two.
- Structs and constructors for data; `ds_*` structures freed or replaced by arrays/structs; avoid `with (all)` in step events.
- Physics world: set `physics_world_update_speed` and iterations explicitly; collision masks authored, not full-sprite.
- UI on the GUI layer (`Draw GUI`) with `display_set_gui_size` for resolution independence; custom fonts with fallback ranges for CJK.

## Defold (Lua)
- `update(self, dt)` with `dt`; enable fixed timestep in `game.project` for physics-heavy games (`physics.use_fixed_timestep`) and use `fixed_update`.
- Messages (`msg.post`) are the module boundary; keep scripts small and data in `go.property` and Lua modules.
- GUI scenes for UI with layouts per orientation; texture profiles for compression per platform.

## Web: PlayCanvas / Kaplay / Excalibur
- PlayCanvas: physics via its Ammo/Rapier integration in the fixed update; `app.graphicsDevice.maxPixelRatio` capped; texture compression via the editor's asset tasks.
- Kaplay (formerly Kaboom): `dt()` for every movement; `setGravity` tuned from derived jump numbers; replace default `text()` font with a loaded bitmap or TTF font.
- Excalibur: `Physics` config with fixed update (`fixedUpdateFps`); scenes for flow separation; loader with real progress.

## Engine-agnostic reminders
- Whatever the engine: fixed-step simulation, data-driven tuning, themed UI kit, server-owned outcomes when online, pooled hot paths.
