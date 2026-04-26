import { ContactShadows, Environment, Float, Mask, RoundedBox, useMask } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Porthole({ position }: { position: [number, number, number] }) {
  const stencil = useMask(1, false);

  const stars = useMemo(
    () =>
      Array.from({ length: 28 }, (_, i) => ({
        x: -0.65 + ((i * 37 + 11) % 100) / 76,
        y: -0.55 + ((i * 53 + 7) % 100) / 90,
        r: 0.007 + ((i * 11) % 4) * 0.003,
      })),
    []
  );

  return (
    <group position={position}>
      <Mask id={1} colorWrite={false} depthWrite={false}>
        <circleGeometry args={[0.72, 32]} />
      </Mask>

      <mesh renderOrder={1}>
        <planeGeometry args={[1.5, 1.5]} />
        <meshBasicMaterial color="#010610" {...stencil} />
      </mesh>

      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0.01]} renderOrder={2}>
          <circleGeometry args={[s.r, 6]} />
          <meshBasicMaterial color="#d8e8ff" {...stencil} />
        </mesh>
      ))}

      <mesh position={[0.22, -0.2, 0.02]} renderOrder={2}>
        <circleGeometry args={[0.16, 20]} />
        <meshBasicMaterial color="#2255aa" {...stencil} />
      </mesh>
      <mesh position={[0.22, -0.2, 0.025]} renderOrder={3}>
        <ringGeometry args={[0.19, 0.25, 20]} />
        <meshBasicMaterial color="#4477cc" transparent opacity={0.7} {...stencil} />
      </mesh>

      <mesh>
        <torusGeometry args={[0.72, 0.09, 8, 32]} />
        <meshToonMaterial color="#3d4d6d" />
      </mesh>
      <mesh>
        <torusGeometry args={[0.86, 0.06, 6, 32]} />
        <meshToonMaterial color="#2a3550" />
      </mesh>

      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 0.88, Math.sin(a) * 0.88, 0.07]}>
            <sphereGeometry args={[0.032, 8, 8]} />
            <meshToonMaterial color="#6a7a9a" />
          </mesh>
        );
      })}
    </group>
  );
}

function EquipmentPanel({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  const lights = useMemo(
    () => [
      { x: -0.28, y: 0.18, color: '#00ff88' },
      { x: -0.12, y: 0.18, color: '#00ff88' },
      { x: 0.04, y: 0.18, color: '#ff4466' },
      { x: 0.2, y: 0.18, color: '#00ccff' },
      { x: -0.28, y: 0.04, color: '#ffcc00' },
      { x: -0.12, y: 0.04, color: '#00ccff' },
    ],
    []
  );

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.72, 0.52, 0.08]} radius={0.05} smoothness={3}>
        <meshToonMaterial color="#1c2a3e" />
      </RoundedBox>
      <mesh position={[0, -0.08, 0.042]}>
        <planeGeometry args={[0.56, 0.22]} />
        <meshBasicMaterial color="#080e1a" />
      </mesh>
      {lights.map((l, i) => (
        <mesh key={i} position={[l.x, l.y, 0.043]}>
          <circleGeometry args={[0.03, 8]} />
          <meshBasicMaterial color={l.color} />
        </mesh>
      ))}
    </group>
  );
}

function StorageLockers({ position, rotation }: { position: [number, number, number]; rotation?: [number, number, number] }) {
  return (
    <group position={position} rotation={rotation}>
      {[-0.44, 0, 0.44].map((x, i) => (
        <group key={i} position={[x, 0, 0]}>
          <RoundedBox args={[0.38, 1.1, 0.14]} radius={0.04} smoothness={3}>
            <meshToonMaterial color="#1a2438" />
          </RoundedBox>
          <RoundedBox args={[0.32, 0.5, 0.04]} radius={0.03} smoothness={3} position={[0, 0.05, 0.08]}>
            <meshToonMaterial color="#151e30" />
          </RoundedBox>
          <mesh position={[0, 0.05, 0.12]}>
            <sphereGeometry args={[0.025, 8, 8]} />
            <meshToonMaterial color="#3a5070" />
          </mesh>
        </group>
      ))}
    </group>
  );
}

function CeilingFixture({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[1.1, 0.08, 0.36]} radius={0.03} smoothness={3}>
        <meshToonMaterial color="#1a2438" />
      </RoundedBox>
      <mesh position={[0, -0.06, 0]}>
        <planeGeometry args={[0.9, 0.26]} />
        <meshBasicMaterial color="#a8e8ff" transparent opacity={0.55} />
      </mesh>
      <pointLight position={[0, -0.2, 0]} intensity={0.55} distance={4.5} color="#90d8ff" />
    </group>
  );
}

function MaintenanceBot() {
  const botRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const bot = botRef.current;
    if (!bot) return;
    const t = clock.getElapsedTime();
    const glide = Math.sin(t * 0.38);
    const side = glide > 0 ? 1 : -1;
    const toolActive = Math.sin(t * 1.4) > 0.78;

    bot.position.x = glide * 3.0;
    bot.position.y = 4.3 + Math.sin(t * 1.9) * 0.14;
    bot.position.z = -3.6 + Math.cos(t * 0.55) * 0.45;
    bot.rotation.y = THREE.MathUtils.lerp(bot.rotation.y, side > 0 ? -0.4 : 0.4, 0.07);
    bot.rotation.z = Math.sin(t * 1.9) * 0.06;

    const tool = bot.getObjectByName('heldTool');
    if (tool) {
      tool.visible = toolActive;
      tool.position.x = toolActive ? 0.2 * side : 0;
    }
  });

  return (
    <group ref={botRef} position={[0, 4.3, -3.6]}>
      <Float speed={1.3} floatIntensity={0.18} rotationIntensity={0.12}>
        <RoundedBox args={[0.36, 0.22, 0.3]} radius={0.09} smoothness={4} castShadow>
          <meshToonMaterial color="#8ab0c8" />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.16]}>
          <sphereGeometry args={[0.052, 12, 12]} />
          <meshBasicMaterial color="#00f0ff" />
        </mesh>
        <mesh position={[-0.25, -0.02, 0]} rotation={[0, 0, 0.65]}>
          <capsuleGeometry args={[0.025, 0.17, 6, 8]} />
          <meshToonMaterial color="#6a8aa8" />
        </mesh>
        <mesh position={[0.25, -0.02, 0]} rotation={[0, 0, -0.65]}>
          <capsuleGeometry args={[0.025, 0.17, 6, 8]} />
          <meshToonMaterial color="#6a8aa8" />
        </mesh>
        {[[-0.11, -0.11, 0.09], [0.11, -0.11, 0.09], [-0.11, -0.11, -0.09], [0.11, -0.11, -0.09]].map(([x, y, z], i) => (
          <mesh key={i} position={[x, y, z]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[0.038, 0.1, 8]} />
            <meshToonMaterial color="#4a6a88" />
          </mesh>
        ))}
        <mesh name="heldTool" position={[0, -0.04, 0.18]} visible={false}>
          <boxGeometry args={[0.08, 0.04, 0.15]} />
          <meshToonMaterial color="#e8d040" />
        </mesh>
      </Float>
      <pointLight intensity={0.45} distance={3} color="#00d8ff" />
    </group>
  );
}

function SpaceDebris() {
  const particles = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        x: -4.2 + ((i * 41 + 3) % 100) / 11.8,
        y: 0.9 + ((i * 29 + 5) % 100) / 25,
        z: -4.8 + ((i * 17 + 9) % 100) / 24,
        size: 0.011 + ((i * 7) % 5) * 0.004,
      })),
    []
  );

  return (
    <>
      {particles.map((p, i) => (
        <Float key={i} speed={0.35 + (i % 5) * 0.1} floatIntensity={0.2} rotationIntensity={0.07}>
          <mesh position={[p.x, p.y, p.z]}>
            <sphereGeometry args={[p.size, 6, 6]} />
            <meshBasicMaterial color="#c0d0e0" transparent opacity={0.32} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export function SpaceStation() {
  return (
    <>
      <color attach="background" args={['#060c18']} />
      <fog attach="fog" args={['#060c18', 7, 17]} />
      <Environment preset="night" />
      <ambientLight intensity={0.38} color="#88aacc" />
      <directionalLight
        position={[4, 6, 5]}
        intensity={0.75}
        color="#a0c8e8"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 3, -2]} intensity={0.18} color="#4466aa" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.5} scale={11} blur={1.8} far={4.5} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshToonMaterial color="#141c2c" />
      </mesh>

      {/* Floor LED strips */}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.5 + i * 1.05]}>
          <planeGeometry args={[24, 0.04]} />
          <meshBasicMaterial color="#00d8ff" transparent opacity={0.38} />
        </mesh>
      ))}

      {/* Landing pad ring decal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -2.7]}>
        <ringGeometry args={[1.85, 2.05, 32]} />
        <meshBasicMaterial color="#00d8ff" transparent opacity={0.55} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -2.7]}>
        <ringGeometry args={[0.6, 0.72, 32]} />
        <meshBasicMaterial color="#00d8ff" transparent opacity={0.3} />
      </mesh>

      {/* Back wall */}
      <RoundedBox args={[15.5, 6.2, 0.5]} radius={0.28} smoothness={4} position={[0, 3.1, -6]} receiveShadow>
        <meshToonMaterial color="#111c2e" />
      </RoundedBox>
      {/* Back wall accent strip */}
      <RoundedBox args={[15.1, 0.1, 0.15]} radius={0.04} smoothness={3} position={[0, 0.6, -5.72]}>
        <meshToonMaterial color="#00c8f0" />
      </RoundedBox>
      <mesh position={[0, 0.6, -5.72]}>
        <planeGeometry args={[15.0, 0.08]} />
        <meshBasicMaterial color="#00d8ff" transparent opacity={0.5} />
      </mesh>

      {/* Porthole windows */}
      <Porthole position={[-2.6, 3.15, -5.72]} />
      <Porthole position={[2.6, 3.15, -5.72]} />

      {/* Side walls */}
      {([-7.2, 7.2] as number[]).map((x) => (
        <RoundedBox
          key={x}
          args={[0.42, 6, 11.6]}
          radius={0.2}
          smoothness={4}
          position={[x, 3, -0.35]}
          receiveShadow
        >
          <meshToonMaterial color="#121c2c" />
        </RoundedBox>
      ))}

      {/* Equipment panels on left wall */}
      <EquipmentPanel position={[-6.8, 2.6, -1.2]} rotation={[0, Math.PI / 2, 0]} />
      <EquipmentPanel position={[-6.8, 2.6, -3.5]} rotation={[0, Math.PI / 2, 0]} />
      <StorageLockers position={[-6.8, 0.85, -5.0]} rotation={[0, Math.PI / 2, 0]} />

      {/* Equipment panels on right wall */}
      <EquipmentPanel position={[6.8, 2.6, -1.8]} rotation={[0, -Math.PI / 2, 0]} />
      <StorageLockers position={[6.8, 0.85, -3.8]} rotation={[0, -Math.PI / 2, 0]} />

      {/* Ceiling */}
      <RoundedBox args={[15.2, 0.5, 11.8]} radius={0.22} smoothness={4} position={[0, 6.1, -0.2]}>
        <meshToonMaterial color="#101828" />
      </RoundedBox>

      {/* Ceiling duct strips */}
      {([-2.8, 0, 2.8] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.22, 0.14, 10.5]} radius={0.06} smoothness={3} position={[x, 5.82, -0.4]}>
          <meshToonMaterial color="#1a2a3a" />
        </RoundedBox>
      ))}

      {/* Ceiling light fixtures */}
      <CeilingFixture position={[-2.8, 5.78, -1.8]} />
      <CeilingFixture position={[0, 5.78, -2.2]} />
      <CeilingFixture position={[2.8, 5.78, -1.8]} />
      <CeilingFixture position={[-2.8, 5.78, -4.2]} />
      <CeilingFixture position={[2.8, 5.78, -4.2]} />

      {/* Desk top */}
      <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.73, -2.1]} castShadow receiveShadow>
        <meshToonMaterial color="#1e2e44" />
      </RoundedBox>
      {/* Desk edge glow strip */}
      <mesh position={[0, 0.67, -1.22]}>
        <planeGeometry args={[6.1, 0.02]} />
        <meshBasicMaterial color="#00d8ff" transparent opacity={0.6} />
      </mesh>
      {/* Desk legs */}
      {([-2.75, 2.75] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.22, 0.72, 1.3]} radius={0.08} smoothness={4} position={[x, 0.30, -2.1]} castShadow>
          <meshToonMaterial color="#16222e" />
        </RoundedBox>
      ))}

      <MaintenanceBot />
      <SpaceDebris />
    </>
  );
}
