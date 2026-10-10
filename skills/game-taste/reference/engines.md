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

## Engine-agnostic reminders
- Whatever the engine: fixed-step simulation, data-driven tuning, themed UI kit, server-owned outcomes when online, pooled hot paths.
