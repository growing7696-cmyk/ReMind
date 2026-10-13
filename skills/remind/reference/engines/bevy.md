# Engine notes: Bevy

Follow the project's engine version; check APIs against it.

## Bevy (Rust)
- Systems in `FixedUpdate` for simulation; `Update` for presentation; physics via avian or bevy_rapier.
- ECS-first: components for data, systems for behaviour, events for cross-system messages, states for game flow.
- Assets via `AssetServer` with loading states; `bevy_asset_loader` for loading screens.
