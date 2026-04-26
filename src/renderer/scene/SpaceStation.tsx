import { ContactShadows, Environment, Float, Mask, RoundedBox, useMask } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function StarDiorama({ maskId }: { maskId: number }) {
  const stencil = useMask(maskId);
  const stars = useMemo(
    () =>
      Array.from({ length: 55 }, (_, i) => ({
        x: -0.5 + ((i * 13) % 20) * 0.053,
        y: -0.5 + ((i * 9) % 20) * 0.053,
        r: 0.006 + (i % 4) * 0.003,
        bright: i % 8 === 0,
      })),
    []
  );
  return (
    <group>
      {/* Deep space background */}
      <mesh position={[0, 0, 0.06]}>
        <planeGeometry args={[1.1, 1.1]} />
        <meshBasicMaterial color="#040710" {...stencil} />
      </mesh>
      {/* Nebula warp */}
      <mesh position={[-0.1, 0.08, 0.062]}>
        <circleGeometry args={[0.38, 24]} />
        <meshBasicMaterial color="#100828" transparent opacity={0.9} {...stencil} />
      </mesh>
      {/* Distant planet */}
      <mesh position={[0.22, 0.18, 0.063]}>
        <circleGeometry args={[0.11, 32]} />
        <meshBasicMaterial color="#2a4060" {...stencil} />
      </mesh>
      <mesh position={[0.2, 0.2, 0.064]}>
        <circleGeometry args={[0.08, 32]} />
        <meshBasicMaterial color="#3a5578" {...stencil} />
      </mesh>
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0.065]}>
          <circleGeometry args={[s.r, 6]} />
          <meshBasicMaterial color={s.bright ? '#fff8e8' : '#aac0f8'} {...stencil} />
        </mesh>
      ))}
    </group>
  );
}

function Porthole({ position, maskId }: { position: [number, number, number]; maskId: number }) {
  return (
    <group position={position}>
      {/* Outer hull ring */}
      <mesh>
        <torusGeometry args={[0.52, 0.1, 8, 32]} />
        <meshToonMaterial color="#4a5a6a" />
      </mesh>
      {/* Bolt ring */}
      <mesh position={[0, 0, 0.05]}>
        <torusGeometry args={[0.44, 0.03, 6, 24]} />
        <meshToonMaterial color="#3a4a58" />
      </mesh>
      <Mask id={maskId} position={[0, 0, 0.07]}>
        <circleGeometry args={[0.42, 32]} />
      </Mask>
      <StarDiorama maskId={maskId} />
      {/* Glass tint */}
      <mesh position={[0, 0, 0.09]}>
        <circleGeometry args={[0.42, 32]} />
        <meshBasicMaterial color="#3060a0" transparent opacity={0.08} />
      </mesh>
      <pointLight position={[0, 0, 0.4]} intensity={0.25} distance={2.5} color="#5070c0" />
    </group>
  );
}

function MaintenanceDrone() {
  const groupRef = useRef<THREE.Group>(null);
  const clawRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const sw = Math.sin(t * 0.42);
    g.position.x = sw * 3.0;
    g.position.y = 3.3 + Math.sin(t * 1.7) * 0.09;
    g.position.z = -4.3 + Math.cos(t * 0.55) * 0.2;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, sw > 0 ? -0.4 : 0.4, 0.07);
    if (clawRef.current) clawRef.current.rotation.z = Math.sin(t * 2.8) * 0.25;
  });

  return (
    <group ref={groupRef} position={[0, 3.3, -4.3]}>
      <Float speed={1.4} floatIntensity={0.14} rotationIntensity={0.1}>
        <RoundedBox args={[0.36, 0.2, 0.28]} radius={0.07} smoothness={4} castShadow>
          <meshToonMaterial color="#5a6a7a" />
        </RoundedBox>
        {/* Visor */}
        <mesh position={[0, 0.02, 0.15]}>
          <planeGeometry args={[0.2, 0.09]} />
          <meshBasicMaterial color="#0a1828" />
        </mesh>
        <mesh position={[0, 0.02, 0.155]}>
          <planeGeometry args={[0.16, 0.055]} />
          <meshBasicMaterial color="#38d8f0" transparent opacity={0.65} />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.22, 0, 0]} rotation={[0, 0, -0.6]} castShadow>
          <capsuleGeometry args={[0.025, 0.18, 6, 8]} />
          <meshToonMaterial color="#48596a" />
        </mesh>
        <mesh ref={clawRef} position={[-0.35, -0.1, 0]} castShadow>
          <capsuleGeometry args={[0.018, 0.1, 4, 6]} />
          <meshToonMaterial color="#38d8f0" />
        </mesh>
        <mesh position={[0.22, 0, 0]} rotation={[0, 0, 0.6]} castShadow>
          <capsuleGeometry args={[0.025, 0.18, 6, 8]} />
          <meshToonMaterial color="#48596a" />
        </mesh>
        {/* Thruster pods */}
        {([-0.12, 0.12] as const).map((x) => (
          <mesh key={x} position={[x, -0.14, 0]} castShadow>
            <cylinderGeometry args={[0.035, 0.045, 0.09, 8]} />
            <meshToonMaterial color="#4a5a6a" />
          </mesh>
        ))}
      </Float>
      <pointLight intensity={0.45} distance={2.5} color="#38d8f0" />
    </group>
  );
}

export function SpaceStation() {
  return (
    <>
      <color attach="background" args={['#090c14']} />
      <fog attach="fog" args={['#090c14', 9, 20]} />
      <Environment preset="night" />
      <ambientLight intensity={0.28} color="#5070b0" />
      <directionalLight
        position={[3, 5, 4]}
        intensity={0.75}
        color="#8ab0ff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 2, -1]} intensity={0.18} color="#38d8f0" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.55} scale={11} blur={2.2} far={4.5} color="#1a2840" />

      {/* Floor — metal grating */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshToonMaterial color="#181e2a" />
      </mesh>
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.5 + i * 1.0]}>
          <planeGeometry args={[24, 0.025]} />
          <meshBasicMaterial color="#28384c" transparent opacity={0.55} />
        </mesh>
      ))}

      {/* LED floor strips */}
      {([
        [0, 0.012, -0.7],
        [0, 0.012, -3.8],
      ] as [number, number, number][]).map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <boxGeometry args={[5.5, 0.02, 0.04]} />
            <meshBasicMaterial color="#38d8f0" />
          </mesh>
          <pointLight intensity={0.14} distance={2.5} color="#38d8f0" />
        </group>
      ))}
      {([
        [-3.1, 0.012, -2.1],
        [3.1, 0.012, -2.1],
      ] as [number, number, number][]).map((pos, i) => (
        <group key={i} position={pos}>
          <mesh>
            <boxGeometry args={[0.04, 0.02, 3.0]} />
            <meshBasicMaterial color="#38d8f0" />
          </mesh>
          <pointLight intensity={0.14} distance={2.5} color="#38d8f0" />
        </group>
      ))}

      {/* Back wall */}
      <RoundedBox args={[15.5, 6.2, 0.5]} radius={0.22} smoothness={4} position={[0, 3.1, -6]} receiveShadow>
        <meshToonMaterial color="#161c28" />
      </RoundedBox>
      {[-5.5, -2.8, 0, 2.8, 5.5].map((x, i) => (
        <group key={i} position={[x, 3.0, -5.72]}>
          <RoundedBox args={[2.2, 5.6, 0.07]} radius={0.05} smoothness={3}>
            <meshToonMaterial color="#1e2838" />
          </RoundedBox>
          <mesh position={[0, 0, 0.04]}>
            <boxGeometry args={[2.1, 0.03, 0.02]} />
            <meshToonMaterial color="#2a3848" />
          </mesh>
        </group>
      ))}
      {/* Wainscoting */}
      <RoundedBox args={[15.1, 1.6, 0.18]} radius={0.12} smoothness={3} position={[0, 0.9, -5.7]}>
        <meshToonMaterial color="#1a2232" />
      </RoundedBox>

      {/* Side walls */}
      {[-7.2, 7.2].map((x) => (
        <RoundedBox key={x} args={[0.42, 6, 11.6]} radius={0.2} smoothness={4} position={[x, 3, -0.35]} receiveShadow>
          <meshToonMaterial color="#161c28" />
        </RoundedBox>
      ))}

      {/* Equipment racks on side walls */}
      {[-6.7, 6.7].map((x) => (
        <group key={x} position={[x > 0 ? x - 0.15 : x + 0.15, 2.5, -3.2]}>
          <RoundedBox args={[0.22, 2.8, 1.4]} radius={0.06} smoothness={3} castShadow>
            <meshToonMaterial color="#202c3c" />
          </RoundedBox>
          {([0.8, 0.4, 0, -0.4, -0.8] as const).map((y, j) => (
            <mesh key={j} position={[x > 0 ? -0.1 : 0.1, y, 0]}>
              <boxGeometry args={[0.015, 0.1, 1.1]} />
              <meshBasicMaterial color={j % 2 === 0 ? '#38d8f0' : '#ff5050'} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ceiling */}
      <RoundedBox args={[15.2, 0.5, 11.8]} radius={0.22} smoothness={4} position={[0, 6.1, -0.2]}>
        <meshToonMaterial color="#121620" />
      </RoundedBox>
      {/* Ceiling conduits */}
      {[-3.5, 0, 3.5].map((x) => (
        <mesh key={x} position={[x, 5.87, -2.5]}>
          <boxGeometry args={[0.14, 0.12, 9.5]} />
          <meshToonMaterial color="#202c3c" />
        </mesh>
      ))}

      {/* Porthole windows */}
      <Porthole position={[-2.8, 3.2, -5.7]} maskId={1} />
      <Porthole position={[2.8, 3.2, -5.7]} maskId={2} />

      {/* Desk */}
      <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.8, -2.1]} castShadow receiveShadow>
        <meshToonMaterial color="#202c3c" />
      </RoundedBox>
      {[-2.75, 2.75].map((x) => (
        <RoundedBox key={x} args={[0.22, 0.72, 1.3]} radius={0.08} smoothness={4} position={[x, 0.4, -2.1]} castShadow>
          <meshToonMaterial color="#1a2230" />
        </RoundedBox>
      ))}

      {/* Work zone mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -2.7]} receiveShadow>
        <planeGeometry args={[7.4, 4.4]} />
        <meshBasicMaterial color="#1e2c40" transparent opacity={0.65} />
      </mesh>

      {/* Storage container */}
      <RoundedBox args={[1.5, 0.75, 0.65]} radius={0.08} smoothness={3} position={[0, 0.375, -4.7]} castShadow>
        <meshToonMaterial color="#1e2c3a" />
      </RoundedBox>
      <mesh position={[0, 0.45, -4.38]}>
        <boxGeometry args={[0.8, 0.05, 0.02]} />
        <meshToonMaterial color="#38d8f0" />
      </mesh>

      <MaintenanceDrone />
    </>
  );
}
