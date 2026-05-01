import { Canvas, useFrame } from '@react-three/fiber';
import { useRef } from 'react';
import * as THREE from 'three';
import { Avatar } from '../scene/Avatar';
import { SKINS, type AvatarAppearance } from '../data/skins';

function RotatingPreview({ appearance }: { appearance: AvatarAppearance }) {
  const ref = useRef<THREE.Group>(null);
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.55;
  });
  return (
    <group ref={ref}>
      <Avatar
        position={[0, 0, 0]}
        rotationY={Math.PI}
        color={appearance.bodyColor}
        skinColor={appearance.skinTone}
        hairColor={appearance.hairColor}
        eyeColor={appearance.eyeColor}
        chairColor={appearance.chairColor}
      />
    </group>
  );
}

type Props = {
  value: AvatarAppearance;
  onChange: (a: AvatarAppearance) => void;
};

export function CharacterCustomizer({ value, onChange }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ height: 210, borderRadius: 14, overflow: 'hidden', background: '#0b0f1c' }}>
        <Canvas camera={{ position: [0, 1.5, 3.1], fov: 46 }} gl={{ antialias: true }}>
          <color attach="background" args={['#0b0f1c']} />
          <ambientLight intensity={0.75} color="#ffeedd" />
          <directionalLight position={[2, 4, 3]} intensity={1.3} />
          <directionalLight position={[-1, 2, -1]} intensity={0.28} color="#aaccff" />
          <RotatingPreview appearance={value} />
        </Canvas>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 5 }}>
        {SKINS.map((skin) => {
          const selected = skin.id === value.id;
          return (
            <button
              key={skin.id}
              onClick={() => !skin.locked && onChange(skin)}
              title={skin.locked ? `${skin.name} · coming soon` : skin.name}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 4,
                padding: '7px 4px 5px',
                borderRadius: 10,
                border: selected ? `2px solid ${skin.bodyColor}` : '2px solid transparent',
                background: selected ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.025)',
                cursor: skin.locked ? 'not-allowed' : 'pointer',
                opacity: skin.locked ? 0.4 : 1,
                transition: 'border-color 100ms, background 100ms, opacity 100ms',
              }}
            >
              <div style={{ position: 'relative', width: 26, height: 26 }}>
                <div
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: '50%',
                    background: skin.bodyColor,
                    boxShadow: selected ? `0 0 9px ${skin.bodyColor}99` : undefined,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    bottom: -1,
                    right: -1,
                    width: 11,
                    height: 11,
                    borderRadius: '50%',
                    background: skin.hairColor,
                    border: '1.5px solid rgba(0,0,0,0.5)',
                  }}
                />
              </div>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 600,
                  color: skin.locked ? 'var(--text-mute)' : selected ? 'var(--text)' : 'var(--text-dim)',
                  letterSpacing: 0.2,
                }}
              >
                {skin.locked ? 'locked' : skin.name}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
