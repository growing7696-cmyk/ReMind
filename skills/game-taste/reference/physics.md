# Physics Reference

Goal: movement and collision that feel *authored*, behave identically at 30, 60, and 144 fps, and never explode.

## 1. The loop

### Fixed timestep with interpolation (custom engines, canvas, Three.js, PixiJS)

```js
const STEP = 1 / 60;          // simulation rate; 1/120 for fast action
const MAX_FRAME = 0.25;       // clamp after tab switches or hitches
let acc = 0, last = performance.now() / 1000;

function frame(nowMs) {
  const now = nowMs / 1000;
  acc += Math.min(now - last, MAX_FRAME);
  last = now;
  while (acc >= STEP) {
    previous.copy(current);   // keep last state for interpolation
    simulate(current, STEP);  // physics, AI, gameplay
    acc -= STEP;
  }
  render(lerpState(previous, current, acc / STEP));
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
```

Rules:
- Never use `setInterval` as the game loop.
- Clamp the frame delta, otherwise a background tab returns and runs thousands of steps (spiral of death).
- Input is sampled per frame and consumed per step (latch "pressed this frame" flags until a step reads them).
- Render interpolation removes the stutter that fixed steps otherwise cause on high-refresh displays.

### Engine equivalents
| Engine | Fixed callback | Notes |
|--------|----------------|-------|
| Unity | `FixedUpdate` | Read input in `Update`, apply in `FixedUpdate`. Enable `Rigidbody.interpolation`. Move with `MovePosition`/`velocity`, never `transform.position` on dynamic bodies. |
| Godot 4 | `_physics_process(delta)` | `CharacterBody2D/3D.move_and_slide()` only here. Enable physics interpolation (4.3+) or smooth visuals separately. |
| Unreal 5 | Chaos with substepping | Enable substepping for fast or stacked physics; use `CharacterMovementComponent` for characters. |
| Phaser | Arcade/Matter config `fps`, `fixedStep: true` | Arcade for most 2D; Matter for joints and polygons. |
| Rapier (web) | `world.step()` inside the fixed loop | Set `world.timestep = STEP`. |
| Bevy | `FixedUpdate` schedule | `Time<Fixed>`; physics via avian or rapier plugins. |

## 2. Character movement

### Platformer jump from design intent
Choose what the designer means, then derive:
- `h` apex height (world units), `t` time to apex (seconds)
- `gravity = 2h / t^2`
- `jumpVelocity = 2h / t`
- `fallGravity = gravity * 1.5..3`
- `lowJumpGravity = gravity * 2..3` when jump is released early (variable height)
- `apexHang`: reduce gravity to ~0.5x while |vy| is small near the apex for readable control
- `terminalVelocity`: cap fall speed (~1.5-2.5x jumpVelocity)

Forgiveness (tell when missing):
- Coyote time 80-120 ms after leaving a ledge.
- Jump buffer 100-150 ms before landing.
- Corner correction: nudge a few pixels around ceiling corners.
- Ledge grab or step-up for small lips in 3D.

### Horizontal movement
- `accelGround`, `decelGround`, `accelAir`, `decelAir`, `turnaroundBoost`.
- Approach target speed: `v = moveTowards(v, input * maxSpeed, accel * dt)`.
- Express accel as "time to top speed" in data (e.g. 0.08 s ground, 0.18 s air) and derive the rate; designers think in time, not units/s^2.

### Top-down and 3D
- Normalise diagonal input. Rotate input by camera yaw for 3D.
- Separate turn rate from move speed; characters that snap 180° in one frame read as AI-made unless the genre is twin-stick.
- Slopes: max walkable angle, snap-to-ground when descending, no sliding while idle on gentle slopes.

## 3. Collision

- Collider shapes simpler than visuals: capsules for characters, boxes and convex hulls for props, compound shapes for complex objects. Mesh colliders only for static world geometry.
- Hitbox vs hurtbox: separate, authored per animation frame for fighting/action games. Hurtboxes slightly smaller than the sprite feel fair to players; enemy hitboxes slightly smaller too.
- Layers and masks: document a matrix (player, enemy, player-projectile, enemy-projectile, world, trigger, pickup). Projectiles do not test against their own team.
- Fast objects: CCD, or raycast/shape-cast sweeps from previous to current position. Rule of thumb: anything that moves more than half its size per step needs it.
- Sleeping on; stacking tested; solver iterations raised only where a measured problem exists.
- Triggers for pickups and zones, not solid colliders with code that ignores them.

## 4. Body types

| Use | Body |
|-----|------|
| Player character in action games | Kinematic controller (precise, authored) |
| Physics-puzzle protagonist, ball, vehicle | Dynamic |
| Moving platforms, doors | Kinematic, and carry the rider explicitly |
| Debris, props, ragdolls | Dynamic, sleeping, pooled |
| Static world | Static |

Ragdolls: blend from animation to ragdoll; clamp joint limits; disable self-collision between adjacent bones. Vehicles: use the engine's wheel/raycast vehicle, tune centre of mass low, anti-roll.

## 5. Juice (feel layered on physics)

- Hit-stop: freeze or slow the hit actors for 40-120 ms, scaled by damage.
- Screen shake (trauma model): add trauma 0-1 on events, `shake = trauma^2`, offset and rotation from smooth noise (Perlin/simplex), decay trauma per second. Global multiplier in accessibility settings.
- Knockback with a short control lockout, squash on land, stretch on jump, dust/particles on land and turnaround, camera lead in the movement direction, camera damping (critically damped spring, not lerp with a constant factor per frame).
- Frame-rate independent smoothing: `x = lerp(x, target, 1 - exp(-k * dt))`, never `lerp(x, target, 0.1)` per frame.

## 6. Determinism and networking

- Seeded RNG per system; never call global `Math.random()` inside the simulation.
- Lockstep or rollback netcode needs deterministic simulation: fixed step, fixed-point or carefully controlled float, ordered iteration, no wall-clock reads in sim.
- Server-authoritative games: the server runs the same fixed-step simulation; clients predict and reconcile.

## 7. Debugging and tuning

- Debug overlay toggle: colliders, velocities, contact points, ground normal, state machine state.
- Tuning values hot-reload from data in T2+.
- Record the final tuned values and the reason in `docs/FEEL.md` (T2+), so future changes do not regress feel.

## 8. Physics scoring hints
- 5: fixed step + interpolation, derived and documented values, forgiveness mechanics, CCD, layered juice, debug tools.
- 3: fixed step, reasonable feel, a couple of magic numbers or missing CCD.
- 1: frame-dependent movement or physics in render updates; tunnelling; jitter.
