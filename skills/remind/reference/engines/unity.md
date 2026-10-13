# Engine notes: Unity

Follow the project's engine version; check APIs against it.

## Unity (C#)
- Physics in `FixedUpdate`; input in `Update` (or the Input System's callbacks) stored for the next fixed step. Rigidbody interpolation on for the player and camera targets.
- Move dynamic bodies with `Rigidbody.MovePosition`/`linearVelocity` (Unity 6) or `velocity` (older); never write `transform.position` on them.
- Character: `CharacterController` or a custom kinematic controller with `Physics.CapsuleCast`.
- Fast projectiles: `CollisionDetectionMode.ContinuousDynamic` or raycasts.
- Data: ScriptableObjects for tuning and content; Addressables for asset loading at T2+.
- UI: UI Toolkit or uGUI with a Canvas Scaler (Scale With Screen Size, 1920x1080 reference); TextMeshPro with a proper font asset (include Korean/CJK atlas or dynamic font).
- Audio: AudioMixer with exposed bus volumes.
- Pooling: `UnityEngine.Pool.ObjectPool<T>`.
- Avoid: `FindObjectOfType`/`GameObject.Find` in loops, `GetComponent` per frame, string-based `SendMessage`, LINQ in hot paths.
- Security: IL2CPP for release; never trust client in Netcode for GameObjects/Mirror/Fish-Net - use server RPC validation.
