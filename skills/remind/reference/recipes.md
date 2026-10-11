# Recipes

Small, correct building blocks for the rules in the pillar references. Written in TypeScript-flavoured JS; the comments name the engine equivalent where one exists. Prefer the engine's built-in when it does the same job. Copy the idea, then match the project's style and naming.

## 1. Seeded RNG (one per system)

```js
// splitmix32 seeding + mulberry32 stream. Fast, small, good enough for gameplay (not crypto).
export function rng(seed) {
  let s = seed >>> 0;
  const next = () => {
    s = (s + 0x6d2b79f5) >>> 0;
    let t = s;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  return {
    float: next,                                   // [0, 1)
    range: (a, b) => a + (b - a) * next(),
    int: (a, b) => a + Math.floor(next() * (b - a + 1)), // inclusive
    pick: (arr) => arr[Math.floor(next() * arr.length)],
    chance: (p) => next() < p,
  };
}
const runSeed = Date.now() >>> 0;                  // log it with bug reports
export const rand = { world: rng(runSeed), loot: rng(runSeed ^ 0x9e3779b9), fx: rng(runSeed ^ 0x85ebca6b) };
```
Cosmetic randomness (`fx`) gets its own stream so adding a particle never changes loot. Unity: `new System.Random(seed)` or `Unity.Mathematics.Random`. Godot: `RandomNumberGenerator` with `.seed`. Bevy: `rand_chacha` seeded resource.

## 2. Object pool

```js
export class Pool {
  constructor(create, reset, size = 64) {
    this.create = create; this.reset = reset;
    this.free = Array.from({ length: size }, create);
  }
  get() { return this.free.pop() ?? this.create(); }
  release(obj) { this.reset(obj); this.free.push(obj); }
}
// Iterate live objects with a swap-remove array, never splice in the hot loop:
function removeAt(arr, i) { arr[i] = arr[arr.length - 1]; arr.pop(); }
```
Unity: `UnityEngine.Pool.ObjectPool<T>`. Godot: keep nodes in the tree, toggle `visible`/`process_mode` instead of `queue_free` + `instantiate` per shot.

## 3. Frame-rate independent smoothing and springs

```js
// Exponential smoothing: same result at 30, 60, 144 fps. k = 1/half-life-ish; 10-20 is snappy.
export const damp = (a, b, k, dt) => a + (b - a) * (1 - Math.exp(-k * dt));

// Critically damped spring (no overshoot), smoothTime in seconds. Same maths as Unity's SmoothDamp.
export function smoothDamp(cur, target, state, smoothTime, dt) {
  const omega = 2 / smoothTime, x = omega * dt;
  const exp = 1 / (1 + x + 0.48 * x * x + 0.235 * x * x * x);
  const change = cur - target;
  const temp = (state.v + omega * change) * dt;
  state.v = (state.v - omega * temp) * exp;
  return target + (change + temp) * exp;
}
```
Never `lerp(a, b, 0.1)` once per frame - it converges faster at higher frame rates.

## 4. Trauma screen shake

```js
const shake = { trauma: 0, decay: 1.6, maxOffset: 12, maxAngle: 0.05, scale: 1 }; // scale from accessibility setting
export const addTrauma = (t) => { shake.trauma = Math.min(1, shake.trauma + t); };
export function shakeOffset(time, dt, noise /* 1D smooth noise, e.g. simplex */) {
  shake.trauma = Math.max(0, shake.trauma - shake.decay * dt);
  const s = shake.trauma * shake.trauma * shake.scale;
  return {
    x: shake.maxOffset * s * noise(time * 25, 0),
    y: shake.maxOffset * s * noise(time * 25, 100),
    angle: shake.maxAngle * s * noise(time * 25, 200),
  };
}
```
Apply to the camera's render transform only, never to simulation positions. Typical trauma: light hit 0.2, heavy hit 0.4, explosion 0.7.

## 5. Hit-stop

```js
let hitStop = 0;                                          // seconds remaining
export const triggerHitStop = (damage) => { hitStop = Math.max(hitStop, Math.min(0.12, 0.04 + damage * 0.002)); };
// In the fixed-step loop: consume real time but skip simulation for the hit actors (or the whole world).
function step(dt) {
  if (hitStop > 0) { hitStop -= dt; return; }             // presentation (particles, shake) keeps running
  simulate(dt);
}
```
Unity: scale `Time.timeScale` briefly or freeze the two actors' animators; restore in unscaled time. Godot: `Engine.time_scale` with a `SceneTreeTimer` created with `ignore_time_scale = true`.

## 6. Input buffer and coyote time

```js
const COYOTE = 0.1, BUFFER = 0.12;
let sinceGrounded = Infinity, sinceJumpPressed = Infinity;
function tickJump(p, input, dt) {
  sinceGrounded = p.grounded ? 0 : sinceGrounded + dt;
  sinceJumpPressed = input.jumpPressed ? 0 : sinceJumpPressed + dt; // jumpPressed latched per frame, consumed per step
  if (sinceJumpPressed <= BUFFER && sinceGrounded <= COYOTE) {
    p.vy = -p.tuning.jumpVelocity;                           // derived: 2h / t (y-down screen space)
    sinceJumpPressed = sinceGrounded = Infinity;             // consume both
  }
  if (input.jumpReleased && p.vy < 0) p.vy *= p.tuning.jumpCut; // variable height, once per release, e.g. 0.5
}
```

## 7. Sound variations without repetition

```js
export function makeSfx(play, clips, { pitch = 0.05, volDb = 1.5, maxVoices = 4 } = {}) {
  let last = -1, voices = 0;
  return () => {
    if (voices >= maxVoices) return;
    let i = Math.floor(Math.random() * clips.length);       // cosmetic randomness is fine here
    if (clips.length > 1 && i === last) i = (i + 1) % clips.length;
    last = i; voices++;
    play(clips[i], {
      rate: 1 + (Math.random() * 2 - 1) * pitch,
      gain: Math.pow(10, ((Math.random() * 2 - 1) * volDb) / 20),
      onEnd: () => voices--,
    });
  };
}
```
Godot: `AudioStreamRandomizer` (pitch/volume random, no-repeat mode) plus `max_polyphony`. Unity: a small `SfxBank` ScriptableObject with clip list and pitch range.

## 8. Versioned, atomic saves

```js
const SAVE_VERSION = 3;
const migrations = {
  1: (s) => ({ ...s, settings: s.settings ?? { volume: 1 } }),
  2: (s) => ({ ...s, inventory: (s.items ?? []).map((id) => ({ id, n: 1 })), items: undefined }),
};
export function loadSave(raw) {
  let s;
  try { s = JSON.parse(raw); } catch { return freshSave(); } // corrupt: recover, keep a .bak
  if (typeof s !== 'object' || s === null) return freshSave();
  for (let v = s.version ?? 1; v < SAVE_VERSION; v++) s = { ...migrations[v](s), version: v + 1 };
  return validateSave(s) ? s : freshSave();
}
```
Desktop/native: write to `save.tmp`, flush, then rename over `save.json` (atomic on the same volume); keep the previous file as `save.bak`. Web: write the whole object in one `localStorage.setItem` or one IndexedDB transaction. Never store currency for an online economy here (see `security.md`).

## 9. State machine (instead of boolean soup)

```js
const states = {
  idle:   { enter(p) { p.anim('idle'); },  update(p, i) { if (i.move) return 'run'; if (i.jump) return 'jump'; } },
  run:    { enter(p) { p.anim('run'); },   update(p, i) { if (!i.move) return 'idle'; if (i.jump) return 'jump'; } },
  jump:   { enter(p) { p.anim('jump'); },  update(p) { if (p.grounded) return p.vx ? 'run' : 'idle'; } },
  hurt:   { enter(p) { p.lockout = 0.25; }, update(p, i, dt) { if ((p.lockout -= dt) <= 0) return 'idle'; } },
};
export function tickState(p, input, dt) {
  const next = states[p.state].update(p, input, dt);
  if (next && next !== p.state) { states[p.state].exit?.(p); p.state = next; states[next].enter?.(p); }
}
```
Show `p.state` in the debug overlay. Godot: a `State` node per state or an `enum` + `match`. Unity: plain C# classes or an Animator only for animation, not for gameplay logic.

## 10. Frame-time probe (for the verify step)

```js
// Paste in the browser console or a dev-only module. Reports p50/p95/p99 frame time over ~5 s.
(() => { const t = []; let last = performance.now(), end = last + 5000;
  const f = (now) => { t.push(now - last); last = now;
    if (now < end) return requestAnimationFrame(f);
    t.sort((a, b) => a - b); const q = (p) => t[Math.floor(p * (t.length - 1))].toFixed(2);
    console.log(`frames ${t.length}  p50 ${q(.5)}ms  p95 ${q(.95)}ms  p99 ${q(.99)}ms  max ${t.at(-1).toFixed(2)}ms`); };
  requestAnimationFrame(f); })();
```
Quote p95 and p99 in the scorecard, not the average: hitches live in the tail.
