import { Environment, Float, RoundedBox } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// ─── Scrolling city backdrop (seen through side windows) ───────────────────

function ScrollingCityStrip({ W, H }: { W: number; H: number }) {
  const STRIP = W * 2.5;
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
          <group key={`${offset}-${i}`} position={[b.x + offset - W * 0.8, b.yCenter, 0]}>
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

// ─── Side window with night scene ─────────────────────────────────────────

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
      <ScrollingCityStrip W={W} H={H} />
      {/* Frame */}
      <RoundedBox args={[W + F * 2, F, D]} radius={0.03} smoothness={3} position={[0,  H / 2 + F / 2, 0]}>
        <meshToonMaterial color="#3a2010" />
      </RoundedBox>
      <RoundedBox args={[W + F * 2, F, D]} radius={0.03} smoothness={3} position={[0, -(H / 2 + F / 2), 0]}>
        <meshToonMaterial color="#3a2010" />
      </RoundedBox>
      <RoundedBox args={[F, H, D]} radius={0.03} smoothness={3} position={[-(W / 2 + F / 2), 0, 0]}>
        <meshToonMaterial color="#3a2010" />
      </RoundedBox>
      <RoundedBox args={[F, H, D]} radius={0.03} smoothness={3} position={[ W / 2 + F / 2, 0, 0]}>
        <meshToonMaterial color="#3a2010" />
      </RoundedBox>
    </group>
  );
}

// ─── Globe lamp ────────────────────────────────────────────────────────────

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

// ─── Bench seat (single bench, 1.5 wide, backrest behind) ─────────────────

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

// ─── Bar (small counter with bottles) ─────────────────────────────────────

function Bar({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      {/* Counter body */}
      <RoundedBox args={[1.8, 1.05, 0.65]} radius={0.1} smoothness={3} position={[0, 0.52, 0]} castShadow>
        <meshToonMaterial color="#2a1608" />
      </RoundedBox>
      {/* Counter top */}
      <RoundedBox args={[1.9, 0.08, 0.72]} radius={0.06} smoothness={3} position={[0, 1.07, 0]} castShadow>
        <meshToonMaterial color="#f7d8a0" />
      </RoundedBox>
      {/* Bottles */}
      {([-0.5, -0.1, 0.3, 0.65] as number[]).map((x, i) => (
        <group key={i} position={[x, 1.38, -0.12]}>
          <mesh>
            <cylinderGeometry args={[0.038, 0.042, 0.46, 8]} />
            <meshToonMaterial color={i % 2 === 0 ? '#1a4428' : '#5a2010'} />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.016, 0.028, 0.12, 6]} />
            <meshToonMaterial color="#8a8060" />
          </mesh>
        </group>
      ))}
      {/* Two bar stools */}
      {([-0.45, 0.45] as number[]).map((x, i) => (
        <group key={i} position={[x, 0, 0.62]}>
          <mesh position={[0, 0.54, 0]}>
            <cylinderGeometry args={[0.18, 0.18, 0.06, 10]} />
            <meshToonMaterial color="#28aacc" />
          </mesh>
          <mesh position={[0, 0.28, 0]}>
            <cylinderGeometry args={[0.02, 0.02, 0.48, 6]} />
            <meshToonMaterial color="#5a3018" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

// ─── Sliding door ──────────────────────────────────────────────────────────

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
      {/* Wall left of opening */}
      <RoundedBox args={[1.6, 4.5, 0.28]} radius={0.1} smoothness={3} position={[-2.4, 2.25, 0]}>
        <meshToonMaterial color={wallColor} />
      </RoundedBox>
      {/* Wall right of opening */}
      <RoundedBox args={[1.6, 4.5, 0.28]} radius={0.1} smoothness={3} position={[2.4, 2.25, 0]}>
        <meshToonMaterial color={wallColor} />
      </RoundedBox>
      {/* Wall above door */}
      <RoundedBox args={[1.95, 1.55, 0.28]} radius={0.1} smoothness={3} position={[0, 3.73, 0]}>
        <meshToonMaterial color={wallColor} />
      </RoundedBox>
      {/* Sliding door panel */}
      <group ref={panelRef}>
        <RoundedBox args={[1.72, 2.72, 0.10]} radius={0.06} smoothness={3} position={[0, 1.36, 0]}>
          <meshToonMaterial color="#3e2010" />
        </RoundedBox>
        {/* Small window in door */}
        <mesh position={[0, 1.60, 0.06]}>
          <planeGeometry args={[0.7, 0.48]} />
          <meshBasicMaterial color="#07101e" transparent opacity={0.75} />
        </mesh>
      </group>
    </group>
  );
}

// ─── Conductor ─────────────────────────────────────────────────────────────

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

// ─── Main scene ────────────────────────────────────────────────────────────

export function Train() {
  const trainRef = useRef<THREE.Group>(null);
  const conductorRef = useRef<THREE.Group>(null);
  const conductorZ = useRef(1.5);

  // Car extents — train runs along Z, narrow in X
  const X_LEFT  = -3.0;   // left wall interior
  const X_RIGHT =  4.5;   // right wall interior
  const Z_NEAR  =  2.0;   // near end (door / camera side)
  const Z_FAR   = -10.2;  // far end (door / back)
  const CAR_W   = X_RIGHT - X_LEFT; // 7.5
  const CAR_L   = Z_NEAR  - Z_FAR;  // 12.2
  const CAR_H   = 4.5;
  const CX      = (X_LEFT + X_RIGHT) / 2;  // 0.75

  // Aisle: x ∈ [1.7, 2.7] — between table side (left) and bench seats (right)
  // Table: x ∈ [-2.0, 1.7], z ∈ [0, -7.8] — long in Z, covers both laptops
  // Bench seats: x ≈ 3.3, facing -X toward table
  // Bar: far-left corner, z ≈ -8.5 to -10

  useFrame(({ clock }) => {
    // Train sway
    if (trainRef.current) {
      trainRef.current.rotation.z = Math.sin(clock.getElapsedTime() * 0.6) * 0.008;
    }

    const t = clock.getElapsedTime();
    const PERIOD = 24;
    const phase = (t % PERIOD) / PERIOD;
    const z = phase < 0.5
      ? THREE.MathUtils.lerp(1.5, -9.8, phase * 2)
      : THREE.MathUtils.lerp(-9.8, 1.5, (phase - 0.5) * 2);

    conductorZ.current = z;

    if (conductorRef.current) {
      conductorRef.current.position.z = z;
      conductorRef.current.rotation.y = phase < 0.5 ? Math.PI : 0;
      conductorRef.current.position.y = Math.abs(Math.sin(t * 3.8)) * 0.024;
    }
  });

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
        {/* Floor planks — run along Z (train direction) */}
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
        {/* Left wall wainscot */}
        <RoundedBox args={[0.12, 1.4, CAR_L - 1.0]} radius={0.06} smoothness={3}
          position={[X_LEFT + 0.06, 0.80, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#3e2010" />
        </RoundedBox>
        {/* Left wall windows */}
        {([-1.5, -3.5, -5.5, -7.5] as number[]).map((z) => (
          <TrainWindow
            key={z}
            position={[X_LEFT + 0.14, 2.7, z]}
            rotation={[0, Math.PI / 2, 0]}
          />
        ))}

        {/* ── Right wall ── */}
        <RoundedBox args={[0.3, CAR_H, CAR_L]} radius={0.1} smoothness={4}
          position={[X_RIGHT + 0.15, CAR_H / 2, (Z_NEAR + Z_FAR) / 2]} receiveShadow>
          <meshToonMaterial color="#6a3a1a" />
        </RoundedBox>
        {/* Right wall wainscot */}
        <RoundedBox args={[0.12, 1.4, CAR_L - 1.0]} radius={0.06} smoothness={3}
          position={[X_RIGHT - 0.06, 0.80, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#3e2010" />
        </RoundedBox>
        {/* Right wall windows */}
        {([-1.5, -3.5, -5.5, -7.5] as number[]).map((z) => (
          <TrainWindow
            key={z}
            position={[X_RIGHT - 0.14, 2.7, z]}
            rotation={[0, -Math.PI / 2, 0]}
          />
        ))}

        {/* ── Ceiling ── */}
        <RoundedBox args={[CAR_W + 0.5, 0.4, CAR_L]} radius={0.15} smoothness={4}
          position={[CX, CAR_H + 0.2, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#5a3c1e" />
        </RoundedBox>
        {/* Ceiling trim strip along center */}
        <RoundedBox args={[0.18, 0.18, CAR_L - 1]} radius={0.06} smoothness={3}
          position={[CX, CAR_H - 0.02, (Z_NEAR + Z_FAR) / 2]}>
          <meshToonMaterial color="#3a2010" />
        </RoundedBox>

        {/* ── Globe lamps ── */}
        {([-1.5, -3.5, -5.5, -7.5] as number[]).map((z) => (
          <GlobeLamp key={z} position={[CX, CAR_H - 0.45, z]} />
        ))}

        {/* ── Long side table (long in Z, covers both laptops) ──
             x ∈ [-2.0, 1.7] = 3.7 wide, z ∈ [0.1, -7.8] = 7.9 long ── */}
        <RoundedBox args={[3.7, 0.14, 7.9]} radius={0.10} smoothness={4}
          position={[-0.15, 0.73, -3.85]} castShadow receiveShadow>
          <meshToonMaterial color="#3a2210" />
        </RoundedBox>
        {/* Table legs at four corners */}
        {([-1.8, 1.5] as number[]).map((x) =>
          ([-0.1, -7.6] as number[]).map((z) => (
            <RoundedBox key={`${x}-${z}`} args={[0.18, 0.66, 0.18]} radius={0.06} smoothness={3}
              position={[x, 0.33, z]}>
              <meshToonMaterial color="#2a1808" />
            </RoundedBox>
          ))
        )}

        {/* ── Bench seats — opposite side of table, facing -X ──
             Aligned with bench backs toward right wall (x=4.5) ── */}
        {([-1.0, -2.6, -4.2, -5.8] as number[]).map((z) => (
          <BenchSeat
            key={z}
            position={[3.4, 0.14, z]}
            rotation={[0, Math.PI / 2, 0]}
          />
        ))}

        {/* ── Bar — far-left corner ── */}
        <Bar position={[-1.6, 0, -9.0]} />

        {/* ── Doors at both ends ── */}
        <SlidingDoor
          position={[CX, 0, Z_NEAR]}
          conductorZ={conductorZ}
          triggerZ={1.5}
        />
        <SlidingDoor
          position={[CX, 0, Z_FAR]}
          conductorZ={conductorZ}
          triggerZ={-9.8}
          flip
        />

        {/* ── Conductor ── */}
        <ConductorBot botRef={conductorRef} />

        {/* ── Destination sign ── */}
        <group position={[CX, 4.0, Z_FAR + 0.3]}>
          <RoundedBox args={[2.8, 0.42, 0.08]} radius={0.08} smoothness={3}>
            <meshToonMaterial color="#2a1410" />
          </RoundedBox>
        </group>

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
