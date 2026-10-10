# UI Reference

Goal: UI that reads in a glance, looks expensive, feels responsive under the thumb, and clearly belongs to this game's world rather than to a web dashboard.

## 1. Choose the representation per element

| Mode | Lives in | Example | Use when |
|------|----------|---------|----------|
| Diegetic | The world, seen by the character | Ammo counter on the gun, health as suit lights | Immersion matters; info is glanceable |
| Spatial | The world, not seen by the character | Outline on interactables, path markers | Guiding without breaking flow |
| Meta | Screen, but in-fiction | Blood splatter, cracked visor | Communicating state emotionally |
| Non-diegetic | Overlay | Classic HUD, menus | Precision info, complex systems |

A premium HUD usually mixes at least two modes. Pure overlays everywhere are acceptable for arcade games when the overlay itself is beautifully themed.

## 2. HUD hierarchy

- Show what the current second needs; everything else is contextual (appear on change, fade after ~2-3 s of stability).
- Anchor zones: critical player state near where the eyes already are (character or crosshair), secondary info in corners.
- Health: bar with a delayed ghost segment on loss and a flash on heal; low-health state communicated by more than the bar (audio, vignette, character animation).
- Damage numbers: pooled, slight random spread, crits larger with a distinct colour and pop, merge rapid ticks.
- Respect safe areas (notches, TV overscan); keep critical info out of the outer ~5%.

## 3. Typography

- One display face that carries identity (titles, big numbers) and one UI face built for legibility (body, labels, numbers). Use tabular figures for counters.
- Never the browser default, Arial, or the engine default font in a shipped screen.
- Sizes from a scale (e.g. 14 / 18 / 24 / 32 / 48 at 1080p reference), not arbitrary values.
- Text over the world always gets an outline, shadow, or backing plate.
- Localization: no hard-coded strings; layouts survive +30-40% text length; CJK fonts included for Korean, Japanese, Chinese; line breaking rules correct for CJK.

## 4. The themed component kit

Build it from the art bible, before the screens:

- Panels: 9-slice frames in the game's material (wood, metal, paper, holo, pixel border).
- Buttons with five states - idle, hover, focus, pressed, disabled - each visually distinct and each with sound (hover tick, confirm, back, error buzz).
- One icon family: same grid, same stroke weight, same corner treatment. No emoji. No mixing filled and outline sets.
- Sliders, toggles, tabs, tooltips, modals, list rows, and a scroll treatment in the same style.
- Spacing scale (4 or 8 px base at reference resolution) and a fixed number of corner radii.
- Colours from the palette: one accent for primary action, one for danger, one for reward; neutrals carry everything else.

Web-specific tells inside a game UI: glassmorphism cards, purple-to-blue gradients, `rounded-2xl` panels with soft drop shadows, Tailwind-default greys, hero-section layouts on the title screen. Allowed only when the game's fiction is literally a sleek OS.

## 5. Motion

- Transitions 120-250 ms; ease-out entering, ease-in leaving, exits faster than entries.
- Staggered list entry (20-40 ms per item), capped so long lists do not take a second.
- Numbers tick up (score, gold) with a short pop when done.
- Button press: scale down ~3-5% with a quick rebound; selection moves with a smooth cursor rather than teleporting.
- The title screen is alive: parallax, ambient animation, the game world in the background, music from frame one.
- Never block input during decorative animation; allow skipping.

## 6. Input parity and navigation

- Mouse, keyboard, controller, and touch where the platform supports them; every menu navigable without a mouse.
- Visible, styled focus state that moves predictably (explicit navigation graph where automatic fails).
- Button prompts switch with the last used device (keyboard keys vs controller glyphs).
- Rebinding for all actions in T2+, with conflict detection.
- Touch: hit targets at least ~44-48 pt, thumb zones respected, virtual stick with dead zone and dynamic origin.

## 7. Required screens (T2+)

1. Title / main menu - continue, new game, settings, credits, quit (desktop).
2. Pause - resume, settings, restart (if applicable), quit to menu; game truly paused (sim, audio ducking, timers).
3. Settings - audio (per-bus sliders), display (resolution, window mode, vsync, fps cap, UI scale), controls (rebinding, sensitivity, invert), accessibility, language.
4. Loading - real progress, tips or lore, never a frozen frame.
5. Results / game over - stats worth reading, a clear next action, and an instant retry where the genre wants it.
6. Credits - including third-party asset attribution.

## 8. Accessibility floor

- Text contrast >= 4.5:1 (>= 3:1 for large display text) against whatever is behind it.
- UI scale or text size option.
- Subtitles with size and background options; speaker names.
- Reduce screen shake, reduce flashing, disable camera bob.
- Hold-to-toggle alternatives for long presses; adjustable QTE timing or skip.
- Colour is never the only signal - pair with shape, icon, or pattern; offer palettes for common colour-vision deficiencies rather than a single full-screen filter.

## 9. What "premium" means in practice

- Restraint: fewer elements, more space, one strong accent.
- Consistency: every screen built from the same kit; no one-off styling.
- Responsiveness: every input acknowledged within one frame (visual) and with sound.
- Craft details: subtle noise or texture on panels, light shimmer on rare items, rarity frames, eased cursors, polished transitions between every screen.
- Copy: short, in the game's voice, no placeholder text, consistent capitalisation.

## 10. UI scoring hints
- 5: themed kit, mixed UI modes, contextual HUD, full input parity, all required screens, accessibility floor met, motion and sound on every interaction.
- 3: consistent and readable, some screens or states missing, partial controller support.
- 1: default fonts, emoji icons, raw overlay text, web-dashboard styling, no states or sounds.
