import { useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';

type Props = {
  /** World position of the laptop this tree sits beside. */
  laptopPosition: [number, number, number];
  /** 0 → seedling, 1 → fully grown. */
  growth: number;
  /** When true, leaves desaturate + droop (paused / peer idle / slacker). */
  withered?: boolean;
  /** Side: tree placed +x from laptop by default; flip with -1 for left-side. */
  side?: 1 | -1;
};

const POT_RADIUS = 0.10;
const POT_HEIGHT = 0.12;
const DESK_TOP_Y = 0.80;
const STEM_MIN = 0.05;
const STEM_MAX = 0.55;
const LEAF_BASE_R = 0.02;
const LEAF_GROWN_R = 0.13;

const HEALTHY = new THREE.Color('#7ec97a');
const WILTED  = new THREE.Color('#9ab088');

export function FocusTree({ laptopPosition, growth, withered = false, side = 1 }: Props) {
  const stemRef = useRef<THREE.Mesh>(null);
  const canopyRef = useRef<THREE.Group>(null);
  const leafColorRef = useRef(new THREE.Color());
  const leafMatRefs = useRef<THREE.MeshToonMaterial[]>([]);

  // Anchor: desk surface, +x of laptop body (laptop body half-width ≈ 0.62, pot radius 0.10)
  const x = laptopPosition[0] + side * 0.78;
  const z = laptopPosition[2] - 0.10;

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const g = THREE.MathUtils.clamp(growth, 0, 1);
    const stemHeight = STEM_MIN + (STEM_MAX - STEM_MIN) * g;
    const leafR = LEAF_BASE_R + (LEAF_GROWN_R - LEAF_BASE_R) * g;

    if (stemRef.current) {
      stemRef.current.scale.y = stemHeight / 0.4;
      stemRef.current.position.y = DESK_TOP_Y + POT_HEIGHT * 0.5 + stemHeight * 0.5;
    }
    if (canopyRef.current) {
      const sway = withered ? 0 : Math.sin(t * 1.2) * 0.04;
      canopyRef.current.position.y = DESK_TOP_Y + POT_HEIGHT + stemHeight + leafR * 0.5;
      canopyRef.current.rotation.z = withered ? -0.18 : sway;
      canopyRef.current.scale.setScalar(THREE.MathUtils.lerp(0.4, 1, g));
    }

    leafColorRef.current.copy(withered ? WILTED : HEALTHY);
    leafMatRefs.current.forEach((m) => {
      if (m) m.color.lerp(leafColorRef.current, 0.05);
    });
  });

  const leafPositions: [number, number, number][] = [
    [0, 0, 0],
    [-0.075, 0.04, 0.02],
    [0.075, 0.04, -0.02],
    [0.02, -0.05, 0.06],
    [-0.04, -0.04, -0.05],
  ];

  return (
    <group position={[x, 0, z]}>
      {/* Pot */}
      <mesh position={[0, DESK_TOP_Y + POT_HEIGHT * 0.5, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[POT_RADIUS, POT_RADIUS * 0.78, POT_HEIGHT, 14]} />
        <meshToonMaterial color="#9c6a48" />
      </mesh>
      {/* Soil cap */}
      <mesh position={[0, DESK_TOP_Y + POT_HEIGHT - 0.005, 0]}>
        <cylinderGeometry args={[POT_RADIUS * 0.94, POT_RADIUS * 0.94, 0.012, 14]} />
        <meshToonMaterial color="#3a2614" />
      </mesh>
      {/* Stem (scale-y animates) */}
      <mesh ref={stemRef} castShadow>
        <cylinderGeometry args={[0.012, 0.018, 0.4, 6]} />
        <meshToonMaterial color="#5a3c20" />
      </mesh>
      {/* Canopy */}
      <group ref={canopyRef}>
        {leafPositions.map(([lx, ly, lz], i) => (
          <mesh key={i} position={[lx, ly, lz]} castShadow>
            <sphereGeometry args={[LEAF_GROWN_R, 8, 8]} />
            <meshToonMaterial
              ref={(m) => { if (m) leafMatRefs.current[i] = m; }}
              color={HEALTHY}
            />
          </mesh>
        ))}
      </group>
    </group>
  );
}
