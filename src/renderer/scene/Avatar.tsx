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
};

export function Avatar({ position, color, rotationY = 0, isIdle, isTyping, transparent = false }: Props) {
  const bodyOpacity = transparent ? 0.12 : 1;
  const skinOpacity = transparent ? 0.08 : 1;
  const leftHandRef = useRef<THREE.Mesh>(null);
  const rightHandRef = useRef<THREE.Mesh>(null);

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
  });

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* Chair seat — behind the character */}
      <RoundedBox args={[0.72, 0.18, 0.72]} radius={0.12} smoothness={4} position={[0, 0.38, -0.10]} castShadow>
        <meshToonMaterial color="#f4efe7" transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>
      {/* Chair back */}
      <RoundedBox args={[0.72, 0.78, 0.12]} radius={0.08} smoothness={4} position={[0, 0.84, -0.42]} castShadow>
        <meshToonMaterial color="#f4efe7" transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>
      {/* Torso — lowered to sit properly on chair */}
      <mesh position={[0, 0.92, 0.30]} castShadow>
        <capsuleGeometry args={[0.29, 0.42, 6, 12]} />
        <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </mesh>
      {/* Head */}
      <mesh position={[0, 1.52, 0.32]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshToonMaterial color="#f4c9a0" transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      {/* Eyes */}
      <mesh position={[-0.09, 1.56, 0.52]} castShadow>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial color="#2a3448" transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      <mesh position={[0.09, 1.56, 0.52]} castShadow>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial color="#2a3448" transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      {/* Hands — animated via useFrame */}
      <mesh ref={leftHandRef} position={[-0.34, 0.80, 0.18]} castShadow>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshToonMaterial color="#f4c9a0" transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      <mesh ref={rightHandRef} position={[0.34, 0.80, 0.18]} castShadow>
        <sphereGeometry args={[0.09, 12, 12]} />
        <meshToonMaterial color="#f4c9a0" transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      {isIdle && (
        <Float speed={1.2} floatIntensity={0.18} rotationIntensity={0.08}>
          <mesh position={[0, 1.96, 0.32]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#9ec7ff" />
          </mesh>
        </Float>
      )}
    </group>
  );
}
