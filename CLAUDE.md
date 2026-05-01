# Coworker — Codebase Notes

Electron + React + R3F virtual co-working app. Full design in `PLAN.md`.

> **All work is reviewed by Codex before merging.**
> When context usage exceeds ~90% of the 5-hour limit, write `HANDOFF.md` at the repo root and stop. Do not continue past that point — let the next session pick up from the handoff.

## Coordinate system

Standard three.js right-handed axes — treat as load-bearing conventions.

- Origin `(0,0,0)` = center of floor. Everything sits on `y = 0`.
- `−Z` into scene (back wall). `+Z` toward camera. Default avatar faces `−Z`.
- Ceiling `y ≈ 6.0`. Back wall interior `z ≈ −5.75`. Side walls interior `x ≈ ±7.0`.

**Safe freestanding zone:** `x ∈ [−3.4, 3.4]`, `y ∈ [0, 5.6]`, `z ∈ [−4.8, −0.5]`

**`rotationY={Math.PI}` transform:** local `+Z` → world `−Z`. Chair/object backs need **negative** local Z to appear behind the character in world space.

## Furniture anchors (`Session.tsx`)

```ts
const SELF_LAPTOP: [number, number, number] = [-1.8, 0, -2];
const PEER_LAPTOP: [number, number, number] = [ 0.9, 0, -2];
```

Avatars sit `+Z` of their laptop by `0.8` (self) / `1.15` (peer). Deck top at `y = 0.84`.

## Camera heights (`Camera.tsx`)

| Constant | Value | Meaning |
|---|---|---|
| `SCREEN_HEIGHT` | 1.24 | Laptop screen center Y |
| `SCREEN_Z_BIAS` | −0.35 | Screen Z offset from anchor |
| `HEAD_HEIGHT` | 1.70 | Seated avatar head Y (first-person) |
| `HEAD_Z_BIAS` | 1.08 | Head Z offset from anchor |

## Environments

- `src/renderer/scene/Library.tsx` — active library scene.
- `src/renderer/scene/Environments.tsx` — legacy switcher (different extents: walls ±10, shelves ±6, ceiling y=6).
- `src/renderer/data/environments.ts` — `ENVIRONMENTS[]` list powering the picker UI.

## Conventions

1. Box height `h` → center `cy = h/2` (feet on floor).
2. AABB-check new objects against safe zone; clamp animated objects too.
3. Seam phasing ≤ 0.05 is fine. No full ghost overlaps.
4. Room reads front-to-back: `z≈0` foreground · `z≈−2` desks · `z≈−5` back wall.
5. Define named anchor `const`s near component top; don't inline world positions.

## Project skills

Custom R3F skills live in `.agents/skills/`. Read and apply the relevant skill before working on anything in that domain:

| Task domain | Skill |
|---|---|
| Animations, `useFrame`, keyframes | `.agents/skills/r3f-animation/SKILL.md` |
| Core R3F setup, canvas, hooks | `.agents/skills/r3f-fundamentals/SKILL.md` |
| Geometry, `BufferGeometry`, shapes | `.agents/skills/r3f-geometry/SKILL.md` |
| Pointer events, controls, input | `.agents/skills/r3f-interaction/SKILL.md` |
| Lights, shadows, env maps | `.agents/skills/r3f-lighting/SKILL.md` |
| GLTF/OBJ/asset loading | `.agents/skills/r3f-loaders/SKILL.md` |
| Materials, shading, PBR | `.agents/skills/r3f-materials/SKILL.md` |
| Physics, colliders, rapier | `.agents/skills/r3f-physics/SKILL.md` |
| Post-processing, effects | `.agents/skills/r3f-postprocessing/SKILL.md` |
| Custom shaders, GLSL | `.agents/skills/r3f-shaders/SKILL.md` |
| Textures, UV mapping, video | `.agents/skills/r3f-textures/SKILL.md` |

## Tech stack

- Electron main: `src/main/index.ts` · Preload: `src/preload/index.ts`
- Renderer: React + R3F (`@react-three/fiber`, `@react-three/drei`)
- Signaling: `server/signaling/index.ts` (WebSocket) · Client: `src/renderer/net/signaling.ts`

## Dev notes

- No `new Vector3/Color` inside `useFrame` — reuse refs (see `Camera.tsx`).
- One shadow-casting `directionalLight` per scene (Library: 2048² shadow map).
- `VideoTexture` → always `toneMapped={false}` to avoid double tone-mapping.
- HMR works for renderer code. Main/preload changes require full Electron restart.
