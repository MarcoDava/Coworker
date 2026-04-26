import { ContactShadows, Environment, Float, Mask, RoundedBox, useMask } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

const CITY_STRIP = 9.0; // total width of one building loop
const SCROLL_SPEED = 0.9; // units per second

function ScrollingCity({ maskId, offsetX = 0 }: { maskId: number; offsetX?: number }) {
  const stencil = useMask(maskId);
  const groupRef = useRef<THREE.Group>(null);

  // Building layout for one scrolling strip
  const buildings = useMemo(
    () =>
      Array.from({ length: 32 }, (_, i) => {
        const x = -CITY_STRIP / 2 + i * (CITY_STRIP / 32);
        const h = 0.3 + ((i * 13 + maskId * 7) % 18) * 0.08; // 0.3 – 1.74
        const w = 0.18 + (i % 4) * 0.055;
        const windowRows = Math.floor(h / 0.18);
        const windowCols = Math.floor(w / 0.1);
        return { x, h, w, windowRows, windowCols };
      }),
    [maskId]
  );

  useFrame((_, dt) => {
    const g = groupRef.current;
    if (!g) return;
    g.position.x -= SCROLL_SPEED * dt;
    if (g.position.x < -CITY_STRIP / 2) g.position.x += CITY_STRIP / 2;
  });

  return (
    <group>
      {/* Night sky */}
      <mesh renderOrder={1}>
        <planeGeometry args={[4.0, 2.8]} />
        <meshBasicMaterial color="#06080f" transparent depthWrite={false} {...stencil} />
      </mesh>
      {/* Stars */}
      {Array.from({ length: 35 }, (_, i) => (
        <mesh key={i} position={[-1.8 + ((i * 11) % 36) * 0.1, 0.1 + ((i * 7) % 12) * 0.08, 0.005]} renderOrder={2}>
          <circleGeometry args={[0.007 + (i % 3) * 0.003, 5]} />
          <meshBasicMaterial color="#c0d0ff" transparent depthWrite={false} {...stencil} />
        </mesh>
      ))}
      {/* Moon */}
      <mesh position={[1.1, 0.65, 0.01]} renderOrder={2}>
        <circleGeometry args={[0.1, 24]} />
        <meshBasicMaterial color="#e8e4d8" transparent depthWrite={false} {...stencil} />
      </mesh>
      <mesh position={[1.14, 0.67, 0.012]} renderOrder={3}>
        <circleGeometry args={[0.076, 24]} />
        <meshBasicMaterial color="#f5f2e8" transparent depthWrite={false} {...stencil} />
      </mesh>
      {/* Ground / street level glow */}
      <mesh position={[0, -0.9, 0.005]} renderOrder={2}>
        <planeGeometry args={[4.0, 0.35]} />
        <meshBasicMaterial color="#0a0c12" transparent depthWrite={false} {...stencil} />
      </mesh>
      {/* Horizon glow from city lights */}
      <mesh position={[0, -0.62, 0.006]} renderOrder={3}>
        <planeGeometry args={[4.0, 0.22]} />
        <meshBasicMaterial color="#1a1020" transparent opacity={0.9} depthWrite={false} {...stencil} />
      </mesh>

      {/* Scrolling buildings group — contains two copies side by side for seamless loop */}
      <group ref={groupRef} position={[offsetX, 0, 0]}>
        {[0, CITY_STRIP / 2].map((baseX) =>
          buildings.map((b, i) => (
            <group key={`${baseX}-${i}`} position={[baseX + b.x, -0.9 + b.h / 2, 0.01]}>
              {/* Building body */}
              <mesh renderOrder={4}>
                <planeGeometry args={[b.w, b.h]} />
                <meshBasicMaterial color="#0c1018" transparent depthWrite={false} {...stencil} />
              </mesh>
              {/* Lit windows */}
              {Array.from({ length: b.windowRows }, (__, row) =>
                Array.from({ length: b.windowCols }, (___, col) => {
                  const lit = ((i + row + col + maskId) % 5) !== 0;
                  const wx = -b.w / 2 + 0.06 + col * (b.w / b.windowCols);
                  const wy = -b.h / 2 + 0.1 + row * 0.17;
                  return (
                    <mesh key={`w${row}${col}`} position={[wx, wy, 0.001]} renderOrder={5}>
                      <planeGeometry args={[0.05, 0.08]} />
                      <meshBasicMaterial color={lit ? '#ffdd88' : '#0e1218'} transparent depthWrite={false} {...stencil} />
                    </mesh>
                  );
                })
              )}
              {/* Rooftop light / antenna on some buildings */}
              {i % 5 === 0 && (
                <mesh position={[0, b.h / 2 + 0.04, 0.001]} renderOrder={5}>
                  <circleGeometry args={[0.018, 6]} />
                  <meshBasicMaterial color="#ff3030" transparent depthWrite={false} {...stencil} />
                </mesh>
              )}
            </group>
          ))
        )}
      </group>
    </group>
  );
}

function TrainWindow({ position, maskId, offsetX }: { position: [number, number, number]; maskId: number; offsetX: number }) {
  return (
    <group position={position}>
      {/* Frame */}
      <RoundedBox args={[2.2, 1.8, 0.14]} radius={0.14} smoothness={4}>
        <meshToonMaterial color="#5c3e28" />
      </RoundedBox>
      <Mask id={maskId} position={[0, 0, 0.175]}>
        <planeGeometry args={[1.88, 1.48]} />
      </Mask>
      <group position={[0, 0, 0.18]}>
        <ScrollingCity maskId={maskId} offsetX={offsetX} />
      </group>
      {/* Glass tint */}
      <mesh position={[0, 0, 0.2]}>
        <planeGeometry args={[1.88, 1.48]} />
        <meshBasicMaterial color="#102030" transparent opacity={0.18} />
      </mesh>
      {/* Mullion */}
      <mesh position={[0, 0, 0.21]}>
        <boxGeometry args={[1.94, 0.055, 0.04]} />
        <meshToonMaterial color="#4a3020" />
      </mesh>
      <pointLight position={[0, 0, 0.4]} intensity={0.08} distance={3.5} color="#8090c0" />
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
    g.position.z = -3.5 + Math.cos(t * 0.5) * 0.18;
    g.rotation.y = THREE.MathUtils.lerp(g.rotation.y, walk > 0 ? -Math.PI / 2 : Math.PI / 2, 0.06);
    if (hatRef.current) hatRef.current.rotation.z = Math.sin(t * 1.5) * 0.04;
  });

  return (
    <group ref={groupRef} position={[0, 0.72, -3.5]}>
      <Float speed={0.8} floatIntensity={0.06} rotationIntensity={0.05}>
        <RoundedBox args={[0.28, 0.42, 0.22]} radius={0.08} smoothness={4} castShadow>
          <meshToonMaterial color="#2c3a4e" />
        </RoundedBox>
        {([-0.1, 0, 0.1] as const).map((y) => (
          <mesh key={y} position={[0, y, 0.115]}>
            <circleGeometry args={[0.018, 8]} />
            <meshBasicMaterial color="#d4b060" />
          </mesh>
        ))}
        <RoundedBox args={[0.26, 0.24, 0.24]} radius={0.1} smoothness={4} position={[0, 0.36, 0]} castShadow>
          <meshToonMaterial color="#e8c898" />
        </RoundedBox>
        <mesh position={[-0.065, 0.38, 0.125]}>
          <circleGeometry args={[0.028, 10]} />
          <meshBasicMaterial color="#1a1a2a" />
        </mesh>
        <mesh position={[0.065, 0.38, 0.125]}>
          <circleGeometry args={[0.028, 10]} />
          <meshBasicMaterial color="#1a1a2a" />
        </mesh>
        <mesh ref={hatRef} position={[0, 0.55, 0]} castShadow>
          <cylinderGeometry args={[0.12, 0.14, 0.15, 8]} />
          <meshToonMaterial color="#1a2030" />
        </mesh>
        <mesh position={[0, 0.49, 0]}>
          <cylinderGeometry args={[0.18, 0.18, 0.03, 8]} />
          <meshToonMaterial color="#1a2030" />
        </mesh>
        <mesh position={[0, 0.505, 0]}>
          <cylinderGeometry args={[0.141, 0.141, 0.04, 8]} />
          <meshToonMaterial color="#d4b060" />
        </mesh>
        <mesh position={[-0.2, 0.15, 0]} rotation={[0, 0, 0.6]} castShadow>
          <capsuleGeometry args={[0.035, 0.2, 6, 8]} />
          <meshToonMaterial color="#253040" />
        </mesh>
        <mesh position={[0.2, 0.15, 0]} rotation={[0, 0, -0.6]} castShadow>
          <capsuleGeometry args={[0.035, 0.2, 6, 8]} />
          <meshToonMaterial color="#253040" />
        </mesh>
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
      <fog attach="fog" args={['#100c08', 7, 16]} />
      <Environment preset="warehouse" />
      <ambientLight intensity={0.42} color="#ffd090" />
      <directionalLight position={[2, 5, 3]} intensity={0.8} color="#ffe0a0" castShadow shadow-mapSize-width={2048} shadow-mapSize-height={2048} />
      <directionalLight position={[-3, 3, -2]} intensity={0.14} color="#8090b0" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.4} scale={10} blur={1.8} far={4} color="#3a2010" />

      <group ref={rockRef}>
        {/* Floor — dark wood planks */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
          <planeGeometry args={[20, 12]} />
          <meshToonMaterial color="#2a1c10" />
        </mesh>
        {Array.from({ length: 10 }, (_, i) => (
          <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.5 + i * 1.1]}>
            <planeGeometry args={[20, 0.04]} />
            <meshBasicMaterial color="#1e1408" transparent opacity={0.5} />
          </mesh>
        ))}

        {/* Back wall — wood-panelled, close to viewer */}
        <RoundedBox args={[14, 6.0, 0.5]} radius={0.22} smoothness={4} position={[0, 3.0, -4.0]} receiveShadow>
          <meshToonMaterial color="#4a3020" />
        </RoundedBox>
        {[-4.8, -2.3, 2.3, 4.8].map((x, i) => (
          <group key={i} position={[x, 3.0, -3.75]}>
            <RoundedBox args={[2.0, 5.6, 0.08]} radius={0.08} smoothness={3}>
              <meshToonMaterial color="#5c3e28" />
            </RoundedBox>
            <mesh position={[0, 0, 0.045]}>
              <boxGeometry args={[0.04, 5.4, 0.02]} />
              <meshToonMaterial color="#3e2818" />
            </mesh>
          </group>
        ))}
        <RoundedBox args={[13.5, 1.4, 0.2]} radius={0.12} smoothness={3} position={[0, 0.8, -3.75]}>
          <meshToonMaterial color="#3a2414" />
        </RoundedBox>

        {/* Side walls */}
        {[-6.5, 6.5].map((x) => (
          <RoundedBox key={x} args={[0.4, 6.0, 10]} radius={0.18} smoothness={4} position={[x, 3.0, -0.5]} receiveShadow>
            <meshToonMaterial color="#4a3020" />
          </RoundedBox>
        ))}

        {/* Ceiling */}
        <RoundedBox args={[14, 0.5, 10.2]} radius={0.2} smoothness={4} position={[0, 6.1, -0.4]}>
          <meshToonMaterial color="#5c3e28" />
        </RoundedBox>
        {[-4.5, -2.5, 0, 2.5, 4.5].map((x) => (
          <mesh key={x} position={[x, 5.55, -0.4]}>
            <boxGeometry args={[0.1, 0.06, 2.2]} />
            <meshToonMaterial color="#7a5538" />
          </mesh>
        ))}

        {/* Overhead carriage lights */}
        {[-3.0, 0, 3.0].map((x) => (
          <group key={x} position={[x, 5.3, -2.2]}>
            <mesh>
              <sphereGeometry args={[0.12, 12, 12]} />
              <meshToonMaterial color="#fff8e0" emissive="#ffdd80" emissiveIntensity={0.4} />
            </mesh>
            <pointLight intensity={0.55} distance={5} color="#ffd880" />
          </group>
        ))}

        {/* Two windows right in front, close to viewer */}
        <TrainWindow position={[-1.35, 2.1, -3.72]} maskId={1} offsetX={0} />
        <TrainWindow position={[1.35, 2.1, -3.72]} maskId={2} offsetX={-2.5} />

        {/* Desk — lowered so laptop sits on top */}
        <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.73, -2.1]} castShadow receiveShadow>
          <meshToonMaterial color="#6a4830" />
        </RoundedBox>
        {[-2.75, 2.75].map((x) => (
          <RoundedBox key={x} args={[0.22, 0.60, 1.3]} radius={0.08} smoothness={4} position={[x, 0.30, -2.1]} castShadow>
            <meshToonMaterial color="#4a3020" />
          </RoundedBox>
        ))}

        {/* Rug */}
        <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -2.7]} receiveShadow>
          <planeGeometry args={[7.4, 4.4]} />
          <meshToonMaterial color="#6a3820" transparent opacity={0.88} />
        </mesh>

        {/* Luggage near back wall */}
        <RoundedBox args={[0.55, 0.42, 0.35]} radius={0.06} smoothness={3} position={[2.8, 0.21, -3.55]} castShadow>
          <meshToonMaterial color="#483018" />
        </RoundedBox>
        <RoundedBox args={[0.45, 0.35, 0.3]} radius={0.05} smoothness={3} position={[3.5, 0.175, -3.45]} castShadow>
          <meshToonMaterial color="#6a4530" />
        </RoundedBox>

        <ConductorBot />
      </group>
    </>
  );
}
