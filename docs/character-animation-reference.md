# Real-Time 3D Character Animation Reference

> Practical reference for the Coworker avatar system. All techniques apply to low-poly geometry animated via `useFrame` in `@react-three/fiber` — no GLTF/skeleton rigs.

---

## 1. Procedural Pose Blending — Lerp-Based State Machine

### Core Pattern

Every animated property has a "goal" and an "actual." Actual lerps toward goal each frame, giving automatic easing on all state transitions.

```tsx
mesh.rotation.x = THREE.MathUtils.lerp(mesh.rotation.x, targetRotX, alpha);
```

### Pose State Machine

Define goal poses as constants outside the component (no allocation per frame):

```tsx
const POSE_IDLE    = { armRotX: 0,    armPosY: 0.90, handPosZ: 0.0,  bodyRotX: 0    } as const;
const POSE_TYPING  = { armRotX: -1.7, armPosY: 1.05, handPosZ: 0.50, bodyRotX: 0.12 } as const;
const POSE_FOCUSED = { armRotX: -0.42,armPosY: 0.90, handPosZ: 0.40, bodyRotX: 0.14 } as const;
```

Blend alphas should differ: fast entering typing (responsive), slow returning to idle (relaxed):

```tsx
const BLEND_FAST = 0.20;   // entering typing
const BLEND_MED  = 0.08;   // body lean
const BLEND_SLOW = 0.04;   // head drift, idle return
```

### Numerical Ranges

| Property | Idle | Typing | Focused | Notes |
|---|---|---|---|---|
| `armRotX` | 0 | -1.7 rad | -0.42 rad | -1.7 = nearly horizontal forward reach |
| `armPosY` | 0.90 | 1.05 | 0.90 | world Y |
| `handPosZ` | 0.0 | 0.50 | 0.40 | forward reach |
| `bodyRotX` | 0 | 0.12 rad | 0.14 rad | lean forward |
| `headRotX` | 0 | 0.20 rad | 0.24 rad | look down |
| `headRotZ sway` | 0.022 amp | 0.07 amp | 0.010 amp | |
| `headBob Y` | 0.016 amp | 0.012 amp | 0 | |
| `headBob freq` | 1.6 Hz | 4.8 Hz | 0 | |
| `bodySway freq` | — | 2.4 Hz | 0.6 Hz | |
| `bodySway amplitude` | — | 0.11 rad | ~0 | |

---

## 2. Secondary Motion

### Head Counter-Sway to Body Tilt

When body sways, head should counter-rotate at 30–40% magnitude:

```tsx
const bodySwayZ = ub.rotation.z;
const headCounterTarget = -bodySwayZ * 0.35;
hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, headCounterTarget + Math.sin(t * 0.85) * 0.022, 0.06);
```

Typical ratio: 0.25–0.45. Below 0.25 disappears; above 0.45 head looks disconnected.

### Hand Follow-Through (Keystroke Bounce)

Stagger left/right hands with different frequencies and phase offset to avoid mechanical lockstep:

```tsx
lh.position.y = lerp(lh.position.y, 0.92 + Math.sin(t * 8.4) * 0.065, 0.20);
rh.position.y = lerp(rh.position.y, 0.92 + Math.sin(t * 9.1 + Math.PI * 0.62) * 0.065, 0.20);
// Left: 8.4 Hz, Right: 9.1 Hz + phase shift — prevents synchronization
```

### Organic Body Sway (Dual Frequency)

Pure sine sway is recognizable as artificial. Mix two offset frequencies:

```tsx
const sway = Math.sin(t * 2.4) * 0.09 + Math.sin(t * 1.7 + 1.1) * 0.03;
ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, sway, 0.07);
```

---

## 3. Eye Blinking

### Implementation

```tsx
const blinkState = useRef({ next: 2.5 + Math.random() * 3, active: false, start: 0 });

// In useFrame:
const bs = blinkState.current;
if (!bs.active && t > bs.next) { bs.active = true; bs.start = t; }
if (bs.active) {
  const dt = t - bs.start;
  const sy = dt < 0.07 ? 1 - dt / 0.07 : dt < 0.14 ? (dt - 0.07) / 0.07 : 1;
  const clamped = Math.max(0.05, sy);  // never fully 0 — prevents Z-fighting
  leftEyeRef.current?.scale.setY(clamped);
  rightEyeRef.current?.scale.setY(clamped);
  if (dt > 0.14) { bs.active = false; bs.next = t + 2.5 + Math.random() * 4; }
}
```

### Blink Interval by State

```tsx
const nextBlinkInterval = focused
  ? 1.8 + Math.random() * 2.5   // concentrating = more frequent
  : isIdle
  ? 4.0 + Math.random() * 6.0   // drowsy = less frequent
  : 2.5 + Math.random() * 4.0;  // normal
```

Human blink: 2–10s interval, mean ~4s. Duration: 100–400ms. Close faster than open.

---

## 4. Eyebrow Animation

### Values

| State | `position.y` | `rotation.z` (left/right) |
|---|---|---|
| Neutral | 0.18 | ±0.10 |
| Furrowed (typing/focused) | 0.165 | ±0.24 |
| Raised (idle beat) | 0.205 | ±0.04 |

Alpha: 0.06 — intentionally slow (fast brows read as twitching).

### Occasional Raised Brow Idle Beat

```tsx
const browState = useRef({ mode: 'neutral' as 'neutral' | 'raised', nextChange: 8 + Math.random() * 12 });

// In useFrame idle branch:
if (t > browState.current.nextChange) {
  browState.current.mode = browState.current.mode === 'neutral' ? 'raised' : 'neutral';
  browState.current.nextChange = t + (browState.current.mode === 'raised' ? 1.5 + Math.random() * 2 : 5 + Math.random() * 10);
}
```

---

## 5. Head Bob and Look-Around

### Head Bob

Uses `clock.getElapsedTime()` (absolute time) — framerate-independent for oscillations:

```tsx
hg.position.y = lerp(hg.position.y, HEAD_PIVOT_Y + Math.sin(t * 1.6) * 0.016, 0.06);
```

- 1.6 Hz, 0.016 amplitude = slow breathing feel
- 4.8 Hz, 0.012 amplitude = typing exertion feel

### Idle Look-Around with Vertical Pitch

```tsx
const lookAround = useRef({
  targetYaw: 0, nextYawChange: 3 + Math.random() * 5,
  targetPitch: 0, nextPitchChange: 5 + Math.random() * 8,
});

// In useFrame idle branch:
const la = lookAround.current;
if (t > la.nextYawChange)   { la.targetYaw   = (Math.random() - 0.5) * 0.45; la.nextYawChange   = t + 3 + Math.random() * 5; }
if (t > la.nextPitchChange) { la.targetPitch  = (Math.random() - 0.5) * 0.18; la.nextPitchChange = t + 5 + Math.random() * 10; }
hg.rotation.y = lerp(hg.rotation.y, la.targetYaw,   0.03);  // very slow — drifting feel
hg.rotation.x = lerp(hg.rotation.x, la.targetPitch, 0.025);
```

---

## 6. Mouse-Driven Hand Animation

### Prop Interface

```tsx
mouseRef?: MutableRefObject<{ nx: number; ny: number; active: boolean }>
// nx, ny = normalized screen coords [0..1]
// active = false after 1.5s inactivity
```

### Hand Mapping (Local Space, Avatar Facing -Z with rotationY=π)

```tsx
// Local left arm/hand = viewer's right side (where mouse lives)
la.rotation.x = lerp(la.rotation.x, -1.1, 0.16);     // less severe than typing (-1.7)
la.position.z = lerp(la.position.z, 0.20, 0.16);
la.position.y = lerp(la.position.y, 1.02, 0.16);
lh.position.x = lerp(lh.position.x, -0.28 - nx * 0.20, 0.18);  // x range 0.20
lh.position.y = lerp(lh.position.y,  0.91 - ny * 0.05, 0.18);  // y range 0.05 (flat surface)
lh.position.z = lerp(lh.position.z,  0.36 + ny * 0.10, 0.18);  // z range 0.10
```

Desk top is at y=0.84. Hand target y=0.86–0.91 keeps it above the surface.

### Critical: Pose Branches Must Yield to Mouse Block

When `mousing=true`, skip `la`/`lh` in the pose branches entirely. Competing lerps in the same frame reduce the effective alpha and the mouse block "barely wins":

```tsx
if (isTyping) {
  if (lh && !mousing) { /* ... */ }
  if (la && !mousing) { /* ... */ }
  // rh and ra still animate normally
}
// Mouse block runs after — uncontested
if (mousing && lh && la) { /* ... */ }
```

### Network Throttling for Peer Mouse

```tsx
// 66ms interval (~15 Hz) — enough for smooth visual, low bandwidth
if (now - lastSend > 66) {
  lastSend = now;
  peerRef.current?.send({ type: 'mouseMove', nx, ny });
}
// Receiver: 1.5s timeout to return to normal pose
```

---

## 7. Look-At Constraints

### Self Avatar: Camera-Mirror (rotationY=π Correction)

```tsx
camera.getWorldDirection(_camDir.current);
const worldYaw  = Math.atan2(_camDir.current.x, -_camDir.current.z);
const localYaw  = -worldYaw;  // negate — avatar local +Z = world -Z
const localPitch = -Math.asin(THREE.MathUtils.clamp(_camDir.current.y, -1, 1));

hg.rotation.y = lerp(hg.rotation.y, clamp(localYaw,   -0.72, 0.72), 0.12);
hg.rotation.x = lerp(hg.rotation.x, clamp(localPitch, -0.45, 0.45), 0.10);
```

### Peer Avatar: Social Presence (Slow Track)

```tsx
hg.getWorldPosition(_headWorldPos.current);
_headWorldPos.current.y += 0.07;  // offset to eye level
_toCam.current.copy(camera.position).sub(_headWorldPos.current);
const { x: dx, y: dy, z: dz } = _toCam.current;
const horiz    = Math.sqrt(dx * dx + dz * dz);
const localYaw   = -Math.atan2(dx, -dz);
const localPitch = -Math.atan2(dy, horiz);

hg.rotation.y = lerp(hg.rotation.y, clamp(localYaw,   -0.65, 0.65), 0.06);  // slower alpha — lazy awareness
hg.rotation.x = lerp(hg.rotation.x, clamp(localPitch, -0.35, 0.35), 0.06);
```

Alpha difference matters: self=0.12 (snappy), peer=0.06 (drifting). Peer should "notice and slowly look back" not snap to attention.

### Rotation Clamp Limits

| | Yaw | Pitch |
|---|---|---|
| Self | ±0.72 rad (~41°) | ±0.45 rad (~26°) |
| Peer | ±0.65 rad | ±0.35 rad |

---

## 8. Performance in React Three Fiber

### Non-Negotiable Rules

**Never allocate inside `useFrame`:**
```tsx
// WRONG
useFrame(() => { mesh.position.lerp(new THREE.Vector3(1, 0, 0), 0.1); });

// CORRECT — pre-allocate as ref
const _target = useRef(new THREE.Vector3(1, 0, 0));
useFrame(() => { mesh.position.lerp(_target.current, 0.1); });
```

**Never use `useState` for per-frame values.** All blink, look-around, and mouse state lives in `useRef`.

**`clock.getElapsedTime()` for oscillations, `delta` for velocities.**

**Framerate-independent lerp:**
```tsx
// Standard lerp — NOT framerate-independent (moves half as much at 30fps vs 60fps)
lerp(a, b, 0.08)

// Framerate-independent version
const alpha = 1 - Math.pow(1 - smoothingFactor, delta * 60);
lerp(a, b, alpha)  // smoothingFactor is the target alpha at 60fps
```

**One `useFrame` per animated entity.** Splitting into multiple subscriptions adds call overhead and complicates priority management.

**Priority ordering:** If avatar needs to read camera position after it has moved, use priority:
```tsx
useFrame(({ camera }) => { /* ... */ }, 1);  // runs after default-priority camera
```

---

## 9. Squash and Stretch

### Volume Conservation Rule

If you squash Y by factor `s`, scale XZ by `1/sqrt(s)`:

```tsx
const squashY  = 0.85;
const squashXZ = 1.0 / Math.sqrt(squashY);  // ≈ 1.086
mesh.scale.set(squashXZ, squashY, squashXZ);
```

### State-Entry Anticipation Beat

When entering typing state, brief squash on upper body adds life:

```tsx
const squashState = useRef({ active: false, elapsed: 0 });
const wasTyping   = useRef(false);

// Detect state entry
if (isTyping && !wasTyping.current) squashState.current = { active: true, elapsed: 0 };
wasTyping.current = isTyping;

// In useFrame:
if (squashState.current.active && ub) {
  squashState.current.elapsed += delta;
  const phase = squashState.current.elapsed / 0.25;  // 250ms
  if (phase < 1) {
    const squash = 1 - Math.sin(phase * Math.PI) * 0.06;
    ub.scale.set(1.0 / squash, squash, 1.0 / squash);
  } else {
    ub.scale.set(1, 1, 1);
    squashState.current.active = false;
  }
}
```

Typical squash magnitude: 0.04–0.08 (4–8% deformation). Above 0.12 looks rubbery.

### Head Bob Micro-Squash

```tsx
const bobPhase = Math.sin(t * 1.6);
const bobSquash = 1 - Math.max(0, -bobPhase) * 0.012;  // only at bob bottom
if (hg) hg.scale.y = bobSquash;
```

---

## 10. Spring Physics (Overshoot for Cartoon Feel)

Replace lerp with spring where overshoot adds personality:

```tsx
const armSpring = useRef({ pos: 0, vel: 0 });

// In useFrame:
const stiffness = 200, damping = 18;
const error = armTarget - armSpring.current.pos;
armSpring.current.vel += (error * stiffness - armSpring.current.vel * damping) * delta;
armSpring.current.pos += armSpring.current.vel * delta;
la.rotation.x = armSpring.current.pos;
```

Parameters:
| Feel | Stiffness | Damping |
|---|---|---|
| Overdamped (no bounce) | 150 | 28+ |
| Critically damped | 200 | 28 |
| Slight bounce | 200 | 18 |
| Bouncy cartoon | 300 | 12 |

Critical damping: `damping = 2 * sqrt(stiffness)`.

---

## 11. Transition Markers (On-Enter / On-Exit Hooks)

Without React state, detect state changes with a prev-state ref:

```tsx
const prevState = useRef({ isTyping: false, focused: false });

useFrame(() => {
  const enteredTyping = isTyping && !prevState.current.isTyping;
  const exitedTyping  = !isTyping && prevState.current.isTyping;
  if (enteredTyping) { /* trigger anticipation squash */ }
  if (exitedTyping)  { /* trigger relaxation sag */ }
  prevState.current.isTyping = isTyping;
  prevState.current.focused  = focused;
});
```

---

## 12. Common Pitfalls

| Pitfall | Fix |
|---|---|
| `atan2` sign convention | Use `atan2(dx, -dz)` not `atan2(dx, dz)` — Three.js forward is -Z |
| Clamp after lerp | Clamp the TARGET before lerping, not the result |
| Same ref assigned to two meshes | Only last assignment survives — use groups or separate refs |
| Multiple pose branches write same prop | Later branch wins, but competing lerps in same frame blur the target — use guard flags |
| `useRef` inside `useFrame` closure captures stale values | Stale closure only matters for `useCallback`/`useEffect` — `useRef.current` is always live |
| `Float` from drei for body parts | `Float` adds its own `useFrame` — use for decorative elements only |
| Alpha too high → jitter at rest | 0.20+ alphas oscillate at sub-pixel scale around target — acceptable for most cases |

---

## 13. Quick Parameter Reference

| Parameter | Range | Notes |
|---|---|---|
| Lerp alpha — head drift (idle) | 0.02–0.04 | Look-around yaw |
| Lerp alpha — body lean | 0.05–0.08 | Focused/typing |
| Lerp alpha — arm/brow | 0.08–0.12 | Main pose |
| Lerp alpha — mouse hand | 0.15–0.22 | Fast tracking |
| Blink duration | 0.12–0.18s | 0.14s = 70ms close + 70ms open |
| Blink interval | 2.5–6.5s | `2.5 + Math.random() * 4` |
| Head yaw clamp (self) | ±0.72 rad | ~±41° |
| Head yaw clamp (peer) | ±0.65 rad | |
| Head pitch clamp (self) | ±0.45 rad | ~±26° |
| Head pitch clamp (peer) | ±0.35 rad | |
| Idle bob amplitude | 0.012–0.020 world units | |
| Idle bob frequency | 1.5–1.7 Hz | |
| Body sway amplitude (typing) | 0.08–0.12 rad | rotation.z |
| Body sway frequency (typing) | 2.2–2.6 Hz | |
| Eyebrow Y offset furrowed | 0.015–0.020 | |
| Counter-sway head/body ratio | 0.25–0.45 | |
| Squash magnitude | 0.04–0.08 | Scale factor delta |
| Spring stiffness (cartoon) | 150–300 | |
| Spring damping (cartoon) | 12–20 | |

---

## Relevant Files

- `src/renderer/scene/Avatar.tsx` — primary animation system
- `src/renderer/scene/CharacterParts.tsx` — Eye/Hair geometry with ref support
- `src/renderer/scene/Camera.tsx` — CameraRig look-at math
- `src/renderer/screens/Session.tsx` — mouse/typing event sources, ref wiring
- `.agents/skills/r3f-animation/SKILL.md` — project R3F animation skill
