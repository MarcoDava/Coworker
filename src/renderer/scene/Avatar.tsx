import { Float, RoundedBox } from '@react-three/drei';

type Props = {
  position: [number, number, number];
  color: string;
  rotationY?: number;
  isIdle?: boolean;
  transparent?: boolean;
};

export function Avatar({ position, color, rotationY = 0, isIdle, transparent = false }: Props) {
  const bodyOpacity = transparent ? 0.12 : 1;
  const skinOpacity = transparent ? 0.08 : 1;

  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      <RoundedBox args={[0.72, 0.18, 0.72]} radius={0.12} smoothness={4} position={[0, 0.36, 0.28]} castShadow>
        <meshToonMaterial color="#f4efe7" transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>
      <RoundedBox args={[0.72, 0.78, 0.12]} radius={0.08} smoothness={4} position={[0, 0.82, 0.56]} castShadow>
        <meshToonMaterial color="#f4efe7" transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </RoundedBox>
      <mesh position={[0, 1.1, 0.26]} castShadow>
        <capsuleGeometry args={[0.29, 0.42, 6, 12]} />
        <meshToonMaterial color={color} transparent opacity={bodyOpacity} depthWrite={!transparent} />
      </mesh>
      <mesh position={[0, 1.72, 0.3]} castShadow>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshToonMaterial color="#f4c9a0" transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      <mesh position={[-0.09, 1.76, 0.51]} castShadow>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial color="#2a3448" transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      <mesh position={[0.09, 1.76, 0.51]} castShadow>
        <sphereGeometry args={[0.03, 10, 10]} />
        <meshBasicMaterial color="#2a3448" transparent opacity={skinOpacity} depthWrite={!transparent} />
      </mesh>
      {isIdle && (
        <Float speed={1.2} floatIntensity={0.18} rotationIntensity={0.08}>
          <mesh position={[0, 2.16, 0.3]}>
            <sphereGeometry args={[0.08, 12, 12]} />
            <meshBasicMaterial color="#9ec7ff" />
          </mesh>
        </Float>
      )}
    </group>
  );
}
