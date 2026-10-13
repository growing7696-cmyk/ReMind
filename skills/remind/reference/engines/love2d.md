# Engine notes: LÖVE

Follow the project's engine version; check APIs against it.

## LÖVE (Lua)
- Own the fixed step in `love.run` or with an accumulator in `love.update(dt)`; `love.physics` (Box2D) worlds stepped with a fixed `dt`.
- Pixel art: `love.graphics.setDefaultFilter('nearest', 'nearest')`, render to a low-res canvas and scale by integers.
- Audio: `love.audio.newSource(path, 'static')` for SFX, `'stream'` for music; clone sources for overlapping variations.
- Avoid globals; modules return tables. No `loadstring`/`load` on save or mod files - parse data, do not execute it.
