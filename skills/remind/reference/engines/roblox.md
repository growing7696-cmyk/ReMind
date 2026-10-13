# Engine notes: Roblox

Follow the project's engine version; check APIs against it.

## Roblox (Luau)
- Every client is hostile. `RemoteEvent.OnServerEvent` / `RemoteFunction.OnServerInvoke` handlers receive `player` from the engine plus arguments the client chose: validate type, range, ownership, distance, and cooldown on the server for every argument. Never set `leaderstats`, currency, or damage from a client-sent value.
- Never use `RemoteFunction:InvokeClient` for anything the server waits on (a client can hang it forever).
- Server scripts in `ServerScriptService`, secrets and server modules in `ServerStorage`; anything in `ReplicatedStorage` or `Workspace` is readable by clients.
- `task.wait`/`task.spawn`/`task.delay` instead of deprecated `wait`/`spawn`/`delay`; `RunService.Heartbeat`/`Stepped` with the passed `dt`.
- Physics: network ownership decides who simulates a part; set it to the server for anything gameplay-critical (`SetNetworkOwner(nil)`), and sanity-check client-owned character movement (speed, teleport).
- Data: `DataStoreService` calls wrapped in `pcall` with retries and session locking (or ProfileStore); never save on every change.
- Typed Luau (`--!strict`) for modules; Rojo for file-based projects; TestEZ or Jest-Lua for pure logic.
- UI: build a themed kit from `UIStroke`, `UICorner`, `9-slice` `ImageLabel`s and a custom font (`Font.new`); `UIScale` + `UIAspectRatioConstraint` for devices; never ship default `SourceSans` buttons.
