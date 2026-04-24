import { Environment } from '@react-three/drei';

export function Library() {
  return (
    <>
      <Environment preset="apartment" />
      <ambientLight intensity={0.4} />
      <directionalLight position={[5, 8, 5]} intensity={0.6} castShadow />
      {/* floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#3a2a1e" />
      </mesh>
      {/* back wall */}
      <mesh position={[0, 3, -6]}>
        <boxGeometry args={[20, 6, 0.2]} />
        <meshStandardMaterial color="#55402f" />
      </mesh>
      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#2b1e15" />
      </mesh>
      {/* bookshelves flanking */}
      {[-5, 5].map((x) => (
        <mesh key={x} position={[x, 2, -5.5]} castShadow>
          <boxGeometry args={[3, 4, 0.6]} />
          <meshStandardMaterial color="#4a2d1a" />
        </mesh>
      ))}
    </>
  );
}
