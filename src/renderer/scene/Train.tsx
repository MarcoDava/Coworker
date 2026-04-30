import { ContactShadows, Environment, Float, RoundedBox, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function ScrollingCityStrip({ D, W, H }: { D: number; W: number; H: number }) {
  const STRIP = W * 2.2;
  const groupRef = useRef<THREE.Group>(null);

  const buildings = useMemo(() => {
    const count = 18;
    return Array.from({ length: count }, (_, i) => {
      const bw = 0.08 + ((i * 17 + 3) % 5) * 0.04;
      const bh = 0.22 + ((i * 29 + 7) % 10) * 0.055;
      const x = (i / count) * STRIP;
      const yCenter = -H / 2 + bh / 2;
      const wins: { wx: number; wy: number; color: string }[] = [];
      const cols = Math.max(1, Math.floor(bw / 0.03));
      const rows = Math.max(1, Math.floor(bh / 0.038));
      for (let c = 0; c < cols; c++) {
        for (let r = 0; r < rows; r++) {
          if (((c * 3 + r * 5 + i * 7) % 10) <= 2) continue;
          wins.push({
            wx: -bw / 2 + (c + 0.5) * (bw / cols),
            wy: -bh / 2 + (r + 0.5) * (bh / rows),
            color: (c + r + i) % 3 === 0 ? '#ffcc66' : (c + r + i) % 3 === 1 ? '#ffaa44' : '#88bbff',
          });
        }
      }
      return { x, bw, bh, yCenter, wins };
    });
  }, [W, H, STRIP]);

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.position.x -= 0.24 * dt;
    if (g.position.x < -STRIP) g.position.x += STRIP;
  });

  const Z = -D * 0.43;

  return (
    <group ref={groupRef}>
      {([0, STRIP] as number[]).map((offset) =>
        buildings.map((b, i) => (
          <group key={`${offset}-${i}`} position={[b.x + offset - W, b.yCenter, Z]}>
            <mesh>
              <boxGeometry args={[b.bw, b.bh, 0.001]} />
              <meshBasicMaterial color="#1c2030" />
            </mesh>
            {b.wins.map((w, j) => (
              <mesh key={j} position={[w.wx, w.wy, 0.002]}>
                <planeGeometry args={[0.016, 0.012]} />
                <meshBasicMaterial color={w.color} />
              </mesh>
            ))}
          </group>
        ))
      )}
    </group>
  );
}

function TrainWindow({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const W = 1.1;
  const H = 0.86;
  const F = 0.13;
  const D = 0.18;

  const stars = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: -0.45 + ((i * 41 + 3) % 100) / 111,
        y: 0.02 + ((i * 31 + 7) % 100) / 200,
        r: 0.006 + ((i * 13) % 3) * 0.003,
      })),
    []
  );

  return (
    <group position={position} rotation={rotation}>
      {/* Night scene backdrop */}
      <mesh position={[0, 0, -D * 0.55]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#07101e" />
      </mesh>

      {/* Stars */}
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, -D * 0.5]}>
          <circleGeometry args={[s.r, 6]} />
          <meshBasicMaterial color="#d0dcff" />
        </mesh>
      ))}

      {/* Moon */}
      <mesh position={[0.28, 0.22, -D * 0.48]}>
        <circleGeometry args={[0.09, 16]} />
        <meshBasicMaterial color="#dde8b0" />
      </mesh>

      {/* Dark hill silhouettes */}
      <mesh position={[-0.22, -0.28, -D * 0.46]}>
        <circleGeometry args={[0.28, 20]} />
        <meshBasicMaterial color="#0a0f08" />
      </mesh>
      <mesh position={[0.18, -0.32, -D * 0.45]}>
        <circleGeometry args={[0.24, 20]} />
        <meshBasicMaterial color="#0c100a" />
      </mesh>

      {/* Scrolling city buildings */}
      <ScrollingCityStrip D={D} W={W} H={H} />

      {/* Frame bezels — thick dark wood */}
      <RoundedBox args={[W + F * 2, F, D]} radius={0.03} smoothness={3} position={[0, H / 2 + F / 2, 0]}>
        <meshToonMaterial color="#3a2010" />
      </RoundedBox>
      <RoundedBox args={[W + F * 2, F, D]} radius={0.03} smoothness={3} position={[0, -(H / 2 + F / 2), 0]}>
        <meshToonMaterial color="#3a2010" />
      </RoundedBox>
      <RoundedBox args={[F, H, D]} radius={0.03} smoothness={3} position={[-(W / 2 + F / 2), 0, 0]}>
        <meshToonMaterial color="#3a2010" />
      </RoundedBox>
      <RoundedBox args={[F, H, D]} radius={0.03} smoothness={3} position={[W / 2 + F / 2, 0, 0]}>
        <meshToonMaterial color="#3a2010" />
      </RoundedBox>
    </group>
  );
}

function GlobeLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.22, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.44, 6]} />
        <meshToonMaterial color="#5a3a20" />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[0.12, 14, 14]} />
        <meshToonMaterial color="#ffe4a8" emissive="#ffb844" emissiveIntensity={0.7} />
      </mesh>
      <pointLight position={[0, -0.16, 0]} intensity={1.1} distance={5} color="#ffb844" />
    </group>
  );
}

function LuggageRack() {
  return (
    <group>
      {/* Side rails running front-to-back */}
      {([-2.8, 2.8] as number[]).map((x) => (
        <mesh key={x} position={[x, 4.35, -2.6]}>
          <cylinderGeometry args={[0.025, 0.025, 7.6, 8]} />
          <meshToonMaterial color="#6a5040" />
        </mesh>
      ))}
      {/* Cross bars */}
      {[-0.8, -2.0, -3.2, -4.4].map((z) => (
        <mesh key={z} position={[0, 4.35, z]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.02, 0.02, 5.7, 8]} />
          <meshToonMaterial color="#6a5040" />
        </mesh>
      ))}
      {/* Mesh floor of rack */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 4.22, -2.6]}>
        <planeGeometry args={[5.5, 7.2]} />
        <meshToonMaterial color="#4a3020" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

function BenchSeat({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {/* Seat cushion — vibrant teal */}
      <RoundedBox args={[1.6, 0.14, 0.72]} radius={0.1} smoothness={3} position={[0, 0.07, 0]} castShadow>
        <meshToonMaterial color="#28aacc" />
      </RoundedBox>
      {/* Back rest */}
      <RoundedBox args={[1.6, 0.68, 0.12]} radius={0.08} smoothness={3} position={[0, 0.5, -0.3]} castShadow>
        <meshToonMaterial color="#2298b8" />
      </RoundedBox>
      {/* Seat frame */}
      <RoundedBox args={[1.62, 0.08, 0.74]} radius={0.04} smoothness={3} position={[0, -0.02, 0]}>
        <meshToonMaterial color="#4a2e16" />
      </RoundedBox>
    </group>
  );
}

function ConductorBot() {
  const botRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const bot = botRef.current;
    if (!bot) return;
    const t = clock.getElapsedTime();
    const walk = Math.sin(t * 0.48);
    bot.position.z = -3.4 + walk * 0.9;
    bot.rotation.y = walk > 0 ? 0 : Math.PI;
    bot.position.y = Math.abs(Math.sin(t * 2.5)) * 0.025;
  });

  return (
    <group ref={botRef} position={[2.6, 0, -3.4]}>
      {/* Body */}
      <RoundedBox args={[0.28, 0.5, 0.18]} radius={0.07} smoothness={3} position={[0, 0.62, 0]} castShadow>
        <meshToonMaterial color="#221408" />
      </RoundedBox>
      {/* Jacket lapels */}
      <RoundedBox args={[0.08, 0.3, 0.06]} radius={0.03} smoothness={3} position={[-0.08, 0.72, 0.1]} rotation={[0, 0, 0.2]}>
        <meshToonMaterial color="#1a0e06" />
      </RoundedBox>
      <RoundedBox args={[0.08, 0.3, 0.06]} radius={0.03} smoothness={3} position={[0.08, 0.72, 0.1]} rotation={[0, 0, -0.2]}>
        <meshToonMaterial color="#1a0e06" />
      </RoundedBox>
      {/* Head */}
      <mesh position={[0, 1.12, 0]} castShadow>
        <sphereGeometry args={[0.16, 12, 12]} />
        <meshToonMaterial color="#c8a878" />
      </mesh>
      {/* Conductor hat */}
      <RoundedBox args={[0.28, 0.06, 0.28]} radius={0.02} smoothness={3} position={[0, 1.25, 0]}>
        <meshToonMaterial color="#1a0e06" />
      </RoundedBox>
      <RoundedBox args={[0.2, 0.18, 0.2]} radius={0.04} smoothness={3} position={[0, 1.34, 0]}>
        <meshToonMaterial color="#1a0e06" />
      </RoundedBox>
      {/* Legs */}
      <mesh position={[-0.08, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.055, 0.28, 6, 8]} />
        <meshToonMaterial color="#181006" />
      </mesh>
      <mesh position={[0.08, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.055, 0.28, 6, 8]} />
        <meshToonMaterial color="#181006" />
      </mesh>
    </group>
  );
}

export function Train() {
  const trainRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const g = trainRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.rotation.z = Math.sin(t * 0.6) * 0.008;
  });

  return (
    <>
      <color attach="background" args={['#1e1008']} />
      <fog attach="fog" args={['#1e1008', 7, 17]} />
      <Environment preset="sunset" />
      <ambientLight intensity={0.65} color="#ffcc66" />
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.1}
        color="#ffcc66"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 2.5, -2]} intensity={0.24} color="#ff9933" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.42} scale={11} blur={1.6} far={4.5} />

      <group ref={trainRef}>
        {/* Wood floor */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[24, 24]} />
          <meshToonMaterial color="#3c2010" />
        </mesh>

        {/* Floor plank lines */}
        {Array.from({ length: 11 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.5 + i * 1.05]}>
            <planeGeometry args={[24, 0.04]} />
            <meshBasicMaterial color="#5a3418" transparent opacity={0.5} />
          </mesh>
        ))}

        {/* Aisle runner rug — vivid red */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -2.7]} receiveShadow>
          <planeGeometry args={[2.4, 10.0]} />
          <meshToonMaterial color="#cc2820" transparent opacity={0.9} />
        </mesh>

        {/* Back wall */}
        <RoundedBox args={[15.5, 6.2, 0.5]} radius={0.28} smoothness={4} position={[0, 3.1, -6]} receiveShadow>
          <meshToonMaterial color="#5a3018" />
        </RoundedBox>
        {/* Back wall wainscot panel */}
        <RoundedBox args={[15.1, 1.6, 0.2]} radius={0.12} smoothness={4} position={[0, 0.9, -5.72]}>
          <meshToonMaterial color="#3e2010" />
        </RoundedBox>

        {/* Side walls */}
        {([-7.2, 7.2] as number[]).map((x) => (
          <group key={x}>
            <RoundedBox args={[0.42, 6, 11.6]} radius={0.2} smoothness={4} position={[x, 3, -0.35]} receiveShadow>
              <meshToonMaterial color="#6a3a1a" />
            </RoundedBox>

            {/* Wood wall panels (vertical strips) */}
            {[-4.2, -2.6, -1.0, 0.6].map((z) => (
              <RoundedBox key={z} args={[0.08, 4.8, 1.1]} radius={0.03} smoothness={3} position={[x > 0 ? x - 0.22 : x + 0.22, 2.8, z]}>
                <meshToonMaterial color="#4e2a10" />
              </RoundedBox>
            ))}

            {/* Two windows per side */}
            <TrainWindow
              position={[x > 0 ? x - 0.22 : x + 0.22, 2.85, -1.5]}
              rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
            />
            <TrainWindow
              position={[x > 0 ? x - 0.22 : x + 0.22, 2.85, -3.8]}
              rotation={[0, x > 0 ? -Math.PI / 2 : Math.PI / 2, 0]}
            />
          </group>
        ))}

        {/* Ceiling */}
        <RoundedBox args={[15.2, 0.5, 11.8]} radius={0.22} smoothness={4} position={[0, 6.1, -0.2]}>
          <meshToonMaterial color="#5a3c1e" />
        </RoundedBox>

        {/* Globe lamps hanging from ceiling */}
        <GlobeLamp position={[-2.2, 5.5, -1.6]} />
        <GlobeLamp position={[2.2, 5.5, -1.6]} />
        <GlobeLamp position={[0, 5.5, -3.5]} />
        <GlobeLamp position={[-2.2, 5.5, -4.8]} />
        <GlobeLamp position={[2.2, 5.5, -4.8]} />

        {/* Luggage rack above aisle */}
        <LuggageRack />

        {/* Bench seats along both sides behind desk zone */}
        <BenchSeat position={[-4.8, 0.14, -4.6]} />
        <BenchSeat position={[4.8, 0.14, -4.6]} rotation={[0, Math.PI, 0]} />
        <BenchSeat position={[-4.8, 0.14, -3.2]} />
        <BenchSeat position={[4.8, 0.14, -3.2]} rotation={[0, Math.PI, 0]} />

        {/* Desk top — same footprint as Library, dark wood */}
        <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.73, -2.1]} castShadow receiveShadow>
          <meshToonMaterial color="#3a2210" />
        </RoundedBox>
        {([-2.75, 2.75] as number[]).map((x) => (
          <RoundedBox key={x} args={[0.22, 0.72, 1.3]} radius={0.08} smoothness={4} position={[x, 0.30, -2.1]} castShadow>
            <meshToonMaterial color="#2a1808" />
          </RoundedBox>
        ))}

        {/* Decorative floating dust motes — warm amber */}
        {Array.from({ length: 14 }, (_, i) => (
          <Float key={i} speed={0.4 + (i % 4) * 0.12} floatIntensity={0.25} rotationIntensity={0}>
            <mesh
              position={[
                -3.5 + ((i * 43 + 3) % 100) / 14.2,
                1.0 + ((i * 29 + 5) % 100) / 34,
                -4.5 + ((i * 17 + 9) % 100) / 25,
              ]}
            >
              <sphereGeometry args={[0.014 + ((i * 7) % 3) * 0.004, 6, 6]} />
              <meshBasicMaterial color="#ffdd99" transparent opacity={0.25} />
            </mesh>
          </Float>
        ))}

        {/* Destination sign — Rec Room style */}
        <group position={[0, 4.8, -5.8]}>
          <RoundedBox args={[3.2, 0.5, 0.08]} radius={0.1} smoothness={3}>
            <meshToonMaterial color="#2a1410" />
          </RoundedBox>
          <Text
            position={[0, 0, 0.05]}
            fontSize={0.24}
            color="#ffcc44"
            anchorX="center"
            anchorY="middle"
          >
            NEXT STOP: FOCUS
          </Text>
        </group>

        <ConductorBot />
      </group>
    </>
  );
}
