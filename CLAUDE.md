# Coworker — Codebase Notes

Electron + React + R3F virtual co-working app. Full design lives in `PLAN.md`.

## World coordinate system

Standard three.js right-handed axes. Treat these as **load-bearing conventions** when placing or moving any object — match them or update this doc if you intentionally change them.

```
        +Y (up)
         |
         |
         +------ +X (right, viewer's right when looking toward back wall)
        /
       /
     +Z (toward camera / front of room)
```

- **Origin `(0, 0, 0)`** is the center of the floor, at floor height. Everything sits on `y = 0`.
- **+X** is right, **−X** is left, looking from camera toward the back wall.
- **+Y** is up. Floor at `y = 0`, ceiling at `y ≈ 6.0` (Library uses `6.1`).
- **−Z** is into the scene (toward the back wall). **+Z** is toward the camera/front.
- Default avatar facing direction is **`−Z`** (into the room). `rotationY` rotates around +Y.

### Room footprint (current Library)

| Region                    | Coordinate                                  |
|---------------------------|---------------------------------------------|
| Floor plane               | `y = 0` (mesh at `y = 0` to `0.03`)         |
| Ceiling                   | `y ≈ 6.0` (`6.1` panel center)              |
| Back wall (interior face) | `z ≈ −5.75` (wall body centered at `z = −6`, depth `0.5`) |
| Side panels               | `x = ±7.2` (panel body width `0.42`)        |
| Side-wall interior        | `x ≈ ±7.0`                                  |
| Bookshelves               | centered at `x = ±5.25, z = −5.25`, body `3.25 × 4.6 × 0.8` |
| Desk/laptop zone          | centered at `z ≈ −2`, deck top at `y ≈ 0.84` |
| Reading rug               | `z = −2.7`, `7.4 × 4.4`                     |

**Safe interior placement zone for new freestanding objects** (avoids walls, shelves, ceiling):

```
x ∈ [−3.4, 3.4]    (clear of bookshelves at ±5.25)
y ∈ [0,    5.6]    (clear of ceiling)
z ∈ [−4.8, −0.5]   (clear of back wall + shelf fronts; in front of bookshelves)
```

For objects that hug the back wall, use `z ≈ −5.6` (in front of wall, behind shelf fronts at `z ≈ −4.85`). For wall-mounted decoration, place the front face at `z ≈ −5.55` so it sits proud of the wall.

### Furniture-relative anchors (Session)

Laptop/avatar pairs are defined in `src/renderer/screens/Session.tsx`:

```ts
const SELF_LAPTOP: [number, number, number] = [-1.8, 0, -2];
const PEER_LAPTOP: [number, number, number] = [ 0.9, 0, -2];
```

Avatars sit **behind** their laptop (toward `+Z`) by `0.8` (self) and `1.15` (peer). The `Laptop` component places its deck top at `y = 0.84` relative to the anchor's `y` (so anchor `y = 0` → deck top `y = 0.84`).

### Camera-relevant heights

Defined in `src/renderer/scene/Camera.tsx`:

| Constant         | Value | Meaning                                  |
|------------------|-------|------------------------------------------|
| `SCREEN_HEIGHT`  | 1.24  | Y of laptop screen center (look target)  |
| `SCREEN_Z_BIAS`  | −0.35 | Screen offset from laptop anchor in Z    |
| `HEAD_HEIGHT`    | 1.70  | Y of seated avatar head (FP camera)      |
| `HEAD_Z_BIAS`    | 1.08  | Head offset from laptop anchor in Z      |

If you change avatar geometry, update these — the camera rig depends on them.

### Multiple environments

Two scene roots currently exist:

- `src/renderer/scene/Library.tsx` — the **active** library scene (warm/daytime).
- `src/renderer/scene/Environments.tsx` — a switcher (`library` / `cafe` / `spaceship`) with **slightly different conventions** (back wall body 22 wide, shelves at `x = ±6`, ceiling at `y = 6` flat, side walls at `x = ±10`). When adding to a specific environment, match that environment's existing extents, not the Library.tsx ones.

### Conventions when adding objects

1. **Place feet on the floor.** A box of height `h` whose center is `cy` sits on the floor when `cy = h / 2`. Don't author objects with negative-y extents unless they're explicitly buried (rugs, floor inlays at `y ≈ 0.002–0.03`).
2. **Avoid the safe-zone violations above.** Run a mental AABB check against bookshelves and walls — particularly for any animated object (see the `LibrarianBot` glide range as an example: clamped to `x = ±3.2, z = −4.55` to stay clear of the shelves at `x = ±5.25, z = −5.25`).
3. **Small phasing (≤ ~0.05) is fine** for stylistic seams (rug into floor, trim into wall corners). **No "ghost" overlaps** where a whole object passes through another.
4. **Stack offsets along Z, not just X.** The room reads front-to-back: foreground at `z ≈ 0`, mid at `z ≈ −2` (desks), back at `z ≈ −5`.
5. **Name your anchors.** If a new feature needs a world position referenced from multiple files, define it as a `const` near the top of the owning component (mirroring `SELF_LAPTOP` / `PEER_LAPTOP`) rather than inlining magic numbers.

## Tech stack quick reference

- **Electron** main: `src/main/index.ts`
- **Preload**: `src/preload/index.ts`
- **Renderer**: React + R3F (`@react-three/fiber`, `@react-three/drei`)
- **Signaling server**: `server/signaling/index.ts` (WebSocket)
- **WebRTC client**: `src/renderer/net/signaling.ts`

## Dev-loop optimization notes

- **R3F**: prefer `useMemo` for arrays of meshes (already used for books, motes, stars). Avoid creating new `Vector3`/`Color` inside `useFrame` — reuse refs (see `Camera.tsx` pattern with `goalPos`/`goalLook`/`currentDir` refs).
- **drei**: `<Float>`, `<RoundedBox>`, `<ContactShadows>`, `<Environment>` are the workhorses here. `RoundedBox` `smoothness` ≥ 4 is overkill for tiny props — use `3` for sub-0.3m objects.
- **Shadows**: only one `directionalLight` casts shadows per scene (Library uses 2048² shadow map). Don't add more shadow casters without measuring frame time — they're the most expensive thing in the scene.
- **Video textures**: `Laptop.tsx` creates a `THREE.VideoTexture` per laptop. Mark `toneMapped={false}` to avoid double tone-mapping (already done).
- **HMR**: Vite HMR works for renderer code. Main/preload changes require a full Electron restart.
