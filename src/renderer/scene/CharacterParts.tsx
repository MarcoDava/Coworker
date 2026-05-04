import { RoundedBox } from '@react-three/drei';

export const NPC_SCALE = 1.6;

export function Eye({ x, eyeColor, opacity, depthWrite }: { x: number; eyeColor: string; opacity: number; depthWrite: boolean }) {
  return (
    <group position={[x, 0.095, 0.285]}>
      <mesh scale={[0.78, 1.18, 0.22]} rotation={[0.08, 0, 0]} castShadow>
        <sphereGeometry args={[0.075, 18, 18]} />
        <meshBasicMaterial color="#fff7ed" transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <mesh position={[0, -0.003, 0.022]} scale={[0.68, 1.0, 0.12]} rotation={[0.08, 0, 0]}>
        <sphereGeometry args={[0.047, 16, 16]} />
        <meshBasicMaterial color={eyeColor} transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <mesh position={[0, -0.005, 0.037]} scale={[0.72, 1.0, 0.08]} rotation={[0.08, 0, 0]}>
        <sphereGeometry args={[0.026, 12, 12]} />
        <meshBasicMaterial color="#171426" transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <mesh position={[0.014, 0.020, 0.047]}>
        <circleGeometry args={[0.010, 10]} />
        <meshBasicMaterial color="#fffdfa" transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <mesh position={[-0.010, -0.025, 0.046]}>
        <circleGeometry args={[0.005, 8]} />
        <meshBasicMaterial color="#fffdfa" transparent opacity={opacity * 0.62} depthWrite={depthWrite} />
      </mesh>
    </group>
  );
}

export function Hair({ color, opacity, depthWrite }: { color: string; opacity: number; depthWrite: boolean }) {
  return (
    <group>
      <mesh position={[0, 0.315, -0.055]} scale={[1.08, 0.48, 0.9]} castShadow>
        <sphereGeometry args={[0.30, 20, 20]} />
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <mesh position={[0, 0.17, -0.205]} scale={[0.92, 0.82, 0.58]} rotation={[-0.08, 0, 0]} castShadow>
        <sphereGeometry args={[0.24, 18, 18]} />
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <RoundedBox args={[0.42, 0.16, 0.14]} radius={0.065} smoothness={4} position={[0, 0.035, -0.225]} rotation={[-0.08, 0, 0]} castShadow>
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </RoundedBox>
      <mesh position={[-0.245, 0.135, -0.13]} scale={[0.36, 0.72, 0.62]} rotation={[0.02, 0.12, 0.10]} castShadow>
        <sphereGeometry args={[0.20, 16, 16]} />
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <mesh position={[0.245, 0.135, -0.13]} scale={[0.36, 0.72, 0.62]} rotation={[0.02, -0.12, -0.10]} castShadow>
        <sphereGeometry args={[0.20, 16, 16]} />
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <RoundedBox args={[0.48, 0.14, 0.24]} radius={0.08} smoothness={4} position={[0, 0.31, 0.13]} rotation={[-0.18, 0, 0]} castShadow>
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.16, 0.18]} radius={0.07} smoothness={4} position={[-0.18, 0.245, 0.19]} rotation={[-0.22, 0, -0.28]} castShadow>
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.17, 0.18]} radius={0.08} smoothness={4} position={[0.02, 0.235, 0.205]} rotation={[-0.28, 0, 0.05]} castShadow>
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </RoundedBox>
      <RoundedBox args={[0.16, 0.16, 0.18]} radius={0.07} smoothness={4} position={[0.20, 0.245, 0.18]} rotation={[-0.22, 0, 0.30]} castShadow>
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </RoundedBox>
      <mesh position={[-0.29, 0.16, -0.02]} scale={[0.36, 0.72, 0.62]} rotation={[0, 0.03, 0.08]} castShadow>
        <sphereGeometry args={[0.20, 16, 16]} />
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <mesh position={[0.29, 0.16, -0.02]} scale={[0.36, 0.72, 0.62]} rotation={[0, -0.03, -0.08]} castShadow>
        <sphereGeometry args={[0.20, 16, 16]} />
        <meshToonMaterial color={color} transparent opacity={opacity} depthWrite={depthWrite} />
      </mesh>
      <mesh position={[0, 0.365, -0.03]} scale={[0.82, 0.2, 0.58]}>
        <sphereGeometry args={[0.26, 16, 16]} />
        <meshToonMaterial color="#fff2d4" transparent opacity={opacity * 0.12} depthWrite={false} />
      </mesh>
    </group>
  );
}
