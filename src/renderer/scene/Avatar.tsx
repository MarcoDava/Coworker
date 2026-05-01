import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef, type MutableRefObject } from 'react';
import * as THREE from 'three';

type Props = {
  position: [number, number, number];
  color: string;
  rotationY?: number;
  isIdle?: boolean;
  isTyping?: boolean;
  transparent?: boolean;
  skinColor?: string;
  hairColor?: string;
  eyeColor?: string;
  chairColor?: string;
  /** Self avatar: pass freeLookRef so head follows the camera look direction. */
  lookRef?: MutableRefObject<{ enabled: boolean; yaw: number; pitch: number }>;
  /** Peer avatar: softly track toward camera for social presence. */
  trackCamera?: boolean;
};

export function Avatar({ position, color, rotationY = 0, isIdle, isTyping, transparent = false, skinColor = '#f8d2aa', hairColor = '#3a2010', eyeColor = '#3a88cc', chairColor = '#22aacc', lookRef, trackCamera }: Props) {
  const bodyOpacity = transparent ? 0.12 : 1;
  const skinOpacity = transparent ? 0.08 : 1;
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const leftArmRef = useRef<THREE.Mesh>(null);
  const rightArmRef = useRef<THREE.Mesh>(null);
  const headGroupRef = useRef<THREE.Group>(null);
  const upperBodyRef = useRef<THREE.Group>(null);

  // Pre-allocated — no new Vector3 inside useFrame
  const _camDir = useRef(new THREE.Vector3());
  const _headWorldPos = useRef(new THREE.Vector3());
  const _toCam = useRef(new THREE.Vector3());

  useFrame(({ camera, clock }) => {
    const t = clock.getElapsedTime();
    const lh = leftHandRef.current;
    const rh = rightHandRef.current;
    const la = leftArmRef.current;
    const ra = rightArmRef.current;
    const hg = headGroupRef.current;
    const ub = upperBodyRef.current;

    // --- Typing: hands / arms / upper body ---
    if (isTyping) {
      if (lh) {
        lh.position.y = THREE.MathUtils.lerp(lh.position.y, 0.88 + Math.sin(t * 8.4) * 0.065, 0.20);
        lh.position.z = THREE.MathUtils.lerp(lh.position.z, 0.50, 0.12);
      }
      if (rh) {
        rh.position.y = THREE.MathUtils.lerp(rh.position.y, 0.88 + Math.sin(t * 9.1 + Math.PI * 0.62) * 0.065, 0.20);
        rh.position.z = THREE.MathUtils.lerp(rh.position.z, 0.50, 0.12);
      }
      if (la) la.rotation.x = THREE.MathUtils.lerp(la.rotation.x, 0.52, 0.08);
      if (ra) ra.rotation.x = THREE.MathUtils.lerp(ra.rotation.x, 0.52, 0.08);
      if (ub) {
        ub.rotation.x = THREE.MathUtils.lerp(ub.rotation.x, 0.10, 0.06);
        ub.rotation.z = THREE.MathUtils.lerp(ub.rotation.z, Math.sin(t * 1.1) * 0.018, 0.04);
      }
    } else {
      if (lh) {
        lh.position.y = THREE.MathUtils.lerp(lh.position.y, 0.80, 0.08);
        lh.position.z = THREE.MathUtils.lerp(lh.position.z, -0.06, 0.08);
      }
      if (rh) {
        rh.position.y = THREE.MathUtils.lerp(rh.position.y, 0.80, 0.08);
        rh.position.z = THREE.MathUtils.lerp(rh.position.z, -0.06, 0.08);
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
      // Self avatar: head mirrors actual camera look direction.
      // Avatar group has rotationY=π, so avatar-local +X is world -X.
      // Negate worldYaw to convert from world to avatar-local.
      camera.getWorldDirection(_camDir.current);
      const worldYaw = Math.atan2(_camDir.current.x, -_camDir.current.z);
      const localYaw = -worldYaw;
      const localPitch = -Math.asin(THREE.MathUtils.clamp(_camDir.current.y, -1, 1));
      hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, THREE.MathUtils.clamp(localYaw, -0.72, 0.72), 0.12);
      hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, THREE.MathUtils.clamp(localPitch, -0.45, 0.45), 0.10);
      hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.08);
      hg.position.y = THREE.MathUtils.lerp(hg.position.y, 0, 0.06);
    } else if (trackCamera) {
      // Peer avatar: softly look toward the camera (social presence).
      hg.getWorldPosition(_headWorldPos.current);
      _headWorldPos.current.y += 1.52; // offset to head center
      _toCam.current.copy(camera.position).sub(_headWorldPos.current);
      const dx = _toCam.current.x;
      const dy = _toCam.current.y;
      const dz = _toCam.current.z;
      const horiz = Math.sqrt(dx * dx + dz * dz);
      const worldYaw = Math.atan2(dx, -dz);
      const localYaw = -worldYaw;
      const localPitch = -Math.atan2(dy, horiz);
      hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, THREE.MathUtils.clamp(localYaw, -0.65, 0.65), 0.06);
      hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, THREE.MathUtils.clamp(localPitch, -0.35, 0.35), 0.06);
      hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, 0, 0.06);
      hg.position.y = THREE.MathUtils.lerp(hg.position.y, Math.sin(t * 1.6) * 0.016, 0.06);
    } else {
      // Default idle / typing head animation (no tracking)
      if (isTyping) {
        hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0.20, 0.06);
        hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, 0, 0.06);
        hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.85) * 0.008, 0.05);
        hg.position.y = THREE.MathUtils.lerp(hg.position.y, -0.02, 0.05);
      } else {
        hg.rotation.x = THREE.MathUtils.lerp(hg.rotation.x, 0, 0.06);
        hg.rotation.y = THREE.MathUtils.lerp(hg.rotation.y, 0, 0.06);
        hg.position.y = THREE.MathUtils.lerp(hg.position.y, Math.sin(t * 1.6) * 0.016, 0.06);
        hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.85) * 0.022, 0.06);
      }
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Chair seat */}
      <RoundedBox args={[0.76, 0.18, 0.72]} radius={0.12} smoothness={4} position={[0, 0.38, -0.10]} castShadow>
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

      {/* Upper body group — leans forward when typing */}
      <group ref={upperBodyRef}>
        {!transparent && (
          <RoundedBox args={[0.58, 0.50, 0.48]} radius={0.19} smoothness={4} position={[0, 0.88, 0.0]}>
            <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
          </RoundedBox>
        )}
        <RoundedBox args={[0.54, 0.46, 0.44]} radius={0.18} smoothness={4} position={[0, 0.88, 0.0]} castShadow>
          <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
        </RoundedBox>

        {/* Arms — pitch forward when typing */}
        <mesh ref={leftArmRef} position={[-0.36, 0.90, 0.0]} rotation={[0, 0, 0.32]} castShadow>
          <capsuleGeometry args={[0.072, 0.22, 4, 8]} />
          <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh ref={rightArmRef} position={[0.36, 0.90, 0.0]} rotation={[0, 0, -0.32]} castShadow>
          <capsuleGeometry args={[0.072, 0.22, 4, 8]} />
          <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
        </mesh>
      </group>

      {/* Head group — bobs idle, tilts for typing, tracks look direction */}
      <group ref={headGroupRef}>
        {!transparent && (
          <mesh position={[0, 1.52, 0.02]}>
            <sphereGeometry args={[0.315, 18, 18]} />
            <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
          </mesh>
        )}
        <mesh position={[0, 1.52, 0.02]} castShadow>
          <sphereGeometry args={[0.30, 18, 18]} />
          <meshToonMaterial color={skinColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>

        {/* Eyebrows */}
        <RoundedBox args={[0.10, 0.025, 0.04]} radius={0.012} smoothness={3} position={[-0.11, 1.64, 0.27]} rotation={[0, 0, 0.18]} castShadow>
          <meshBasicMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>
        <RoundedBox args={[0.10, 0.025, 0.04]} radius={0.012} smoothness={3} position={[0.11, 1.64, 0.27]} rotation={[0, 0, -0.18]} castShadow>
          <meshBasicMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>

        {/* Cheek blushes */}
        <mesh position={[-0.18, 1.46, 0.26]}>
          <circleGeometry args={[0.052, 10]} />
          <meshBasicMaterial color="#f0a090" transparent opacity={transparent ? 0 : 0.32} />
        </mesh>
        <mesh position={[0.18, 1.46, 0.26]}>
          <circleGeometry args={[0.052, 10]} />
          <meshBasicMaterial color="#f0a090" transparent opacity={transparent ? 0 : 0.32} />
        </mesh>

        {/* Left eye */}
        <mesh position={[-0.11, 1.55, 0.26]} castShadow>
          <sphereGeometry args={[0.060, 12, 12]} />
          <meshBasicMaterial color="white" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[-0.11, 1.55, 0.312]}>
          <circleGeometry args={[0.040, 12]} />
          <meshBasicMaterial color={eyeColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[-0.11, 1.55, 0.318]}>
          <circleGeometry args={[0.022, 10]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[-0.095, 1.564, 0.322]}>
          <circleGeometry args={[0.008, 8]} />
          <meshBasicMaterial color="white" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>

        {/* Right eye */}
        <mesh position={[0.11, 1.55, 0.26]} castShadow>
          <sphereGeometry args={[0.060, 12, 12]} />
          <meshBasicMaterial color="white" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[0.11, 1.55, 0.312]}>
          <circleGeometry args={[0.040, 12]} />
          <meshBasicMaterial color={eyeColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[0.11, 1.55, 0.318]}>
          <circleGeometry args={[0.022, 10]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[0.125, 1.564, 0.322]}>
          <circleGeometry args={[0.008, 8]} />
          <meshBasicMaterial color="white" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>

        {/* Hair */}
        <RoundedBox args={[0.56, 0.14, 0.52]} radius={0.09} smoothness={4} position={[0, 1.80, -0.02]} castShadow>
          <meshToonMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>
        <RoundedBox args={[0.12, 0.20, 0.48]} radius={0.07} smoothness={3} position={[-0.28, 1.72, -0.02]} castShadow>
          <meshToonMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>
        <RoundedBox args={[0.12, 0.20, 0.48]} radius={0.07} smoothness={3} position={[0.28, 1.72, -0.02]} castShadow>
          <meshToonMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>

        {/* Smile */}
        <mesh position={[0, 1.41, 0.295]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.068, 0.013, 6, 14, Math.PI]} />
          <meshBasicMaterial color="#c07060" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
      </group>

      {/* Hands — round mitts, animated */}
      <mesh ref={leftHandRef} position={[-0.40, 0.80, -0.06]} castShadow>
        <sphereGeometry args={[0.095, 12, 12]} />
        <meshToonMaterial color={skinColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      <mesh ref={rightHandRef} position={[0.40, 0.80, -0.06]} castShadow>
        <sphereGeometry args={[0.095, 12, 12]} />
        <meshToonMaterial color={skinColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>

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
