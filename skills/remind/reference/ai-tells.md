# AI Tells Catalogue

Patterns that make a game look machine-generated, with the fix for each. Use it as a review checklist.

## Physics and feel
| Tell | Fix |
|------|-----|
| `x += speed` with no delta; game runs faster on 144 Hz | Fixed-step loop with interpolation (`physics.md` §1) |
| `setInterval(update, 16)` | `requestAnimationFrame` + accumulator |
| Rigidbody forces in `Update`/`_process` | Move to `FixedUpdate`/`_physics_process` |
| Instant start and stop at max speed | Accel/decel curves, separate for air |
| Floaty symmetric jump, gravity 9.81 copied from real life | Derive gravity from apex height and time; heavier fall |
| No coyote time or jump buffer | 80-120 ms coyote, 100-150 ms buffer |
| Bullets pass through thin walls | CCD or raycast sweeps |
| Collider equals the full sprite rectangle | Authored, slightly forgiving hitboxes |
| `lerp(cam, target, 0.1)` every frame | `1 - exp(-k*dt)` smoothing or critically damped spring |
| Hits with no hit-stop, shake, knockback, or sound | Layered juice scaled to impact |
| Camera parented rigidly to the player, or following the raw physics body (stutter) | Follow the interpolated position in late update; dead zone, look-ahead, damped spring (`physics.md` §6) |
| Pixel-art sprites shimmer while the camera moves | Snap the camera to whole pixels at the target scale |

## Assets
| Tell | Fix |
|------|-----|
| Coloured rectangles and circles with no art direction | Art bible; consistent placeholder set until art arrives |
| Three packs, three pixel densities, three outline styles | One source or unify with palette, outline, and grade |
| Same footstep sound every step | 3-5 variations, pitch and volume jitter |
| Gigantic WAV/PNG files in a web build | Compressed audio, atlases, GPU texture compression |
| Asset folder full of unreferenced files | Remove or use them; audit regularly |
| Generated art in clashing styles | Lock a style reference; regenerate or repaint outliers |
| No credits file | `CREDITS.md` with source, author, licence |

## UI
| Tell | Fix |
|------|-----|
| `Score: 0` in white Arial at top-left | Themed HUD with display font and contextual placement |
| Emoji as icons (❤️ 💰 ⚔️) | One drawn icon family at a consistent stroke weight |
| Purple-blue gradient buttons, glassmorphism, `rounded-2xl` cards | Kit derived from the game's world and palette |
| Centred `GAME OVER` + `Restart` button only | Results screen with stats, flair, and instant retry |
| `alert()` / `confirm()` for game events | In-game modal from the kit |
| No hover, focus, pressed states; no UI sounds | Five states, each with sound |
| Mouse-only menus | Full keyboard/controller navigation with visible focus |
| No pause or settings | Pause and settings screens (T2+) |
| Hard-coded English strings | String tables; CJK fonts; length headroom |

## Security
| Tell | Fix |
|------|-----|
| `fetch('/score', {body: JSON.stringify({score})})` trusted by server | Server re-simulates or plausibility-checks |
| API keys or DB passwords in client code | Move to server/edge function; rotate the key |
| Firebase rules `if true`, Supabase without RLS | Auth-scoped rules and policies |
| `el.innerHTML = playerName` | `textContent` or sanitiser |
| `eval(levelData)` / `JSON` parsed then executed | Safe parsing + schema validation; sandboxed scripting |
| Full world state broadcast to all clients | Interest management |
| Gold and items stored in an editable local save for an online economy | Server-owned inventory |
| Roblox `OnServerEvent` handler that sets coins or damage from a client argument | Server computes the outcome; validate every argument |

## Quality and structure
| Tell | Fix |
|------|-----|
| One 3,000-line `main.js` or `GameManager.cs` | Feature modules; sim/view split |
| `Math.random()` scattered through gameplay | Seeded RNG per system |
| `new Vector3()` / array literals inside update loops | Reused temporaries; pools |
| Booleans like `isJumping && !isAttacking && wasGrounded` | State machine |
| Magic numbers in movement code | Tuning data with names and units |
| Breaks on window resize or tab switch | Robustness checklist (`quality.md` §4) |
| No tests for damage/inventory/save | Unit tests for pure logic |
| `console.log` spam in release | Logging levels; stripped in release |
| Title screen as a static image with a "Start" button | Living title: world background, music, transitions |
