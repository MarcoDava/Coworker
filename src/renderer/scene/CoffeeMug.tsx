import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

type Props = {
  /** Laptop world position. Mug placed on the opposite side of the FocusTree. */
  laptopPosition: [number, number, number];
  /** Tint of the ceramic body. */
  color?: string;
  /** Side: -1 places mug on the laptop's left side (FocusTree defaults to right). */
  side?: 1 | -1;
};

const DESK_TOP_Y = 0.80;
const MUG_RADIUS = 0.07;
const MUG_HEIGHT = 0.11;
const STEAM_COUNT = 5;
const STEAM_RISE = 0.45;
const STEAM_PERIOD = 4.0;

export function CoffeeMug({ laptopPosition, color = '#f7f4ef', side = -1 }: Props) {
  const x = laptopPosition[0] + side * 0.78;
  const z = laptopPosition[2] - 0.05;

  const steamGroupRef = useRef<THREE.Group>(null);
  const steamRefs = useRef<THREE.Mesh[]>([]);
  // Per-particle phase offsets so they don't all rise in sync.
  const offsets = useMemo(() => Array.from({ length: STEAM_COUNT }, (_, i) => i / STEAM_COUNT), []);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    steamRefs.current.forEach((m, i) => {
      if (!m) return;
      const phase = ((t / STEAM_PERIOD) + offsets[i]) % 1;
      const rise = phase * STEAM_RISE;
      const wobble = Math.sin(t * 1.6 + i) * 0.025;
      m.position.y = MUG_HEIGHT + rise;
      m.position.x = wobble;
      m.position.z = Math.cos(t * 1.3 + i * 0.7) * 0.022;
      // Fade-in then fade-out.
      const alpha = phase < 0.2 ? phase / 0.2 : phase > 0.7 ? (1 - phase) / 0.3 : 1;
      const mat = m.material as THREE.MeshBasicMaterial;
      mat.opacity = alpha * 0.32;
      m.scale.setScalar(THREE.MathUtils.lerp(0.4, 1.2, phase));
    });
  });

  return (
    <group position={[x, DESK_TOP_Y, z]}>
      {/* Mug body */}
      <mesh position={[0, MUG_HEIGHT * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[MUG_RADIUS, MUG_RADIUS * 0.92, MUG_HEIGHT, 16]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Coffee surface */}
      <mesh position={[0, MUG_HEIGHT - 0.012, 0]}>
        <cylinderGeometry args={[MUG_RADIUS * 0.85, MUG_RADIUS * 0.85, 0.008, 16]} />
        <meshBasicMaterial color="#3a2410" />
      </mesh>
      {/* Handle (torus segment, half ring on +x side) */}
      <mesh position={[MUG_RADIUS + 0.01, MUG_HEIGHT * 0.5, 0]} rotation={[0, 0, Math.PI / 2]}>
        <torusGeometry args={[0.035, 0.012, 6, 12, Math.PI]} />
        <meshToonMaterial color={color} />
      </mesh>
      {/* Steam particles */}
      <group ref={steamGroupRef}>
        {offsets.map((_, i) => (
          <mesh
            key={i}
            ref={(m) => { if (m) steamRefs.current[i] = m; }}
          >
            <sphereGeometry args={[0.025, 6, 6]} />
            <meshBasicMaterial color="#ffffff" transparent opacity={0.0} depthWrite={false} />
          </mesh>
        ))}
      </group>
    </group>
  );
}
