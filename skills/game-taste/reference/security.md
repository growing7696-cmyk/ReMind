# Security Reference

Goal: spend security effort where the game actually has something to protect, and make sure the client is never the judge of an outcome that other players or money depend on.

## 1. Classify the game

| Class | Examples | What matters |
|-------|----------|--------------|
| S0 Offline single-player | Story game, jam game, no network | Do not waste effort on anti-cheat. Protect against crashes from corrupted saves. Keep dependencies patched. |
| S1 Shared leaderboards / achievements | Arcade high scores, daily challenge | Server validates scores; rate limits; sanitised names. |
| S2 Accounts, cloud saves, social | Profiles, friends, chat, UGC | Auth done right, data access rules, chat and UGC sanitising, privacy law basics. |
| S3 Real-time multiplayer | Co-op, PvP, MMO | Authoritative server, input validation, interest management, anti-replay, DoS-aware design. |
| S4 Economy and payments | Trading, IAP, real-money value | Server-owned inventory and currency, receipt verification, audit logs, fraud monitoring. |

State the class in the plan. Higher classes include all rules of lower ones.

## 2. The golden rule: clients send intents, servers decide outcomes

- Bad: `POST /score {score: 999999}`. Good: the server receives the run's seed and input log (or periodic state snapshots) and re-simulates or plausibility-checks it.
- Bad: client sends `{hit: enemyId, damage: 50}`. Good: client sends `{fire, aimDir, tick}`; the server checks ammo, cooldown, line of sight with lag compensation, and computes damage.
- Movement: the server enforces max speed, acceleration, and teleport thresholds; it corrects the client rather than trusting it.
- Score plausibility for S1 when re-simulation is too expensive: bounds per second of play, per level, per action; signed session start/finish with server timestamps; flag outliers for review rather than silently accepting.

## 3. Secrets and backend configuration

- Anything shipped to players is public: JS bundles, WASM, APK/IPA, Unity/Unreal binaries, and their string tables can all be read.
- Private keys (payment providers, admin APIs, database credentials, LLM API keys) live on a server or edge function only. The client calls your endpoint, never the third party directly with a secret.
- Public keys that are designed to be public (Firebase web config, Supabase anon key) are fine only with strict rules:
  - Firebase: no `allow read, write: if true`; rules check `request.auth.uid` and validate data shape.
  - Supabase: row-level security enabled on every table; policies per operation.
- `.env` files in `.gitignore`; rotate any key that was ever committed, even if removed later (git history keeps it).

## 4. Validate every message

- Schema validation on every request and socket message (types, ranges, enums, string lengths, array sizes).
- Size limits on payloads; reject before parsing large bodies.
- Rate limits per connection, per account, per IP for expensive or abusable actions (chat, matchmaking, score submit).
- Authentication on every socket connection and request; short-lived tokens; reauth on reconnect.
- Sequence numbers or nonces to stop replayed packets; server-side tick validation.

## 5. Never execute or render untrusted data

- Web: never `innerHTML` with player names, chat, or UGC; use `textContent` or a vetted sanitiser. Watch canvas-based games that still render HTML overlays.
- No `eval`, `new Function`, `setTimeout(string)`, Lua `loadstring`, or reflection-based deserialisers on level files, mods, save files, or network data.
- Deserialise with safe formats (JSON with schema validation, FlatBuffers, protobuf). Avoid BinaryFormatter (.NET) and pickle (Python) for any untrusted input.
- Mods and UGC levels: sandboxed scripting (restricted Lua environment, WASM sandbox), resource limits, and moderation for shared content.

## 6. Do not leak hidden information

- Interest management: send entities only to clients that should perceive them (fog of war, line of sight, distance).
- Do not send loot tables, next-card order, or opponent hands to clients ahead of time.
- Server-side hit registration and visibility checks remove the payload that wallhacks and ESP read.

## 7. Saves and local data

- S0: version and validate saves so corruption cannot crash the game; a checksum catches accidental corruption. Obfuscation is not security - do not pretend it is.
- S2+: cloud saves are validated server-side; inventory and currency for S4 never come from a client save.
- Never store auth tokens in plain files readable by other apps on mobile; use the platform keychain/keystore.

## 8. Payments (S4)

- Verify App Store / Google Play / Steam receipts on the server; grant items only after verification; make grants idempotent.
- Append-only audit log for currency and item changes; alerts on abnormal flows.
- Trading: server-side escrow, both sides confirmed, no client-side item creation.

## 9. Dependencies and build

- Lockfiles committed; regular `npm audit` / `dotnet list package --vulnerable` / `cargo audit`.
- Strip debug menus, cheat consoles, and dev endpoints from release builds (compile-time flags, not hidden buttons).
- For web builds, set a Content-Security-Policy and serve over HTTPS; WebSockets over `wss://`.

## 10. Privacy basics

- Collect the minimum; document what and why.
- Analytics and crash reporting with consent where required (GDPR, regional laws); age-gating considerations for children's audiences (COPPA and similar).
- Chat and voice: report and block tools, profanity filter options.

## 11. Security scoring hints
- 5: correct class, server-authoritative where needed, schema validation and rate limits, no secrets in client, interest management, safe deserialisation, release builds stripped.
- 3: no secrets in client, server validates key outcomes, some limits missing.
- 0: committed secret, client-trusted scores or currency in a shared game, or unsanitised HTML from players.
