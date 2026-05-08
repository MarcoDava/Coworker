import { ContactShadows, Environment, RoundedBox, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { Bldg3D, genBuildings, pr } from './CityBuildings';

const CITY_W = 40;
// Buildings generated in train-normalized units then scaled up to world units.
const BSCALE = 8;

function SkyCityLayer({ layer, z, speed, opacity }: {
  layer: 'far' | 'mid' | 'near';
  z: number; speed: number; opacity: number;
}) {
  const STRIP_TRAIN = CITY_W / BSCALE;
  const count = layer === 'far' ? 20 : layer === 'mid' ? 24 : 30;
  const groupRef = useRef<THREE.Group>(null);
  const buildings = useMemo(() => genBuildings(count, STRIP_TRAIN, layer), [count, STRIP_TRAIN]);
  const seedBase = layer === 'far' ? 0 : layer === 'mid' ? 1000 : 2000;

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.position.x -= speed * dt;
    if (g.position.x < -CITY_W) g.position.x += CITY_W;
  });

  return (
    <group ref={groupRef}>
      {([0, CITY_W] as number[]).map((offset) =>
        buildings.map((b, i) => (
          <group
            key={`${offset}-${i}`}
            position={[b.x * BSCALE + offset - CITY_W * 0.4, b.h * BSCALE / 2, z + (pr(seedBase + i * 7 + 99) - 0.5) * 1.2]}
            scale={[BSCALE, BSCALE, 1]}
          >
            <Bldg3D b={b} seed={seedBase + i * 7} opacity={opacity} />
          </group>
        ))
      )}
    </group>
  );
}

function PendantLight({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.55, 0]}>
        <cylinderGeometry args={[0.004, 0.004, 1.1, 4]} />
        <meshToonMaterial color="#151e2e" />
      </mesh>
      <mesh>
        <coneGeometry args={[0.14, 0.20, 8, 1, true]} />
        <meshToonMaterial color="#1a2540" emissive="#2244aa" emissiveIntensity={0.15} />
      </mesh>
      <pointLight intensity={0.50} distance={4.0} color="#d0e4ff" />
    </group>
  );
}

export function Skyscraper() {
  const stars = useMemo(
    () =>
      Array.from({ length: 70 }, (_, i) => ({
        x: -22 + ((i * 37 + 3) % 100) / 2.27,
        y: 3.8 + ((i * 53 + 7) % 100) / 22,
        r: 0.012 + ((i * 11) % 4) * 0.007,
      })),
    []
  );

  return (
    <>
      <color attach="background" args={['#060810']} />
      <fog attach="fog" args={['#060810', 10, 28]} />
      <Environment preset="night" />
      <ambientLight intensity={0.35} color="#8090bb" />
      <directionalLight
        position={[3, 8, 5]}
        intensity={0.7}
        color="#a0b4d8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-6, 4, 2]} intensity={0.2} color="#3355aa" />
      <directionalLight position={[0, 6, 8]} intensity={0.18} color="#7090cc" />

      <ContactShadows position={[0, 0.02, -1.6]} opacity={0.38} scale={11} blur={1.8} far={4.5} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshToonMaterial color="#0c1020" />
      </mesh>

      {/* Neon floor grid lines */}
      {Array.from({ length: 13 }, (_, i) => (
        <mesh key={`fx-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -0.5 + (i - 6) * 0.9]}>
          <planeGeometry args={[24, 0.022]} />
          <meshBasicMaterial color="#2255cc" transparent opacity={0.45} />
        </mesh>
      ))}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`fy-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 3) * 1.8, 0.002, -2.7]}>
          <planeGeometry args={[0.022, 12]} />
          <meshBasicMaterial color="#2255cc" transparent opacity={0.3} />
        </mesh>
      ))}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -5.5]}>
        <planeGeometry args={[14, 0.06]} />
        <meshBasicMaterial color="#4466ff" transparent opacity={0.6} />
      </mesh>
      <pointLight position={[0, 0.1, -5.4]} intensity={0.4} distance={4} color="#4466ff" />

      {/* Sky backdrop */}
      <mesh position={[0, 4.5, -16]}>
        <planeGeometry args={[80, 20]} />
        <meshBasicMaterial color="#060810" />
      </mesh>

      {/* Stars */}
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, -15.5]}>
          <circleGeometry args={[s.r, 6]} />
          <meshBasicMaterial color="#c0d0ff" transparent opacity={0.75} />
        </mesh>
      ))}

      {/* Moon */}
      <mesh position={[-4.5, 6.0, -15]}>
        <circleGeometry args={[0.52, 32]} />
        <meshBasicMaterial color="#eaeedd" />
      </mesh>
      <mesh position={[-4.5, 6.0, -14.94]}>
        <ringGeometry args={[0.52, 0.74, 32]} />
        <meshBasicMaterial color="#b8ccee" transparent opacity={0.16} />
      </mesh>

      {/* City — three parallax layers */}
      <SkyCityLayer layer="far"  z={-12}  speed={0.12} opacity={0.70} />
      <SkyCityLayer layer="mid"  z={-9.8} speed={0.26} opacity={1.00} />
      <SkyCityLayer layer="near" z={-7.8} speed={0.48} opacity={1.00} />

      {/* City glow on horizon */}
      <mesh position={[0, -1.8, -9.0]}>
        <planeGeometry args={[CITY_W * 0.6, 2.0]} />
        <meshBasicMaterial color="#ff8c40" transparent opacity={0.10} />
      </mesh>

      {/* Panoramic window frame */}
      <RoundedBox args={[15.6, 0.24, 0.28]} radius={0.08} smoothness={3} position={[0, 5.95, -5.74]}>
        <meshToonMaterial color="#1a2234" />
      </RoundedBox>
      <RoundedBox args={[15.6, 0.36, 0.3]} radius={0.08} smoothness={3} position={[0, 0.68, -5.74]}>
        <meshToonMaterial color="#1a2234" />
      </RoundedBox>
      {([-4.9, 0, 4.9] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.1, 5.1, 0.22]} radius={0.04} smoothness={3} position={[x, 3.32, -5.74]}>
          <meshToonMaterial color="#1a2234" />
        </RoundedBox>
      ))}
      {([-7.2, -2.45, 2.45, 7.2] as number[]).map((cx, i) => {
        const w = i === 0 || i === 3 ? 2.2 : 4.7;
        return (
          <mesh key={i} position={[cx, 3.32, -5.71]}>
            <planeGeometry args={[w, 5.0]} />
            <meshBasicMaterial color="#1a3055" transparent opacity={0.12} />
          </mesh>
        );
      })}

      {/* Side walls */}
      {([-7.2, 7.2] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.42, 6, 11.6]} radius={0.2} smoothness={4} position={[x, 3, -0.35]} receiveShadow>
          <meshToonMaterial color="#101828" />
        </RoundedBox>
      ))}

      {/* Ceiling */}
      <RoundedBox args={[15.2, 0.5, 11.8]} radius={0.22} smoothness={4} position={[0, 6.1, -0.2]}>
        <meshToonMaterial color="#0e1422" />
      </RoundedBox>

      {/* Ceiling LED panels */}
      {([-3.6, -1.2, 1.2, 3.6] as number[]).map((x) => (
        <group key={x}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[x, 5.84, -2.6]}>
            <planeGeometry args={[1.6, 0.06]} />
            <meshBasicMaterial color="#6688ff" transparent opacity={0.75} />
          </mesh>
          <pointLight position={[x, 5.5, -2.6]} intensity={0.75} distance={5.2} color="#5577ff" />
        </group>
      ))}
      <pointLight position={[-6.5, 2.5, -2.5]} intensity={0.55} distance={5} color="#cc44ff" />
      <pointLight position={[6.5, 2.5, -2.5]} intensity={0.55} distance={5} color="#ff4488" />

      {/* Neon sign */}
      <group position={[-6.6, 3.5, -3.0]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[2.2, 0.52, 0.06]} radius={0.08} smoothness={3}>
          <meshToonMaterial color="#0a0e18" />
        </RoundedBox>
        <Text
          position={[0, 0, 0.04]}
          fontSize={0.28}
          color="#cc44ff"
          anchorX="center"
          anchorY="middle"
          outlineWidth={0.008}
          outlineColor="#8822cc"
        >
          LOCKED IN
        </Text>
        <pointLight position={[0, 0, 0.15]} intensity={0.35} distance={2.0} color="#cc44ff" />
      </group>

      {/* Pendant lights above each desk row — professional cool-white fill */}
      {([-3.3, 0.1] as number[]).map((dz) =>
        ([-2.2, 0, 2.2] as number[]).map((dx) => (
          <PendantLight key={`pend-${dz}-${dx}`} position={[dx, 4.6, dz]} />
        ))
      )}

      {/* Wall sconces — cool-white professional ambient, both side walls */}
      {([-3.5, -1.5, 0.5] as number[]).map((z) => (
        <group key={`wl-${z}`} position={[-6.85, 2.8, z]}>
          <RoundedBox args={[0.05, 0.22, 0.14]} radius={0.02} smoothness={3}>
            <meshToonMaterial color="#0e1828" />
          </RoundedBox>
          <pointLight position={[0.2, 0, 0]} intensity={0.35} distance={5.0} color="#d0e4ff" />
        </group>
      ))}
      {([-3.5, -1.5, 0.5] as number[]).map((z) => (
        <group key={`wr-${z}`} position={[6.85, 2.8, z]}>
          <RoundedBox args={[0.05, 0.22, 0.14]} radius={0.02} smoothness={3}>
            <meshToonMaterial color="#0e1828" />
          </RoundedBox>
          <pointLight position={[-0.2, 0, 0]} intensity={0.35} distance={5.0} color="#d0e4ff" />
        </group>
      ))}

      {/* Desks — P1&P2 at z=-3.3 (rear), P3&P4 at z=0.1 (front) */}
      {([-3.3, 0.1] as number[]).map((dz) => (
        <group key={dz}>
          <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.73, dz]} castShadow receiveShadow>
            <meshToonMaterial color="#131c30" />
          </RoundedBox>
          <mesh position={[0, 0.67, dz + 0.88]}>
            <planeGeometry args={[6.1, 0.03]} />
            <meshBasicMaterial color="#6688ff" transparent opacity={0.75} />
          </mesh>
          <pointLight position={[0, 0.8, dz + 0.9]} intensity={0.3} distance={2.5} color="#6688ff" />
          {([-2.75, 2.75] as number[]).map((x) => (
            <RoundedBox key={x} args={[0.22, 0.72, 1.3]} radius={0.08} smoothness={4} position={[x, 0.30, dz]} castShadow>
              <meshToonMaterial color="#0d1420" />
            </RoundedBox>
          ))}
        </group>
      ))}
    </>
  );
}
