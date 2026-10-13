# Engine notes: Web engines

Follow the project's engine version; check APIs against it.

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

## Web: PlayCanvas / Kaplay / Excalibur
- PlayCanvas: physics via its Ammo/Rapier integration in the fixed update; `app.graphicsDevice.maxPixelRatio` capped; texture compression via the editor's asset tasks.
- Kaplay (formerly Kaboom): `dt()` for every movement; `setGravity` tuned from derived jump numbers; replace default `text()` font with a loaded bitmap or TTF font.
- Excalibur: `Physics` config with fixed update (`fixedUpdateFps`); scenes for flow separation; loader with real progress.
