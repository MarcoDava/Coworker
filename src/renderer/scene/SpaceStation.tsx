import { ContactShadows, Environment, RoundedBox, Text } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

// LCARS color palette
const L = {
  orange: '#FF9900',
  peach: '#FF9966',
  lilac: '#CC99CC',
  brick: '#CC6666',
  blue: '#9999FF',
  yellow: '#FFCC99',
};

function LCARSPanel({
  position,
  rotation,
  seed = 0,
}: {
  position: [number, number, number];
  rotation?: [number, number, number];
  seed?: number;
}) {
  const colorList = [L.orange, L.peach, L.lilac, L.brick, L.blue, L.yellow];
  const buttons = useMemo(() => {
    const btns: { x: number; y: number; w: number; h: number; color: string; blink: boolean }[] = [];
    // Left elbow column
    for (let i = 0; i < 5; i++) {
      btns.push({
        x: -0.36, y: 0.16 - i * 0.09, w: 0.1, h: 0.07,
        color: colorList[(i + seed) % colorList.length],
        blink: (i * 3 + seed * 7) % 5 === 0,
      });
    }
    // Right elbow column
    for (let i = 0; i < 3; i++) {
      btns.push({
        x: 0.36, y: 0.14 - i * 0.10, w: 0.1, h: 0.07,
        color: colorList[(i + seed + 2) % colorList.length],
        blink: (i * 5 + seed * 3) % 7 === 0,
      });
    }
    // Top bar
    btns.push({ x: 0, y: 0.28, w: 0.44, h: 0.06, color: L.orange, blink: false });
    // Bottom bar
    btns.push({ x: 0, y: -0.28, w: 0.44, h: 0.06, color: L.peach, blink: false });
    // Center display
    btns.push({ x: 0, y: 0, w: 0.36, h: 0.24, color: '#030610', blink: false });
    // Indicator lights on display
    for (let i = 0; i < 4; i++) {
      btns.push({
        x: -0.12 + i * 0.08, y: 0.06, w: 0.05, h: 0.03,
        color: i % 2 === 0 ? L.blue : L.orange,
        blink: i % 2 === 0,
      });
    }
    return btns;
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [seed]);

  const refs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    buttons.forEach((b, i) => {
      if (!b.blink) return;
      const mesh = refs.current[i];
      if (!mesh) return;
      (mesh.material as THREE.MeshBasicMaterial).opacity =
        Math.sin(t * 1.5 + i * 1.3) > 0 ? 0.9 : 0.22;
    });
  });

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.88, 0.68, 0.06]} radius={0.04} smoothness={3}>
        <meshToonMaterial color="#0a0a0a" />
      </RoundedBox>
      {buttons.map((b, i) => (
        <mesh
          key={i}
          ref={(el) => { refs.current[i] = el; }}
          position={[b.x, b.y, 0.034]}
        >
          <planeGeometry args={[b.w, b.h]} />
          <meshBasicMaterial color={b.color} transparent />
        </mesh>
      ))}
    </group>
  );
}

function WallStrip({ position, rotation }: {
  position: [number, number, number];
  rotation?: [number, number, number];
}) {
  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.08, 4.0, 0.06]} radius={0.03} smoothness={3}>
        <meshToonMaterial color="#1c1a10" />
      </RoundedBox>
      <mesh>
        <planeGeometry args={[0.04, 3.8]} />
        <meshBasicMaterial color="#ffd080" transparent opacity={0.72} />
      </mesh>
      <pointLight intensity={0.28} distance={3.5} color="#ffd080" />
    </group>
  );
}

function Viewscreen() {
  const stars = useMemo(
    () =>
      Array.from({ length: 90 }, (_, i) => ({
        x: -4.0 + ((i * 41 + 7) % 100) / 12.5,
        y: 1.0 + ((i * 29 + 13) % 100) / 33,
        r: 0.007 + ((i * 11) % 5) * 0.003,
      })),
    []
  );

  return (
    <group position={[0, 0, -5.72]}>
      {/* Screen frame */}
      <RoundedBox args={[8.8, 4.4, 0.14]} radius={0.1} smoothness={3} position={[0, 2.9, -0.01]}>
        <meshToonMaterial color="#1a1a18" />
      </RoundedBox>
      {/* Screen surface */}
      <mesh position={[0, 2.9, 0.08]}>
        <planeGeometry args={[8.2, 3.8]} />
        <meshBasicMaterial color="#020510" />
      </mesh>
      {/* Stars */}
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y + 1.3, 0.09]}>
          <circleGeometry args={[s.r, 6]} />
          <meshBasicMaterial color="#d8e8ff" transparent opacity={0.85} />
        </mesh>
      ))}
      {/* Planet */}
      <mesh position={[2.4, 3.4, 0.10]}>
        <circleGeometry args={[0.62, 28]} />
        <meshBasicMaterial color="#2244aa" />
      </mesh>
      <mesh position={[2.4, 3.4, 0.11]}>
        <ringGeometry args={[0.62, 0.70, 28]} />
        <meshBasicMaterial color="#4466cc" transparent opacity={0.45} />
      </mesh>
      {/* Nebula glow */}
      <mesh position={[-1.8, 2.6, 0.09]}>
        <circleGeometry args={[1.4, 16]} />
        <meshBasicMaterial color="#220033" transparent opacity={0.22} />
      </mesh>
      <mesh position={[-1.0, 2.2, 0.09]}>
        <circleGeometry args={[0.8, 16]} />
        <meshBasicMaterial color="#330055" transparent opacity={0.15} />
      </mesh>
      {/* Screen glow onto bridge */}
      <pointLight position={[0, 2.9, 0.6]} intensity={0.45} distance={7} color="#3355aa" />
    </group>
  );
}

function CaptainChair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.58, 0.10, 0.52]} radius={0.05} smoothness={3} position={[0, 0.44, 0]}>
        <meshToonMaterial color="#3c3a3a" />
      </RoundedBox>
      <RoundedBox args={[0.54, 0.62, 0.08]} radius={0.05} smoothness={3} position={[0, 0.85, -0.22]}>
        <meshToonMaterial color="#3c3a3a" />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.06, 0.09]} radius={0.03} smoothness={3} position={[-0.33, 0.55, 0.04]}>
        <meshToonMaterial color="#7a5a3a" />
      </RoundedBox>
      <RoundedBox args={[0.48, 0.06, 0.09]} radius={0.03} smoothness={3} position={[0.33, 0.55, 0.04]}>
        <meshToonMaterial color="#7a5a3a" />
      </RoundedBox>
      {/* Arm control panel */}
      <RoundedBox args={[0.18, 0.02, 0.10]} radius={0.01} smoothness={3} position={[0.33, 0.60, -0.04]}>
        <meshBasicMaterial color="#030810" />
      </RoundedBox>
      {[L.orange, L.blue, L.lilac].map((c, i) => (
        <mesh key={i} position={[0.33 - 0.06 + i * 0.06, 0.615, -0.04]}>
          <planeGeometry args={[0.04, 0.025]} />
          <meshBasicMaterial color={c} />
        </mesh>
      ))}
      <RoundedBox args={[0.22, 0.42, 0.22]} radius={0.05} smoothness={3} position={[0, 0.21, 0]}>
        <meshToonMaterial color="#2a2a2a" />
      </RoundedBox>
    </group>
  );
}

function OfficerChair({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.44, 0.08, 0.40]} radius={0.04} smoothness={3} position={[0, 0.44, 0]}>
        <meshToonMaterial color="#383838" />
      </RoundedBox>
      <RoundedBox args={[0.40, 0.48, 0.07]} radius={0.04} smoothness={3} position={[0, 0.74, -0.18]}>
        <meshToonMaterial color="#383838" />
      </RoundedBox>
      <RoundedBox args={[0.14, 0.38, 0.14]} radius={0.04} smoothness={3} position={[0, 0.18, 0]}>
        <meshToonMaterial color="#252525" />
      </RoundedBox>
    </group>
  );
}

function CommandRail() {
  return (
    <group>
      {/* Left rail */}
      <RoundedBox args={[0.08, 0.82, 2.2]} radius={0.03} smoothness={3} position={[-2.45, 0.41, -0.9]}>
        <meshToonMaterial color="#7a5a3a" />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.04, 2.22]} radius={0.02} smoothness={3} position={[-2.45, 0.85, -0.9]}>
        <meshToonMaterial color="#9a7a5a" />
      </RoundedBox>
      {/* Right rail */}
      <RoundedBox args={[0.08, 0.82, 2.2]} radius={0.03} smoothness={3} position={[2.45, 0.41, -0.9]}>
        <meshToonMaterial color="#7a5a3a" />
      </RoundedBox>
      <RoundedBox args={[0.12, 0.04, 2.22]} radius={0.02} smoothness={3} position={[2.45, 0.85, -0.9]}>
        <meshToonMaterial color="#9a7a5a" />
      </RoundedBox>
      {/* Rear cross rail */}
      <RoundedBox args={[5.0, 0.08, 0.08]} radius={0.03} smoothness={3} position={[0, 0.82, -2.0]}>
        <meshToonMaterial color="#7a5a3a" />
      </RoundedBox>
    </group>
  );
}

function TacticalConsole() {
  // Arc of 3 panels at the aft edge of command area, standing console
  return (
    <group position={[0, 0.20, 0.55]}>
      {([-0.88, 0, 0.88] as number[]).map((x, i) => {
        const rot = (i - 1) * 0.18;
        return (
          <group key={i} rotation={[0, rot, 0]} position={[x, 0, 0]}>
            <RoundedBox args={[0.86, 0.12, 0.52]} radius={0.04} smoothness={3} position={[0, 0.96, 0]}>
              <meshToonMaterial color="#1e2222" />
            </RoundedBox>
            <mesh position={[0, 1.04, -0.09]} rotation={[-Math.PI * 0.18, 0, 0]}>
              <planeGeometry args={[0.68, 0.28]} />
              <meshBasicMaterial color="#020610" />
            </mesh>
            {[L.orange, L.blue, L.peach].map((c, j) => (
              <mesh key={j} position={[-0.18 + j * 0.18, 1.055, -0.11]} rotation={[-Math.PI * 0.18, 0, 0]}>
                <planeGeometry args={[0.13, 0.07]} />
                <meshBasicMaterial color={c} />
              </mesh>
            ))}
            <RoundedBox args={[0.82, 0.90, 0.44]} radius={0.05} smoothness={3} position={[0, 0.45, 0]}>
              <meshToonMaterial color="#1a1e22" />
            </RoundedBox>
          </group>
        );
      })}
    </group>
  );
}

function AftStations() {
  return (
    <group>
      {([-2.4, 0, 2.4] as number[]).map((x, i) => (
        <group key={i} position={[x, 0.20, 1.65]}>
          <RoundedBox args={[1.15, 0.12, 0.52]} radius={0.05} smoothness={3} position={[0, 0.90, 0]}>
            <meshToonMaterial color="#1e2020" />
          </RoundedBox>
          <mesh position={[0, 0.99, -0.12]} rotation={[-Math.PI * 0.18, 0, 0]}>
            <planeGeometry args={[0.92, 0.38]} />
            <meshBasicMaterial color="#020610" />
          </mesh>
          {[L.orange, L.blue, L.lilac, L.peach].map((c, j) => (
            <mesh key={j} position={[-0.33 + j * 0.22, 1.005, -0.14]} rotation={[-Math.PI * 0.18, 0, 0]}>
              <planeGeometry args={[0.16, 0.07]} />
              <meshBasicMaterial color={c} transparent opacity={0.9} />
            </mesh>
          ))}
          <RoundedBox args={[1.05, 0.82, 0.42]} radius={0.04} smoothness={3} position={[0, 0.41, 0]}>
            <meshToonMaterial color="#181c1e" />
          </RoundedBox>
        </group>
      ))}
    </group>
  );
}

function ForwardConsole() {
  return (
    <group>
      <RoundedBox args={[6.4, 0.14, 1.85]} radius={0.12} smoothness={4} position={[0, 0.73, -2.1]} castShadow receiveShadow>
        <meshToonMaterial color="#1a1e20" />
      </RoundedBox>
      {/* LCARS display surfaces */}
      {([-1.8, 0.9] as number[]).map((x, idx) => (
        <group key={idx}>
          <mesh position={[x, 0.81, -2.30]} rotation={[-Math.PI * 0.18, 0, 0]}>
            <planeGeometry args={[0.92, 0.34]} />
            <meshBasicMaterial color="#020610" />
          </mesh>
          {[L.orange, L.blue, L.peach].map((c, j) => (
            <mesh key={j} position={[x - 0.22 + j * 0.22, 0.826, -2.32]} rotation={[-Math.PI * 0.18, 0, 0]}>
              <planeGeometry args={[0.17, 0.06]} />
              <meshBasicMaterial color={c} />
            </mesh>
          ))}
        </group>
      ))}
      {/* LCARS accent strip on front edge */}
      <mesh position={[0, 0.67, -1.22]}>
        <planeGeometry args={[6.1, 0.03]} />
        <meshBasicMaterial color={L.orange} transparent opacity={0.65} />
      </mesh>
      <pointLight position={[0, 0.8, -1.2]} intensity={0.3} distance={2.5} color={L.orange} />
      {([-2.75, 2.75] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.22, 0.72, 1.3]} radius={0.08} smoothness={4} position={[x, 0.30, -2.1]} castShadow>
          <meshToonMaterial color="#141618" />
        </RoundedBox>
      ))}
    </group>
  );
}

function TurboliftDoor({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.4, 2.9, 0.06]} radius={0.05} smoothness={3} position={[0, 1.45, 0]}>
        <meshToonMaterial color="#4a4640" />
      </RoundedBox>
      <RoundedBox args={[0.04, 2.8, 0.04]} radius={0.02} smoothness={3} position={[0, 1.45, 0.04]}>
        <meshToonMaterial color="#2a2820" />
      </RoundedBox>
      <RoundedBox args={[1.52, 3.02, 0.04]} radius={0.06} smoothness={3} position={[0, 1.51, -0.03]}>
        <meshToonMaterial color="#5a5450" />
      </RoundedBox>
      <mesh position={[0, 2.97, 0.05]}>
        <planeGeometry args={[0.8, 0.05]} />
        <meshBasicMaterial color={L.orange} transparent opacity={0.85} />
      </mesh>
      <pointLight position={[0, 3.0, 0.2]} intensity={0.12} distance={1.5} color={L.orange} />
    </group>
  );
}

export function SpaceStation() {
  return (
    <>
      <color attach="background" args={['#0c0e12']} />
      <fog attach="fog" args={['#0c0e12', 9, 20]} />
      <Environment preset="night" />

      {/* TNG uses warm, even indirect lighting */}
      <ambientLight intensity={0.58} color="#d4c8b0" />
      <directionalLight
        position={[3, 7, 5]}
        intensity={0.72}
        color="#e8dfc8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 4, 2]} intensity={0.32} color="#c8c0a8" />
      {/* Cove ceiling fill */}
      <pointLight position={[0, 5.5, -2.5]} intensity={0.65} distance={9} color="#e8d8b0" />
      <pointLight position={[-5.5, 5.5, -2.0]} intensity={0.35} distance={6} color="#ffd090" />
      <pointLight position={[5.5, 5.5, -2.0]} intensity={0.35} distance={6} color="#ffd090" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.5} scale={11} blur={1.8} far={4.5} />

      {/* ── Floor — TNG gray-taupe carpet ── */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[16, 12]} />
        <meshToonMaterial color="#4a4540" />
      </mesh>
      {/* Aft platform — slightly raised section behind captain's area */}
      <RoundedBox args={[15.0, 0.20, 3.4]} radius={0.06} smoothness={3} position={[0, 0.10, 1.1]}>
        <meshToonMaterial color="#464240" />
      </RoundedBox>
      <RoundedBox args={[15.0, 0.06, 0.08]} radius={0.03} smoothness={3} position={[0, 0.03, -0.22]}>
        <meshToonMaterial color="#5a5650" />
      </RoundedBox>

      {/* ── Back wall — viewscreen wall ── */}
      <RoundedBox args={[15.5, 6.2, 0.5]} radius={0.28} smoothness={4} position={[0, 3.1, -6]} receiveShadow>
        <meshToonMaterial color="#686058" />
      </RoundedBox>
      {/* Illuminated strips flanking viewscreen */}
      {([-4.8, 4.8] as number[]).map((x) => (
        <group key={x} position={[x, 3.1, -5.73]}>
          <RoundedBox args={[0.09, 5.6, 0.05]} radius={0.03} smoothness={3}>
            <meshToonMaterial color="#1c1a10" />
          </RoundedBox>
          <mesh>
            <planeGeometry args={[0.04, 5.2]} />
            <meshBasicMaterial color="#ffd080" transparent opacity={0.68} />
          </mesh>
          <pointLight intensity={0.28} distance={3.5} color="#ffd080" />
        </group>
      ))}

      <Viewscreen />

      {/* ── Side walls — beige-taupe with illuminated strips ── */}
      {([-7.2, 7.2] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.42, 6.2, 11.0]} radius={0.2} smoothness={4} position={[x, 3.1, -1.0]} receiveShadow>
          <meshToonMaterial color="#686058" />
        </RoundedBox>
      ))}
      {[-4.5, -2.8, -1.1, 0.6].map((z) => (
        <WallStrip key={`L${z}`} position={[-7.0, 3.0, z]} rotation={[0, Math.PI / 2, 0]} />
      ))}
      {[-4.5, -2.8, -1.1, 0.6].map((z) => (
        <WallStrip key={`R${z}`} position={[7.0, 3.0, z]} rotation={[0, -Math.PI / 2, 0]} />
      ))}

      {/* LCARS panels on side walls */}
      <LCARSPanel position={[-6.85, 2.5, -3.2]} rotation={[0, Math.PI / 2, 0]} seed={3} />
      <LCARSPanel position={[-6.85, 2.5, -1.0]} rotation={[0, Math.PI / 2, 0]} seed={7} />
      <LCARSPanel position={[6.85, 2.5, -2.6]} rotation={[0, -Math.PI / 2, 0]} seed={11} />
      <LCARSPanel position={[6.85, 2.5, -0.6]} rotation={[0, -Math.PI / 2, 0]} seed={15} />

      {/* ── Aft wall — turbolift doors ── */}
      <RoundedBox args={[15.5, 6.2, 0.45]} radius={0.28} smoothness={4} position={[0, 3.1, 2.5]} receiveShadow>
        <meshToonMaterial color="#686058" />
      </RoundedBox>
      <TurboliftDoor position={[-3.2, 0, 2.25]} />
      <TurboliftDoor position={[3.2, 0, 2.25]} />
      {/* LCARS flanking turbolift doors */}
      <LCARSPanel position={[-5.0, 2.2, 2.22]} seed={5} />
      <LCARSPanel position={[2.0, 2.2, 2.22]} seed={9} />

      {/* ── Ceiling — taupe with cove lighting ── */}
      <RoundedBox args={[15.2, 0.5, 11.8]} radius={0.22} smoothness={4} position={[0, 6.15, -1.0]}>
        <meshToonMaterial color="#5e5850" />
      </RoundedBox>
      {/* Cove strips along ceiling edges */}
      {([-6.2, 6.2] as number[]).map((x) => (
        <mesh key={x} position={[x, 5.9, -1.0]} rotation={[Math.PI / 2, 0, 0]}>
          <planeGeometry args={[10.0, 0.04]} />
          <meshBasicMaterial color="#ffd080" transparent opacity={0.5} />
        </mesh>
      ))}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.9, -5.6]}>
        <planeGeometry args={[14.0, 0.04]} />
        <meshBasicMaterial color="#ffd080" transparent opacity={0.42} />
      </mesh>

      {/* ── User stations — CONN (x=-1.8) and OPS (x=0.9) ── */}
      <ForwardConsole />

      {/* ── Command area (between users and aft section) ── */}
      <CommandRail />
      <CaptainChair position={[0, 0, -1.0]} />
      <OfficerChair position={[-1.35, 0, -0.88]} />
      <OfficerChair position={[1.35, 0, -0.88]} />

      {/* ── Tactical console (Worf's station, on aft platform) ── */}
      <TacticalConsole />

      {/* ── Aft stations (on raised platform, against aft wall) ── */}
      <AftStations />

      {/* ── Ship dedication plaque ── */}
      <group position={[-6.6, 3.8, -2.0]} rotation={[0, Math.PI / 2, 0]}>
        <RoundedBox args={[1.6, 0.42, 0.05]} radius={0.06} smoothness={3}>
          <meshToonMaterial color="#0a0a08" />
        </RoundedBox>
        <Text
          position={[0, 0.05, 0.04]}
          fontSize={0.14}
          color={L.orange}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.1}
        >
          U.S.S. FOCUS
        </Text>
        <Text
          position={[0, -0.10, 0.04]}
          fontSize={0.09}
          color={L.yellow}
          anchorX="center"
          anchorY="middle"
          letterSpacing={0.06}
        >
          NCC-1701-F
        </Text>
        <pointLight position={[0, 0, 0.1]} intensity={0.18} distance={2.0} color={L.orange} />
      </group>
    </>
  );
}
