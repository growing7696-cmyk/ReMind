# Assets Reference

Goal: every asset looks like it came from the same hand, earns its file size, is used as many ways as possible, and is legal to ship.

## 1. Art bible first

Write it before importing anything (T2+: `docs/ART_BIBLE.md`). Keep it to one page:

- **Palette**: 5-8 core colours plus 1-2 accent colours reserved for gameplay-critical signals (pickups, danger, interactables). Give hex values.
- **Resolution**: 2D pixel art - one base sprite size (16, 24, 32 px) and one pixels-per-unit; no mixed densities. 3D - one texel density (e.g. 512 px/m) and one polygon budget per asset class.
- **Line and shape language**: outline or no outline, outline colour (dark tint of the fill, not pure black), rounded vs angular silhouettes per faction.
- **Light**: one light direction for baked shading in 2D; one lighting setup and colour grade in 3D.
- **Readability**: player, enemies, hazards, and interactables distinguishable by silhouette alone in greyscale at gameplay zoom.
- **Value structure**: background low contrast, gameplay layer high contrast, UI highest.

Test: screenshot the game, convert to greyscale, shrink to 25%. If you cannot find the player and the threats instantly, the art direction fails.

## 2. Cohesion

- One source per category when possible (one character pack, one environment pack, one icon family).
- Mixing packs: remap all to the bible palette, unify outline width, re-shade to one light direction, or apply a global post-process/LUT grade.
- Never mix pixel art with smooth vector or HD painted art in the same layer unless the contrast is a deliberate style choice written into the bible.
- Placeholder art is fine while prototyping when it is consistent (all grey boxes, or all one placeholder pack) and listed in `docs/PLACEHOLDERS.md` so nothing ships by accident.

## 3. Squeeze every asset (utilization)

Asset utilization is a skill. Prefer ten looks from one asset over ten assets:

- **Palette swap / tint**: enemy variants, team colours, elite versions, damage flash.
- **Modular kits**: walls, floors, trims, and props on a shared grid that snap together into many rooms.
- **Trim sheets and tileable textures** in 3D; autotiling rules (Wang/blob tiles) in 2D.
- **Transform variants**: scale, rotation, mirroring, and slight hue jitter for foliage, rocks, debris.
- **Layering**: combine base + overlay decals (moss, cracks, blood, snow) for variety without new base art.
- **Animation reuse**: shared rigs/skeletons, retargeting, additive animations (hit reactions, breathing), procedural motion (look-at, foot IK, bob).
- **VFX from existing frames**: dissolve shaders, sprite fragments as debris, flipbook particles generated from gameplay sprites.
- **Audio layering**: build impacts from a body + transient + tail; recombine layers for new events.

Measure it: list assets used in only one place and ask whether each could serve two more.

## 4. Pipeline and optimization

| Asset | Shipping practice |
|-------|-------------------|
| 2D sprites | Atlases / sprite sheets; trim transparent pixels; point filtering and no mipmaps for pixel art; integer scaling. |
| 3D textures | GPU compression (KTX2/Basis Universal on web, ASTC on mobile, BCn on desktop); mipmaps; power-of-two where the target needs it; channel packing (ORM: occlusion/roughness/metalness). |
| Meshes | LODs at T2+; Draco/Meshopt compression for glTF on web; shared materials to batch; instancing for repeated props. |
| Audio | Ogg Vorbis/Opus for shipping, AAC fallback for Safari/iOS; WAV only as source files; music streamed, short SFX preloaded; mono for positional SFX. |
| Fonts | Subset to used glyphs for Latin; for CJK, use dynamic or split fonts rather than one giant file; ship WOFF2 on web. |

- An asset manifest or addressables/resources system, never scattered string paths.
- Preload what the first screen needs; stream the rest behind a loading screen with real progress.
- Budget: set a download size target for web (e.g. first load < 10 MB) and an install size for mobile.

## 5. Audio is half the feel

- Mixer buses: master, music, sfx, ui, voice, ambience; ducking music under dialogue and big impacts.
- Variations: 3-5 samples for footsteps, hits, shots; random pitch ±3-6%, volume ±1-2 dB, no immediate repeats.
- Voice limits: cap concurrent instances per sound so 40 coins do not play 40 overlapping clips.
- Loudness consistent across all files (normalise in the source pipeline); avoid clipping.
- Spatial audio in 3D with sensible attenuation curves; 2D games still pan by screen position.
- Every UI interaction has a sound (hover, confirm, back, error) designed in one family.
- Music: loops cut on beat with no click; intensity layers or stingers tied to game state.

## 6. Integrity checks

- No unused files in shipping asset folders (the audit script lists candidates).
- No missing references (console errors at load, pink/magenta materials).
- No duplicates (same image imported under several names).
- No source files (PSD, BLEND, uncompressed WAV) in the shipping build.

## 7. Licensing

Track every external asset in `CREDITS.md` or `THIRD_PARTY_NOTICES.md`: name, author, source URL, licence, and modifications.

| Licence | Can ship commercially? | Obligation |
|---------|------------------------|-----------|
| CC0 / public domain | Yes | None (credit is good manners) |
| CC-BY | Yes | Visible attribution, ideally in game credits |
| CC-BY-SA | Yes, with care | Derivative assets must be shared alike |
| CC-BY-NC | No (commercial) | - |
| "Free for personal use" | No | - |
| Asset store licences | Usually yes, per seat/project | Read the store EULA; no redistribution of raw files in open source repos |

Common sources with clear licensing: Kenney (CC0), Quaternius (CC0), Poly Haven (CC0), ambientCG (CC0). OpenGameArt and Freesound are per-file licences - check each one.

AI-generated art: record which tool and its terms, keep style consistent with the bible, and never ship mismatched generations; generated assets are where cohesion most often breaks.

## 8. Asset scoring hints
- 5: art bible, strong cohesion, heavy reuse, optimized pipeline, full audio design, complete credits.
- 3: cohesive but some unused or unoptimized assets; basic audio; credits partly done.
- 1: mixed packs and densities, no audio design, unknown licences.
