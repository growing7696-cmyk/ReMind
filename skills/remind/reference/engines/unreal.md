# Engine notes: Unreal Engine 5

Follow the project's engine version; check APIs against it.

## Unreal Engine 5 (C++ / Blueprints)
- `CharacterMovementComponent` for characters; Chaos with substepping for physics-heavy games.
- Gameplay Ability System for abilities and attributes at T3; DataAssets/DataTables for content.
- Enhanced Input for actions and rebinding.
- UI with UMG / CommonUI (CommonUI gives controller navigation and input routing).
- Replication: server-authoritative by default; validate RPCs (`WithValidation`); use relevancy for interest management.
- Performance: Unreal Insights; Nanite/Lumen budgets per platform.
