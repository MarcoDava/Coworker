import { ContactShadows, Environment, Float, Mask, RoundedBox, Text, useMask } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Porthole({ position }: { position: [number, number, number] }) {
  const stencil = useMask(1, false);

  const stars = useMemo(
    () =>
      Array.from({ length: 36 }, (_, i) => ({
        x: -0.9 + ((i * 37 + 11) % 100) / 55.5,
        y: -0.76 + ((i * 53 + 7) % 100) / 66,
        r: 0.008 + ((i * 11) % 4) * 0.004,
      })),
    []
  );

  return (
    <group position={position}>
      <Mask id={1} colorWrite={false} depthWrite={false}>
        <circleGeometry args={[1.0, 32]} />
      </Mask>

      <mesh renderOrder={1}>
        <planeGeometry args={[2.1, 2.1]} />
        <meshBasicMaterial color="#010610" {...stencil} />
      </mesh>

      {stars.map((s, i) => (
        <mesh key={i} position={[s.x, s.y, 0.01]} renderOrder={2}>
          <circleGeometry args={[s.r, 6]} />
          <meshBasicMaterial color="#d8e8ff" {...stencil} />
        </mesh>
      ))}

      <mesh position={[0.30, -0.28, 0.02]} renderOrder={2}>
        <circleGeometry args={[0.22, 20]} />
        <meshBasicMaterial color="#2255aa" {...stencil} />
      </mesh>
      <mesh position={[0.30, -0.28, 0.025]} renderOrder={3}>
        <ringGeometry args={[0.26, 0.35, 20]} />
        <meshBasicMaterial color="#4477cc" transparent opacity={0.7} {...stencil} />
      </mesh>

      <mesh>
        <torusGeometry args={[1.0, 0.10, 8, 32]} />
        <meshToonMaterial color="#3d4d6d" />
      </mesh>
      <mesh>
        <torusGeometry args={[1.2, 0.07, 6, 32]} />
        <meshToonMaterial color="#2a3550" />
      </mesh>

      {Array.from({ length: 8 }, (_, i) => {
        const a = (i / 8) * Math.PI * 2;
        return (
          <mesh key={i} position={[Math.cos(a) * 1.22, Math.sin(a) * 1.22, 0.07]}>
            <sphereGeometry args={[0.044, 8, 8]} />
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
      { x: -0.28, y: 0.18, color: '#00ff88', blinkRate: 0 },
      { x: -0.12, y: 0.18, color: '#00ff88', blinkRate: 1.2 },
      { x: 0.04, y: 0.18, color: '#ff4466', blinkRate: 0.7 },
      { x: 0.2, y: 0.18, color: '#00ccff', blinkRate: 0 },
      { x: -0.28, y: 0.04, color: '#ffcc00', blinkRate: 2.1 },
      { x: -0.12, y: 0.04, color: '#00ccff', blinkRate: 0 },
    ],
    []
  );

  const lightRefs = useRef<(THREE.Mesh | null)[]>([]);

  useFrame(({ clock }) => {
    const t = clock.getElapsedTime();
    lights.forEach((l, i) => {
      const mesh = lightRefs.current[i];
      if (!mesh || l.blinkRate === 0) return;
      const mat = mesh.material as THREE.MeshBasicMaterial;
      const on = Math.sin(t * l.blinkRate * Math.PI * 2) > 0;
      mat.opacity = on ? 1.0 : 0.18;
    });
  });

  return (
    <group position={position} rotation={rotation}>
      <RoundedBox args={[0.72, 0.52, 0.08]} radius={0.05} smoothness={3}>
        <meshToonMaterial color="#1c2a3e" />
      </RoundedBox>
      <mesh position={[0, -0.08, 0.042]}>
        <planeGeometry args={[0.56, 0.22]} />
        <meshBasicMaterial color="#060c18" />
      </mesh>
      {lights.map((l, i) => (
        <mesh key={i} ref={(el) => { lightRefs.current[i] = el; }} position={[l.x, l.y, 0.043]}>
          <circleGeometry args={[0.034, 8]} />
          <meshBasicMaterial color={l.color} transparent />
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
      <color attach="background" args={['#080e20']} />
      <fog attach="fog" args={['#080e20', 7, 17]} />
      <Environment preset="night" />
      <ambientLight intensity={0.55} color="#66ccff" />
      <directionalLight
        position={[4, 6, 5]}
        intensity={0.9}
        color="#aaddff"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 3, -2]} intensity={0.28} color="#4488ff" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.5} scale={11} blur={1.8} far={4.5} />

      {/* Floor */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshToonMaterial color="#1a2640" />
      </mesh>

      {/* Floor LED strips */}
      {Array.from({ length: 11 }, (_, i) => (
        <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.5 + i * 1.05]}>
          <planeGeometry args={[24, 0.05]} />
          <meshBasicMaterial color="#00eeff" transparent opacity={0.55} />
        </mesh>
      ))}

      {/* Landing pad ring decal */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -2.7]}>
        <ringGeometry args={[1.85, 2.05, 32]} />
        <meshBasicMaterial color="#00eeff" transparent opacity={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.003, -2.7]}>
        <ringGeometry args={[0.6, 0.72, 32]} />
        <meshBasicMaterial color="#00eeff" transparent opacity={0.5} />
      </mesh>

      {/* Back wall */}
      <RoundedBox args={[15.5, 6.2, 0.5]} radius={0.28} smoothness={4} position={[0, 3.1, -6]} receiveShadow>
        <meshToonMaterial color="#182238" />
      </RoundedBox>
      {/* Back wall accent strip */}
      <RoundedBox args={[15.1, 0.1, 0.15]} radius={0.04} smoothness={3} position={[0, 0.6, -5.72]}>
        <meshToonMaterial color="#00eeff" />
      </RoundedBox>
      <mesh position={[0, 0.6, -5.72]}>
        <planeGeometry args={[15.0, 0.08]} />
        <meshBasicMaterial color="#00eeff" transparent opacity={0.65} />
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
          <meshToonMaterial color="#1a2840" />
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
        <meshToonMaterial color="#141e30" />
      </RoundedBox>

      {/* Ceiling duct strips */}
      {([-2.8, 0, 2.8] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.22, 0.14, 10.5]} radius={0.06} smoothness={3} position={[x, 5.82, -0.4]}>
          <meshToonMaterial color="#22344e" />
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
        <planeGeometry args={[6.1, 0.03]} />
        <meshBasicMaterial color="#00eeff" transparent opacity={0.8} />
      </mesh>
      <pointLight position={[0, 0.78, -1.2]} intensity={0.35} distance={2.5} color="#00eeff" />
      {/* Desk legs */}
      {([-2.75, 2.75] as number[]).map((x) => (
        <RoundedBox key={x} args={[0.22, 0.72, 1.3]} radius={0.08} smoothness={4} position={[x, 0.30, -2.1]} castShadow>
          <meshToonMaterial color="#16222e" />
        </RoundedBox>
      ))}

      {/* Space station ID sign on right wall */}
      <group position={[6.6, 3.8, -1.5]} rotation={[0, -Math.PI / 2, 0]}>
        <RoundedBox args={[1.8, 0.44, 0.06]} radius={0.07} smoothness={3}>
          <meshToonMaterial color="#0e1e30" />
        </RoundedBox>
        <Text
          position={[0, 0, 0.04]}
          fontSize={0.22}
          color="#00eeff"
          anchorX="center"
          anchorY="middle"
        >
          DEEP FOCUS ZONE
        </Text>
        <pointLight position={[0, 0, 0.1]} intensity={0.2} distance={1.5} color="#00eeff" />
      </group>

      <MaintenanceBot />
      <SpaceDebris />
    </>
  );
}
