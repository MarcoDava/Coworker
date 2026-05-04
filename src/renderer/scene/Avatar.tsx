import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';
import { Eye, Hair } from './CharacterParts';

// Head group pivot Y — neck height. All head child y-coords are relative to this.
const HEAD_PIVOT_Y = 1.45;

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
};

export function Avatar({
  position, color, rotationY = 0,
  isIdle, isTyping, focused = false, transparent = false,
  skinColor = '#f8d2aa', hairColor = '#3a2010', eyeColor = '#3a88cc', chairColor = '#22aacc',
  lookRef, trackCamera,
}: Props) {
  const bodyOpacity = transparent ? 0.12 : 1;
  const skinOpacity = transparent ? 0.08 : 1;
  const leftHandRef  = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const leftArmRef   = useRef<THREE.Mesh>(null);
  const rightArmRef  = useRef<THREE.Mesh>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const upperBodyRef = useRef<THREE.Group>(null);

  // Pre-allocated — no new Vector3 inside useFrame
  const _camDir      = useRef(new THREE.Vector3());
  const _headWorldPos = useRef(new THREE.Vector3());
  const _toCam       = useRef(new THREE.Vector3());

  useFrame(({ camera, clock }) => {
    const t  = clock.getElapsedTime();
    const lh = leftHandRef.current;
    const rh = rightHandRef.current;
    const la = leftArmRef.current;
    const ra = rightArmRef.current;
    const hg = headGroupRef.current;
    const ub = upperBodyRef.current;

    // ── Body / arms / hands ──────────────────────────────────────────────────
    if (isTyping) {
      if (lh) {
        lh.position.y = THREE.MathUtils.lerp(lh.position.y, 0.92 + Math.sin(t * 8.4) * 0.065, 0.20);
        lh.position.z = THREE.MathUtils.lerp(lh.position.z, 0.50, 0.12);
      }
      if (rh) {
        rh.position.y = THREE.MathUtils.lerp(rh.position.y, 0.92 + Math.sin(t * 9.1 + Math.PI * 0.62) * 0.065, 0.20);
        rh.position.z = THREE.MathUtils.lerp(rh.position.z, 0.50, 0.12);
      }
      if (la) {
        la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -1.7, 0.08);
        la.position.z = THREE.MathUtils.lerp(la.position.z, 0.1, 0.08);
        
      }
      if (ra){
        ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, -1.7, 0.08);
        ra.position.z = THREE.MathUtils.lerp(ra.position.z, 0.1, 0.08);
      }
      if (ub) {
        ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, 0.10, 0.06);
        ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, Math.sin(t * 1.1) * 0.018, 0.04);
      }
    } else if (focused) {
      // Focused / screen-mode pose: locked-in, leaned forward, hands resting on keyboard
      if (lh) {
        lh.position.y = THREE.MathUtils.lerp(lh.position.y, 0.90, 0.06);
        lh.position.z = THREE.MathUtils.lerp(lh.position.z, 0.40, 0.06);
      }
      if (rh) {
        rh.position.y = THREE.MathUtils.lerp(rh.position.y, 0.90, 0.06);
        rh.position.z = THREE.MathUtils.lerp(rh.position.z, 0.40, 0.06);
      }
      if (la) la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, -0.42, 0.06);
      if (ra) ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, -0.42, 0.06);
      if (ub) {
        ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, 0.14, 0.05);
        ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, 0, 0.05);
      }
    } else {
      // Idle rest pose — hands at sides, arms straight
      if (lh) {
        lh.position.y = THREE.MathUtils.lerp(lh.position.y, 0.80, 0.08);
        lh.position.z = THREE.MathUtils.lerp(lh.position.z, 0.0, 0.08);
      }
      if (rh) {
        rh.position.y = THREE.MathUtils.lerp(rh.position.y, 0.80, 0.08);
        rh.position.z = THREE.MathUtils.lerp(rh.position.z, 0.0, 0.08);
      }
      if (la) la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, 0, 0.08);
      if (ra) ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, 0, 0.08);
      if (ub) {
        ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, 0, 0.06);
        ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, 0, 0.06);
      }
    }

    if (!hg) return;

    const lookActive = lookRef?.current?.enabled;

    if (lookActive) {
      // Self avatar: head mirrors camera look direction.
      // Avatar group has rotationY=π, so avatar-local +X is world -X → negate worldYaw.
      camera.getWorldDirection(_camDir.current);
      const worldYaw  = Math.atan2(_camDir.current.x, -_camDir.current.z);
      const localYaw   = -worldYaw;
      const localPitch = -Math.asin(THREE.MathUtils.clamp(_camDir.current.y, -1, 1));
      hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, THREE.MathUtils.clamp(localYaw,   -0.72, 0.72), 0.12);
      hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, THREE.MathUtils.clamp(localPitch, -0.45, 0.45), 0.10);
      hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.08);
      hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y, 0.06);
    } else if (trackCamera) {
      // Peer avatar: softly look toward camera (social presence).
      // getWorldPosition gives the group origin; head sphere is +0.07 above that.
      hg.getWorldPosition(_headWorldPos.current);
      _headWorldPos.current.y += 0.07;
      _toCam.current.copy(camera.position).sub(_headWorldPos.current);
      const dx    = _toCam.current.x;
      const dy    = _toCam.current.y;
      const dz    = _toCam.current.z;
      const horiz = Math.sqrt(dx * dx + dz * dz);
      const worldYaw  = Math.atan2(dx, -dz);
      const localYaw   = -worldYaw;
      const localPitch = -Math.atan2(dy, horiz);
      hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, THREE.MathUtils.clamp(localYaw,   -0.65, 0.65), 0.06);
      hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, THREE.MathUtils.clamp(localPitch, -0.35, 0.35), 0.06);
      hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.06);
      hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y + Math.sin(t * 1.6) * 0.016, 0.06);
    } else {
      // No tracking — idle, typing, or focused head animations
      if (focused) {
        // Locked-in: head pitched forward and down, no bob, slight sway
        hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0.24, 0.05);
        hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, 0, 0.05);
        hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.6) * 0.010, 0.04);
        hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y - 0.04, 0.04);
      } else if (isTyping) {
        hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0.20, 0.06);
        hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, 0, 0.06);
        hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.85) * 0.008, 0.05);
        hg.position.y = THREE.MathUtils.lerp(hg.position.y, HEAD_PIVOT_Y - 0.02, 0.05);
      } else {
        // Idle bob
        hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0, 0.06);
        hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, 0, 0.06);
        hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.85) * 0.022, 0.06);
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

        {/* Arms — pitch forward when typing/focused */}
        {!transparent && (
          <>
             <mesh ref={leftArmRef} position={[-0.36, 0.90, 0.0]} rotation={[0, Math.PI, 0.32]} castShadow>
              <capsuleGeometry args={[0.08, 0.24, 4.1, 8.2]} />
              <meshToonMaterial color="#131313" transparent opacity={bodyOpacity} depthWrite={!transparent} side={THREE.BackSide}/>
            </mesh>
            <mesh ref={rightArmRef} position={[0.36, 0.90, 0.0]} rotation={[0, Math.PI, -0.32]} castShadow>
              <capsuleGeometry args={[0.08, 0.24, 4.1, 8.2]} />
              <meshToonMaterial color="#1a1008" transparent opacity={bodyOpacity} depthWrite={!transparent} side={THREE.BackSide}/>
            </mesh>
          </>
        )}
        <mesh ref={leftArmRef} position={[-0.36, 0.90, 0.0]} rotation={[0, Math.PI, 0.32]} castShadow>
          <capsuleGeometry args={[0.072, 0.22, 4, 8]} />
          <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.36, 0.90, 0.0]} rotation={[0, Math.PI, -0.32]} castShadow>
          <capsuleGeometry args={[0.072, 0.22, 4, 8]} />
          <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
        </mesh>
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

      {/* Head group — pivot at neck height (HEAD_PIVOT_Y).
          All child positions are relative to this pivot. */}
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
        <RoundedBox args={[0.13, 0.026, 0.035]} radius={0.012} smoothness={3} position={[-0.115, 0.18, 0.285]} rotation={[0.05, 0, 0.10]} castShadow>
          <meshBasicMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>
        <RoundedBox args={[0.13, 0.026, 0.035]} radius={0.012} smoothness={3} position={[0.115, 0.18, 0.285]} rotation={[0.05, 0, -0.10]} castShadow>
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

        <Eye x={-0.11} eyeColor={eyeColor} opacity={skinOpacity} depthWrite={!transparent} />
        <Eye x={0.11}  eyeColor={eyeColor} opacity={skinOpacity} depthWrite={!transparent} />

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
