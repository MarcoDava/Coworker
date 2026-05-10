import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { Eye, Hair } from './CharacterParts';

const HEAD_PIVOT_Y = 1.45;

const POSE = {
  idle:    { armRotX: 0,     armPosY: 0.90, armPosZ: 0.0,  handPosY: 0.80, handPosZ: 0.0,  bodyRotX: 0    },
  typing:  { armRotX: -1.7,  armPosY: 1.05, armPosZ: 0.10, handPosY: 0.92, handPosZ: 0.50, bodyRotX: 0.12 },
  focused: { armRotX: -0.42, armPosY: 0.90, armPosZ: 0.0,  handPosY: 0.90, handPosZ: 0.40, bodyRotX: 0.14 },
  victory: { armRotX: -2.6,  armPosY: 1.30, armPosZ: -0.12, handPosY: 1.42, handPosZ: -0.08, bodyRotX: -0.10 },
  defeat:  { armRotX: 0.5,   armPosY: 0.75, armPosZ: 0.0,  handPosY: 0.65, handPosZ: 0.0,  bodyRotX: 0.28 },
} as const;

const BLEND_FAST = 0.20;
const BLEND_MED  = 0.08;
const BLEND_SLOW = 0.04;

// ── Refs bundle ──────────────────��─────────────────────────────────────────
type PoseRefs = {
  lh: THREE.Mesh | null;
  rh: THREE.Mesh | null;
  la: THREE.Group | null;
  ra: THREE.Group | null;
  ub: THREE.Group | null;
};

type HeadRefs = {
  hg: THREE.Group | null;
  camDir: THREE.Vector3;
  headWorldPos: THREE.Vector3;
  toCam: THREE.Vector3;
};

type FaceRefs = {
  leftEye: THREE.Group | null;
  rightEye: THREE.Group | null;
  leftBrow: THREE.Mesh | null;
  rightBrow: THREE.Mesh | null;
};

type AnimState = {
  blink: { next: number; active: boolean; start: number };
  lookAround: { targetYaw: number; nextYawChange: number; targetPitch: number; nextPitchChange: number };
  browState: { mode: 'neutral' | 'raised'; nextChange: number };
  squash: { active: boolean; elapsed: number };
  wasTyping: boolean;
};

// ── Animation helpers ──────────────────────────��───────────────────────────

type PoseKey = keyof typeof POSE;

function blendLimbs(pr: PoseRefs, pose: (typeof POSE)[PoseKey], alpha: number, mousing: boolean) {
  const { lh, rh, la, ra, ub } = pr;
  if (lh && !mousing) {
    lh.position.y = THREE.MathUtils.lerp(lh.position.y, pose.handPosY, alpha);
    lh.position.z = THREE.MathUtils.lerp(lh.position.z, pose.handPosZ, alpha);
  }
  if (rh) {
    rh.position.y = THREE.MathUtils.lerp(rh.position.y, pose.handPosY, alpha);
    rh.position.z = THREE.MathUtils.lerp(rh.position.z, pose.handPosZ, alpha);
  }
  if (la && !mousing) {
    la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, pose.armRotX,  alpha);
    la.position.y = THREE.MathUtils.lerp(la.position.y, pose.armPosY,  alpha);
    la.position.z = THREE.MathUtils.lerp(la.position.z, pose.armPosZ,  alpha);
  }
  if (ra) {
    ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, pose.armRotX,  alpha);
    ra.position.y = THREE.MathUtils.lerp(ra.position.y, pose.armPosY,  alpha);
    ra.position.z = THREE.MathUtils.lerp(ra.position.z, pose.armPosZ,  alpha);
  }
  if (ub) {
    ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, pose.bodyRotX, alpha);
  }
}

function applyPoseBlend(
  pr: PoseRefs,
  state: AnimState,
  isTyping: boolean | undefined,
  focused: boolean,
  mood: 'victory' | 'defeat' | undefined,
  mousing: boolean,
  t: number,
  delta: number,
) {
  const { ub } = pr;

  if (isTyping && !state.wasTyping) state.squash = { active: true, elapsed: 0 };
  state.wasTyping = !!isTyping;

  if (mood === 'victory') {
    blendLimbs(pr, POSE.victory, BLEND_MED, mousing);
    if (ub) {
      ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, POSE.victory.bodyRotX, 0.05);
      ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, Math.sin(t * 3.5) * 0.04, 0.07);
      ub.position.x = THREE.MathUtils.lerp(ub.position.x, 0, 0.05);
    }
  } else if (mood === 'defeat') {
    blendLimbs(pr, POSE.defeat, BLEND_MED, mousing);
    if (ub) {
      ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, POSE.defeat.bodyRotX, 0.04);
      ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, 0, 0.05);
      ub.position.x = THREE.MathUtils.lerp(ub.position.x, 0, 0.05);
    }
  } else if (isTyping) {
    blendLimbs(pr, POSE.typing, BLEND_MED, mousing);
    // Override hand Y with typing bounce
    const { lh, rh } = pr;
    if (lh && !mousing) lh.position.y = THREE.MathUtils.lerp(lh.position.y, POSE.typing.handPosY + Math.sin(t * 8.4) * 0.065, BLEND_FAST);
    if (rh) rh.position.y = THREE.MathUtils.lerp(rh.position.y, POSE.typing.handPosY + Math.sin(t * 9.1 + Math.PI * 0.62) * 0.065, BLEND_FAST);
    if (ub) {
      const sway = Math.sin(t * 2.4) * 0.09 + Math.sin(t * 1.7 + 1.1) * 0.03;
      ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, POSE.typing.bodyRotX, 0.06);
      ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, sway, 0.07);
      ub.position.x = THREE.MathUtils.lerp(ub.position.x, Math.sin(t * 2.4) * 0.04, 0.07);
    }
  } else if (focused) {
    blendLimbs(pr, POSE.focused, 0.06, mousing);
    if (ub) {
      ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, POSE.focused.bodyRotX, 0.05);
      ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, 0, 0.05);
      ub.position.x = THREE.MathUtils.lerp(ub.position.x, 0, 0.05);
    }
  } else {
    blendLimbs(pr, POSE.idle, BLEND_MED, mousing);
    if (ub) {
      ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, POSE.idle.bodyRotX, 0.06);
      ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, 0, 0.06);
      ub.position.x = THREE.MathUtils.lerp(ub.position.x, 0, 0.06);
    }
  }

  // Typing-entry squash beat
  if (state.squash.active && ub) {
    state.squash.elapsed += delta;
    const phase = state.squash.elapsed / 0.25;
    if (phase < 1) {
      const s = 1 - Math.sin(phase * Math.PI) * 0.06;
      ub.scale.set(1.0 / s, s, 1.0 / s);
    } else {
      ub.scale.set(1, 1, 1);
      state.squash.active = false;
    }
  }
}

function applyMouseHand(
  pr: PoseRefs,
  mouse: { nx: number; ny: number; active: boolean } | undefined,
  mousing: boolean,
) {
  const { lh, la } = pr;
  if (!mousing || !mouse || !lh || !la) return;
  la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -1.1, 0.16);
  la.position.z = THREE.MathUtils.lerp(la.position.z, 0.20, 0.16);
  la.position.y = THREE.MathUtils.lerp(la.position.y, 1.02, 0.16);
  lh.position.x = THREE.MathUtils.lerp(lh.position.x, -0.28 - mouse.nx * 0.20, 0.18);
  lh.position.y = THREE.MathUtils.lerp(lh.position.y,  0.91 - mouse.ny * 0.05, 0.18);
  lh.position.z = THREE.MathUtils.lerp(lh.position.z,  0.36 + mouse.ny * 0.10, 0.18);
}

function applyBlink(fr: FaceRefs, state: AnimState, t: number, focused: boolean, isIdle: boolean | undefined) {
  const bs = state.blink;
  if (!bs.active && t > bs.next) { bs.active = true; bs.start = t; }
  if (!bs.active) return;
  const dt = t - bs.start;
  const sy = dt < 0.07 ? 1 - dt / 0.07 : dt < 0.14 ? (dt - 0.07) / 0.07 : 1;
  const clamped = Math.max(0.05, sy);
  if (fr.leftEye)  fr.leftEye.scale.y  = clamped;
  if (fr.rightEye) fr.rightEye.scale.y = clamped;
  if (dt > 0.14) {
    bs.active = false;
    bs.next = t + (focused ? 1.8 + Math.random() * 2.5 : isIdle ? 4.0 + Math.random() * 6.0 : 2.5 + Math.random() * 4.0);
  }
}

function applyEyebrows(fr: FaceRefs, state: AnimState, t: number, isTyping: boolean | undefined, focused: boolean) {
  let browY: number, browZL: number, browZR: number;
  if (isTyping || focused) {
    browY = 0.165; browZL = 0.24; browZR = -0.24;
  } else {
    if (t > state.browState.nextChange) {
      state.browState.mode = state.browState.mode === 'neutral' ? 'raised' : 'neutral';
      state.browState.nextChange = t + (state.browState.mode === 'raised' ? 1.5 + Math.random() * 2 : 5 + Math.random() * 10);
    }
    if (state.browState.mode === 'raised') {
      browY = 0.205; browZL = 0.04; browZR = -0.04;
    } else {
      browY = 0.18; browZL = 0.10; browZR = -0.10;
    }
  }
  if (fr.leftBrow) {
    fr.leftBrow.position.y = THREE.MathUtils.lerp(fr.leftBrow.position.y, browY,  0.06);
    fr.leftBrow.rotation.z = THREE.MathUtils.lerp(fr.leftBrow.rotation.z, browZL, 0.06);
  }
  if (fr.rightBrow) {
    fr.rightBrow.position.y = THREE.MathUtils.lerp(fr.rightBrow.position.y, browY,  0.06);
    fr.rightBrow.rotation.z = THREE.MathUtils.lerp(fr.rightBrow.rotation.z, browZR, 0.06);
  }
}

function applyHead(
  hr: HeadRefs,
  state: AnimState,
  camera: THREE.Camera,
  lookRef: MutableRefObject<{ enabled: boolean; yaw: number; pitch: number }> | undefined,
  trackCamera: boolean | undefined,
  t: number,
  focused: boolean,
  isTyping: boolean | undefined,
  mood: 'victory' | 'defeat' | undefined,
) {
  const { hg } = hr;
  if (!hg) return;

  hg.scale.y = 1 - Math.max(0, -Math.sin(t * 1.6)) * 0.012;

  if (lookRef?.current?.enabled) {
    camera.getWorldDirection(hr.camDir);
    const worldYaw   = Math.atan2(hr.camDir.x, -hr.camDir.z);
    hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, THREE.MathUtils.clamp(-worldYaw,         -0.72, 0.72), 0.12);
    hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, THREE.MathUtils.clamp(-Math.asin(THREE.MathUtils.clamp(hr.camDir.y, -1, 1)), -0.45, 0.45), 0.10);
    hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.08);
    hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y, 0.06);
  } else if (trackCamera) {
    hg.getWorldPosition(hr.headWorldPos);
    hr.headWorldPos.y += 0.07;
    hr.toCam.copy(camera.position).sub(hr.headWorldPos);
    const horiz = Math.sqrt(hr.toCam.x * hr.toCam.x + hr.toCam.z * hr.toCam.z);
    hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, THREE.MathUtils.clamp(-Math.atan2(hr.toCam.x, -hr.toCam.z), -0.65, 0.65), 0.06);
    hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, THREE.MathUtils.clamp(-Math.atan2(hr.toCam.y, horiz),        -0.35, 0.35), 0.06);
    hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.06);
    hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y + Math.sin(t * 1.6) * 0.016, 0.06);
  } else if (mood === 'victory') {
    hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, -0.18 + Math.sin(t * 3.5) * 0.04, 0.06);
    hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, Math.sin(t * 2.2) * 0.12, 0.07);
    hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.06);
    hg.position.x = THREE.MathUtils.lerp(hg.position.x, 0, 0.05);
    hg.position.z = THREE.MathUtils.lerp(hg.position.z, 0, 0.05);
    hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y + 0.03 + Math.sin(t * 3.5) * 0.02, 0.06);
  } else if (mood === 'defeat') {
    hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0.32, 0.04);
    hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, 0, 0.04);
    hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.04);
    hg.position.x = THREE.MathUtils.lerp(hg.position.x, 0, 0.04);
    hg.position.z = THREE.MathUtils.lerp(hg.position.z, 0.04, 0.04);
    hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y - 0.06, 0.04);
  } else if (focused) {
    hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0.24, 0.05);
    hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, 0, 0.05);
    hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.6) * 0.010, 0.04);
    hg.position.x = THREE.MathUtils.lerp(hg.position.x, 0, 0.05);
    hg.position.z = THREE.MathUtils.lerp(hg.position.z, 0, 0.05);
    hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y - 0.04, 0.04);
  } else if (isTyping) {
    const sway = Math.sin(t * 2.4) * 0.09 + Math.sin(t * 1.7 + 1.1) * 0.03;
    hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0.20, 0.06);
    hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, Math.sin(t * 1.8) * 0.08, 0.07);
    hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, sway, 0.09);
    hg.position.x = THREE.MathUtils.lerp(hg.position.x, sway * HEAD_PIVOT_Y * 0.55, 0.09);
    hg.position.z = THREE.MathUtils.lerp(hg.position.z, Math.sin(t * 2.4) * 0.04, 0.08);
    hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y - 0.02 + Math.sin(t * 4.8) * 0.018, 0.06);
  } else {
    const look = state.lookAround;
    if (t > look.nextYawChange)   { look.targetYaw   = (Math.random() - 0.5) * 0.45;  look.nextYawChange   = t + 3 + Math.random() * 5;  }
    if (t > look.nextPitchChange) { look.targetPitch  = (Math.random() - 0.5) * 0.18;  look.nextPitchChange = t + 5 + Math.random() * 10; }
    hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, look.targetPitch, BLEND_SLOW + 0.005);
    hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, look.targetYaw,   BLEND_SLOW);
    hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.85) * 0.022, 0.06);
    hg.position.x = THREE.MathUtils.lerp(hg.position.x, 0, BLEND_SLOW);
    hg.position.z = THREE.MathUtils.lerp(hg.position.z, 0, BLEND_SLOW);
    hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y + Math.sin(t * 1.6) * 0.016, 0.06);
  }
}

// ── Component ──────────────────────────────────────────────────────────────

type Props = {
  position: [number, number, number];
  color: string;
  rotationY?: number;
  isIdle?: boolean;
  isTyping?: boolean;
  focused?: boolean;
  transparent?: boolean;
  skinColor?: string;
  hairColor?: string;
  eyeColor?: string;
  chairColor?: string;
  mood?: 'victory' | 'defeat';
  /** Self avatar: pass freeLookRef so head follows camera look direction. */
  lookRef?: MutableRefObject<{ enabled: boolean; yaw: number; pitch: number }>;
  /** Peer avatar: softly track toward camera for social presence. */
  trackCamera?: boolean;
  /** Normalized mouse position [0..1] + active flag — drives right-hand mouse animation. */
  mouseRef?: MutableRefObject<{ nx: number; ny: number; active: boolean }>;
};

export function Avatar({
  position, color, rotationY = 0,
  isIdle, isTyping, focused = false, transparent = false,
  skinColor = '#f8d2aa', hairColor = '#3a2010', eyeColor = '#3a88cc', chairColor = '#22aacc',
  mood, lookRef, trackCamera, mouseRef,
}: Props) {
  const bodyOpacity = transparent ? 0.12 : 1;
  const skinOpacity = transparent ? 0.08 : 1;

  const leftHandRef  = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const leftArmRef   = useRef<THREE.Group>(null);
  const rightArmRef  = useRef<THREE.Group>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const upperBodyRef = useRef<THREE.Group>(null);
  const leftEyeRef   = useRef<THREE.Group>(null);
  const rightEyeRef  = useRef<THREE.Group>(null);
  const leftBrowRef  = useRef<THREE.Mesh>(null);
  const rightBrowRef = useRef<THREE.Mesh>(null);

  // Pre-allocated — no new Vector3 inside useFrame
  const _camDir       = useRef(new THREE.Vector3());
  const _headWorldPos = useRef(new THREE.Vector3());
  const _toCam        = useRef(new THREE.Vector3());

  const animState = useRef<AnimState>({
    blink:     { next: 2.5 + Math.random() * 3, active: false, start: 0 },
    lookAround: { targetYaw: 0, nextYawChange: 3 + Math.random() * 5, targetPitch: 0, nextPitchChange: 5 + Math.random() * 8 },
    browState: { mode: 'neutral', nextChange: 8 + Math.random() * 12 },
    squash:    { active: false, elapsed: 0 },
    wasTyping: false,
  });

  useFrame(({ camera, clock }, delta) => {
    const t       = clock.getElapsedTime();
    const mousing = mouseRef?.current?.active ?? false;
    const state   = animState.current;

    const poseRefs: PoseRefs = {
      lh: leftHandRef.current, rh: rightHandRef.current,
      la: leftArmRef.current,  ra: rightArmRef.current,
      ub: upperBodyRef.current,
    };
    const headRefs: HeadRefs = {
      hg: headGroupRef.current,
      camDir: _camDir.current, headWorldPos: _headWorldPos.current, toCam: _toCam.current,
    };
    const faceRefs: FaceRefs = {
      leftEye: leftEyeRef.current, rightEye: rightEyeRef.current,
      leftBrow: leftBrowRef.current, rightBrow: rightBrowRef.current,
    };

    applyPoseBlend(poseRefs, state, isTyping, focused, mood, mousing, t, delta);
    applyMouseHand(poseRefs, mouseRef?.current, mousing);
    applyBlink(faceRefs, state, t, focused, isIdle);
    applyEyebrows(faceRefs, state, t, isTyping, focused);
    applyHead(headRefs, state, camera, lookRef, trackCamera, t, focused, isTyping, mood);
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Chair seat */}
      <RoundedBox args={[1, 0.23, 0.72]} radius={0.12} smoothness={4} position={[0, 0.38, -0.10]} castShadow>
        <meshToonMaterial color={chairColor} transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>
      {/* Chair back */}
      <RoundedBox args={[0.76, 0.80, 0.12]} radius={0.10} smoothness={4} position={[0, 0.84, -0.42]} castShadow>
        <meshToonMaterial color={chairColor} transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>
      {/* Chair legs */}
      {([-0.32, 0.32] as number[]).map((x) =>
        ([0.20, -0.40] as number[]).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.16, z]}>
            <cylinderGeometry args={[0.025, 0.025, 0.32, 6]} />
            <meshToonMaterial color={chairColor} transparent opacity={bodyOpacity} depthWrite={!transparent} />
          </mesh>
        ))
      )}

      {/* Upper body group — leans forward when typing or focused */}
      <group ref={upperBodyRef}>
        {!transparent && (
          <>
            <RoundedBox args={[0.58, 0.50, 0.5]} radius={0.19} smoothness={4} position={[0, 0.96, 0.05]}>
              <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
            </RoundedBox>
            <RoundedBox args={[0.45, 0.5, 0.40]} radius={0.19} smoothness={4} position={[0, 0.78, 0.02]}>
              <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
            </RoundedBox>
          </>
        )}
        <RoundedBox args={[0.54, 0.46, 0.46]} radius={0.18} smoothness={4} position={[0, 0.96, 0.05]} castShadow>
          <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
        </RoundedBox>
        <RoundedBox args={[0.4, 0.46, 0.36]} radius={0.19} smoothness={4} position={[0, 0.78, 0.02]} castShadow>
          <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
        </RoundedBox>

        {/* Arms */}
        <group ref={leftArmRef} position={[-0.36, 0.90, 0.0]} rotation={[0, Math.PI, 0.32]}>
          {!transparent && (
            <mesh castShadow>
              <capsuleGeometry args={[0.08, 0.24, 4.1, 8.2]} />
              <meshToonMaterial color="#131313" transparent opacity={bodyOpacity} depthWrite={!transparent} side={THREE.BackSide} />
            </mesh>
          )}
          <mesh castShadow>
            <capsuleGeometry args={[0.072, 0.22, 4, 8]} />
            <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
          </mesh>
        </group>
        <group ref={rightArmRef} position={[0.36, 0.90, 0.0]} rotation={[0, Math.PI, -0.32]}>
          {!transparent && (
            <mesh castShadow>
              <capsuleGeometry args={[0.08, 0.24, 4.1, 8.2]} />
              <meshToonMaterial color="#1a1008" transparent opacity={bodyOpacity} depthWrite={!transparent} side={THREE.BackSide} />
            </mesh>
          )}
          <mesh castShadow>
            <capsuleGeometry args={[0.072, 0.22, 4, 8]} />
            <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
          </mesh>
        </group>
        {/* Hands — inside upperBodyRef so they lean with the body */}
        <mesh ref={leftHandRef}  position={[-0.40, 0.80, 0.0]} castShadow>
          <sphereGeometry args={[0.095, 12, 12]} />
          <meshToonMaterial color={skinColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh ref={rightHandRef} position={[0.40, 0.80, 0.0]} castShadow>
          <sphereGeometry args={[0.095, 12, 12]} />
          <meshToonMaterial color={skinColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
      </group>

      {/* Head group — pivot at neck height (HEAD_PIVOT_Y) */}
      <group ref={headGroupRef} position={[0, HEAD_PIVOT_Y, 0]}>
        {!transparent && (
          <mesh position={[0, 0.07, 0.02]}>
            <sphereGeometry args={[0.315, 18, 18]} />
            <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
          </mesh>
        )}
        <mesh position={[0, 0.07, 0.02]} castShadow>
          <sphereGeometry args={[0.30, 18, 18]} />
          <meshToonMaterial color={skinColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>

        {/* Eyebrows */}
        <RoundedBox ref={leftBrowRef} args={[0.13, 0.026, 0.035]} radius={0.012} smoothness={3} position={[-0.115, 0.18, 0.285]} rotation={[0.05, 0, 0.10]} castShadow>
          <meshBasicMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>
        <RoundedBox ref={rightBrowRef} args={[0.13, 0.026, 0.035]} radius={0.012} smoothness={3} position={[0.115, 0.18, 0.285]} rotation={[0.05, 0, -0.10]} castShadow>
          <meshBasicMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>

        {/* Cheek blushes */}
        <mesh position={[-0.18, 0.01, 0.26]}>
          <circleGeometry args={[0.052, 10]} />
          <meshBasicMaterial color="#f0a090" transparent opacity={transparent ? 0 : 0.32} />
        </mesh>
        <mesh position={[0.18, 0.01, 0.26]}>
          <circleGeometry args={[0.052, 10]} />
          <meshBasicMaterial color="#f0a090" transparent opacity={transparent ? 0 : 0.32} />
        </mesh>

        <Eye x={-0.11} eyeColor={eyeColor} opacity={skinOpacity} depthWrite={!transparent} groupRef={leftEyeRef} />
        <Eye x={0.11}  eyeColor={eyeColor} opacity={skinOpacity} depthWrite={!transparent} groupRef={rightEyeRef} />

        <Hair color={hairColor} opacity={skinOpacity} depthWrite={!transparent} />

        {/* Smile */}
        <mesh position={[0, -0.04, 0.295]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.068, 0.013, 6, 14, Math.PI]} />
          <meshBasicMaterial color="#c07060" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
      </group>

      {isIdle && (
        <Float speed={1.2} floatIntensity={0.18} rotationIntensity={0.08}>
          <mesh position={[0, 1.98, 0.26]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#9ec7ff" />
          </mesh>
        </Float>
      )}
    </group>
  );
}
