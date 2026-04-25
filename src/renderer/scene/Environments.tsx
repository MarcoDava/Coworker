import { Environment, ContactShadows, Float } from '@react-three/drei';
import { useMemo } from 'react';
import * as THREE from 'three';

export type EnvironmentId = 'library' | 'cafe' | 'spaceship';

export const ENVIRONMENTS: { id: EnvironmentId; label: string; blurb: string }[] = [
  { id: 'library', label: 'Library', blurb: 'warm lamps, wood, books' },
  { id: 'cafe', label: 'Café', blurb: 'morning light, plants' },
  { id: 'spaceship', label: 'Spaceship', blurb: 'neon cockpit, starfield' },
];

export function SceneEnv({ id }: { id: EnvironmentId }) {
  return (
    <>
      <ContactShadows position={[0, 0.01, 0]} opacity={0.45} scale={25} blur={2.4} far={6} />
      {id === 'library' && <LibraryScene />}
      {id === 'cafe' && <CafeScene />}
      {id === 'spaceship' && <SpaceshipScene />}
    </>
  );
}

/* ---------- shared helpers ---------- */

function Books({ position, count = 12, height = 0.35 }: { position: [number, number, number]; count?: number; height?: number }) {
  const books = useMemo(() => {
    const palette = ['#7a2e2e', '#2e4a7a', '#3a6b3a', '#b38a3f', '#4a2e5e', '#8a4a2e'];
    return Array.from({ length: count }, (_, i) => ({
      x: -1.2 + (i / count) * 2.4,
      h: height * (0.7 + Math.random() * 0.5),
      w: 0.14 + Math.random() * 0.06,
      c: palette[Math.floor(Math.random() * palette.length)],
      tilt: Math.random() < 0.1 ? (Math.random() - 0.5) * 0.25 : 0,
    }));
  }, [count, height]);
  return (
    <group position={position}>
      {books.map((b, i) => (
        <mesh key={i} position={[b.x, b.h / 2, 0]} rotation={[0, 0, b.tilt]} castShadow>
          <boxGeometry args={[b.w, b.h, 0.18]} />
          <meshStandardMaterial color={b.c} roughness={0.7} />
        </mesh>
      ))}
    </group>
  );
}

function DeskLamp({ position, color = '#ffb770' }: { position: [number, number, number]; color?: string }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.02, 0]} castShadow>
        <cylinderGeometry args={[0.12, 0.14, 0.04, 20]} />
        <meshStandardMaterial color="#1a1a1a" roughness={0.4} metalness={0.6} />
      </mesh>
      <mesh position={[0, 0.3, 0]} castShadow>
        <cylinderGeometry args={[0.015, 0.015, 0.55, 10]} />
        <meshStandardMaterial color="#1a1a1a" metalness={0.7} roughness={0.3} />
      </mesh>
      <mesh position={[0.08, 0.55, 0]} rotation={[0, 0, -0.5]} castShadow>
        <coneGeometry args={[0.12, 0.22, 20, 1, true]} />
        <meshStandardMaterial color="#222" side={THREE.DoubleSide} metalness={0.5} roughness={0.4} />
      </mesh>
      <pointLight position={[0.15, 0.5, 0]} intensity={1.8} distance={3.5} color={color} castShadow />
    </group>
  );
}

/* ---------- library ---------- */

function LibraryScene() {
  return (
    <>
      <fog attach="fog" args={['#1a120c', 8, 22]} />
      <color attach="background" args={['#14100a']} />
      <Environment preset="apartment" />

      <ambientLight intensity={0.25} color="#ffd9a8" />
      <directionalLight
        position={[4, 9, 3]}
        intensity={0.45}
        color="#ffe2b0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      {/* rim */}
      <directionalLight position={[-6, 4, -4]} intensity={0.25} color="#6d8bff" />

      {/* wood floor (planks via repeated meshes for cheap detail) */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#4a2f1e" roughness={0.85} />
      </mesh>
      {Array.from({ length: 10 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -5 + i * 1.1]}>
          <planeGeometry args={[20, 0.02]} />
          <meshStandardMaterial color="#2a1a10" />
        </mesh>
      ))}

      {/* rug */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.005, -1.8]} receiveShadow>
        <planeGeometry args={[6, 4]} />
        <meshStandardMaterial color="#6a2d2d" roughness={0.95} />
      </mesh>

      {/* paneled back wall */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <boxGeometry args={[22, 6, 0.2]} />
        <meshStandardMaterial color="#5a3d28" roughness={0.8} />
      </mesh>
      {/* wainscoting accent */}
      <mesh position={[0, 1.2, -5.89]}>
        <boxGeometry args={[22, 2.4, 0.05]} />
        <meshStandardMaterial color="#3f2817" roughness={0.8} />
      </mesh>

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 6, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1d140d" roughness={1} />
      </mesh>

      {/* side walls */}
      {[-10, 10].map((x) => (
        <mesh key={x} position={[x, 3, 0]} rotation={[0, -Math.sign(x) * Math.PI / 2, 0]}>
          <planeGeometry args={[20, 6]} />
          <meshStandardMaterial color="#4d3320" roughness={0.9} />
        </mesh>
      ))}

      {/* big bookshelves flanking back wall */}
      {[-6, 6].map((x) => (
        <group key={x} position={[x, 0, -5.5]}>
          <mesh position={[0, 2, 0]} castShadow receiveShadow>
            <boxGeometry args={[3.4, 4, 0.7]} />
            <meshStandardMaterial color="#3a2416" roughness={0.85} />
          </mesh>
          {[0.6, 1.4, 2.2, 3.0, 3.6].map((y) => (
            <Books key={y} position={[0, y, 0.28]} count={10} height={0.5} />
          ))}
        </group>
      ))}

      {/* framed art on back wall */}
      <mesh position={[0, 3.2, -5.88]} castShadow>
        <boxGeometry args={[1.8, 1.2, 0.06]} />
        <meshStandardMaterial color="#241608" />
      </mesh>
      <mesh position={[0, 3.2, -5.85]}>
        <planeGeometry args={[1.55, 0.95]} />
        <meshStandardMaterial color="#d9c896" emissive="#4a3a1e" emissiveIntensity={0.35} />
      </mesh>

      {/* desk lamps — warm pools of light on each laptop */}
      <DeskLamp position={[-1.2, 0.75, -2]} color="#ffb770" />
      <DeskLamp position={[1.2, 0.75, -2]} color="#ffb770" />

      {/* shared long desk */}
      <mesh position={[0, 0.72, -2]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#2f1d11" roughness={0.6} />
      </mesh>
      {[-2.4, 2.4].map((x) => (
        <mesh key={x} position={[x, 0.36, -2]} castShadow>
          <boxGeometry args={[0.12, 0.72, 1.2]} />
          <meshStandardMaterial color="#1f120a" roughness={0.6} />
        </mesh>
      ))}

      {/* floating dust motes */}
      <Motes count={30} bounds={[5, 3, 4]} color="#ffdca8" />
    </>
  );
}

/* ---------- cafe ---------- */

function CafeScene() {
  return (
    <>
      <fog attach="fog" args={['#f0e6d8', 10, 28]} />
      <color attach="background" args={['#e9dfce']} />
      <Environment preset="city" />

      <ambientLight intensity={0.7} color="#fff3de" />
      <directionalLight
        position={[6, 8, 4]}
        intensity={1.2}
        color="#fff1d1"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-4, 3, 2]} intensity={0.35} color="#a8c8ff" />

      {/* tile floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#d9c9a8" roughness={0.6} />
      </mesh>
      {/* grout lines */}
      {Array.from({ length: 20 }, (_, i) => (
        <mesh key={`h${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.001, -10 + i]}>
          <planeGeometry args={[20, 0.015]} />
          <meshStandardMaterial color="#b5a37f" />
        </mesh>
      ))}

      {/* exposed-brick back wall */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <boxGeometry args={[22, 6, 0.2]} />
        <meshStandardMaterial color="#c86f4e" roughness={0.95} />
      </mesh>
      {/* window frames casting "sunlight" strips */}
      {[-4, 0, 4].map((x) => (
        <group key={x} position={[x, 3.2, -5.88]}>
          <mesh>
            <boxGeometry args={[2.4, 2.6, 0.08]} />
            <meshStandardMaterial color="#f5ecd9" />
          </mesh>
          <mesh position={[0, 0, 0.04]}>
            <planeGeometry args={[2.2, 2.4]} />
            <meshStandardMaterial
              color="#cfe3ff"
              emissive="#fff1d1"
              emissiveIntensity={0.9}
              transparent
              opacity={0.85}
            />
          </mesh>
          {/* muntin cross */}
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[2.25, 0.06, 0.02]} />
            <meshStandardMaterial color="#f5ecd9" />
          </mesh>
          <mesh position={[0, 0, 0.05]}>
            <boxGeometry args={[0.06, 2.45, 0.02]} />
            <meshStandardMaterial color="#f5ecd9" />
          </mesh>
        </group>
      ))}

      {/* counter along left wall */}
      <mesh position={[-6.5, 0.5, -2]} castShadow receiveShadow>
        <boxGeometry args={[2, 1, 4]} />
        <meshStandardMaterial color="#2d2419" roughness={0.6} />
      </mesh>
      <mesh position={[-6.5, 1.05, -2]} castShadow>
        <boxGeometry args={[2.1, 0.05, 4.1]} />
        <meshStandardMaterial color="#4a3524" roughness={0.4} />
      </mesh>

      {/* potted plants */}
      {[[-3.5, 0, -5], [3.5, 0, -5]].map((p, i) => (
        <group key={i} position={p as [number, number, number]}>
          <mesh position={[0, 0.25, 0]} castShadow>
            <cylinderGeometry args={[0.28, 0.22, 0.5, 16]} />
            <meshStandardMaterial color="#8a5a3a" roughness={0.8} />
          </mesh>
          <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.15}>
            <mesh position={[0, 0.9, 0]} castShadow>
              <icosahedronGeometry args={[0.55, 1]} />
              <meshStandardMaterial color="#3c6b3a" roughness={0.9} flatShading />
            </mesh>
          </Float>
        </group>
      ))}

      {/* chalkboard menu */}
      <mesh position={[-6.6, 3.2, -2]} rotation={[0, Math.PI / 2, 0]} castShadow>
        <boxGeometry args={[2.4, 1.4, 0.08]} />
        <meshStandardMaterial color="#1a1a14" roughness={0.9} />
      </mesh>

      {/* round communal table */}
      <mesh position={[0, 0.72, -2]} castShadow receiveShadow>
        <cylinderGeometry args={[1.7, 1.7, 0.08, 32]} />
        <meshStandardMaterial color="#3f2a1a" roughness={0.5} />
      </mesh>
      <mesh position={[0, 0.36, -2]} castShadow>
        <cylinderGeometry args={[0.15, 0.2, 0.72, 12]} />
        <meshStandardMaterial color="#2a1a10" roughness={0.6} />
      </mesh>

      {/* pendant lights overhead */}
      {[-1.5, 1.5].map((x) => (
        <group key={x} position={[x, 4.5, -2]}>
          <mesh>
            <cylinderGeometry args={[0.01, 0.01, 1.5, 6]} />
            <meshStandardMaterial color="#222" />
          </mesh>
          <mesh position={[0, -0.85, 0]} castShadow>
            <sphereGeometry args={[0.18, 16, 16]} />
            <meshStandardMaterial color="#f4d18a" emissive="#ffb35a" emissiveIntensity={1.2} />
          </mesh>
          <pointLight position={[0, -0.85, 0]} intensity={1.4} distance={4} color="#ffb870" />
        </group>
      ))}

      <Motes count={25} bounds={[6, 3, 5]} color="#fff1d1" />
    </>
  );
}

/* ---------- spaceship ---------- */

function SpaceshipScene() {
  return (
    <>
      <fog attach="fog" args={['#05060d', 10, 26]} />
      <color attach="background" args={['#030310']} />

      <ambientLight intensity={0.15} color="#6a8aff" />
      <directionalLight position={[3, 6, 4]} intensity={0.4} color="#8ab6ff" castShadow />
      <pointLight position={[0, 3, -4]} intensity={1.2} color="#ff5aa8" distance={10} />
      <pointLight position={[-4, 2, 2]} intensity={0.8} color="#5affd4" distance={10} />

      {/* metal floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#1a1d28" metalness={0.7} roughness={0.4} />
      </mesh>
      {/* floor grid lines */}
      {Array.from({ length: 14 }, (_, i) => (
        <mesh key={`gx${i}`} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -7 + i]}>
          <planeGeometry args={[14, 0.02]} />
          <meshStandardMaterial color="#3a4a7a" emissive="#4a6aff" emissiveIntensity={0.6} />
        </mesh>
      ))}

      {/* ceiling */}
      <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 5.5, 0]}>
        <planeGeometry args={[40, 40]} />
        <meshStandardMaterial color="#0d1020" metalness={0.6} roughness={0.5} />
      </mesh>

      {/* curved cockpit viewport (big window showing stars) */}
      <mesh position={[0, 3, -6]} receiveShadow>
        <boxGeometry args={[22, 6, 0.2]} />
        <meshStandardMaterial color="#0f1222" metalness={0.8} roughness={0.3} />
      </mesh>
      <mesh position={[0, 3.2, -5.88]}>
        <planeGeometry args={[10, 3.5]} />
        <meshBasicMaterial color="#030615" />
      </mesh>
      {/* window frame */}
      <mesh position={[0, 3.2, -5.86]}>
        <boxGeometry args={[10.2, 3.7, 0.02]} />
        <meshStandardMaterial color="#0a0d1a" />
      </mesh>

      {/* stars inside the viewport */}
      <Starfield count={140} bounds={[5, 1.7, 0.05]} center={[0, 3.2, -5.84]} />

      {/* console strip in front of window */}
      <mesh position={[0, 1.2, -5.4]} castShadow>
        <boxGeometry args={[9, 0.4, 0.6]} />
        <meshStandardMaterial color="#1a1f33" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* blinking panel lights */}
      {Array.from({ length: 12 }, (_, i) => (
        <mesh key={i} position={[-4 + i * 0.75, 1.4, -5.1]}>
          <boxGeometry args={[0.18, 0.05, 0.05]} />
          <meshStandardMaterial
            color={i % 3 === 0 ? '#ff4a6b' : i % 3 === 1 ? '#4affbf' : '#4a9aff'}
            emissive={i % 3 === 0 ? '#ff4a6b' : i % 3 === 1 ? '#4affbf' : '#4a9aff'}
            emissiveIntensity={1.4}
          />
        </mesh>
      ))}

      {/* side ribbed walls */}
      {[-7, 7].map((x) => (
        <group key={x}>
          <mesh position={[x, 2.5, 0]} rotation={[0, -Math.sign(x) * Math.PI / 2, 0]}>
            <planeGeometry args={[16, 5]} />
            <meshStandardMaterial color="#141827" metalness={0.6} roughness={0.4} />
          </mesh>
          {Array.from({ length: 6 }, (_, i) => (
            <mesh
              key={i}
              position={[x - Math.sign(x) * 0.05, 2.5, -6 + i * 2.2]}
              rotation={[0, -Math.sign(x) * Math.PI / 2, 0]}
            >
              <boxGeometry args={[0.08, 4.4, 0.08]} />
              <meshStandardMaterial color="#5affd4" emissive="#5affd4" emissiveIntensity={0.8} />
            </mesh>
          ))}
        </group>
      ))}

      {/* desk — glossy dark */}
      <mesh position={[0, 0.72, -2]} castShadow receiveShadow>
        <boxGeometry args={[5.2, 0.08, 1.4]} />
        <meshStandardMaterial color="#12162a" metalness={0.85} roughness={0.2} emissive="#0a1430" emissiveIntensity={0.5} />
      </mesh>
      {/* glow strip under desk */}
      <mesh position={[0, 0.66, -2]}>
        <boxGeometry args={[5.0, 0.01, 1.38]} />
        <meshStandardMaterial color="#ff5aa8" emissive="#ff5aa8" emissiveIntensity={2} />
      </mesh>
    </>
  );
}

/* ---------- decoration helpers ---------- */

function Motes({ count, bounds, color }: { count: number; bounds: [number, number, number]; color: string }) {
  const motes = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * bounds[0] * 2,
        y: 0.5 + Math.random() * bounds[1],
        z: -2 + (Math.random() - 0.5) * bounds[2],
        s: 0.01 + Math.random() * 0.015,
      })),
    [count, bounds]
  );
  return (
    <>
      {motes.map((m, i) => (
        <Float key={i} speed={0.4 + Math.random()} floatIntensity={0.8} rotationIntensity={0}>
          <mesh position={[m.x, m.y, m.z]}>
            <sphereGeometry args={[m.s, 6, 6]} />
            <meshBasicMaterial color={color} transparent opacity={0.55} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

function Starfield({
  count,
  bounds,
  center,
}: {
  count: number;
  bounds: [number, number, number];
  center: [number, number, number];
}) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, () => ({
        x: (Math.random() - 0.5) * bounds[0] * 2,
        y: (Math.random() - 0.5) * bounds[1] * 2,
        s: 0.005 + Math.random() * 0.015,
        b: 0.5 + Math.random() * 0.8,
      })),
    [count, bounds]
  );
  return (
    <group position={center}>
      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, bounds[2]]}>
          <sphereGeometry args={[s.s, 6, 6]} />
          <meshBasicMaterial color={`rgb(${Math.floor(200 + Math.random() * 55)},${Math.floor(220 + Math.random() * 35)},255)`} transparent opacity={s.b} />
        </mesh>
      ))}
    </group>
  );
}
