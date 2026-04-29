import { ContactShadows, Environment, RoundedBox, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const CITY_W = 40;

type Building = {
  x: number;
  w: number;
  h: number;
  yCenter: number;
  windows: { wx: number; wy: number; color: string }[];
};

function buildingStrip(count: number, seed: number, maxWins: number): Building[] {
  return Array.from({ length: count }, (_, i) => {
    const r1 = ((i * 37 + seed * 11) % 97) / 97;
    const r2 = ((i * 53 + seed * 17) % 89) / 89;
    const r3 = ((i * 71 + seed * 23) % 83) / 83;
    const w = 0.5 + r1 * 1.4;
    const h = 1.0 + r2 * 4.5;
    const x = (i / count) * CITY_W;
    const yTop = 2.0 + r3 * 3.2;
    const yCenter = yTop - h / 2;
    const cols = Math.max(2, Math.min(5, Math.floor(w / 0.22)));
    const rows = Math.max(2, Math.min(9, Math.floor(h / 0.26)));
    const wins: Building['windows'] = [];
    for (let c = 0; c < cols && wins.length < maxWins; c++) {
      for (let r = 0; r < rows && wins.length < maxWins; r++) {
        if (((c * 7 + r * 3 + i * 11 + seed) % 10) <= 3) continue;
        const p = (c + r + i + seed) % 3;
        wins.push({
          wx: -w / 2 + (c + 0.5) * (w / cols),
          wy: yCenter - h / 2 + (r + 0.5) * (h / rows),
          color: p === 0 ? '#ffcc88' : p === 1 ? '#ffe4b0' : '#aaccff',
        });
      }
    }
    return { x, w, h, yCenter, windows: wins };
  });
}

function CityLayer({
  z,
  count,
  speed,
  seed,
  maxWins,
}: {
  z: number;
  count: number;
  speed: number;
  seed: number;
  maxWins: number;
}) {
  const groupRef = useRef<THREE.Group>(null);
  const buildings = useMemo(() => buildingStrip(count, seed, maxWins), [count, seed, maxWins]);

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.position.x -= speed * dt;
    if (g.position.x < -CITY_W) g.position.x += CITY_W;
  });

  return (
    <group ref={groupRef}>
      {/* Two identical strips side by side so the seam is never in view */}
      {([0, CITY_W] as number[]).map((offset) =>
        buildings.map((b, i) => (
          <group key={`${offset}-${i}`} position={[b.x + offset, 0, z]}>
            <mesh position={[0, b.yCenter, 0]}>
              <boxGeometry args={[b.w, b.h, 0.3]} />
              <meshBasicMaterial color="#07090f" />
            </mesh>
            {b.windows.map((w, j) => (
              <mesh key={j} position={[w.wx, w.wy, 0.16]}>
                <planeGeometry args={[0.07, 0.09]} />
                <meshBasicMaterial color={w.color} />
              </mesh>
            ))}
          </group>
        ))
      )}
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
      <fog attach="fog" args={['#060810', 10, 24]} />
      <Environment preset="night" />
      <ambientLight intensity={0.28} color="#8090bb" />
      <directionalLight
        position={[3, 8, 5]}
        intensity={0.55}
        color="#a0b4d8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-6, 4, 2]} intensity={0.1} color="#3355aa" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.38} scale={11} blur={1.8} far={4.5} />

      {/* Floor — polished dark concrete */}
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
      {/* Cross grid lines */}
      {Array.from({ length: 7 }, (_, i) => (
        <mesh key={`fy-${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[(i - 3) * 1.8, 0.002, -2.7]}>
          <planeGeometry args={[0.022, 12]} />
          <meshBasicMaterial color="#2255cc" transparent opacity={0.3} />
        </mesh>
      ))}
      {/* Floor edge neon strip */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -5.5]}>
        <planeGeometry args={[14, 0.06]} />
        <meshBasicMaterial color="#4466ff" transparent opacity={0.6} />
      </mesh>
      <pointLight position={[0, 0.1, -5.4]} intensity={0.4} distance={4} color="#4466ff" />

      {/* Sky backdrop */}
      <mesh position={[0, 4.5, -15]}>
        <planeGeometry args={[70, 16]} />
        <meshBasicMaterial color="#060810" />
      </mesh>

      {/* Stars */}
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, -14.5]}>
          <circleGeometry args={[s.r, 6]} />
          <meshBasicMaterial color="#c0d0ff" transparent opacity={0.75} />
        </mesh>
      ))}

      {/* Moon */}
      <mesh position={[-4.5, 6.0, -14]}>
        <circleGeometry args={[0.52, 32]} />
        <meshBasicMaterial color="#eaeedd" />
      </mesh>
      <mesh position={[-4.5, 6.0, -13.94]}>
        <ringGeometry args={[0.52, 0.74, 32]} />
        <meshBasicMaterial color="#b8ccee" transparent opacity={0.16} />
      </mesh>

      {/* City — three parallax layers */}
      <CityLayer z={-12} count={14} speed={0.12} seed={5} maxWins={5} />
      <CityLayer z={-9.5} count={18} speed={0.26} seed={11} maxWins={8} />
      <CityLayer z={-7.5} count={24} speed={0.48} seed={17} maxWins={12} />

      {/* Panoramic window frame — the entire back wall is glass */}
      {/* Top beam */}
      <RoundedBox args={[15.6, 0.24, 0.28]} radius={0.08} smoothness={3} position={[0, 5.95, -5.74]}>
        <meshToonMaterial color="#1a2234" />
      </RoundedBox>
      {/* Bottom sill */}
      <RoundedBox args={[15.6, 0.36, 0.3]} radius={0.08} smoothness={3} position={[0, 0.68, -5.74]}>
        <meshToonMaterial color="#1a2234" />
      </RoundedBox>
      {/* Vertical mullions */}
      {([-4.9, 0, 4.9] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.1, 5.1, 0.22]} radius={0.04} smoothness={3} position={[x, 3.32, -5.74]}>
          <meshToonMaterial color="#1a2234" />
        </RoundedBox>
      ))}
      {/* Glass panes — very faint blue tint */}
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

      {/* Ceiling LED panels — vibrant color */}
      {([-3.6, -1.2, 1.2, 3.6] as number[]).map((x) => (
        <group key={x}>
          <mesh rotation={[Math.PI / 2, 0, 0]} position={[x, 5.84, -2.6]}>
            <planeGeometry args={[1.6, 0.06]} />
            <meshBasicMaterial color="#6688ff" transparent opacity={0.75} />
          </mesh>
          <pointLight position={[x, 5.5, -2.6]} intensity={0.75} distance={5.2} color="#5577ff" />
        </group>
      ))}
      {/* Colored neon accent lights on side walls */}
      <pointLight position={[-6.5, 2.5, -2.5]} intensity={0.55} distance={5} color="#cc44ff" />
      <pointLight position={[6.5, 2.5, -2.5]} intensity={0.55} distance={5} color="#ff4488" />

      {/* Neon "LOCKED IN" sign on left wall */}
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

      {/* Desk */}
      <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.73, -2.1]} castShadow receiveShadow>
        <meshToonMaterial color="#131c30" />
      </RoundedBox>
      {/* Desk edge glow — vibrant neon */}
      <mesh position={[0, 0.67, -1.22]}>
        <planeGeometry args={[6.1, 0.03]} />
        <meshBasicMaterial color="#6688ff" transparent opacity={0.75} />
      </mesh>
      <pointLight position={[0, 0.8, -1.2]} intensity={0.3} distance={2.5} color="#6688ff" />
      {/* Desk legs */}
      {([-2.75, 2.75] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.22, 0.72, 1.3]} radius={0.08} smoothness={4} position={[x, 0.30, -2.1]} castShadow>
          <meshToonMaterial color="#0d1420" />
        </RoundedBox>
      ))}
    </>
  );
}
