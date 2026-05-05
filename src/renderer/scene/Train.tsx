import { Environment, Float, RoundedBox, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { NPC_SCALE } from './CharacterParts';
import { Bldg3D, genBuildings, pr } from './CityBuildings';

function CityLayer({ layer, D, W, H, speed, zOff, opacity }: {
  layer: 'far' | 'mid' | 'near';
  D: number; W: number; H: number;
  speed: number; zOff: number; opacity: number;
}) {
  const STRIP = W * 2.8;
  const groupRef = useRef<THREE.Group>(null);
  const count = layer === 'far' ? 38 : layer === 'mid' ? 26 : 18;
  const buildings = useMemo(() => genBuildings(count, STRIP, layer), [count, STRIP, layer]);
  const seedBase = layer === 'far' ? 0 : layer === 'mid' ? 1000 : 2000;

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.position.x -= speed * dt;
    if (g.position.x < -STRIP) g.position.x += STRIP;
  });

  return (
    <group ref={groupRef}>
      {([0, STRIP] as number[]).map((offset) =>
        buildings.map((b, i) => (
          <group key={`${offset}-${i}`} position={[b.x + offset - W * 0.8, -H / 2 + b.h / 2, -D * zOff]}>
            <Bldg3D b={b} seed={seedBase + i * 7} opacity={opacity} />
          </group>
        ))
      )}
    </group>
  );
}

function CityLayers({ D, W, H }: { D: number; W: number; H: number }) {
  return (
    <>
      <CityLayer layer="far"  D={D} W={W} H={H} speed={0.14} zOff={0.52} opacity={0.70} />
      <CityLayer layer="mid"  D={D} W={W} H={H} speed={0.22} zOff={0.47} opacity={1.00} />
      <CityLayer layer="near" D={D} W={W} H={H} speed={0.36} zOff={0.43} opacity={1.00} />
      <mesh position={[0, -H * 0.44, -D * 0.42]}>
        <planeGeometry args={[W * 6.0, H * 0.10]} />
        <meshBasicMaterial color="#ff8c40" transparent opacity={0.12} />
      </mesh>
    </>
  );
}

// ─── Side window ─────────────────────────────────────────────────────────────

function TrainWindow({ position, rotation, width = 1.1, height = 0.88, struts = 0, showMoon = false }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  width?: number;
  height?: number;
  struts?: number;
  showMoon?: boolean;
}) {
  const W = width; const H = height; const F = 0.12; const D = 0.16;
  const WALL_LAYER = 0.95;
  const WALL_LAYER_Z = -D * 0.24;

  const skyGeo = useMemo(() => {
    const geo = new THREE.PlaneGeometry(W, H, 1, 8);
    const pos = geo.attributes.position as THREE.BufferAttribute;
    const top = new THREE.Color('#0a1428');
    const mid = new THREE.Color('#1a1a3a');
    const low = new THREE.Color('#2a1838');
    const cols: number[] = [];
    for (let i = 0; i < pos.count; i++) {
      const t = (pos.getY(i) + H / 2) / H;
      const c = t > 0.5
        ? new THREE.Color().lerpColors(mid, top, (t - 0.5) * 2)
        : new THREE.Color().lerpColors(low, mid, t * 2);
      cols.push(c.r, c.g, c.b);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(new Float32Array(cols), 3));
    return geo;
  }, [W, H]);

  const stars = useMemo(() =>
    Array.from({ length: 90 }, (_, i) => ({
      x: -W * 0.48 + pr(i * 5 + 1) * W * 0.96,
      y:  H * 0.04 + pr(i * 5 + 2) * H * 0.42,
      r: 0.004 + pr(i * 5 + 3) * 0.006,
      bright: pr(i * 5 + 4) > 0.65,
    })), [W, H]);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -D * 0.56]} geometry={skyGeo}>
        <meshBasicMaterial vertexColors />
      </mesh>
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, -D * 0.54]}>
          <circleGeometry args={[s.r, s.bright ? 6 : 4]} />
          <meshBasicMaterial color={s.bright ? '#e8d9b7' : '#8ba8c8'} />
        </mesh>
      ))}
      {showMoon && (
        <>
          {/* Moon glow */}
          <mesh position={[-W * 0.20, H * 0.25, -D * 0.535]}>
            <circleGeometry args={[0.14, 16]} />
            <meshBasicMaterial color="#f4ecc4" transparent opacity={0.08} />
          </mesh>
          {/* Moon disc */}
          <mesh position={[-W * 0.20, H * 0.25, -D * 0.53]}>
            <circleGeometry args={[0.08, 16]} />
            <meshBasicMaterial color="#f4ecc4" />
          </mesh>
          {/* Crescent shadow */}
          <mesh position={[-W * 0.20 + 0.038, H * 0.25 + 0.022, -D * 0.52]}>
            <circleGeometry args={[0.068, 16]} />
            <meshBasicMaterial color="#1a1a3a" />
          </mesh>
        </>
      )}
      <CityLayers D={D} W={W} H={H} />
      {([-1, 1] as number[]).map((side) => (
        <mesh key={`side-${side}`} position={[side * (W / 2 + WALL_LAYER / 2), 0, WALL_LAYER_Z]}>
          <planeGeometry args={[WALL_LAYER, H + F * 3]} />
          <meshBasicMaterial color="#6a3a1a" />
        </mesh>
      ))}
      {([-1, 1] as number[]).map((side) => (
        <mesh key={`rail-${side}`} position={[0, side * (H / 2 + WALL_LAYER / 2), WALL_LAYER_Z]}>
          <planeGeometry args={[W + WALL_LAYER * 2, WALL_LAYER]} />
          <meshBasicMaterial color="#6a3a1a" />
        </mesh>
      ))}
      {Array.from({ length: struts }, (_, i) => {
        const x = -W / 2 + ((i + 1) * W) / (struts + 1);
        return (
          <RoundedBox key={i} args={[F * 0.52, H + F * 0.55, D * 1.05]} radius={0.025} smoothness={3} position={[x, 0, 0.012]}>
            <meshToonMaterial color="#3a2010" />
          </RoundedBox>
        );
      })}
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

// ─── Globe lamp ───────────────────────────────────────────────────────────────

function GlobeLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.20, 0]}>
        <cylinderGeometry args={[0.008, 0.008, 0.40, 6]} />
        <meshToonMaterial color="#5a3a20" />
      </mesh>
      <mesh castShadow>
        <sphereGeometry args={[0.11, 10, 10]} />
        <meshToonMaterial color="#ffe4a8" emissive="#ffb844" emissiveIntensity={0.7} />
      </mesh>
      <pointLight intensity={0.55} distance={3.2} color="#ffb844" />
    </group>
  );
}

// ─── Bench seat ───────────────────────────────────────────────────────────────

function BenchSeat({ position, rotation }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[1.5, 0.13, 0.68]} radius={0.09} smoothness={3} position={[0, 0.07, 0]} castShadow>
        <meshToonMaterial color="#28aacc" />
      </RoundedBox>
      <RoundedBox args={[1.5, 0.64, 0.11]} radius={0.07} smoothness={3} position={[0, 0.48, -0.28]} castShadow>
        <meshToonMaterial color="#2298b8" />
      </RoundedBox>
      <RoundedBox args={[1.52, 0.07, 0.70]} radius={0.04} smoothness={3} position={[0, -0.01, 0]}>
        <meshToonMaterial color="#4a2e16" />
      </RoundedBox>
    </group>
  );
}

// ─── Drink shelf (wall-mounted behind bar) ────────────────────────────────────

function BoothSet({ z }: { z: number }) {
  return (
    <group>
      <BenchSeat position={[4.04, 0.14, z-1.2]} rotation={[0, 0, 0]} />
      <BenchSeat position={[4.04, 0.14, z+1.2]} rotation={[0, Math.PI, 0]} />
      <RoundedBox args={[1.6, 0.12, 1.12]} radius={0.08} smoothness={3}
        position={[4.04, 0.72, z]} castShadow receiveShadow>
        <meshToonMaterial color="#3a2210" />
      </RoundedBox>
      {([-0.38, 0.38] as number[]).map((x) =>
        ([-0.38, 0.38] as number[]).map((dz) => (
          <RoundedBox key={`${x}-${dz}`} args={[0.10, 0.62, 0.10]} radius={0.04} smoothness={2}
            position={[3.8 + x, 0.33, z + dz]}>
            <meshToonMaterial color="#2a1808" />
          </RoundedBox>
        ))
      )}
      {([-0.28, 0.28] as number[]).map((dz, i) => (
        <group key={dz} position={[4.04, 0.81, z + dz]}>
          <mesh>
            <cylinderGeometry args={[0.075, 0.075, 0.012, 12]} />
            <meshToonMaterial color={i === 0 ? '#f1d69b' : '#d8e8f0'} />
          </mesh>
          <mesh position={[0.12, 0.035, 0.03]}>
            <cylinderGeometry args={[0.028, 0.024, 0.07, 8]} />
            <meshToonMaterial color="#b8eef2" transparent opacity={0.52} />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function DrinkShelf({ position }: { position: [number, number, number] }) {
  const lowerBottles = useMemo(() =>
    Array.from({ length: 11 }, (_, i) => ({
      x: -1.45 + i * 0.29,
      h: 0.28 + ((i * 11 + 3) % 4) * 0.055,
      color: i % 4 === 0 ? '#1a4028' : i % 4 === 1 ? '#5a1810' : i % 4 === 2 ? '#2a3858' : '#4a3010',
    })), []);

  return (
    <group position={position}>
      {/* Two shelves */}
      {([1.55, 2.08] as number[]).map((y) => (
        <RoundedBox key={y} args={[3.2, 0.06, 0.20]} radius={0.02} smoothness={3} position={[0, y, 0]}>
          <meshToonMaterial color="#5a3a20" />
        </RoundedBox>
      ))}
      {/* Bracket supports */}
      {([-1.4, 0, 1.4] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.05, 0.59, 0.18]} radius={0.02} smoothness={3} position={[x, 1.795, 0]}>
          <meshToonMaterial color="#4a2e18" />
        </RoundedBox>
      ))}
      {/* Lower shelf bottles */}
      {lowerBottles.map((b, i) => (
        <group key={i} position={[b.x, 1.58 + b.h / 2, 0.02]}>
          <mesh>
            <cylinderGeometry args={[0.038, 0.042, b.h, 8]} />
            <meshToonMaterial color={b.color} />
          </mesh>
          <mesh position={[0, b.h / 2 + 0.05, 0]}>
            <cylinderGeometry args={[0.016, 0.028, 0.09, 6]} />
            <meshToonMaterial color="#8a8060" />
          </mesh>
        </group>
      ))}
      {/* Upper shelf bottles — fewer, decorative */}
      {([0, 1, 2, 3, 4] as number[]).map((i) => {
        const x = -0.58 + i * 0.30;
        const h = 0.22 + (i % 3) * 0.04;
        const color = i % 2 === 0 ? '#3a1a28' : '#1e3a50';
        return (
          <group key={i} position={[x, 2.11 + h / 2, 0.02]}>
            <mesh>
              <cylinderGeometry args={[0.034, 0.038, h, 8]} />
              <meshToonMaterial color={color} />
            </mesh>
            <mesh position={[0, h / 2 + 0.04, 0]}>
              <cylinderGeometry args={[0.012, 0.022, 0.07, 6]} />
              <meshToonMaterial color="#8a8060" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

// ─── L-shaped bar ─────────────────────────────────────────────────────────────

function LBar() {
  const MX = -1.2;   // main arm center X
  const MZ = -9.0;   // main arm center Z
  const MW = 3.8;    // main arm width (along X)
  const D  = 0.65;   // depth (along Z) for main arm
  const H  = 1.08;   // counter body height
  const TOP = 0.07;  // countertop slab thickness
  const RW = 0.65;   // return arm width (along X)
  const RL = 1.65;   // return arm extra extension toward camera

  // Rotated 180 degrees from the original layout.
  const rightEdge = MX + MW / 2;

  // Return arm: now hooks on the opposite side and extends toward the rear door.
  const retZ = MZ - RL / 2;
  const retX = rightEdge - RW / 2;

  // Bar stool z - customer side after the 180 degree rotation.

  return (
    <group>
      {/* ── Main arm (long, along X) ── */}
      <RoundedBox args={[MW, H, D]} radius={0.1} smoothness={3}
        position={[MX, H / 2, MZ]} castShadow receiveShadow>
        <meshToonMaterial color="#2a1608" />
      </RoundedBox>
      <RoundedBox args={[MW + 0.1, TOP, D + 0.08]} radius={0.06} smoothness={3}
        position={[MX, H + TOP / 2, MZ]} castShadow>
        <meshToonMaterial color="#e8c070" />
      </RoundedBox>

      {/* ── Return arm (perpendicular, along Z) ── */}
      <RoundedBox args={[RW, H, D + RL]} radius={0.1} smoothness={3}
        position={[retX, H / 2, retZ]} castShadow receiveShadow>
        <meshToonMaterial color="#2a1608" />
      </RoundedBox>
      <RoundedBox args={[RW + 0.08, TOP, D + RL + 0.08]} radius={0.06} smoothness={3}
        position={[retX, H + TOP / 2, retZ]} castShadow>
        <meshToonMaterial color="#e8c070" />
      </RoundedBox>

      {/* ── Pendant lights above bar ── */}
      {([-1.5, -0.25, 1.0] as number[]).map((x, i) => (
        <group key={i} position={[x, 4.2, MZ + 0.05]}>
          <mesh>
            <cylinderGeometry args={[0.006, 0.006, 2.85, 5]} />
            <meshToonMaterial color="#3a2010" />
          </mesh>
          <mesh position={[0, -1.55, 0]}>
            {/* Cone shade pointing down */}
            <coneGeometry args={[0.20, 0.26, 8, 1, true]} />
            <meshToonMaterial color="#b06820" emissive="#cc5500" emissiveIntensity={0.18} />
          </mesh>
          <pointLight position={[0, -1.7, 0]} intensity={0.36} distance={3.0} color="#ffcc66" />
        </group>
      ))}

      {/* ── Bar stools (customer side) ── */}
      {([-0.5, -1.5, -2.5] as number[]).map((x, i) => (
        <group key={i} position={[x, 0, -8.4]}>
          <mesh position={[0, 0.62, 0]}>
            <cylinderGeometry args={[0.18, 0.16, 0.06, 10]} />
            <meshToonMaterial color="#28aacc" />
          </mesh>
          <mesh position={[0, 0.32, 0]}>
            <cylinderGeometry args={[0.022, 0.022, 0.52, 6]} />
            <meshToonMaterial color="#5a3018" />
          </mesh>
          <mesh position={[0, 0.06, 0]}>
            <cylinderGeometry args={[0.22, 0.22, 0.06, 10]} />
            <meshToonMaterial color="#5a3018" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Bartender bot ────────────────────────────────────────────────────────────

function BartenderNPC({ position, rotation = [0, 0, 0] }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const leftArmRef = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const bodyRef = useRef<THREE.Group>(null);
  const towelRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cleaning = Math.sin(t * 0.30) > 0.60;
    if (leftArmRef.current) {
      const targetZ = cleaning ? 0.26 + Math.sin(t * 2.8) * 0.16 : 0.08;
      leftArmRef.current.position.z += (targetZ - leftArmRef.current.position.z) * 0.08;
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(leftArmRef.current.rotation.x, cleaning ? 0.50 : 0.08, 0.08);
      leftArmRef.current.rotation.z = THREE.MathUtils.lerp(leftArmRef.current.rotation.z, cleaning ? 0.48 : 0.30, 0.08);
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.z = THREE.MathUtils.lerp(rightArmRef.current.rotation.z, -0.34 + Math.sin(t * 0.9) * 0.04, 0.08);
    }
    if (towelRef.current) {
      towelRef.current.visible = cleaning;
    }
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(t * 0.9) * 0.025;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={NPC_SCALE}>
      <group ref={bodyRef}>
        <RoundedBox args={[0.38, 0.50, 0.26]} radius={0.12} smoothness={4} position={[0, 0.72, 0]} castShadow>
          <meshToonMaterial color="#4c6a72" />
        </RoundedBox>
        <RoundedBox args={[0.30, 0.42, 0.05]} radius={0.05} smoothness={3} position={[0, 0.67, 0.145]}>
          <meshToonMaterial color="#f2dfc2" />
        </RoundedBox>
        <RoundedBox args={[0.08, 0.22, 0.04]} radius={0.025} smoothness={3} position={[0, 0.73, 0.175]}>
          <meshToonMaterial color="#5b2c1a" />
        </RoundedBox>
        <mesh position={[0, 1.09, 0.01]} castShadow>
          <sphereGeometry args={[0.18, 18, 18]} />
          <meshToonMaterial color="#e4b78e" />
        </mesh>
        <mesh position={[0, 1.225, -0.02]} scale={[1.0, 0.38, 0.86]} castShadow>
          <sphereGeometry args={[0.19, 16, 16]} />
          <meshToonMaterial color="#352016" />
        </mesh>
        <RoundedBox args={[0.10, 0.12, 0.10]} radius={0.05} smoothness={3} position={[-0.17, 1.13, 0.00]} castShadow>
          <meshToonMaterial color="#352016" />
        </RoundedBox>
        <RoundedBox args={[0.10, 0.12, 0.10]} radius={0.05} smoothness={3} position={[0.17, 1.13, 0.00]} castShadow>
          <meshToonMaterial color="#352016" />
        </RoundedBox>
        {([-0.055, 0.055] as number[]).map((x) => (
          <mesh key={x} position={[x, 1.095, 0.175]}>
            <sphereGeometry args={[0.016, 8, 8]} />
            <meshBasicMaterial color="#2a1a14" />
          </mesh>
        ))}
        <RoundedBox args={[0.14, 0.032, 0.035]} radius={0.014} smoothness={3} position={[0, 1.045, 0.18]}>
          <meshBasicMaterial color="#5b2c1a" />
        </RoundedBox>
        <mesh position={[0, 0.98, 0.17]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.052, 0.010, 6, 14, Math.PI]} />
          <meshBasicMaterial color="#a85c48" />
        </mesh>
        <group ref={rightArmRef} position={[0.19, 0.76, 0.0]} rotation={[0, Math.PI, -0.26]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.060, 0.24, 4, 8]} />
            <meshToonMaterial color="#4c6a72" />
          </mesh>
          <mesh position={[0.02, -0.15, 0.08]} castShadow>
            <sphereGeometry args={[0.060, 10, 10]} />
            <meshToonMaterial color="#e4b78e" />
          </mesh>
        </group>
        <group ref={leftArmRef} position={[-0.19, 0.76, 0.0]} rotation={[0, Math.PI, 0.26]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.060, 0.24, 4, 8]} />
            <meshToonMaterial color="#4c6a72" />
          </mesh>
          <mesh position={[-0.01, -0.15, 0.10]} castShadow>
            <sphereGeometry args={[0.060, 10, 10]} />
            <meshToonMaterial color="#e4b78e" />
          </mesh>
          <mesh ref={towelRef} position={[-0.03, -0.20, 0.17]} rotation={[0.3, 0, -0.2]}>
            <planeGeometry args={[0.20, 0.13]} />
            <meshBasicMaterial color="#f7f0df" transparent opacity={0.88} side={THREE.DoubleSide} />
          </mesh>
        </group>
        <group position={[-0.33, 1.12, 0.30]} rotation={[0.08, 0, -0.12]}>
          <mesh>
            <cylinderGeometry args={[0.055, 0.045, 0.18, 12, 1, true]} />
            <meshToonMaterial color="#b8eef2" transparent opacity={0.42} />
          </mesh>
          <mesh position={[0, -0.10, 0]}>
            <cylinderGeometry args={[0.035, 0.035, 0.018, 12]} />
            <meshToonMaterial color="#f3c36d" />
          </mesh>
        </group>
        <group position={[0.35, 1.10, 0.24]}>
          <mesh>
            <cylinderGeometry args={[0.032, 0.040, 0.22, 10]} />
            <meshToonMaterial color="#5b2230" />
          </mesh>
          <mesh position={[0, 0.14, 0]}>
            <cylinderGeometry args={[0.016, 0.024, 0.08, 8]} />
            <meshToonMaterial color="#d8c890" />
          </mesh>
        </group>
      </group>
    </group>
  );
}

// ─── Seated NPC passenger ─────────────────────────────────────────────────────

type PassengerKind = 'reader' | 'sleepy' | 'patron';

function TrainNPC({
  position,
  rotation = [0, 0, 0] as [number, number, number],
  bodyColor = '#4a70a8',
  hairColor = '#2a1808',
  skinColor = '#f0c8a0',
  kind = 'reader',
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  bodyColor?: string;
  hairColor?: string;
  skinColor?: string;
  kind?: PassengerKind;
}) {
  const headRef = useRef<THREE.Group>(null);
  const propRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    if (headRef.current) {
      const nod = kind === 'sleepy' ? Math.sin(t * 0.55) * 0.10 - 0.08 : Math.sin(t * 0.75) * 0.025;
      headRef.current.rotation.x = nod;
      headRef.current.rotation.z = kind === 'sleepy' ? Math.sin(t * 0.45) * 0.07 : 0;
    }
    if (propRef.current && kind === 'reader') {
      propRef.current.rotation.z = Math.sin(t * 0.9) * 0.025;
    }
  });

  return (
    <group position={position} rotation={rotation} scale={NPC_SCALE}>
      <RoundedBox args={[0.38, 0.46, 0.30]} radius={0.13} smoothness={4} position={[0, 0.24, 0]} castShadow>
        <meshToonMaterial color={bodyColor} />
      </RoundedBox>
      <RoundedBox args={[0.22, 0.12, 0.035]} radius={0.018} smoothness={3} position={[0, 0.36, 0.16]}>
        <meshToonMaterial color={kind === 'patron' ? '#f0d888' : '#fff0d0'} />
      </RoundedBox>
      <group ref={headRef} position={[0, 0.63, 0.02]}>
        <mesh castShadow>
          <sphereGeometry args={[0.185, 16, 16]} />
          <meshToonMaterial color={skinColor} />
        </mesh>
        <mesh position={[0, 0.13, -0.02]} scale={[1.0, 0.38, 0.82]} castShadow>
          <sphereGeometry args={[0.19, 14, 14]} />
          <meshToonMaterial color={hairColor} />
        </mesh>
        <RoundedBox args={[0.13, 0.10, 0.12]} radius={0.05} smoothness={3} position={[-0.15, 0.055, 0]} castShadow>
          <meshToonMaterial color={hairColor} />
        </RoundedBox>
        <RoundedBox args={[0.13, 0.10, 0.12]} radius={0.05} smoothness={3} position={[0.15, 0.055, 0]} castShadow>
          <meshToonMaterial color={hairColor} />
        </RoundedBox>
        {kind === 'sleepy' ? (
          <>
            <mesh position={[-0.06, 0.00, 0.17]} rotation={[0, 0, 0.18]}>
              <boxGeometry args={[0.052, 0.008, 0.006]} />
              <meshBasicMaterial color="#342018" />
            </mesh>
            <mesh position={[0.06, 0.00, 0.17]} rotation={[0, 0, -0.18]}>
              <boxGeometry args={[0.052, 0.008, 0.006]} />
              <meshBasicMaterial color="#342018" />
            </mesh>
          </>
        ) : (
          ([-0.06, 0.06] as number[]).map((x) => (
            <mesh key={x} position={[x, 0.00, 0.17]}>
              <sphereGeometry args={[0.014, 8, 8]} />
              <meshBasicMaterial color="#281812" />
            </mesh>
          ))
        )}
        <mesh position={[0, -0.055, 0.175]} rotation={[0, 0, Math.PI]}>
          <torusGeometry args={[0.040, 0.008, 5, 12, Math.PI]} />
          <meshBasicMaterial color="#b06b58" />
        </mesh>
      </group>
      <mesh position={[-0.21, 0.30, 0.0]} rotation={[0, Math.PI, 0.22]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.21, 0.30, 0.0]} rotation={[0, Math.PI, -0.22]} castShadow>
        <capsuleGeometry args={[0.055, 0.18, 4, 8]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      {kind === 'reader' && (
        <group ref={propRef} position={[0, 0.35, 0.23]} rotation={[-0.28, 0, 0]}>
          <RoundedBox args={[0.30, 0.19, 0.035]} radius={0.018} smoothness={3}>
            <meshToonMaterial color="#d94f3d" />
          </RoundedBox>
          <mesh position={[0, 0, 0.022]}>
            <boxGeometry args={[0.012, 0.18, 0.008]} />
            <meshBasicMaterial color="#f6dca6" />
          </mesh>
        </group>
      )}
      {kind === 'sleepy' && (
        <Float speed={0.65} floatIntensity={0.06} rotationIntensity={0}>
          <group position={[0.22, 0.94, 0.12]}>
            <Text fontSize={0.13} color="#aaccff" anchorX="center" anchorY="middle">Z</Text>
          </group>
        </Float>
      )}
      {kind === 'patron' && (
        <group position={[0.17, 0.39, 0.24]}>
          <mesh>
            <cylinderGeometry args={[0.045, 0.040, 0.10, 10]} />
            <meshToonMaterial color="#b8eef2" transparent opacity={0.48} />
          </mesh>
          <mesh position={[0, -0.055, 0]}>
            <cylinderGeometry args={[0.030, 0.030, 0.018, 10]} />
            <meshToonMaterial color="#f0bd62" />
          </mesh>
        </group>
      )}
    </group>
  );
}

// ─── Sliding door ─────────────────────────────────────────────────────────────

function SlidingDoor({ position, conductorZ, triggerZ, flip = false }: {
  position: [number, number, number];
  conductorZ: React.MutableRefObject<number>;
  triggerZ: number;
  flip?: boolean;
}) {
  const panelRef = useRef<THREE.Group>(null);
  const OPEN_X = flip ? 2.0 : -2.0;

  useFrame((_, dt) => {
    const panel = panelRef.current;
    if (!panel) return;
    const near = Math.abs(conductorZ.current - triggerZ) < 1.6;
    const targetX = near ? OPEN_X : 0;
    panel.position.x += (targetX - panel.position.x) * Math.min(1, dt * 4.5);
  });

  const wallColor = '#5a3018';
  return (
    <group position={position}>
      <RoundedBox args={[1.6, 4.5, 0.28]} radius={0.1} smoothness={3} position={[-2.4, 2.25, 0]}>
        <meshToonMaterial color={wallColor} />
      </RoundedBox>
      <RoundedBox args={[1.6, 4.5, 0.28]} radius={0.1} smoothness={3} position={[2.4, 2.25, 0]}>
        <meshToonMaterial color={wallColor} />
      </RoundedBox>
      <RoundedBox args={[1.95, 1.55, 0.28]} radius={0.1} smoothness={3} position={[0, 3.73, 0]}>
        <meshToonMaterial color={wallColor} />
      </RoundedBox>
      <group ref={panelRef}>
        <RoundedBox args={[1.72, 2.72, 0.10]} radius={0.06} smoothness={3} position={[0, 1.36, 0]}>
          <meshToonMaterial color="#3e2010" />
        </RoundedBox>
        <mesh position={[0, 1.60, 0.06]}>
          <planeGeometry args={[0.7, 0.48]} />
          <meshBasicMaterial color="#07101e" transparent opacity={0.75} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Conductor ────────────────────────────────────────────────────────────────

const CONDUCTOR_WALK_FREQ = 5.5;

function ConductorNPC({ conductorRef }: { conductorRef: React.RefObject<THREE.Group> }) {
  const lanternRef  = useRef<THREE.Group>(null);
  const rightArmRef = useRef<THREE.Group>(null);
  const leftArmRef  = useRef<THREE.Group>(null);
  const leftLegRef  = useRef<THREE.Group>(null);
  const rightLegRef = useRef<THREE.Group>(null);
  const bodyRef     = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const stride = Math.sin(t * CONDUCTOR_WALK_FREQ);

    if (leftLegRef.current)  leftLegRef.current.rotation.x  =  stride * 0.44;
    if (rightLegRef.current) rightLegRef.current.rotation.x = -stride * 0.44;

    if (leftArmRef.current) {
      leftArmRef.current.rotation.x = THREE.MathUtils.lerp(
        leftArmRef.current.rotation.x, stride * 0.30, 0.18,
      );
    }
    if (rightArmRef.current) {
      rightArmRef.current.rotation.x = THREE.MathUtils.lerp(
        rightArmRef.current.rotation.x, -stride * 0.24, 0.18,
      );
    }

    if (bodyRef.current) {
      bodyRef.current.rotation.z = stride * 0.022;
    }

    if (lanternRef.current) {
      lanternRef.current.rotation.z = stride * 0.20;
      lanternRef.current.position.y = 0.35 +Math.abs(stride) * 0.018;
      lanternRef.current.position.z =  Math.sin(t * CONDUCTOR_WALK_FREQ) * 0.05;
    }
  });

  return (
    <group ref={conductorRef} position={[2.2, 0, 0]} scale={NPC_SCALE}>
      <group ref={bodyRef}>
        <RoundedBox args={[0.34, 0.52, 0.22]} radius={0.10} smoothness={4} position={[0, 0.62, 0]} castShadow>
          <meshToonMaterial color="#243044" />
        </RoundedBox>
        <RoundedBox args={[0.22, 0.44, 0.04]} radius={0.035} smoothness={3} position={[0, 0.60, 0.125]}>
          <meshToonMaterial color="#f3d18a" />
        </RoundedBox>
        <RoundedBox args={[0.08, 0.40, 0.045]} radius={0.02} smoothness={3} position={[0, 0.62, 0.155]}>
          <meshToonMaterial color="#7e2d28" />
        </RoundedBox>
        <mesh position={[0, 1.08, 0.01]} castShadow>
          <sphereGeometry args={[0.17, 16, 16]} />
          <meshToonMaterial color="#d8aa80" />
        </mesh>
        <mesh position={[0, 1.20, -0.015]} scale={[1.05, 0.35, 0.82]} castShadow>
          <sphereGeometry args={[0.18, 14, 14]} />
          <meshToonMaterial color="#2b1a12" />
        </mesh>
        <RoundedBox args={[0.34, 0.065, 0.32]} radius={0.025} smoothness={3} position={[0, 1.22, 0.01]}>
          <meshToonMaterial color="#192033" />
        </RoundedBox>
        <RoundedBox args={[0.24, 0.15, 0.21]} radius={0.055} smoothness={3} position={[0, 1.30, -0.005]}>
          <meshToonMaterial color="#243044" />
        </RoundedBox>
        <RoundedBox args={[0.16, 0.035, 0.035]} radius={0.012} smoothness={3} position={[0, 1.285, 0.13]}>
          <meshToonMaterial color="#f3d18a" />
        </RoundedBox>
        {([-0.055, 0.055] as number[]).map((x) => (
          <mesh key={x} position={[x, 1.075, 0.165]}>
            <sphereGeometry args={[0.014, 8, 8]} />
            <meshBasicMaterial color="#21140e" />
          </mesh>
        ))}
        <RoundedBox args={[0.11, 0.026, 0.026]} radius={0.012} smoothness={3} position={[0, 1.025, 0.17]}>
          <meshBasicMaterial color="#704028" />
        </RoundedBox>
        <group ref={leftArmRef} position={[-0.19, 0.68, 0.0]} rotation={[0, Math.PI, 0.32]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.055, 0.24, 4, 8]} />
            <meshToonMaterial color="#243044" />
          </mesh>
          <mesh position={[-0.02, -0.16, 0.04]} castShadow>
            <sphereGeometry args={[0.052, 10, 10]} />
            <meshToonMaterial color="#d8aa80" />
          </mesh>
          <RoundedBox args={[0.13, 0.055, 0.035]} radius={0.016} smoothness={3} position={[-0.08, -0.21, 0.04]} rotation={[0, 0, -0.25]}>
            <meshToonMaterial color="#d9c3a0" />
          </RoundedBox>
        </group>
        <group ref={rightArmRef} position={[0.19, 0.68, 0.0]} rotation={[0, Math.PI, -0.28]}>
          <mesh castShadow>
            <capsuleGeometry args={[0.055, 0.24, 4, 8]} />
            <meshToonMaterial color="#243044" />
          </mesh>
          <mesh position={[0.02, -0.16, 0.04]} castShadow>
            <sphereGeometry args={[0.052, 10, 10]} />
            <meshToonMaterial color="#d8aa80" />
          </mesh>
        </group>
        <group ref={lanternRef} position={[0.19, 0, 0]}>
          <mesh position={[0, 0.12, 0]}>
            <torusGeometry args={[0.055, 0.008, 5, 12, Math.PI]} />
            <meshToonMaterial color="#4a3420" />
          </mesh>
          <RoundedBox args={[0.11, 0.16, 0.09]} radius={0.025} smoothness={3}>
            <meshToonMaterial color="#4a3420" />
          </RoundedBox>
          <mesh position={[0, 0.00, 0.055]}>
            <planeGeometry args={[0.060, 0.075]} />
            <meshBasicMaterial color="#ffd37a" transparent opacity={0.80} />
          </mesh>
          <pointLight position={[0, 0, 0.08]} intensity={0.35} distance={1.7} color="#ffbd5a" />
        </group>
      </group>
      {/* Legs — pivot from hip so rotation swings foot forward/back */}
      <group ref={leftLegRef} position={[-0.10, 0.41, 0]}>
        <mesh position={[0, -0.205, 0]} castShadow>
          <capsuleGeometry args={[0.052, 0.27, 6, 8]} />
          <meshToonMaterial color="#171a24" />
        </mesh>
      </group>
      <group ref={rightLegRef} position={[0.10, 0.41, 0]}>
        <mesh position={[0, -0.205, 0]} castShadow>
          <capsuleGeometry args={[0.052, 0.27, 6, 8]} />
          <meshToonMaterial color="#171a24" />
        </mesh>
      </group>
    </group>
  );
}

// ─── Main scene ───────────────────────────────────────────────────────────────

export function Train() {
  const trainRef = useRef<THREE.Group>(null);
  const conductorRef = useRef<THREE.Group>(null);
  // Start far from any door trigger so doors are closed on load
  const conductorZ = useRef(1000);

  const X_LEFT  = -3.0;
  const X_RIGHT =  4.5;
  const Z_NEAR  =  2.0;
  const Z_FAR   = -10.2;
  const CAR_W   = X_RIGHT - X_LEFT;
  const CAR_L   = Z_NEAR  - Z_FAR;
  const CAR_H   = 4.5;
  const BAR_STOOL_Z= -8.4;
  const CX      = (X_LEFT + X_RIGHT) / 2;
  const DOOR = 2;
  const WINDOW_PAD = 1.0;
  const WINDOW_W = CAR_L - WINDOW_PAD * 2;
  const WINDOW_Z = (Z_NEAR + Z_FAR) / 2;

  const WALK_PERIOD = 22; // seconds: 0–82% walking, 82–100% hidden/reset

  useFrame(({ clock }) => {
    if (trainRef.current) {
      trainRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.6) * 0.008;
    }

    const t = clock.getElapsedTime();
    const phase = (t % WALK_PERIOD) / WALK_PERIOD;

    // Phase 0–0.82: conductor walks near→far (visible, door triggers active)
    // Phase 0.82–1.0: conductor hidden, reset to near position
    const walking = phase < 0.82;
    const z = walking
      ? THREE.MathUtils.lerp(Z_NEAR - 0.2, Z_FAR + 0.2, phase / 0.82)
      : Z_NEAR - 0.2;

    conductorZ.current = walking ? z : 1000;

    if (conductorRef.current) {
      conductorRef.current.visible = walking;
      conductorRef.current.position.z = z;
      conductorRef.current.rotation.y = Math.PI; // face −Z, walking into scene
      conductorRef.current.position.y = walking ? Math.abs(Math.sin(t * CONDUCTOR_WALK_FREQ)) * 0.030 : 0;
    }
  });

  // Bar geometry constants (must match LBar internals for NPC placement)
 

  return (
    <>
      <color attach="background" args={['#1e1008']} />
      <fog attach="fog" args={['#1e1008', 8, 20]} />
      <Environment preset="sunset" />
      <ambientLight intensity={0.60} color="#ffcc66" />
      <directionalLight
        position={[2, 6, 4]}
        intensity={1.1}
        color="#ffcc66"
        castShadow
        shadow-mapSize-width={1024}
        shadow-mapSize-height={1024}
      />
      <directionalLight position={[-3, 2, -2]} intensity={0.22} color="#ff9933" />

      <group ref={trainRef}>
        {/* ── Floor ── */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[CAR_W, CAR_L]} />
          <meshToonMaterial color="#3c2010" />
        </mesh>
        {Array.from({ length: 9 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[X_LEFT + 0.5 + i * 0.84, 0.002, (Z_NEAR + Z_FAR) / 2]}>
            <planeGeometry args={[0.04, CAR_L]} />
            <meshBasicMaterial color="#5a3418" transparent opacity={0.45} />
          </mesh>
        ))}

        {/* ── Aisle runner rug ── */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.05, 0.03, (Z_NEAR + Z_FAR) / 2]} receiveShadow>
          <planeGeometry args={[1.0, CAR_L - 1]} />
          <meshToonMaterial color="#cc2820" transparent opacity={0.88} />
        </mesh>

        {/* ── Left wall ── */}
        <RoundedBox args={[0.3, CAR_H, CAR_L]} radius={0.1} smoothness={4}
          position={[X_LEFT - 0.15, CAR_H / 2, (Z_NEAR + Z_FAR) / 2]} receiveShadow>
          <meshToonMaterial color="#6a3a1a" />
        </RoundedBox>
        <RoundedBox args={[0.12, 1.4, CAR_L - 1.0]} radius={0.06} smoothness={3}
          position={[X_LEFT + 0.06, 0.80, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#3e2010" />
        </RoundedBox>
        <TrainWindow
          position={[X_LEFT + 0.14, 1.9, WINDOW_Z]}
          rotation={[0, Math.PI / 2, 0]}
          width={WINDOW_W}
          height={1.05}
          struts={4}
          showMoon
        />

        {/* ── Right wall ── */}
        <RoundedBox args={[0.3, CAR_H, CAR_L]} radius={0.1} smoothness={4}
          position={[X_RIGHT + 0.15, CAR_H / 2, (Z_NEAR + Z_FAR) / 2]} receiveShadow>
          <meshToonMaterial color="#6a3a1a" />
        </RoundedBox>
        <RoundedBox args={[0.12, 1.4, CAR_L - 1.0]} radius={0.06} smoothness={3}
          position={[X_RIGHT - 0.06, 0.80, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#3e2010" />
        </RoundedBox>
        <TrainWindow
          position={[X_RIGHT - 0.14, 1.9, WINDOW_Z]}
          rotation={[0, -Math.PI / 2, 0]}
          width={WINDOW_W}
          height={1.05}
          struts={4}
        />

        {/* ── Back wall (z=Z_FAR) — left fill panel beside sliding door ── */}
        <RoundedBox args={[1.8, CAR_H, 0.28]} radius={0.08} smoothness={4}
          position={[X_LEFT + 0.9, CAR_H / 2, Z_FAR - 0.14]} receiveShadow>
          <meshToonMaterial color="#6a3a1a" />
        </RoundedBox>

        {/* ── Front wall (z=Z_NEAR) — left fill panel beside sliding door ── */}
        <RoundedBox args={[1.8, CAR_H, 0.28]} radius={0.08} smoothness={4}
          position={[X_LEFT + 0.9, CAR_H / 2, Z_NEAR + 0.14]} receiveShadow>
          <meshToonMaterial color="#6a3a1a" />
        </RoundedBox>

        {/* ── Solid backdrop planes — block any gap visible through door frames ── */}
        <mesh position={[CX, CAR_H / 2, Z_FAR - 0.55]}>
          <planeGeometry args={[CAR_W + 0.6, CAR_H + 0.3]} />
          <meshBasicMaterial color="#4a2810" />
        </mesh>
        <mesh position={[CX, CAR_H / 2, Z_NEAR + 0.55]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[CAR_W + 0.6, CAR_H + 0.3]} />
          <meshBasicMaterial color="#4a2810" />
        </mesh>

        {/* ── Ceiling ── */}
        <RoundedBox args={[CAR_W + 0.5, 0.4, CAR_L]} radius={0.15} smoothness={4}
          position={[CX, CAR_H + 0.2, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#5a3c1e" />
        </RoundedBox>
        <RoundedBox args={[0.18, 0.18, CAR_L - 1]} radius={0.06} smoothness={3}
          position={[CX, CAR_H - 0.02, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#3a2010" />
        </RoundedBox>

        {/* ── Globe lamps ── */}
        {([-1.5, -3.5, -5.5, -7.5] as number[]).map((z) => (
          <GlobeLamp key={z} position={[CX, CAR_H - 0.45, z]} />
        ))}

        {/* ── Booth tables ── */}
        {([-1.8, -5.3] as number[]).map((z) => (
          <BoothSet key={z} z={z} />
        ))}

        {/* ── Work tables — P1&P2 at z=-2, P3&P4 at z=-0.7 ── */}
        {([-2.85, -0.5] as number[]).map((tz) => (
          <group key={tz}>
            <RoundedBox args={[3.4, 0.06, 0.88]} radius={0.04} smoothness={3}
              position={[-0.45, 0.81, tz]} castShadow receiveShadow>
              <meshToonMaterial color="#b06420" />
            </RoundedBox>
            <RoundedBox args={[3.28, 0.07, 0.76]} radius={0.03} smoothness={3}
              position={[-0.45, 0.745, tz]}>
              <meshToonMaterial color="#4a2e16" />
            </RoundedBox>
            {([-1.54, 1.54] as number[]).map((dx) =>
              ([-0.36, 0.36] as number[]).map((dz) => (
                <mesh key={`${dx}-${dz}`} position={[-0.45 + dx, 0.365, tz + dz]} castShadow>
                  <cylinderGeometry args={[0.022, 0.026, 0.73, 6]} />
                  <meshToonMaterial color="#3a1e0a" />
                </mesh>
              ))
            )}
          </group>
        ))}

        {/* ── Seated NPC passengers ── */}
        {/* Bench NPCs — positioned at seat surface y≈0.28, facing −X toward table */}
        <TrainNPC
          position={[3.9, 0.28, -1]}
          rotation={[0, Math.PI, 0]}
          bodyColor="#8840c0"
          hairColor="#2a1836"
          kind="reader"
        />
        <TrainNPC
          position={[3.9, 0.28, -6.2]}
          rotation={[0, 0, 0]}
          bodyColor="#c04030"
          hairColor="#5b2c18"
          skinColor="#e0a880"
          kind="sleepy"
        />
        {/* Bar stool NPC — sits at stool, faces bar (+Z away from back wall) */}
        <TrainNPC
          position={[-0.5, 0.7, BAR_STOOL_Z]}
          rotation={[0, Math.PI, 0]}
          bodyColor="#208860"
          hairColor="#183024"
          skinColor="#d4a070"
          kind="patron"
        />

        {/* ── L-shaped bar ── */}
        <LBar />

        {/* ── Drink shelf on back wall ── */}
        <DrinkShelf position={[-1.2, 0, Z_FAR + 0.16]} />

        {/* ── Bartender bot ── */}
        {/* Behind the rotated main bar, facing customers */}
        <BartenderNPC position={[-1.35, 0, -9.8]} rotation={[0, 0, 0]} />

        {/* ── Destination sign (far end, above door) ── */}
        <group position={[CX, 4.0, Z_FAR + 0.3]}>
          <RoundedBox args={[2.8, 0.42, 0.08]} radius={0.08} smoothness={3}>
            <meshToonMaterial color="#2a1410" />
          </RoundedBox>
        </group>

        {/* ── Doors at both ends ── */}
        <SlidingDoor position={[DOOR, 0, Z_NEAR]} conductorZ={conductorZ} triggerZ={1.5} />
        <SlidingDoor position={[DOOR, 0, Z_FAR]} conductorZ={conductorZ} triggerZ={-9.8} flip />

        {/* ── Conductor ── */}
        <ConductorNPC conductorRef={conductorRef} />

        {/* ── Floating dust motes ── */}
        {Array.from({ length: 12 }, (_, i) => (
          <Float key={i} speed={0.4 + (i % 4) * 0.12} floatIntensity={0.22} rotationIntensity={0}>
            <mesh position={[
              X_LEFT + 1 + ((i * 43 + 3) % 100) / 18,
              1.0 + ((i * 29 + 5) % 100) / 36,
              -1.0 - ((i * 17 + 9) % 100) / 11,
            ]}>
              <sphereGeometry args={[0.013 + ((i * 7) % 3) * 0.004, 6, 6]} />
              <meshBasicMaterial color="#ffdd99" transparent opacity={0.24} />
            </mesh>
          </Float>
        ))}
      </group>
    </>
  );
}
