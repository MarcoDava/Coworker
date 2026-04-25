import { ContactShadows, Environment, Float, RoundedBox } from '@react-three/drei';
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

function WindowGlow() {
  return (
    <group position={[0, 3.15, -5.7]}>
      <RoundedBox args={[3.2, 2.3, 0.12]} radius={0.12} smoothness={4}>
        <meshToonMaterial color="#ede1bd" />
      </RoundedBox>
      <mesh position={[0, 0, 0.08]}>
        <planeGeometry args={[2.72, 1.82]} />
        <meshBasicMaterial color="#fff2ce" transparent opacity={0.9} />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[2.78, 0.08, 0.04]} />
        <meshToonMaterial color="#e2cfaa" />
      </mesh>
      <mesh position={[0, 0, 0.1]}>
        <boxGeometry args={[0.08, 1.88, 0.04]} />
        <meshToonMaterial color="#e2cfaa" />
      </mesh>
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
      <WallLamp position={[-4.4, 3.25, -5.62]} />
      <WallLamp position={[4.4, 3.25, -5.62]} />

      {[-5.25, 5.25].map((x) => (
        <group key={x} position={[x, 0.2, -5.25]}>
          <RoundedBox args={[3.25, 4.6, 0.8]} radius={0.18} smoothness={4} position={[0, 2.1, 0]} castShadow receiveShadow>
            <meshToonMaterial color="#5e3d28" />
          </RoundedBox>
          {[0.55, 1.35, 2.15, 2.95, 3.75].map((y) => (
            <RoundedBox key={y} args={[2.7, 0.09, 0.5]} radius={0.03} smoothness={3} position={[0, y, 0.16]} castShadow>
              <meshToonMaterial color="#c49366" />
            </RoundedBox>
          ))}
          {[0.37, 1.17, 1.97, 2.77, 3.57].map((y) => (
            <ShelfBooks key={y} position={[0, y, 0.34]} />
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
