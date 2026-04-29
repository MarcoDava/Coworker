import { Canvas, useFrame } from '@react-three/fiber';
import { Environment, Float, RoundedBox } from '@react-three/drei';
import { useRef, useState } from 'react';
import type { Group } from 'three';
import * as THREE from 'three';
import { AboutModal } from '../ui/AboutModal';

type Props = { onEnter: () => void };

export function Hero({ onEnter }: Props) {
  const [showAbout, setShowAbout] = useState(false);

  return (
    <div style={{ position: 'relative', height: '100%', width: '100%', overflow: 'hidden' }}>
      {showAbout && <AboutModal onClose={() => setShowAbout(false)} />}
      {/* 3D backdrop */}
      <div style={{ position: 'absolute', inset: 0, opacity: 0.9 }}>
        <Canvas camera={{ position: [0, 0.8, 5], fov: 45 }}>
          <Environment preset="apartment" />
          <ambientLight intensity={0.4} />
          <directionalLight position={[4, 6, 3]} intensity={0.7} />
          <FloatingDesks />
        </Canvas>
      </div>

      {/* vignette + gradient wash */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background:
            'radial-gradient(1200px 600px at 50% 110%, rgba(124,108,255,0.25), transparent 60%),' +
            'linear-gradient(180deg, rgba(11,11,18,0.2) 0%, rgba(11,11,18,0.85) 70%, rgba(11,11,18,0.98) 100%)',
          pointerEvents: 'none',
        }}
      />

      {/* content */}
      <div
        style={{
          position: 'relative',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 48,
          textAlign: 'center',
        }}
      >
        <div style={pill}>
          <span style={dot} />
          a shared virtual workspace — for two
        </div>

        <h1
          style={{
            fontSize: 88,
            margin: '20px 0 12px',
            fontWeight: 700,
            letterSpacing: '-0.03em',
            lineHeight: 1,
          }}
        >
          <span
            style={{
              background: 'linear-gradient(90deg,#cfc6ff,#8aa9ff 40%,#7ae0a3)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
            }}
          >
            lock in together.
          </span>
        </h1>
        <div style={{ color: 'var(--text-dim)', fontSize: 18, maxWidth: 620, lineHeight: 1.5 }}>
          you and a friend sit at in-world laptops in a shared 3D library.
          <br />
          peek at each other's real desktops. call out slacking. earn points.
        </div>

        <div style={{ display: 'flex', gap: 12, marginTop: 36 }}>
          <button
            className="primary"
            style={{ padding: '14px 26px', fontSize: 16, borderRadius: 12 }}
            onClick={onEnter}
          >
            ▶  Get started
          </button>
          <button
            className="ghost"
            style={{ padding: '14px 20px', fontSize: 15, borderRadius: 12 }}
            onClick={() =>
              document.getElementById('how-it-works')?.scrollIntoView({ behavior: 'smooth' })
            }
          >
            How it works
          </button>
        </div>

        <div id="how-it-works" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14, marginTop: 56, maxWidth: 900, width: '100%' }}>
          <Feature
            icon="🖥"
            title="Live desktop share"
            body="Your real screen is painted onto your in-world laptop via WebRTC. Your friend can glance over anytime."
          />
          <Feature
            icon="👁"
            title="Peek & call out"
            body="Hold Alt to peek at their laptop. If they're slacking, tap Space and score points."
          />
          <Feature
            icon="⚖"
            title="Fair disputes"
            body="Call out someone who's actually working? You'll owe them an explanation — or lose points."
          />
        </div>

        <div style={{ marginTop: 48, color: 'var(--text-mute)', fontSize: 12 }}>
          run <span style={kbd}>npm run signaling</span> once before your first session
        </div>
      </div>

      <button
        className="ghost"
        style={{
          position: 'absolute',
          bottom: 16,
          right: 16,
          fontSize: 12,
          color: 'var(--text-mute)',
          padding: '6px 12px',
          borderRadius: 8,
        }}
        onClick={() => setShowAbout(true)}
      >
        About
      </button>
    </div>
  );
}

function FloatingDesks() {
  const g = useRef<Group>(null);
  useFrame(({ clock }) => {
    if (g.current) g.current.rotation.y = Math.sin(clock.elapsedTime * 0.15) * 0.15;
  });
  return (
    <group ref={g} position={[0, -0.4, 0]}>
      <Float speed={1.2} rotationIntensity={0.2} floatIntensity={0.5}>
        <MiniDesk position={[-1.8, 0, 0]} color="#5aa8ff" />
      </Float>
      <Float speed={1.4} rotationIntensity={0.2} floatIntensity={0.5}>
        <MiniDesk position={[1.8, 0, 0]} color="#ff8e5a" />
      </Float>
    </group>
  );
}

function MiniDesk({ position, color }: { position: [number, number, number]; color: string }) {
  const skinColor = color === '#5aa8ff' ? '#f8d2aa' : '#fcd0b0';
  const hairColor = color === '#5aa8ff' ? '#3a2010' : '#1a1010';
  return (
    <group position={position}>
      {/* Desk */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.6, 0.08, 1]} />
        <meshToonMaterial color="#aa7040" />
      </mesh>
      {/* Laptop base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[1, 0.04, 0.65]} />
        <meshToonMaterial color="#1a1a1a" />
      </mesh>
      {/* Screen */}
      <mesh position={[0, 0.45, -0.3]} rotation={[-0.25, 0, 0]}>
        <boxGeometry args={[1, 0.65, 0.03]} />
        <meshStandardMaterial color="#0a0a0a" emissive={color} emissiveIntensity={0.5} />
      </mesh>
      {/* Body outline */}
      <RoundedBox args={[0.47, 0.41, 0.37]} radius={0.14} smoothness={4} position={[0, -0.65, 0.22]}>
        <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
      </RoundedBox>
      {/* Body — Rec Room puffy */}
      <RoundedBox args={[0.44, 0.38, 0.34]} radius={0.13} smoothness={4} position={[0, -0.65, 0.22]}>
        <meshToonMaterial color={color} />
      </RoundedBox>
      {/* Head outline */}
      <mesh position={[0, -0.24, 0.22]}>
        <sphereGeometry args={[0.252, 14, 14]} />
        <meshBasicMaterial color="#1a1008" side={THREE.BackSide} />
      </mesh>
      {/* Head — big sphere */}
      <mesh position={[0, -0.24, 0.22]}>
        <sphereGeometry args={[0.24, 14, 14]} />
        <meshToonMaterial color={skinColor} />
      </mesh>
      {/* Hair — flat top */}
      <RoundedBox args={[0.44, 0.11, 0.40]} radius={0.07} smoothness={4} position={[0, -0.05, 0.20]}>
        <meshToonMaterial color={hairColor} />
      </RoundedBox>
      {/* Eyes white */}
      <mesh position={[-0.085, -0.21, 0.43]}>
        <sphereGeometry args={[0.048, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      <mesh position={[0.085, -0.21, 0.43]}>
        <sphereGeometry args={[0.048, 8, 8]} />
        <meshBasicMaterial color="white" />
      </mesh>
      {/* Iris */}
      <mesh position={[-0.085, -0.21, 0.441]}>
        <circleGeometry args={[0.032, 10]} />
        <meshBasicMaterial color="#3a88cc" />
      </mesh>
      <mesh position={[0.085, -0.21, 0.441]}>
        <circleGeometry args={[0.032, 10]} />
        <meshBasicMaterial color="#3a88cc" />
      </mesh>
      {/* Pupils */}
      <mesh position={[-0.085, -0.21, 0.449]}>
        <circleGeometry args={[0.018, 8]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      <mesh position={[0.085, -0.21, 0.449]}>
        <circleGeometry args={[0.018, 8]} />
        <meshBasicMaterial color="#1a1a2e" />
      </mesh>
      {/* Cheek blushes */}
      <mesh position={[-0.14, -0.27, 0.44]}>
        <circleGeometry args={[0.038, 8]} />
        <meshBasicMaterial color="#f0a090" transparent opacity={0.35} />
      </mesh>
      <mesh position={[0.14, -0.27, 0.44]}>
        <circleGeometry args={[0.038, 8]} />
        <meshBasicMaterial color="#f0a090" transparent opacity={0.35} />
      </mesh>
      {/* Smile */}
      <mesh position={[0, -0.30, 0.455]} rotation={[0, 0, Math.PI]}>
        <torusGeometry args={[0.055, 0.010, 6, 10, Math.PI]} />
        <meshBasicMaterial color="#c07060" />
      </mesh>
    </group>
  );
}

function Feature({ icon, title, body }: { icon: string; title: string; body: string }) {
  return (
    <div
      style={{
        background: 'var(--panel)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        border: '1px solid var(--border)',
        borderRadius: 14,
        padding: 20,
        textAlign: 'left',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div style={{ fontSize: 22, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{title}</div>
      <div style={{ color: 'var(--text-dim)', fontSize: 13, lineHeight: 1.5 }}>{body}</div>
    </div>
  );
}

const pill: React.CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: 10,
  padding: '6px 14px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-dim)',
  fontSize: 12,
  letterSpacing: 0.2,
};

const dot: React.CSSProperties = {
  width: 8,
  height: 8,
  borderRadius: 999,
  background: 'var(--good)',
  boxShadow: '0 0 8px var(--good)',
};

const kbd: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  padding: '2px 6px',
  border: '1px solid var(--border-strong)',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--text-dim)',
};
