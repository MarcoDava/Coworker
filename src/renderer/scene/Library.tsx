import { ContactShadows, Environment, Float, Mask, RoundedBox, useMask } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function ShelfBooks({ position }: { position: [number, number, number] }) {
  const books = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const colors = ['#bf7f54', '#7e5fa8', '#d7bf8c', '#6f8d66', '#cf8f73', '#7f5c44'];
        return {
          x: -1.18 + i * 0.17,
          height: 0.34 + ((i * 13) % 5) * 0.04,
          width: 0.11 + ((i * 7) % 3) * 0.015,
          color: colors[i % colors.length],
          tilt: i % 6 === 0 ? 0.08 : i % 5 === 0 ? -0.06 : 0,
        };
      }),
    []
  );

  return (
    <group position={position}>
      {books.map((book, index) => (
        <RoundedBox
          key={index}
          args={[book.width, book.height, 0.12]}
          radius={0.02}
          smoothness={3}
          position={[book.x, book.height / 2, 0]}
          rotation={[0, 0, book.tilt]}
          castShadow
        >
          <meshToonMaterial color={book.color} />
        </RoundedBox>
      ))}
    </group>
  );
}

function WallLamp({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <RoundedBox args={[0.22, 0.32, 0.08]} radius={0.04} smoothness={3} castShadow>
        <meshToonMaterial color="#8f6548" />
      </RoundedBox>
      <mesh position={[0, -0.05, 0.04]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshToonMaterial color="#ffe5b2" emissive="#ffcb7d" emissiveIntensity={0.35} />
      </mesh>
      <pointLight position={[0, -0.05, 0.18]} intensity={0.7} distance={4} color="#ffcf8a" />
    </group>
  );
}

function OutdoorScene() {
  const stencil = useMask(1);
  return (
    <group>
      {/* Sky */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[2.72, 1.82]} />
        <meshBasicMaterial color="#cfe6ff" {...stencil} />
      </mesh>
      {/* Warm sun glow band along the horizon */}
      <mesh position={[0.55, -0.1, 0.072]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#ffe6a8" transparent opacity={0.85} {...stencil} />
      </mesh>
      <mesh position={[0.55, -0.1, 0.073]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color="#fff5d0" {...stencil} />
      </mesh>
      {/* Far hill */}
      <mesh position={[-0.4, -0.45, 0.074]}>
        <circleGeometry args={[1.25, 32]} />
        <meshBasicMaterial color="#9bc28a" {...stencil} />
      </mesh>
      {/* Near hill */}
      <mesh position={[0.6, -0.6, 0.075]}>
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial color="#7ea96e" {...stencil} />
      </mesh>
      {/* Tree on the far hill */}
      <group position={[-0.55, 0.18, 0.078]}>
        <mesh position={[0, -0.18, 0]}>
          <planeGeometry args={[0.05, 0.32]} />
          <meshBasicMaterial color="#5b3a26" {...stencil} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <circleGeometry args={[0.22, 24]} />
          <meshBasicMaterial color="#4f7e46" {...stencil} />
        </mesh>
        <mesh position={[-0.13, -0.03, 0.001]}>
          <circleGeometry args={[0.14, 24]} />
          <meshBasicMaterial color="#5e8e54" {...stencil} />
        </mesh>
        <mesh position={[0.13, -0.03, 0.001]}>
          <circleGeometry args={[0.14, 24]} />
          <meshBasicMaterial color="#5e8e54" {...stencil} />
        </mesh>
      </group>
      {/* Foreground bush, right side */}
      <group position={[0.85, -0.4, 0.079]}>
        <mesh>
          <circleGeometry args={[0.18, 20]} />
          <meshBasicMaterial color="#456e3b" {...stencil} />
        </mesh>
        <mesh position={[-0.13, 0.03, 0.001]}>
          <circleGeometry args={[0.13, 20]} />
          <meshBasicMaterial color="#4f7c43" {...stencil} />
        </mesh>
        <mesh position={[0.12, 0.05, 0.001]}>
          <circleGeometry args={[0.12, 20]} />
          <meshBasicMaterial color="#557f48" {...stencil} />
        </mesh>
      </group>
      {/* Foreground grass blades along bottom */}
      <mesh position={[0, -0.86, 0.08]}>
        <planeGeometry args={[2.72, 0.18]} />
        <meshBasicMaterial color="#3e6535" {...stencil} />
      </mesh>
      {/* Sleeping cat — 3D sphere/torus geometry with toon shading */}
      <group position={[-0.55, -0.78, 0.083]}>
        {/* Main body curl */}
        <mesh>
          <sphereGeometry args={[0.10, 14, 12]} />
          <meshToonMaterial color="#e2b07a" {...stencil} />
        </mesh>
        {/* Head tucked beside body */}
        <mesh position={[-0.08, 0.07, 0.04]}>
          <sphereGeometry args={[0.055, 12, 10]} />
          <meshToonMaterial color="#e8bb84" {...stencil} />
        </mesh>
        {/* Ears */}
        <mesh position={[-0.1, 0.12, 0.06]} rotation={[0, 0, 0.3]}>
          <coneGeometry args={[0.018, 0.038, 4]} />
          <meshToonMaterial color="#c89764" {...stencil} />
        </mesh>
        <mesh position={[-0.055, 0.13, 0.06]} rotation={[0, 0, -0.25]}>
          <coneGeometry args={[0.018, 0.038, 4]} />
          <meshToonMaterial color="#c89764" {...stencil} />
        </mesh>
        {/* Tail arc wrapping around body */}
        <mesh rotation={[Math.PI / 2, 0.4, 0]} position={[0.04, -0.02, 0]}>
          <torusGeometry args={[0.09, 0.022, 6, 20, Math.PI * 1.4]} />
          <meshToonMaterial color="#c89764" {...stencil} />
        </mesh>
      </group>
    </group>
  );
}

function WindowGlow() {
  return (
    <group position={[0, 3.15, -5.7]}>
      {/* Outer frame */}
      <RoundedBox args={[3.2, 2.3, 0.12]} radius={0.12} smoothness={4}>
        <meshToonMaterial color="#ede1bd" />
      </RoundedBox>
      {/* Stencil mask defines the glass opening — clips OutdoorScene to pane bounds */}
      <Mask id={1} position={[0, 0, 0.062]}>
        <planeGeometry args={[2.72, 1.82]} />
      </Mask>
      {/* Outdoor diorama clipped to the pane opening */}
      <OutdoorScene />
      {/* Translucent glass tint overlay */}
      <mesh position={[0, 0, 0.09]}>
        <planeGeometry args={[2.72, 1.82]} />
        <meshBasicMaterial color="#fff2ce" transparent opacity={0.18} />
      </mesh>
      {/* Mullions */}
      <mesh position={[0, 0, 0.105]}>
        <boxGeometry args={[2.78, 0.08, 0.04]} />
        <meshToonMaterial color="#e2cfaa" />
      </mesh>
      <mesh position={[0, 0, 0.105]}>
        <boxGeometry args={[0.08, 1.88, 0.04]} />
        <meshToonMaterial color="#e2cfaa" />
      </mesh>
      {/* Sunbeam pouring in from the window */}
      <spotLight
        position={[0, 0, 0.3]}
        target-position={[0, -3, 5]}
        intensity={1.4}
        distance={14}
        angle={0.85}
        penumbra={0.6}
        color="#ffe2a8"
      />
      <pointLight position={[0, 0, 0.5]} intensity={0.5} distance={6} color="#fff0c4" />
    </group>
  );
}

function Cat() {
  const catRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const cat = catRef.current;
    if (!cat) return;
    const t = clock.getElapsedTime();
    cat.position.y = 0.11 + Math.sin(t * 2.2) * 0.015;
    cat.rotation.z = Math.sin(t * 0.8) * 0.04;
  });

  return (
    <group ref={catRef} position={[3.55, 0.11, -3.45]} rotation={[0, -0.6, 0]}>
      <mesh position={[0, 0.14, 0]} castShadow>
        <capsuleGeometry args={[0.16, 0.4, 8, 12]} />
        <meshToonMaterial color="#d1b08b" />
      </mesh>
      <mesh position={[-0.23, 0.2, 0]} castShadow>
        <sphereGeometry args={[0.14, 16, 16]} />
        <meshToonMaterial color="#d7b895" />
      </mesh>
      <mesh position={[-0.29, 0.32, 0.05]} rotation={[0, 0, 0.2]} castShadow>
        <coneGeometry args={[0.05, 0.1, 4]} />
        <meshToonMaterial color="#d7b895" />
      </mesh>
      <mesh position={[-0.29, 0.32, -0.05]} rotation={[0, 0, 0.2]} castShadow>
        <coneGeometry args={[0.05, 0.1, 4]} />
        <meshToonMaterial color="#d7b895" />
      </mesh>
      <mesh position={[0.28, 0.2, 0.02]} rotation={[0.6, 0, 1.2]} castShadow>
        <capsuleGeometry args={[0.04, 0.26, 6, 10]} />
        <meshToonMaterial color="#c69b73" />
      </mesh>
    </group>
  );
}

function LibrarianBot() {
  const botRef = useRef<THREE.Group>(null);

  useFrame(({ clock }) => {
    const bot = botRef.current;
    if (!bot) return;
    const t = clock.getElapsedTime();
    const glide = Math.sin(t * 0.45);
    const shelfSide = glide > 0 ? 1 : -1;
    const picking = Math.sin(t * 1.2) > 0.82;

    bot.position.x = glide * 3.2;
    bot.position.y = 2.7 + Math.sin(t * 2.2) * 0.08;
    bot.position.z = -4.55 + Math.cos(t * 0.7) * 0.12;
    bot.rotation.y = THREE.MathUtils.lerp(bot.rotation.y, shelfSide > 0 ? -0.45 : 0.45, 0.08);
    bot.rotation.z = Math.sin(t * 2.2) * 0.08;

    const heldBook = bot.getObjectByName('heldBook');
    if (heldBook) {
      heldBook.visible = picking;
      heldBook.position.x = picking ? 0.22 * shelfSide : 0;
      heldBook.position.y = picking ? -0.02 : 0;
      heldBook.rotation.z = picking ? 0.2 * shelfSide : 0;
    }
  });

  return (
    <group ref={botRef} position={[0, 2.7, -4.55]}>
      <Float speed={1.2} floatIntensity={0.18} rotationIntensity={0.15}>
        <RoundedBox args={[0.34, 0.26, 0.28]} radius={0.11} smoothness={4} castShadow>
          <meshToonMaterial color="#99b9d8" />
        </RoundedBox>
        <mesh position={[0, 0.02, 0.15]}>
          <planeGeometry args={[0.14, 0.07]} />
          <meshBasicMaterial color="#2f3d56" />
        </mesh>
        <mesh position={[-0.04, 0.02, 0.16]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#fff7d0" />
        </mesh>
        <mesh position={[0.04, 0.02, 0.16]}>
          <sphereGeometry args={[0.01, 8, 8]} />
          <meshBasicMaterial color="#fff7d0" />
        </mesh>
        <mesh name="heldBook" position={[0, 0, 0]} visible={false}>
          <boxGeometry args={[0.1, 0.14, 0.08]} />
          <meshToonMaterial color="#cf8f73" />
        </mesh>
        <mesh position={[-0.2, -0.02, 0]} rotation={[0, 0, 0.8]} castShadow>
          <capsuleGeometry args={[0.03, 0.16, 6, 8]} />
          <meshToonMaterial color="#7d97b5" />
        </mesh>
        <mesh position={[0.2, -0.02, 0]} rotation={[0, 0, -0.8]} castShadow>
          <capsuleGeometry args={[0.03, 0.16, 6, 8]} />
          <meshToonMaterial color="#7d97b5" />
        </mesh>
        <mesh position={[-0.1, -0.22, 0]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshToonMaterial color="#7d97b5" />
        </mesh>
        <mesh position={[0.1, -0.22, 0]} castShadow>
          <sphereGeometry args={[0.05, 12, 12]} />
          <meshToonMaterial color="#7d97b5" />
        </mesh>
      </Float>
      <pointLight intensity={0.35} distance={2.5} color="#d6eeff" />
    </group>
  );
}

function DustMotes() {
  const points = useMemo(
    () =>
      Array.from({ length: 18 }, (_, index) => ({
        x: -4 + (index % 6) * 1.6,
        y: 1.2 + ((index * 17) % 5) * 0.35,
        z: -4.2 + Math.floor(index / 6) * 1.25,
        size: 0.02 + (index % 3) * 0.006,
      })),
    []
  );

  return (
    <>
      {points.map((point, index) => (
        <Float key={index} speed={0.5 + (index % 4) * 0.15} floatIntensity={0.28} rotationIntensity={0}>
          <mesh position={[point.x, point.y, point.z]}>
            <sphereGeometry args={[point.size, 8, 8]} />
            <meshBasicMaterial color="#ffe9bb" transparent opacity={0.28} />
          </mesh>
        </Float>
      ))}
    </>
  );
}

export function Library() {
  return (
    <>
      <color attach="background" args={['#f5e7c7']} />
      <fog attach="fog" args={['#f5e7c7', 8, 18]} />
      <Environment preset="sunset" />
      <ambientLight intensity={0.7} color="#ffd9a3" />
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.2}
        color="#fff0c4"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 3.5, -2]} intensity={0.25} color="#b9d4ff" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.38} scale={11} blur={1.6} far={4.5} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshToonMaterial color="#d9b07d" />
      </mesh>

      {Array.from({ length: 11 }, (_, index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.5 + index * 1.05]}>
          <planeGeometry args={[24, 0.035]} />
          <meshBasicMaterial color="#c69764" transparent opacity={0.32} />
        </mesh>
      ))}

      <RoundedBox args={[15.5, 6.2, 0.5]} radius={0.28} smoothness={4} position={[0, 3.1, -6]} receiveShadow>
        <meshToonMaterial color="#8b5f3f" />
      </RoundedBox>
      <RoundedBox args={[15.1, 1.85, 0.2]} radius={0.16} smoothness={4} position={[0, 1.05, -5.72]}>
        <meshToonMaterial color="#6f492f" />
      </RoundedBox>

      {[-7.2, 7.2].map((x) => (
        <RoundedBox
          key={x}
          args={[0.42, 6, 11.6]}
          radius={0.2}
          smoothness={4}
          position={[x, 3, -0.35]}
          receiveShadow
        >
          <meshToonMaterial color="#a0704d" />
        </RoundedBox>
      ))}

      <RoundedBox args={[15.2, 0.5, 11.8]} radius={0.22} smoothness={4} position={[0, 6.1, -0.2]}>
        <meshToonMaterial color="#f4e7c8" />
      </RoundedBox>

      <WindowGlow />
      <WallLamp position={[-4.4, 3.25, -5.55]} />
      <WallLamp position={[4.4, 3.25, -5.55]} />

      {[-5.25, 5.25].map((x) => (
        <group key={x} position={[x, 0.2, -5.25]}>
          {/* Back panel of cubby */}
          <RoundedBox args={[3.25, 4.6, 0.1]} radius={0.04} smoothness={3} position={[0, 2.1, -0.35]} castShadow receiveShadow>
            <meshToonMaterial color="#5e3d28" />
          </RoundedBox>
          {/* Side panels */}
          <RoundedBox args={[0.18, 4.6, 0.78]} radius={0.05} smoothness={3} position={[-1.535, 2.1, 0.01]} castShadow receiveShadow>
            <meshToonMaterial color="#5e3d28" />
          </RoundedBox>
          <RoundedBox args={[0.18, 4.6, 0.78]} radius={0.05} smoothness={3} position={[1.535, 2.1, 0.01]} castShadow receiveShadow>
            <meshToonMaterial color="#5e3d28" />
          </RoundedBox>
          {/* Top and bottom caps */}
          <RoundedBox args={[3.25, 0.18, 0.78]} radius={0.05} smoothness={3} position={[0, 4.31, 0.01]} castShadow receiveShadow>
            <meshToonMaterial color="#5e3d28" />
          </RoundedBox>
          <RoundedBox args={[3.25, 0.18, 0.78]} radius={0.05} smoothness={3} position={[0, -0.11, 0.01]} castShadow receiveShadow>
            <meshToonMaterial color="#5e3d28" />
          </RoundedBox>
          {/* Horizontal shelves inside the cubby */}
          {[0.55, 1.35, 2.15, 2.95, 3.75].map((y) => (
            <RoundedBox key={y} args={[2.84, 0.09, 0.7]} radius={0.03} smoothness={3} position={[0, y, 0.01]} castShadow receiveShadow>
              <meshToonMaterial color="#c49366" />
            </RoundedBox>
          ))}
          {/* Books sit inside the cubby, in front of back panel */}
          {[0.64, 1.44, 2.24, 3.04, 3.84].map((y) => (
            <ShelfBooks key={y} position={[0, y, 0.05]} />
          ))}
        </group>
      ))}

      <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.8, -2.1]} castShadow receiveShadow>
        <meshToonMaterial color="#815738" />
      </RoundedBox>
      {[-2.75, 2.75].map((x) => (
        <RoundedBox
          key={x}
          args={[0.22, 0.72, 1.3]}
          radius={0.08}
          smoothness={4}
          position={[x, 0.4, -2.1]}
          castShadow
        >
          <meshToonMaterial color="#6a452d" />
        </RoundedBox>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -2.7]} receiveShadow>
        <planeGeometry args={[7.4, 4.4]} />
        <meshToonMaterial color="#d98873" transparent opacity={0.92} />
      </mesh>

      <RoundedBox args={[1.6, 0.34, 0.86]} radius={0.18} smoothness={4} position={[0, 0.2, -4.5]} castShadow>
        <meshToonMaterial color="#f1d7a4" />
      </RoundedBox>
      <Cat />
      <LibrarianBot />
      <DustMotes />
    </>
  );
}
