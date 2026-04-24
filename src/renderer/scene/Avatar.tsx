type Props = {
  position: [number, number, number];
  color: string;
  rotationY?: number;
  isIdle?: boolean;
};

export function Avatar({ position, color, rotationY = 0, isIdle }: Props) {
  return (
    <group position={position} rotation={[0, rotationY, 0]}>
      {/* seated body */}
      <mesh position={[0, 1.1, 0.3]}>
        <capsuleGeometry args={[0.28, 0.4, 6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
      {/* head */}
      <mesh position={[0, 1.7, 0.3]}>
        <sphereGeometry args={[0.25, 16, 16]} />
        <meshStandardMaterial color="#f4c9a0" />
      </mesh>
      {/* chair */}
      <mesh position={[0, 0.4, 0.3]}>
        <boxGeometry args={[0.6, 0.1, 0.6]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      <mesh position={[0, 0.9, 0.58]}>
        <boxGeometry args={[0.6, 0.9, 0.05]} />
        <meshStandardMaterial color="#222" />
      </mesh>
      {isIdle && (
        <mesh position={[0, 2.15, 0.3]}>
          <sphereGeometry args={[0.08, 12, 12]} />
          <meshBasicMaterial color="#9ec7ff" />
        </mesh>
      )}
    </group>
  );
}
