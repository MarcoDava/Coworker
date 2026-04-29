import { Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
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
};

export function Avatar({ position, color, rotationY = 0, isIdle, isTyping, transparent = false, skinColor = '{skinColor}', hairColor = '#3a2010' }: Props) {
  const bodyOpacity = transparent ? 0.12 : 1;
  const skinOpacity = transparent ? 0.08 : 1;
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);
  const headGroupRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const lh = leftHandRef.current;
    const rh = rightHandRef.current;
    if (!lh || !rh) return;
    if (isTyping) {
      lh.position.y = THREE.MathUtils.lerp(lh.position.y, 0.88 + Math.sin(t * 9) * 0.04, 0.18);
      rh.position.y = THREE.MathUtils.lerp(rh.position.y, 0.88 + Math.sin(t * 9 + Math.PI) * 0.04, 0.18);
      lh.position.z = THREE.MathUtils.lerp(lh.position.z, 0.76, 0.12);
      rh.position.z = THREE.MathUtils.lerp(rh.position.z, 0.76, 0.12);
    } else {
      lh.position.y = THREE.MathUtils.lerp(lh.position.y, 0.80, 0.08);
      rh.position.y = THREE.MathUtils.lerp(rh.position.y, 0.80, 0.08);
      lh.position.z = THREE.MathUtils.lerp(lh.position.z, 0.18, 0.08);
      rh.position.z = THREE.MathUtils.lerp(rh.position.z, 0.18, 0.08);
    }

    const hg = headGroupRef.current;
    if (hg) {
      hg.position.y = THREE.MathUtils.lerp(hg.position.y, Math.sin(t * 1.6) * 0.016, 0.06);
      hg.rotation.z = THREE.MathUtils.lerp(hg.rotation.z, Math.sin(t * 0.85) * 0.022, 0.06);
    }
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Chair seat — bright teal, Rec Room style */}
      <RoundedBox args={[0.76, 0.18, 0.72]} radius={0.12} smoothness={4} position={[0, 0.38, -0.10]} castShadow>
        <meshToonMaterial color="#22aacc" transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>
      {/* Chair back */}
      <RoundedBox args={[0.76, 0.80, 0.12]} radius={0.10} smoothness={4} position={[0, 0.84, -0.42]} castShadow>
        <meshToonMaterial color="#22aacc" transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>
      {/* Chair legs */}
      {([-0.32, 0.32] as number[]).map((x) =>
        ([0.20, -0.40] as number[]).map((z) => (
          <mesh key={`${x}-${z}`} position={[x, 0.16, z]}>
            <cylinderGeometry args={[0.025, 0.025, 0.32, 6]} />
            <meshToonMaterial color="#1888aa" transparent opacity={bodyOpacity} depthWrite={!transparent} />
          </mesh>
        ))
      )}

      {/* Body outline (backface cel-shading) */}
      {!transparent && (
        <RoundedBox args={[0.58, 0.50, 0.48]} radius={0.19} smoothness={4} position={[0, 0.88, 0.24]}>
          <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
        </RoundedBox>
      )}
      {/* Body — puffy Rec Room barrel */}
      <RoundedBox args={[0.54, 0.46, 0.44]} radius={0.18} smoothness={4} position={[0, 0.88, 0.24]} castShadow>
        <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>

      {/* Arms — stubby capsules, same color as body */}
      <mesh position={[-0.36, 0.90, 0.24]} rotation={[0, 0, 0.32]} castShadow>
        <capsuleGeometry args={[0.072, 0.22, 4, 8]} />
        <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </mesh>
      <mesh position={[0.36, 0.90, 0.24]} rotation={[0, 0, -0.32]} castShadow>
        <capsuleGeometry args={[0.072, 0.22, 4, 8]} />
        <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </mesh>

      {/* Head group — gently bobs idle */}
      <group ref={headGroupRef}>
        {/* Head outline */}
        {!transparent && (
          <mesh position={[0, 1.52, 0.26]}>
            <sphereGeometry args={[0.315, 18, 18]} />
            <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
          </mesh>
        )}
        {/* Head — large sphere, Rec Room proportions */}
        <mesh position={[0, 1.52, 0.26]} castShadow>
          <sphereGeometry args={[0.30, 18, 18]} />
          <meshToonMaterial color={skinColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>

        {/* Eyebrows — thick, Rec Room cartoon style */}
        <RoundedBox args={[0.10, 0.025, 0.04]} radius={0.012} smoothness={3} position={[-0.11, 1.64, 0.51]} rotation={[0, 0, 0.18]} castShadow>
          <meshBasicMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>
        <RoundedBox args={[0.10, 0.025, 0.04]} radius={0.012} smoothness={3} position={[0.11, 1.64, 0.51]} rotation={[0, 0, -0.18]} castShadow>
          <meshBasicMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>

        {/* Cheek blushes */}
        <mesh position={[-0.18, 1.46, 0.50]}>
          <circleGeometry args={[0.052, 10]} />
          <meshBasicMaterial color="#f0a090" transparent opacity={transparent ? 0 : 0.32} />
        </mesh>
        <mesh position={[0.18, 1.46, 0.50]}>
          <circleGeometry args={[0.052, 10]} />
          <meshBasicMaterial color="#f0a090" transparent opacity={transparent ? 0 : 0.32} />
        </mesh>

        {/* Left eye: white sclera → colored iris → dark pupil → white highlight */}
        <mesh position={[-0.11, 1.55, 0.50]} castShadow>
          <sphereGeometry args={[0.060, 12, 12]} />
          <meshBasicMaterial color="white" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[-0.11, 1.55, 0.552]}>
          <circleGeometry args={[0.040, 12]} />
          <meshBasicMaterial color="#3a88cc" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[-0.11, 1.55, 0.558]}>
          <circleGeometry args={[0.022, 10]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[-0.095, 1.564, 0.562]}>
          <circleGeometry args={[0.008, 8]} />
          <meshBasicMaterial color="white" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>

        {/* Right eye */}
        <mesh position={[0.11, 1.55, 0.50]} castShadow>
          <sphereGeometry args={[0.060, 12, 12]} />
          <meshBasicMaterial color="white" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[0.11, 1.55, 0.552]}>
          <circleGeometry args={[0.040, 12]} />
          <meshBasicMaterial color="#3a88cc" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[0.11, 1.55, 0.558]}>
          <circleGeometry args={[0.022, 10]} />
          <meshBasicMaterial color="#1a1a2e" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
        <mesh position={[0.125, 1.564, 0.562]}>
          <circleGeometry args={[0.008, 8]} />
          <meshBasicMaterial color="white" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>

        {/* Hair — flat rounded top, Rec Room cartoon style */}
        <RoundedBox args={[0.56, 0.14, 0.52]} radius={0.09} smoothness={4} position={[0, 1.80, 0.22]} castShadow>
          <meshToonMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>
        {/* Hair side bulge left */}
        <RoundedBox args={[0.12, 0.20, 0.48]} radius={0.07} smoothness={3} position={[-0.28, 1.72, 0.22]} castShadow>
          <meshToonMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>
        {/* Hair side bulge right */}
        <RoundedBox args={[0.12, 0.20, 0.48]} radius={0.07} smoothness={3} position={[0.28, 1.72, 0.22]} castShadow>
          <meshToonMaterial color={hairColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
        </RoundedBox>

        {/* Smile arc — torusGeometry rotated to face forward, flipped to ∪ shape */}
        <mesh position={[0, 1.41, 0.535]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.068, 0.013, 6, 14, Math.PI]} />
          <meshBasicMaterial color="#c07060" transparent opacity={skinOpacity} depthWrite={!transparent} />
        </mesh>
      </group>

      {/* Hands — round mitts, animated */}
      <mesh ref={leftHandRef} position={[-0.40, 0.80, 0.18]} castShadow>
        <sphereGeometry args={[0.095, 12, 12]} />
        <meshToonMaterial color={skinColor} transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      <mesh ref={rightHandRef} position={[0.40, 0.80, 0.18]} castShadow>
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
