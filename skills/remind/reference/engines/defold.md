# Engine notes: Defold

Follow the project's engine version; check APIs against it.

## Defold (Lua)
- `update(self, dt)` with `dt`; enable fixed timestep in `game.project` for physics-heavy games (`physics.use_fixed_timestep`) and use `fixed_update`.
- Messages (`msg.post`) are the module boundary; keep scripts small and data in `go.property` and Lua modules.
- GUI scenes for UI with layouts per orientation; texture profiles for compression per platform.
