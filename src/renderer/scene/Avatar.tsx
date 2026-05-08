import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { Eye, Hair } from './CharacterParts';

const HEAD_PIVOT_Y = 1.45;

// Pose targets — module scope, zero allocations per frame
const POSE = {
  idle:    { armRotX: 0,     armPosY: 0.90, armPosZ: 0.0,  handPosY: 0.80, handPosZ: 0.0,  bodyRotX: 0    },
  typing:  { armRotX: -1.7,  armPosY: 1.05, armPosZ: 0.10, handPosY: 0.92, handPosZ: 0.50, bodyRotX: 0.12 },
  focused: { armRotX: -0.42, armPosY: 0.90, armPosZ: 0.0,  handPosY: 0.90, handPosZ: 0.40, bodyRotX: 0.14 },
} as const;

const BLEND_FAST = 0.20;  // hand bounce, mouse
const BLEND_MED  = 0.08;  // main pose transitions
const BLEND_SLOW = 0.04;  // head drift

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
  lookRef, trackCamera, mouseRef,
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

  const blinkState  = useRef({ next: 2.5 + Math.random() * 3, active: false, start: 0 });
  const lookAround  = useRef({
    targetYaw: 0,   nextYawChange:   3 + Math.random() * 5,
    targetPitch: 0, nextPitchChange: 5 + Math.random() * 8,
  });
  const browState   = useRef({ mode: 'neutral' as 'neutral' | 'raised', nextChange: 8 + Math.random() * 12 });
  const squashState = useRef({ active: false, elapsed: 0 });
  const wasTyping   = useRef(false);

  // Pre-allocated — no new Vector3 inside useFrame
  const _camDir       = useRef(new THREE.Vector3());
  const _headWorldPos = useRef(new THREE.Vector3());
  const _toCam        = useRef(new THREE.Vector3());

  useFrame(({ camera, clock }, delta) => {
    const t  = clock.getElapsedTime();
    const lh = leftHandRef.current;
    const rh = rightHandRef.current;
    const la = leftArmRef.current;
    const ra = rightArmRef.current;
    const hg = headGroupRef.current;
    const ub = upperBodyRef.current;

    const mousing = mouseRef?.current?.active ?? false;

    // Detect typing state entry — triggers squash beat
    if (isTyping && !wasTyping.current) squashState.current = { active: true, elapsed: 0 };
    wasTyping.current = !!isTyping;

    // ── Body / arms / hands ──────────────────────────────────────────────────
    if (isTyping) {
      if (lh && !mousing) {
        lh.position.y = THREE.MathUtils.lerp(lh.position.y, POSE.typing.handPosY + Math.sin(t * 8.4) * 0.065, BLEND_FAST);
        lh.position.z = THREE.MathUtils.lerp(lh.position.z, POSE.typing.handPosZ, BLEND_MED);
      }
      if (rh) {
        rh.position.y = THREE.MathUtils.lerp(rh.position.y, POSE.typing.handPosY + Math.sin(t * 9.1 + Math.PI * 0.62) * 0.065, BLEND_FAST);
        rh.position.z = THREE.MathUtils.lerp(rh.position.z, POSE.typing.handPosZ, BLEND_MED);
      }
      if (la && !mousing) {
        la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, POSE.typing.armRotX,  BLEND_MED);
        la.position.z = THREE.MathUtils.lerp(la.position.z, POSE.typing.armPosZ,  BLEND_MED);
        la.position.y = THREE.MathUtils.lerp(la.position.y, POSE.typing.armPosY,  BLEND_MED);
      }
      if (ra) {
        ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, POSE.typing.armRotX,  BLEND_MED);
        ra.position.z = THREE.MathUtils.lerp(ra.position.z, POSE.typing.armPosZ,  BLEND_MED);
        ra.position.y = THREE.MathUtils.lerp(ra.position.y, POSE.typing.armPosY,  BLEND_MED);
      }
      if (ub) {
        // Dual-frequency sway avoids mechanical feel
        const sway = Math.sin(t * 2.4) * 0.09 + Math.sin(t * 1.7 + 1.1) * 0.03;
        ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, POSE.typing.bodyRotX, 0.06);
        ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, sway, 0.07);
        ub.position.x = THREE.MathUtils.lerp(ub.position.x, Math.sin(t * 2.4) * 0.04, 0.07);
      }
    } else if (focused) {
      if (lh && !mousing) {
        lh.position.y = THREE.MathUtils.lerp(lh.position.y, POSE.focused.handPosY, 0.06);
        lh.position.z = THREE.MathUtils.lerp(lh.position.z, POSE.focused.handPosZ, 0.06);
      }
      if (rh) {
        rh.position.y = THREE.MathUtils.lerp(rh.position.y, POSE.focused.handPosY, 0.06);
        rh.position.z = THREE.MathUtils.lerp(rh.position.z, POSE.focused.handPosZ, 0.06);
      }
      if (la && !mousing) {
        la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, POSE.focused.armRotX, 0.06);
        la.position.y = THREE.MathUtils.lerp(la.position.y, POSE.focused.armPosY, 0.06);
        la.position.z = THREE.MathUtils.lerp(la.position.z, POSE.focused.armPosZ, 0.06);
      }
      if (ra) {
        ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, POSE.focused.armRotX, 0.06);
        ra.position.y = THREE.MathUtils.lerp(ra.position.y, POSE.focused.armPosY, 0.06);
        ra.position.z = THREE.MathUtils.lerp(ra.position.z, POSE.focused.armPosZ, 0.06);
      }
      if (ub) {
        ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, POSE.focused.bodyRotX, 0.05);
        ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, 0, 0.05);
        ub.position.x = THREE.MathUtils.lerp(ub.position.x, 0, 0.05);
      }
    } else {
      if (lh && !mousing) {
        lh.position.y = THREE.MathUtils.lerp(lh.position.y, POSE.idle.handPosY, BLEND_MED);
        lh.position.z = THREE.MathUtils.lerp(lh.position.z, POSE.idle.handPosZ, BLEND_MED);
      }
      if (rh) {
        rh.position.y = THREE.MathUtils.lerp(rh.position.y, POSE.idle.handPosY, BLEND_MED);
        rh.position.z = THREE.MathUtils.lerp(rh.position.z, POSE.idle.handPosZ, BLEND_MED);
      }
      if (la && !mousing) {
        la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, POSE.idle.armRotX, BLEND_MED);
        la.position.y = THREE.MathUtils.lerp(la.position.y, POSE.idle.armPosY, BLEND_MED);
        la.position.z = THREE.MathUtils.lerp(la.position.z, POSE.idle.armPosZ, BLEND_MED);
      }
      if (ra) {
        ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, POSE.idle.armRotX, BLEND_MED);
        ra.position.y = THREE.MathUtils.lerp(ra.position.y, POSE.idle.armPosY, BLEND_MED);
        ra.position.z = THREE.MathUtils.lerp(ra.position.z, POSE.idle.armPosZ, BLEND_MED);
      }
      if (ub) {
        ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, POSE.idle.bodyRotX, 0.06);
        ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, 0, 0.06);
        ub.position.x = THREE.MathUtils.lerp(ub.position.x, 0, 0.06);
      }
    }

    // ── Typing-entry squash beat ─────────────────────────────────────────────
    if (squashState.current.active && ub) {
      squashState.current.elapsed += delta;
      const phase = squashState.current.elapsed / 0.25;
      if (phase < 1) {
        const s = 1 - Math.sin(phase * Math.PI) * 0.06;
        ub.scale.set(1.0 / s, s, 1.0 / s);
      } else {
        ub.scale.set(1, 1, 1);
        squashState.current.active = false;
      }
    }

    // ── Mouse hand (local left = viewer's right) ─────────────────────────────
    const mouse = mouseRef?.current;
    if (mousing && lh && la) {
      const nx = mouse!.nx;
      const ny = mouse!.ny;
      la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -1.1, 0.16);
      la.position.z = THREE.MathUtils.lerp(la.position.z, 0.20, 0.16);
      la.position.y = THREE.MathUtils.lerp(la.position.y, 1.02, 0.16);
      lh.position.x = THREE.MathUtils.lerp(lh.position.x, -0.28 - nx * 0.20, 0.18);
      lh.position.y = THREE.MathUtils.lerp(lh.position.y,  0.91 - ny * 0.05, 0.18);
      lh.position.z = THREE.MathUtils.lerp(lh.position.z,  0.36 + ny * 0.10, 0.18);
    }

    // ── Blinking ─────────────────────────────────────────────────────────────
    const bs = blinkState.current;
    if (!bs.active && t > bs.next) { bs.active = true; bs.start = t; }
    if (bs.active) {
      const dt = t - bs.start;
      const sy = dt < 0.07 ? 1 - dt / 0.07 : dt < 0.14 ? (dt - 0.07) / 0.07 : 1;
      const clamped = Math.max(0.05, sy);
      if (leftEyeRef.current)  leftEyeRef.current.scale.y  = clamped;
      if (rightEyeRef.current) rightEyeRef.current.scale.y = clamped;
      if (dt > 0.14) {
        bs.active = false;
        bs.next = t + (focused
          ? 1.8 + Math.random() * 2.5   // concentrating — more frequent
          : isIdle
          ? 4.0 + Math.random() * 6.0   // drowsy — less frequent
          : 2.5 + Math.random() * 4.0); // normal
      }
    }

    // ── Eyebrows ─────────────────────────────────────────────────────────────
    const browFurrow = isTyping || focused;
    let browY: number, browZL: number, browZR: number;
    if (browFurrow) {
      browY = 0.165; browZL = 0.24; browZR = -0.24;
    } else {
      // Occasional raised idle beat
      if (t > browState.current.nextChange) {
        browState.current.mode = browState.current.mode === 'neutral' ? 'raised' : 'neutral';
        browState.current.nextChange = t + (browState.current.mode === 'raised'
          ? 1.5 + Math.random() * 2
          : 5   + Math.random() * 10);
      }
      if (browState.current.mode === 'raised') {
        browY = 0.205; browZL = 0.04; browZR = -0.04;
      } else {
        browY = 0.18; browZL = 0.10; browZR = -0.10;
      }
    }
    if (leftBrowRef.current) {
      leftBrowRef.current.position.y  = THREE.MathUtils.lerp(leftBrowRef.current.position.y,  browY,  0.06);
      leftBrowRef.current.rotation.z  = THREE.MathUtils.lerp(leftBrowRef.current.rotation.z,  browZL, 0.06);
    }
    if (rightBrowRef.current) {
      rightBrowRef.current.position.y = THREE.MathUtils.lerp(rightBrowRef.current.position.y, browY,  0.06);
      rightBrowRef.current.rotation.z = THREE.MathUtils.lerp(rightBrowRef.current.rotation.z, browZR, 0.06);
    }

    if (!hg) return;

    // Head bob micro-squash — subtle volume feel at bob bottom
    const bobPhase = Math.sin(t * 1.6);
    hg.scale.y = 1 - Math.max(0, -bobPhase) * 0.012;

    const lookActive = lookRef?.current?.enabled;

    if (lookActive) {
      // Self: head mirrors camera look direction (rotationY=π correction)
      camera.getWorldDirection(_camDir.current);
      const worldYaw   = Math.atan2(_camDir.current.x, -_camDir.current.z);
      const localYaw   = -worldYaw;
      const localPitch = -Math.asin(THREE.MathUtils.clamp(_camDir.current.y, -1, 1));
      hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, THREE.MathUtils.clamp(localYaw,   -0.72, 0.72), 0.12);
      hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, THREE.MathUtils.clamp(localPitch, -0.45, 0.45), 0.10);
      hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.08);
      hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y, 0.06);
    } else if (trackCamera) {
      // Peer: slow social-presence look toward camera
      hg.getWorldPosition(_headWorldPos.current);
      _headWorldPos.current.y += 0.07;
      _toCam.current.copy(camera.position).sub(_headWorldPos.current);
      const dx    = _toCam.current.x;
      const dy    = _toCam.current.y;
      const dz    = _toCam.current.z;
      const horiz = Math.sqrt(dx * dx + dz * dz);
      const localYaw   = -Math.atan2(dx, -dz);
      const localPitch = -Math.atan2(dy, horiz);
      hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, THREE.MathUtils.clamp(localYaw,   -0.65, 0.65), 0.06);
      hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, THREE.MathUtils.clamp(localPitch, -0.35, 0.35), 0.06);
      hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.06);
      hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y + Math.sin(t * 1.6) * 0.016, 0.06);
    } else {
      if (focused) {
        hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0.24, 0.05);
        hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, 0, 0.05);
        hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.6) * 0.010, 0.04);
        hg.position.x = THREE.MathUtils.lerp(hg.position.x, 0, 0.05);
        hg.position.z = THREE.MathUtils.lerp(hg.position.z, 0, 0.05);
        hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y - 0.04, 0.04);
      } else if (isTyping) {
        // Same dual-freq formula as body sway — directly computed so no lag/damping chain
        const sway = Math.sin(t * 2.4) * 0.09 + Math.sin(t * 1.7 + 1.1) * 0.03;
        hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0.20, 0.06);
        hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, Math.sin(t * 1.8) * 0.08, 0.07);
        hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, sway, 0.09);
        // Simulate rigid-body arc: head at HEAD_PIVOT_Y arcs laterally with body rotation
        hg.position.x = THREE.MathUtils.lerp(hg.position.x, sway * HEAD_PIVOT_Y * 0.55, 0.09);
        // Z oscillation: head rocks forward/back at same frequency
        hg.position.z = THREE.MathUtils.lerp(hg.position.z, Math.sin(t * 2.4) * 0.04, 0.08);
        hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y - 0.02 + Math.sin(t * 4.8) * 0.018, 0.06);
      } else {
        // Idle: bob + look-around (yaw + vertical pitch)
        const look = lookAround.current;
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
