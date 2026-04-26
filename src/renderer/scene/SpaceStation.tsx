import { ContactShadows, Environment, Float, Mask, RoundedBox, useMask } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// 3D planets rendered with depthTest:false + stencil so they show only inside the window mask
function SpaceView({ maskId }: { maskId: number }) {
  const stencil = useMask(maskId);
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        x: -2.2 + ((i * 17) % 44) * 0.1,
        y: -1.3 + ((i * 11) % 26) * 0.1,
        r: 0.007 + (i % 5) * 0.003,
        bright: i % 7 === 0,
      })),
    []
  );
  return (
    <group>
      {/* Deep space background — covers the whole window, depth tested */}
      <mesh renderOrder={1}>
        <planeGeometry args={[4.5, 3.2]} />
        <meshBasicMaterial color="#020509" transparent depthWrite={false} {...stencil} />
      </mesh>
      {/* Nebula cloud */}
      <mesh position={[-0.4, 0.3, 0.01]} renderOrder={2}>
        <circleGeometry args={[1.1, 32]} />
        <meshBasicMaterial color="#14083a" transparent opacity={0.82} depthWrite={false} {...stencil} />
      </mesh>
      <mesh position={[0.5, -0.4, 0.01]} renderOrder={2}>
        <circleGeometry args={[0.7, 28]} />
        <meshBasicMaterial color="#08122a" transparent opacity={0.75} depthWrite={false} {...stencil} />
      </mesh>
      {/* Stars */}
      {stars.map((s, i) => (
        <group key={i} position={[s.x, s.y, 0.02]}>
          <mesh renderOrder={3}>
            <circleGeometry args={[s.r, 6]} />
            <meshBasicMaterial color={s.bright ? '#ffffff' : '#eaf0f8'} transparent depthWrite={false} {...stencil} />
          </mesh>
          <pointLight intensity={s.bright ? 0.25 : 0.08} distance={0.6} color={s.bright ? '#ffffff' : '#eaf0f8'} />
        </group>
      ))}

      {/* ── Planet 1: large gas giant, lit by directional light via toonMaterial ── */}
      {/* Atmosphere glow (slightly bigger, transparent) */}
      <mesh position={[0.95, 0.28, 0.06]} renderOrder={4}>
        <sphereGeometry args={[0.72, 28, 28]} />
        <meshBasicMaterial color="#1830a0" transparent opacity={0.22} depthWrite={false} {...stencil} />
      </mesh>
      {/* Planet body — toon shading from scene directional light gives real 3D look */}
      <mesh position={[0.95, 0.28, 0.07]} renderOrder={5}>
        <sphereGeometry args={[0.62, 32, 32]} />
        <meshToonMaterial color="#3a6090" transparent depthWrite={false} {...stencil} />
      </mesh>
      {/* Cloud band */}
      <mesh position={[0.95, 0.18, 0.08]} renderOrder={6}>
        <sphereGeometry args={[0.56, 28, 14]} />
        <meshBasicMaterial color="#5080b0" transparent opacity={0.28} depthWrite={false} {...stencil} />
      </mesh>

      {/* ── Planet 2: smaller desert world ── */}
      <mesh position={[-1.2, -0.22, 0.04]} renderOrder={4}>
        <sphereGeometry args={[0.32, 28, 28]} />
        <meshBasicMaterial color="#301808" transparent opacity={0.18} depthWrite={false} {...stencil} />
      </mesh>
      <mesh position={[-1.2, -0.22, 0.05]} renderOrder={5}>
        <sphereGeometry args={[0.28, 28, 28]} />
        <meshToonMaterial color="#8a5020" transparent depthWrite={false} {...stencil} />
      </mesh>

      {/* ── Moon orbiting planet 1 ── */}
      <mesh position={[1.62, -0.05, 0.06]} renderOrder={5}>
        <sphereGeometry args={[0.22, 18, 18]} />
        <meshToonMaterial color="#d0d8e0" transparent depthWrite={false} {...stencil} />
      </mesh>

      {/* ── Distant tiny planet ── */}
      <mesh position={[-0.3, 0.78, 0.03]} renderOrder={5}>
        <sphereGeometry args={[0.07, 14, 14]} />
        <meshToonMaterial color="#607850" transparent depthWrite={false} {...stencil} />
      </mesh>

      {/* ── Distant station silhouette ── */}
      <mesh position={[-0.8, 0.5, 0.03]} rotation={[0, 0, 0.3]} renderOrder={4}>
        <boxGeometry args={[0.55, 0.03, 0.02]} />
        <meshBasicMaterial color="#304050" transparent depthWrite={false} {...stencil} />
      </mesh>
      <mesh position={[-0.8, 0.5, 0.03]} renderOrder={4}>
        <boxGeometry args={[0.03, 0.18, 0.02]} />
        <meshBasicMaterial color="#304050" transparent depthWrite={false} {...stencil} />
      </mesh>
    </group>
  );
}

function ObservationWindow() {
  return (
    <group position={[0, 2, -7]}>
      {/* Thick frame — four border bars */}
      <mesh position={[0, 2.44, 0]}>
        <boxGeometry args={[7.4, 0.22, 0.16]} />
        <meshToonMaterial color="#384858" />
      </mesh>
      <mesh position={[0, -2.44, 0]}>
        <boxGeometry args={[7.4, 0.22, 0.16]} />
        <meshToonMaterial color="#384858" />
      </mesh>
      <mesh position={[-3.7, 0, 0]}>
        <boxGeometry args={[0.22, 4.88, 0.16]} />
        <meshToonMaterial color="#384858" />
      </mesh>
      <mesh position={[3.7, 0, 0]}>
        <boxGeometry args={[0.22, 4.88, 0.16]} />
        <meshToonMaterial color="#384858" />
      </mesh>
      {/* Centre mullion */}
      <mesh position={[0, 0, 0.09]}>
        <boxGeometry args={[7.12, 0.07, 0.05]} />
        <meshToonMaterial color="#2c3a48" />
      </mesh>
      {/* Stencil mask for the glass opening */}
      <Mask id={1} position={[0, 0, 0.06]}>
        <planeGeometry args={[7.0, 4.56]} />
      </Mask>
      <group scale={2} position={[0, 0, -0.1]}>
        <SpaceView maskId={1} />
      </group>
      {/* Faint glass tint */}
      <mesh position={[0, 0, 0.1]}>
        <planeGeometry args={[7.0, 4.56]} />
        <meshBasicMaterial color="#102850" transparent opacity={0.1} />
      </mesh>
      <pointLight position={[0, 0, 0.6]} intensity={0.18} distance={8} color="#4060c0" />
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
    g.position.x = sw * 2.6;
    g.position.y = 2.8 + Math.sin(t * 1.7) * 0.09;
    g.position.z = -3.0 + Math.cos(t * 0.55) * 0.15;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, sw > 0 ? -0.4 : 0.4, 0.07);
    if (clawRef.current) clawRef.current.rotation.z = Math.sin(t * 2.8) * 0.25;
  });

  return (
    <group ref={groupRef} position={[0, 2.8, -3.0]}>
      <Float speed={1.4} floatIntensity={0.14} rotationIntensity={0.1}>
        <RoundedBox args={[0.36, 0.2, 0.28]} radius={0.07} smoothness={4} castShadow>
          <meshToonMaterial color="#5a6a7a" />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.15]}>
          <planeGeometry args={[0.2, 0.09]} />
          <meshBasicMaterial color="#0a1828" />
        </mesh>
        <mesh position={[0, 0.02, 0.155]}>
          <planeGeometry args={[0.16, 0.055]} />
          <meshBasicMaterial color="#38d8f0" transparent opacity={0.65} />
        </mesh>
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
      <fog attach="fog" args={['#090c14', 7, 14]} />
      <Environment preset="night" />
      <ambientLight intensity={0.25} color="#5070b0" />
      {/* Main light — direction matters because planets use meshToonMaterial */}
      <directionalLight position={[4, 6, 3]} intensity={0.8} color="#8ab0ff" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-3, 2, -1]} intensity={0.15} color="#38d8f0" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.55} scale={9} blur={2.2} far={3.5} color="#1a2840" />

      {/* Floor — metal grating */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 10]} />
        <meshToonMaterial color="#181e2a" />
      </mesh>
      {Array.from({ length: 9 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.3 - i * 0.5]}>
          <planeGeometry args={[16, 0.025]} />
          <meshBasicMaterial color="#28384c" transparent opacity={0.5} />
        </mesh>
      ))}

      {/* LED floor strips */}
      <group position={[0, 0.012, -0.7]}>
        <mesh><boxGeometry args={[5.0, 0.02, 0.04]} /><meshBasicMaterial color="#38d8f0" /></mesh>
        <pointLight intensity={0.12} distance={2.5} color="#38d8f0" />
      </group>
      <group position={[0, 0.012, -3.6]}>
        <mesh><boxGeometry args={[5.0, 0.02, 0.04]} /><meshBasicMaterial color="#38d8f0" /></mesh>
        <pointLight intensity={0.12} distance={2.5} color="#38d8f0" />
      </group>

      {/* Back wall (close) */}
      <RoundedBox args={[14, 5.8, -4.5]} radius={0.2} smoothness={4} position={[0, 2.9, -7.15]} receiveShadow>
        <meshToonMaterial color="#161c28" />
      </RoundedBox>
      {/* Side panel strips flanking the window */}
      {[-5.0, -3.8, 3.8, 5.0].map((x, i) => (
        <RoundedBox key={i} args={[1.0, 5.6, 0.08]} radius={0.04} smoothness={3} position={[x, 2.8, -3.9]}>
          <meshToonMaterial color="#1e2838" />
        </RoundedBox>
      ))}
      {/* Wainscoting */}
      <RoundedBox args={[13.5, 0.9, 0.18]} radius={0.1} smoothness={3} position={[0, 0.55, -3.9]}>
        <meshToonMaterial color="#1a2232" />
      </RoundedBox>

      {/* Side walls */}
      {[-6.5, 6.5].map((x) => (
        <RoundedBox key={x} args={[0.4, 5.8, 9.5]} radius={0.18} smoothness={4} position={[x, 2.9, -0.8]} receiveShadow>
          <meshToonMaterial color="#161c28" />
        </RoundedBox>
      ))}

      {/* Equipment racks */}
      {[-6.1, 6.1].map((x) => (
        <group key={x} position={[x > 0 ? x - 0.12 : x + 0.12, 2.2, -2.5]}>
          <RoundedBox args={[0.2, 2.5, 1.2]} radius={0.05} smoothness={3} castShadow>
            <meshToonMaterial color="#202c3c" />
          </RoundedBox>
          {([0.7, 0.3, -0.1, -0.5] as const).map((y, j) => (
            <mesh key={j} position={[x > 0 ? -0.09 : 0.09, y, 0]}>
              <boxGeometry args={[0.012, 0.09, 0.9]} />
              <meshBasicMaterial color={j % 2 === 0 ? '#38d8f0' : '#ff5050'} />
            </mesh>
          ))}
        </group>
      ))}

      {/* Ceiling */}
      <RoundedBox args={[14, 0.4, 9.8]} radius={0.18} smoothness={4} position={[0, 5.6, -0.8]}>
        <meshToonMaterial color="#121620" />
      </RoundedBox>
      {[-2.5, 0, 2.5].map((x) => (
        <mesh key={x} position={[x, 5.43, -1.5]}>
          <boxGeometry args={[0.12, 0.1, 8]} />
          <meshToonMaterial color="#202c3c" />
        </mesh>
      ))}

      {/* Large observation window */}
      <ObservationWindow />

      {/* Desk — surface at y=0.73 so laptop deck bottom (y=0.80) sits on top */}
      <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.73, -2.1]} castShadow receiveShadow>
        <meshToonMaterial color="#202c3c" />
      </RoundedBox>
      {[-2.75, 2.75].map((x) => (
        <RoundedBox key={x} args={[0.22, 0.6, 1.3]} radius={0.08} smoothness={4} position={[x, 0.30, -2.1]} castShadow>
          <meshToonMaterial color="#1a2230" />
        </RoundedBox>
      ))}

      {/* Work zone mat */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -2.7]} receiveShadow>
        <planeGeometry args={[7.4, 4.4]} />
        <meshBasicMaterial color="#1e2c40" transparent opacity={0.6} />
      </mesh>

      {/* Storage crate */}
      <RoundedBox args={[1.5, 0.75, 0.65]} radius={0.08} smoothness={3} position={[3.0, 0.375, -3.6]} castShadow>
        <meshToonMaterial color="#1e2c3a" />
      </RoundedBox>
      <mesh position={[3.0, 0.45, -3.28]}>
        <boxGeometry args={[0.8, 0.05, 0.02]} />
        <meshToonMaterial color="#38d8f0" />
      </mesh>

      <MaintenanceDrone />
    </>
  );
}
