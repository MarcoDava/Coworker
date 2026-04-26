import { ContactShadows, Environment, Float, Mask, RoundedBox, useMask } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function CityNight({ maskId }: { maskId: number }) {
  const stencil = useMask(maskId);
  const buildings = useMemo(
    () =>
      Array.from({ length: 18 }, (_, i) => ({
        x: -1.3 + i * 0.155,
        h: 0.35 + ((i * 7) % 8) * 0.08,
        w: 0.1 + (i % 3) * 0.025,
        windows: Array.from({ length: 2 + (i % 4) }, (__, j) => ({
          wx: -0.03 + (j % 2) * 0.055,
          wy: 0.06 + Math.floor(j / 2) * 0.09,
          lit: (i + j) % 3 !== 0,
        })),
      })),
    []
  );

  return (
    <group>
      {/* Night sky */}
      <mesh position={[0, 0, 0.055]}>
        <planeGeometry args={[2.8, 1.85]} />
        <meshBasicMaterial color="#050a12" {...stencil} />
      </mesh>
      {/* City horizon glow */}
      <mesh position={[0, -0.65, 0.057]}>
        <planeGeometry args={[2.8, 0.55]} />
        <meshBasicMaterial color="#0d1520" transparent opacity={0.9} {...stencil} />
      </mesh>
      {/* Glow blobs from city lights */}
      {(['#ff6030', '#ffb040', '#4080ff'] as const).map((color, i) => (
        <mesh key={i} position={[-0.6 + i * 0.75, -0.72, 0.058]}>
          <circleGeometry args={[0.28 + i * 0.06, 20]} />
          <meshBasicMaterial color={color} transparent opacity={0.1} {...stencil} />
        </mesh>
      ))}
      {/* Ground */}
      <mesh position={[0, -0.88, 0.059]}>
        <planeGeometry args={[2.8, 0.2]} />
        <meshBasicMaterial color="#0a0e14" {...stencil} />
      </mesh>
      {/* Buildings */}
      {buildings.map((b, i) => (
        <group key={i} position={[b.x, -0.9 + b.h / 2, 0.06]}>
          <mesh>
            <planeGeometry args={[b.w, b.h]} />
            <meshBasicMaterial color="#0e1520" {...stencil} />
          </mesh>
          {b.windows.map((w, j) => (
            <mesh key={j} position={[w.wx, w.wy - b.h / 2, 0.001]}>
              <planeGeometry args={[0.016, 0.022]} />
              <meshBasicMaterial color={w.lit ? '#ffdd80' : '#1a1e28'} {...stencil} />
            </mesh>
          ))}
        </group>
      ))}
      {/* Rain streaks */}
      {Array.from({ length: 22 }, (_, i) => (
        <mesh key={i} position={[-1.3 + ((i * 11) % 26) * 0.103, -0.3 + ((i * 7) % 14) * 0.08, 0.062]}>
          <planeGeometry args={[0.003, 0.04 + (i % 3) * 0.02]} />
          <meshBasicMaterial color="#2040a0" transparent opacity={0.22} {...stencil} />
        </mesh>
      ))}
    </group>
  );
}

function TrainWindow({ position, maskId }: { position: [number, number, number]; maskId: number }) {
  return (
    <group position={position}>
      {/* Frame */}
      <RoundedBox args={[2.6, 1.85, 0.12]} radius={0.18} smoothness={4}>
        <meshToonMaterial color="#5c3e28" />
      </RoundedBox>
      <Mask id={maskId} position={[0, 0, 0.065]}>
        <planeGeometry args={[2.2, 1.48]} />
      </Mask>
      <CityNight maskId={maskId} />
      {/* Glass tint */}
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[2.2, 1.48]} />
        <meshBasicMaterial color="#102030" transparent opacity={0.22} />
      </mesh>
      {/* Mullion */}
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[2.26, 0.06, 0.04]} />
        <meshToonMaterial color="#4a3020" />
      </mesh>
      {/* Condensation shimmer at bottom */}
      <mesh position={[0, -0.6, 0.095]}>
        <planeGeometry args={[2.0, 0.28]} />
        <meshBasicMaterial color="#607090" transparent opacity={0.07} />
      </mesh>
      <pointLight position={[0, 0, 0.5]} intensity={0.1} distance={4} color="#8090c0" />
    </group>
  );
}

function ConductorBot() {
  const groupRef = useRef<THREE.Group>(null);
  const hatRef = useRef<THREE.Mesh>(null);

  useFrame(({ clock }) => {
    const g = groupRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    const walk = Math.sin(t * 0.38);
    g.position.x = walk * 2.8;
    g.position.y = 0.72 + Math.abs(Math.sin(t * 0.76)) * 0.04;
    g.position.z = -4.1 + Math.cos(t * 0.5) * 0.2;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, walk > 0 ? -Math.PI / 2 : Math.PI / 2, 0.06);
    if (hatRef.current) hatRef.current.rotation.z = Math.sin(t * 1.5) * 0.04;
  });

  return (
    <group ref={groupRef} position={[0, 0.72, -4.1]}>
      <Float speed={0.8} floatIntensity={0.06} rotationIntensity={0.05}>
        {/* Body — dark coat */}
        <RoundedBox args={[0.28, 0.42, 0.22]} radius={0.08} smoothness={4} castShadow>
          <meshToonMaterial color="#2c3a4e" />
        </RoundedBox>
        {/* Coat buttons */}
        {([-0.1, 0, 0.1] as const).map((y) => (
          <mesh key={y} position={[0, y, 0.115]}>
            <circleGeometry args={[0.018, 8]} />
            <meshBasicMaterial color="#d4b060" />
          </mesh>
        ))}
        {/* Head */}
        <RoundedBox args={[0.26, 0.24, 0.24]} radius={0.1} smoothness={4} position={[0, 0.36, 0]} castShadow>
          <meshToonMaterial color="#e8c898" />
        </RoundedBox>
        {/* Eyes */}
        <mesh position={[-0.065, 0.38, 0.125]}>
          <circleGeometry args={[0.028, 10]} />
          <meshBasicMaterial color="#1a1a2a" />
        </mesh>
        <mesh position={[0.065, 0.38, 0.125]}>
          <circleGeometry args={[0.028, 10]} />
          <meshBasicMaterial color="#1a1a2a" />
        </mesh>
        {/* Hat */}
        <mesh ref={hatRef} position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.15, 8]} />
          <meshToonMaterial color="#1a2030" />
        </mesh>
        <mesh position={[0, 0.49, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.03, 8]} />
          <meshToonMaterial color="#1a2030" />
        </mesh>
        {/* Hat band */}
        <mesh position={[0, 0.505, 0]}>
          <cylinderGeometry args={[0.141, 0.141, 0.04, 8]} />
          <meshToonMaterial color="#d4b060" />
        </mesh>
        {/* Arms */}
        <mesh position={[-0.2, 0.15, 0]} rotation={[0, 0, 0.6]} castShadow>
          <capsuleGeometry args={[0.035, 0.2, 6, 8]} />
          <meshToonMaterial color="#253040" />
        </mesh>
        <mesh position={[0.2, 0.15, 0]} rotation={[0, 0, -0.6]} castShadow>
          <capsuleGeometry args={[0.035, 0.2, 6, 8]} />
          <meshToonMaterial color="#253040" />
        </mesh>
        {/* Ticket punch */}
        <mesh position={[0.32, 0.04, 0.05]} castShadow>
          <boxGeometry args={[0.1, 0.06, 0.05]} />
          <meshToonMaterial color="#d4b060" />
        </mesh>
        {/* Legs */}
        {([-0.07, 0.07] as const).map((x) => (
          <mesh key={x} position={[x, -0.28, 0]} castShadow>
            <capsuleGeometry args={[0.04, 0.22, 6, 8]} />
            <meshToonMaterial color="#1a2030" />
          </mesh>
        ))}
      </Float>
    </group>
  );
}

export function Train() {
  const rockRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const g = rockRef.current;
    if (!g) return;
    const t = clock.getElapsedTime();
    g.rotation.z = Math.sin(t * 0.65) * 0.007 + Math.sin(t * 1.25) * 0.003;
    g.rotation.x = Math.sin(t * 0.9 + 1.2) * 0.003;
  });

  return (
    <>
      <color attach="background" args={['#100c08']} />
      <fog attach="fog" args={['#100c08', 8, 18]} />
      <Environment preset="warehouse" />
      <ambientLight intensity={0.45} color="#ffd090" />
      <directionalLight
        position={[2, 5, 3]}
        intensity={0.8}
        color="#ffe0a0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-3, 3, -2]} intensity={0.15} color="#8090b0" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.4} scale={11} blur={1.8} far={4.5} color="#3a2010" />

      {/* Rocking car geometry */}
      <group ref={rockRef}>
        {/* Floor — dark wood planks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[24, 24]} />
          <meshToonMaterial color="#2a1c10" />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.5 + i * 1.1]}>
            <planeGeometry args={[24, 0.04]} />
            <meshBasicMaterial color="#1e1408" transparent opacity={0.5} />
          </mesh>
        ))}

        {/* Back wall — warm wood panels */}
        <RoundedBox args={[15.5, 6.2, 0.5]} radius={0.24} smoothness={4} position={[0, 3.1, -6]} receiveShadow>
          <meshToonMaterial color="#4a3020" />
        </RoundedBox>
        {[-5.5, -2.75, 0, 2.75, 5.5].map((x, i) => (
          <group key={i} position={[x, 3.1, -5.72]}>
            <RoundedBox args={[2.3, 5.8, 0.08]} radius={0.08} smoothness={3}>
              <meshToonMaterial color="#5c3e28" />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <boxGeometry args={[0.04, 5.6, 0.02]} />
              <meshToonMaterial color="#3e2818" />
            </mesh>
          </group>
        ))}
        {/* Wainscoting */}
        <RoundedBox args={[15.1, 1.6, 0.2]} radius={0.14} smoothness={3} position={[0, 0.9, -5.7]}>
          <meshToonMaterial color="#3a2414" />
        </RoundedBox>

        {/* Side walls */}
        {[-7.2, 7.2].map((x) => (
          <RoundedBox key={x} args={[0.42, 6, 11.6]} radius={0.2} smoothness={4} position={[x, 3, -0.35]} receiveShadow>
            <meshToonMaterial color="#4a3020" />
          </RoundedBox>
        ))}

        {/* Ceiling with luggage rack bars */}
        <RoundedBox args={[15.2, 0.5, 11.8]} radius={0.22} smoothness={4} position={[0, 6.1, -0.2]}>
          <meshToonMaterial color="#5c3e28" />
        </RoundedBox>
        {[-5.5, -2.75, 0, 2.75, 5.5].map((x) => (
          <mesh key={x} position={[x, 5.55, -0.5]}>
            <boxGeometry args={[0.1, 0.06, 2.4]} />
            <meshToonMaterial color="#7a5538" />
          </mesh>
        ))}

        {/* Overhead carriage lights */}
        {[-3.5, 0, 3.5].map((x) => (
          <group key={x} position={[x, 5.3, -2.2]}>
            <mesh>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshToonMaterial color="#fff8e0" emissive="#ffdd80" emissiveIntensity={0.4} />
            </mesh>
            <pointLight intensity={0.55} distance={5} color="#ffd880" />
          </group>
        ))}

        {/* Train windows on back wall */}
        <TrainWindow position={[-2.5, 3.2, -5.7]} maskId={1} />
        <TrainWindow position={[2.5, 3.2, -5.7]} maskId={2} />

        {/* Desk */}
        <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.8, -2.1]} castShadow receiveShadow>
          <meshToonMaterial color="#6a4830" />
        </RoundedBox>
        {[-2.75, 2.75].map((x) => (
          <RoundedBox key={x} args={[0.22, 0.72, 1.3]} radius={0.08} smoothness={4} position={[x, 0.4, -2.1]} castShadow>
            <meshToonMaterial color="#4a3020" />
          </RoundedBox>
        ))}

        {/* Rug */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -2.7]} receiveShadow>
          <planeGeometry args={[7.4, 4.4]} />
          <meshToonMaterial color="#6a3820" transparent opacity={0.88} />
        </mesh>

        {/* Luggage by back wall */}
        <RoundedBox args={[0.55, 0.42, 0.35]} radius={0.06} smoothness={3} position={[2.2, 0.21, -4.8]} castShadow>
          <meshToonMaterial color="#483018" />
        </RoundedBox>
        <RoundedBox args={[0.45, 0.35, 0.3]} radius={0.05} smoothness={3} position={[2.9, 0.175, -4.6]} castShadow>
          <meshToonMaterial color="#6a4530" />
        </RoundedBox>

        <ConductorBot />
      </group>
    </>
  );
}
