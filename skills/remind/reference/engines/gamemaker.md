# Engine notes: GameMaker

Follow the project's engine version; check APIs against it.

## GameMaker (GML)
- Use delta time (`delta_time / 1000000`) or a fixed game speed set deliberately; do not mix the two.
- Structs and constructors for data; `ds_*` structures freed or replaced by arrays/structs; avoid `with (all)` in step events.
- Physics world: set `physics_world_update_speed` and iterations explicitly; collision masks authored, not full-sprite.
- UI on the GUI layer (`Draw GUI`) with `display_set_gui_size` for resolution independence; custom fonts with fallback ranges for CJK.
