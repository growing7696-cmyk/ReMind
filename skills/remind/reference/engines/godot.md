# Engine notes: Godot 4

Follow the project's engine version; check APIs against it.

## Godot 4 (GDScript / C#)
- `_physics_process(delta)` for movement and `move_and_slide()`; `_process` for visuals only. Physics interpolation project setting (4.3+) or manual visual smoothing.
- `CharacterBody2D/3D` for characters; `RigidBody` for props; `ShapeCast`/`RayCast` for sweeps; enable CCD on fast rigidbodies.
- Tuning in custom `Resource` classes (`@export` values); content as `.tres` resources.
- Static typing in GDScript (`var speed: float`) for performance and safety.
- UI: Control nodes with a project `Theme` resource (the component kit lives here); containers for layout; stretch mode `canvas_items` with aspect `expand`.
- Audio: AudioBus layout with master/music/sfx/ui; `AudioStreamRandomizer` for variations.
- Autoloads only for true services (audio, save, settings); not a god autoload.
- Avoid: `get_node` paths with deep strings everywhere (use `@onready` and unique names `%Node`), physics in `_process`.
