import { ContactShadows, Environment, Float, Mask, RoundedBox, Text, useMask } from '@react-three/drei';
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';

function Balloon({ position, color }: { position: [number, number, number]; color: string }) {
  return (
    <Float speed={0.8} floatIntensity={0.22} rotationIntensity={0.04}>
      <group position={position}>
        <mesh castShadow>
          <sphereGeometry args={[0.18, 14, 14]} />
          <meshToonMaterial color={color} />
        </mesh>
        {/* Knot */}
        <mesh position={[0, -0.19, 0]}>
          <sphereGeometry args={[0.028, 8, 8]} />
          <meshToonMaterial color={color} />
        </mesh>
        {/* String */}
        <mesh position={[0.02, -0.6, 0]} rotation={[0, 0, 0.1]}>
          <cylinderGeometry args={[0.004, 0.004, 0.8, 4]} />
          <meshToonMaterial color="#c8b090" />
        </mesh>
      </group>
    </Float>
  );
}

function PennantBanner({ z, y, count = 8 }: { z: number; y: number; count?: number }) {
  const colors = ['#e83030', '#e87a10', '#e8cc10', '#30cc40', '#2080e8', '#8840e8', '#e840a0'];
  return (
    <group>
      {/* String */}
      <mesh position={[0, y, z]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.006, 0.006, 13.0, 5]} />
        <meshToonMaterial color="#a08060" />
      </mesh>
      {Array.from({ length: count }, (_, i) => {
        const x = -5.5 + (i / (count - 1)) * 11;
        const sag = Math.sin((i / (count - 1)) * Math.PI) * 0.18;
        const col = colors[i % colors.length];
        return (
          <group key={i} position={[x, y - 0.06 - sag, z]}>
            {/* Flip cone to point downward */}
            <mesh rotation={[Math.PI, 0, i * 0.18]}>
              <coneGeometry args={[0.11, 0.22, 4]} />
              <meshToonMaterial color={col} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
}

function ShelfBooks({ position }: { position: [number, number, number] }) {
  const books = useMemo(
    () =>
      Array.from({ length: 15 }, (_, i) => {
        const colors = ['#e85a3a', '#5f7fe8', '#e8c43a', '#4aaa5a', '#cc55cc', '#e87a28', '#3ab8e8', '#e84a8a'];
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
        <meshToonMaterial color="#c87840" />
      </RoundedBox>
      <mesh position={[0, -0.05, 0.04]}>
        <sphereGeometry args={[0.13, 16, 16]} />
        <meshToonMaterial color="#ffe87a" emissive="#ffcc44" emissiveIntensity={0.55} />
      </mesh>
      <pointLight position={[0, -0.05, 0.18]} intensity={0.9} distance={4.5} color="#ffcc44" />
    </group>
  );
}

function OutdoorScene() {
  const stencil = useMask(1);
  return (
    <group>
      {/* Sky — vivid Rec Room blue */}
      <mesh position={[0, 0, 0.07]}>
        <planeGeometry args={[2.72, 1.82]} />
        <meshBasicMaterial color="#88ccff" {...stencil} />
      </mesh>
      {/* Bright sun */}
      <mesh position={[0.55, -0.1, 0.072]}>
        <circleGeometry args={[0.55, 24]} />
        <meshBasicMaterial color="#ffe840" transparent opacity={0.9} {...stencil} />
      </mesh>
      <mesh position={[0.55, -0.1, 0.073]}>
        <circleGeometry args={[0.22, 24]} />
        <meshBasicMaterial color="#fff880" {...stencil} />
      </mesh>
      {/* Far hill — vibrant green */}
      <mesh position={[-0.4, -0.45, 0.074]}>
        <circleGeometry args={[1.25, 32]} />
        <meshBasicMaterial color="#66cc44" {...stencil} />
      </mesh>
      {/* Near hill */}
      <mesh position={[0.6, -0.6, 0.075]}>
        <circleGeometry args={[1.0, 32]} />
        <meshBasicMaterial color="#44aa28" {...stencil} />
      </mesh>
      {/* Tree on the far hill */}
      <group position={[-0.55, 0.18, 0.078]}>
        <mesh position={[0, -0.18, 0]}>
          <planeGeometry args={[0.05, 0.32]} />
          <meshBasicMaterial color="#5b3a26" {...stencil} />
        </mesh>
        <mesh position={[0, 0.05, 0]}>
          <circleGeometry args={[0.22, 24]} />
          <meshBasicMaterial color="#44aa22" {...stencil} />
        </mesh>
        <mesh position={[-0.13, -0.03, 0.001]}>
          <circleGeometry args={[0.14, 24]} />
          <meshBasicMaterial color="#55bb30" {...stencil} />
        </mesh>
        <mesh position={[0.13, -0.03, 0.001]}>
          <circleGeometry args={[0.14, 24]} />
          <meshBasicMaterial color="#55bb30" {...stencil} />
        </mesh>
      </group>
      {/* Foreground bush, right side */}
      <group position={[0.85, -0.4, 0.079]}>
        <mesh>
          <circleGeometry args={[0.18, 20]} />
          <meshBasicMaterial color="#33aa22" {...stencil} />
        </mesh>
        <mesh position={[-0.13, 0.03, 0.001]}>
          <circleGeometry args={[0.13, 20]} />
          <meshBasicMaterial color="#44bb30" {...stencil} />
        </mesh>
        <mesh position={[0.12, 0.05, 0.001]}>
          <circleGeometry args={[0.12, 20]} />
          <meshBasicMaterial color="#44bb30" {...stencil} />
        </mesh>
      </group>
      {/* Foreground grass blades along bottom */}
      <mesh position={[0, -0.86, 0.08]}>
        <planeGeometry args={[2.72, 0.18]} />
        <meshBasicMaterial color="#228a14" {...stencil} />
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
      <color attach="background" args={['#ffe8c0']} />
      <fog attach="fog" args={['#ffe8c0', 8, 18]} />
      <Environment preset="sunset" />
      <ambientLight intensity={0.85} color="#ffcc66" />
      <directionalLight
        position={[4, 6, 5]}
        intensity={1.4}
        color="#fff4d0"
        castShadow
        shadow-mapSize-width={2048}
        shadow-mapSize-height={2048}
      />
      <directionalLight position={[-5, 3.5, -2]} intensity={0.3} color="#b9d4ff" />

      <ContactShadows position={[0, 0.02, -2.1]} opacity={0.38} scale={11} blur={1.6} far={4.5} />

      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <planeGeometry args={[24, 24]} />
        <meshToonMaterial color="#e09a50" />
      </mesh>

      {Array.from({ length: 11 }, (_, index) => (
        <mesh key={index} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.002, -5.5 + index * 1.05]}>
          <planeGeometry args={[24, 0.035]} />
          <meshBasicMaterial color="#d08040" transparent opacity={0.38} />
        </mesh>
      ))}

      <RoundedBox args={[15.5, 6.2, 0.5]} radius={0.28} smoothness={4} position={[0, 3.1, -6]} receiveShadow>
        <meshToonMaterial color="#c8784a" />
      </RoundedBox>
      <RoundedBox args={[15.1, 1.85, 0.2]} radius={0.16} smoothness={4} position={[0, 1.05, -5.72]}>
        <meshToonMaterial color="#a85c30" />
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
          <meshToonMaterial color="#c87840" />
        </RoundedBox>
      ))}

      <RoundedBox args={[15.2, 0.5, 11.8]} radius={0.22} smoothness={4} position={[0, 6.1, -0.2]}>
        <meshToonMaterial color="#fff4d8" />
      </RoundedBox>

      <WindowGlow />
      <WallLamp position={[-4.4, 3.25, -5.55]} />
      <WallLamp position={[4.4, 3.25, -5.55]} />

      {/* Colorful "STUDY TIME" sign — Rec Room wall decoration */}
      <group position={[-4.0, 4.6, -5.65]}>
        <RoundedBox args={[2.1, 0.5, 0.06]} radius={0.08} smoothness={3}>
          <meshToonMaterial color="#d44020" />
        </RoundedBox>
        <Text
          position={[0, 0, 0.04]}
          fontSize={0.26}
          color="#fff8e0"
          anchorX="center"
          anchorY="middle"
        >
          STUDY TIME
        </Text>
      </group>

      {[-5.25, 5.25].map((x) => (
        <group key={x} position={[x, 0.2, -5.25]}>
          {/* Back panel of cubby */}
          <RoundedBox args={[3.25, 4.6, 0.1]} radius={0.04} smoothness={3} position={[0, 2.1, -0.35]} castShadow receiveShadow>
            <meshToonMaterial color="#7a5035" />
          </RoundedBox>
          {/* Side panels */}
          <RoundedBox args={[0.18, 4.6, 0.78]} radius={0.05} smoothness={3} position={[-1.535, 2.1, 0.01]} castShadow receiveShadow>
            <meshToonMaterial color="#7a5035" />
          </RoundedBox>
          <RoundedBox args={[0.18, 4.6, 0.78]} radius={0.05} smoothness={3} position={[1.535, 2.1, 0.01]} castShadow receiveShadow>
            <meshToonMaterial color="#7a5035" />
          </RoundedBox>
          {/* Top and bottom caps */}
          <RoundedBox args={[3.25, 0.18, 0.78]} radius={0.05} smoothness={3} position={[0, 4.31, 0.01]} castShadow receiveShadow>
            <meshToonMaterial color="#7a5035" />
          </RoundedBox>
          <RoundedBox args={[3.25, 0.18, 0.78]} radius={0.05} smoothness={3} position={[0, -0.11, 0.01]} castShadow receiveShadow>
            <meshToonMaterial color="#7a5035" />
          </RoundedBox>
          {/* Horizontal shelves inside the cubby */}
          {[0.55, 1.35, 2.15, 2.95, 3.75].map((y) => (
            <RoundedBox key={y} args={[2.84, 0.09, 0.7]} radius={0.03} smoothness={3} position={[0, y, 0.01]} castShadow receiveShadow>
              <meshToonMaterial color="#d4a860" />
            </RoundedBox>
          ))}
          {/* Books sit inside the cubby, in front of back panel */}
          {[0.64, 1.44, 2.24, 3.04, 3.84].map((y) => (
            <ShelfBooks key={y} position={[0, y, 0.05]} />
          ))}
        </group>
      ))}

      <RoundedBox args={[6.3, 0.14, 1.75]} radius={0.12} smoothness={4} position={[0, 0.8, -2.1]} castShadow receiveShadow>
        <meshToonMaterial color="#aa7040" />
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
          <meshToonMaterial color="#885030" />
        </RoundedBox>
      ))}

      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, -2.7]} receiveShadow>
        <planeGeometry args={[7.4, 4.4]} />
        <meshToonMaterial color="#e04030" transparent opacity={0.88} />
      </mesh>

      <RoundedBox args={[1.6, 0.34, 0.86]} radius={0.18} smoothness={4} position={[0, 0.2, -4.5]} castShadow>
        <meshToonMaterial color="#f5c842" />
      </RoundedBox>
      {/* Colorful pennant banners — Rec Room signature decoration */}
      <PennantBanner z={-5.55} y={4.8} count={9} />
      <PennantBanner z={-3.2} y={5.5} count={7} />

      {/* Floating balloons — within safe interior zone */}
      <Balloon position={[-3.1, 4.0, -4.3]} color="#e83030" />
      <Balloon position={[-2.6, 4.5, -3.1]} color="#e8cc10" />
      <Balloon position={[3.1, 4.0, -4.1]} color="#2080e8" />
      <Balloon position={[2.5, 4.4, -3.0]} color="#30cc40" />

      <Cat />
      <LibrarianBot />
      <DustMotes />
    </>
  );
}
