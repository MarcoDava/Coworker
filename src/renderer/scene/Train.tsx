import { Environment, Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// ─── Scrolling city backdrop ─────────────────────────────────────────────────

function ScrollingCityStrip({ D, W, H }: { D: number; W: number; H: number }) {
  const STRIP = W * 2.5;
  const Z = -D * 0.43;
  const groupRef = useRef<THREE.Group>(null);

  const buildings = useMemo(() => {
    const count = 22;
    return Array.from({ length: count }, (_, i) => {
      const bw = 0.10 + ((i * 17 + 3) % 5) * 0.05;
      const bh = 0.28 + ((i * 29 + 7) % 10) * 0.062;
      const x = (i / count) * STRIP;
      const yCenter = -H / 2 + bh / 2;
      const wins: { wx: number; wy: number; color: string }[] = [];
      const cols = Math.max(1, Math.floor(bw / 0.034));
      const rows = Math.max(1, Math.floor(bh / 0.042));
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
    g.position.x -= 0.28 * dt;
    if (g.position.x < -STRIP) g.position.x += STRIP;
  });

  return (
    <group ref={groupRef}>
      {([0, STRIP] as number[]).map((offset) =>
        buildings.map((b, i) => (
          <group key={`${offset}-${i}`} position={[b.x + offset - W * 0.8, b.yCenter, Z]}>
            <mesh>
              <boxGeometry args={[b.bw, b.bh, 0.001]} />
              <meshBasicMaterial color="#1c2030" />
            </mesh>
            {b.wins.map((w, j) => (
              <mesh key={j} position={[w.wx, w.wy, 0.002]}>
                <planeGeometry args={[0.018, 0.014]} />
                <meshBasicMaterial color={w.color} />
              </mesh>
            ))}
          </group>
        ))
      )}
    </group>
  );
}

// ─── Side window ─────────────────────────────────────────────────────────────

function TrainWindow({ position, rotation }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  const W = 1.1; const H = 0.88; const F = 0.12; const D = 0.16;

  const stars = useMemo(() =>
    Array.from({ length: 20 }, (_, i) => ({
      x: -0.44 + ((i * 41 + 3) % 100) / 114,
      y: 0.02 + ((i * 31 + 7) % 100) / 220,
      r: 0.006 + ((i * 13) % 3) * 0.003,
    })), []);

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -D * 0.55]}>
        <planeGeometry args={[W, H]} />
        <meshBasicMaterial color="#07101e" />
      </mesh>
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, -D * 0.5]}>
          <circleGeometry args={[s.r, 6]} />
          <meshBasicMaterial color="#d0dcff" />
        </mesh>
      ))}
      <mesh position={[0.26, 0.20, -D * 0.48]}>
        <circleGeometry args={[0.08, 16]} />
        <meshBasicMaterial color="#dde8b0" />
      </mesh>
      <mesh position={[-0.18, -0.28, -D * 0.46]}>
        <circleGeometry args={[0.25, 20]} />
        <meshBasicMaterial color="#0a0f08" />
      </mesh>
      <ScrollingCityStrip D={D} W={W} H={H} />
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
        <sphereGeometry args={[0.11, 14, 14]} />
        <meshToonMaterial color="#ffe4a8" emissive="#ffb844" emissiveIntensity={0.7} />
      </mesh>
      <pointLight intensity={1.0} distance={5} color="#ffb844" />
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

  // Left edge of main arm
  const leftEdge = MX - MW / 2; // −3.1

  // Return arm: extends from back of main arm forward (+Z), flush with main arm back face
  const retZ = MZ + RL / 2;  // center of return arm Z
  const retX = leftEdge + RW / 2; // −2.775

  // Bar stool z — in front of main arm front face
  const stoolZ = MZ + D / 2 + 0.55; // −8.125

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
        <group key={i} position={[x, 4.2, MZ - 0.05]}>
          <mesh>
            <cylinderGeometry args={[0.006, 0.006, 2.85, 5]} />
            <meshToonMaterial color="#3a2010" />
          </mesh>
          <mesh position={[0, -1.55, 0]}>
            {/* Cone shade pointing down */}
            <coneGeometry args={[0.20, 0.26, 8, 1, true]} />
            <meshToonMaterial color="#b06820" emissive="#cc5500" emissiveIntensity={0.18} />
          </mesh>
          <pointLight position={[0, -1.7, 0]} intensity={0.65} distance={4.2} color="#ffcc66" />
        </group>
      ))}

      {/* ── Bar stools (customer side) ── */}
      {([-0.4, 0.4, 1.2] as number[]).map((x, i) => (
        <group key={i} position={[x, 0, stoolZ]}>
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

function BartenderBot({ position }: { position: [number, number, number] }) {
  const leftArmRef = useRef<THREE.Mesh>(null);
  const bodyRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    const cleaning = Math.sin(t * 0.30) > 0.60;
    if (leftArmRef.current) {
      const targetZ = cleaning ? 0.26 + Math.sin(t * 2.8) * 0.14 : 0.06;
      const targetRX = cleaning ? -0.48 : 0.0;
      leftArmRef.current.position.z += (targetZ - leftArmRef.current.position.z) * 0.07;
      leftArmRef.current.rotation.x += (targetRX - leftArmRef.current.rotation.x) * 0.07;
    }
    if (bodyRef.current) {
      bodyRef.current.rotation.z = Math.sin(t * 0.9) * 0.03;
    }
  });

  return (
    <group position={position}>
      <group ref={bodyRef}>
        {/* Body */}
        <RoundedBox args={[0.30, 0.42, 0.22]} radius={0.09} smoothness={3} position={[0, 0.71, 0]} castShadow>
          <meshToonMaterial color="#3a5a8a" />
        </RoundedBox>
        {/* Apron */}
        <RoundedBox args={[0.24, 0.36, 0.04]} radius={0.04} smoothness={3} position={[0, 0.63, 0.12]}>
          <meshToonMaterial color="#e8e0d0" />
        </RoundedBox>
        {/* Head */}
        <RoundedBox args={[0.26, 0.22, 0.24]} radius={0.09} smoothness={3} position={[0, 1.06, 0]} castShadow>
          <meshToonMaterial color="#5080b8" />
        </RoundedBox>
        {/* Face screen */}
        <mesh position={[0, 1.06, 0.13]}>
          <planeGeometry args={[0.15, 0.08]} />
          <meshBasicMaterial color="#1a2a4a" />
        </mesh>
        <mesh position={[-0.033, 1.065, 0.14]}>
          <circleGeometry args={[0.012, 8]} />
          <meshBasicMaterial color="#66ccff" />
        </mesh>
        <mesh position={[0.033, 1.065, 0.14]}>
          <circleGeometry args={[0.012, 8]} />
          <meshBasicMaterial color="#66ccff" />
        </mesh>
        {/* Right arm (static) */}
        <mesh position={[0.20, 0.70, 0.0]} rotation={[0, 0, -0.35]} castShadow>
          <capsuleGeometry args={[0.058, 0.20, 4, 8]} />
          <meshToonMaterial color="#2a4878" />
        </mesh>
        {/* Left arm (cleaning animation) */}
        <mesh ref={leftArmRef} position={[-0.20, 0.74, 0.06]} rotation={[-0.1, 0, 0.35]} castShadow>
          <capsuleGeometry args={[0.058, 0.20, 4, 8]} />
          <meshToonMaterial color="#2a4878" />
        </mesh>
        {/* Ambient glow from face */}
        <pointLight position={[0, 1.10, 0.22]} intensity={0.20} distance={1.8} color="#66ccff" />
      </group>
    </group>
  );
}

// ─── Seated NPC passenger ─────────────────────────────────────────────────────

function TrainNPC({ position, rotation = [0, 0, 0] as [number, number, number], bodyColor = '#4a70a8' }: {
  position: [number, number, number];
  rotation?: [number, number, number];
  bodyColor?: string;
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.36, 0.46, 0.28]} radius={0.12} smoothness={3} position={[0, 0.23, 0]} castShadow>
        <meshToonMaterial color={bodyColor} />
      </RoundedBox>
      <mesh position={[0, 0.64, 0.02]} castShadow>
        <sphereGeometry args={[0.185, 12, 12]} />
        <meshToonMaterial color="#f0c8a0" />
      </mesh>
      <RoundedBox args={[0.32, 0.09, 0.30]} radius={0.06} smoothness={3} position={[0, 0.79, -0.01]} castShadow>
        <meshToonMaterial color="#2a1808" />
      </RoundedBox>
      <RoundedBox args={[0.08, 0.15, 0.28]} radius={0.05} smoothness={3} position={[-0.19, 0.72, -0.01]} castShadow>
        <meshToonMaterial color="#2a1808" />
      </RoundedBox>
      <RoundedBox args={[0.08, 0.15, 0.28]} radius={0.05} smoothness={3} position={[0.19, 0.72, -0.01]} castShadow>
        <meshToonMaterial color="#2a1808" />
      </RoundedBox>
      <mesh position={[-0.26, 0.16, 0.05]} rotation={[0.3, 0, 0.2]} castShadow>
        <capsuleGeometry args={[0.054, 0.16, 4, 6]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
      <mesh position={[0.26, 0.16, 0.05]} rotation={[0.3, 0, -0.2]} castShadow>
        <capsuleGeometry args={[0.054, 0.16, 4, 6]} />
        <meshToonMaterial color={bodyColor} />
      </mesh>
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

function ConductorBot({ botRef }: { botRef: React.RefObject<THREE.Group> }) {
  return (
    <group ref={botRef} position={[2.2, 0, 0]}>
      <RoundedBox args={[0.26, 0.48, 0.17]} radius={0.07} smoothness={3} position={[0, 0.62, 0]} castShadow>
        <meshToonMaterial color="#221408" />
      </RoundedBox>
      <RoundedBox args={[0.07, 0.28, 0.05]} radius={0.03} smoothness={3} position={[-0.07, 0.71, 0.09]} rotation={[0, 0, 0.2]}>
        <meshToonMaterial color="#1a0e06" />
      </RoundedBox>
      <RoundedBox args={[0.07, 0.28, 0.05]} radius={0.03} smoothness={3} position={[0.07, 0.71, 0.09]} rotation={[0, 0, -0.2]}>
        <meshToonMaterial color="#1a0e06" />
      </RoundedBox>
      <mesh position={[0, 1.10, 0]} castShadow>
        <sphereGeometry args={[0.15, 12, 12]} />
        <meshToonMaterial color="#c8a878" />
      </mesh>
      <RoundedBox args={[0.26, 0.05, 0.26]} radius={0.02} smoothness={3} position={[0, 1.22, 0]}>
        <meshToonMaterial color="#1a0e06" />
      </RoundedBox>
      <RoundedBox args={[0.18, 0.17, 0.18]} radius={0.04} smoothness={3} position={[0, 1.30, 0]}>
        <meshToonMaterial color="#1a0e06" />
      </RoundedBox>
      <mesh position={[-0.08, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.26, 6, 8]} />
        <meshToonMaterial color="#181006" />
      </mesh>
      <mesh position={[0.08, 0.22, 0]} castShadow>
        <capsuleGeometry args={[0.05, 0.26, 6, 8]} />
        <meshToonMaterial color="#181006" />
      </mesh>
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
  const CX      = (X_LEFT + X_RIGHT) / 2;

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
      conductorRef.current.position.y = walking ? Math.abs(Math.sin(t * 3.8)) * 0.024 : 0;
    }
  });

  // Bar geometry constants (must match LBar internals for NPC placement)
  const BAR_STOOL_Z = -9.0 + 0.65 / 2 + 0.55; // −8.125

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
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
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
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[2.2, 0.03, (Z_NEAR + Z_FAR) / 2]} receiveShadow>
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
        {([-1.5, -3.5, -5.5, -7.5] as number[]).map((z) => (
          <TrainWindow key={z} position={[X_LEFT + 0.14, 2.7, z]} rotation={[0, Math.PI / 2, 0]} />
        ))}

        {/* ── Right wall ── */}
        <RoundedBox args={[0.3, CAR_H, CAR_L]} radius={0.1} smoothness={4}
          position={[X_RIGHT + 0.15, CAR_H / 2, (Z_NEAR + Z_FAR) / 2]} receiveShadow>
          <meshToonMaterial color="#6a3a1a" />
        </RoundedBox>
        <RoundedBox args={[0.12, 1.4, CAR_L - 1.0]} radius={0.06} smoothness={3}
          position={[X_RIGHT - 0.06, 0.80, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#3e2010" />
        </RoundedBox>
        {([-1.5, -3.5, -5.5, -7.5] as number[]).map((z) => (
          <TrainWindow key={z} position={[X_RIGHT - 0.14, 2.7, z]} rotation={[0, -Math.PI / 2, 0]} />
        ))}

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

        {/* ── Long side table ── */}
        <RoundedBox args={[3.7, 0.14, 7.9]} radius={0.10} smoothness={4}
          position={[-0.15, 0.73, -3.85]} castShadow receiveShadow>
          <meshToonMaterial color="#3a2210" />
        </RoundedBox>
        {([-1.8, 1.5] as number[]).map((x) =>
          ([-0.1, -7.6] as number[]).map((z) => (
            <RoundedBox key={`${x}-${z}`} args={[0.18, 0.66, 0.18]} radius={0.06} smoothness={3}
              position={[x, 0.33, z]}>
              <meshToonMaterial color="#2a1808" />
            </RoundedBox>
          ))
        )}

        {/* ── Bench seats ── */}
        {([-1.0, -2.6, -4.2, -5.8] as number[]).map((z) => (
          <BenchSeat key={z} position={[3.4, 0.14, z]} rotation={[0, Math.PI / 2, 0]} />
        ))}

        {/* ── Seated NPC passengers ── */}
        {/* Bench NPCs — positioned at seat surface y≈0.28, facing −X toward table */}
        <TrainNPC position={[3.4, 0.28, -1.0]} rotation={[0, -Math.PI / 2, 0]} bodyColor="#8840c0" />
        <TrainNPC position={[3.4, 0.28, -4.2]} rotation={[0, -Math.PI / 2, 0]} bodyColor="#c04030" />
        {/* Bar stool NPC — sits at stool, faces bar (+Z away from back wall) */}
        <TrainNPC position={[0.4, 0.62, BAR_STOOL_Z]} rotation={[0, Math.PI, 0]} bodyColor="#208860" />

        {/* ── L-shaped bar ── */}
        <LBar />

        {/* ── Drink shelf on back wall ── */}
        <DrinkShelf position={[-1.2, 0, Z_FAR + 0.16]} />

        {/* ── Bartender bot ── */}
        {/* Behind the main bar, facing +Z toward customers */}
        <BartenderBot position={[-1.2, 0, Z_FAR + 0.82]} />

        {/* ── Destination sign (far end, above door) ── */}
        <group position={[CX, 4.0, Z_FAR + 0.3]}>
          <RoundedBox args={[2.8, 0.42, 0.08]} radius={0.08} smoothness={3}>
            <meshToonMaterial color="#2a1410" />
          </RoundedBox>
        </group>

        {/* ── Doors at both ends ── */}
        <SlidingDoor position={[CX, 0, Z_NEAR]} conductorZ={conductorZ} triggerZ={1.5} />
        <SlidingDoor position={[CX, 0, Z_FAR]} conductorZ={conductorZ} triggerZ={-9.8} flip />

        {/* ── Conductor ── */}
        <ConductorBot botRef={conductorRef} />

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
