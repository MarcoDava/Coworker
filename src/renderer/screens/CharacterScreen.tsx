import { Canvas, useFrame } from '@react-three/fiber';
import { useRef, useState } from 'react';
import * as THREE from 'three';
import { Avatar } from '../scene/Avatar';
import { SKINS, loadAppearance, saveAppearance, type AvatarAppearance } from '../data/skins';

function DraggableAvatar({ appearance, rotY }: { appearance: AvatarAppearance; rotY: React.MutableRefObject<number> }) {
  const ref = useRef<THREE.Group>(null);
  useFrame(() => {
    if (ref.current) ref.current.rotation.y = rotY.current;
  });
  return (
    <group ref={ref} position={[0, -0.92, 0]}>
      <Avatar
        position={[0, 0, 0]}
        rotationY={0}
        color={appearance.bodyColor}
        skinColor={appearance.skinTone}
        hairColor={appearance.hairColor}
        eyeColor={appearance.eyeColor}
        chairColor={appearance.chairColor}
      />
    </group>
  );
}

type Tab = 'colors' | 'face' | 'body' | 'accessories';

type Props = { onBack: () => void };

export function CharacterScreen({ onBack }: Props) {
  const [appearance, setAppearance] = useState<AvatarAppearance>(() => loadAppearance());
  const [tab, setTab] = useState<Tab>('colors');

  const rotY = useRef(Math.PI);
  const dragging = useRef(false);
  const lastX = useRef(0);
  const [isDragging, setIsDragging] = useState(false);

  function handlePointerDown(e: React.PointerEvent) {
    dragging.current = true;
    lastX.current = e.clientX;
    setIsDragging(true);
    (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
  }

  function handlePointerMove(e: React.PointerEvent) {
    if (!dragging.current) return;
    rotY.current += (e.clientX - lastX.current) * 0.012;
    lastX.current = e.clientX;
  }

  function handlePointerUp() {
    dragging.current = false;
    setIsDragging(false);
  }

  function handleSave() {
    saveAppearance(appearance);
    onBack();
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', zIndex: 50 }}>
      <div style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onBack} style={backBtn}>Back</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Customize Character</h2>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 420px', minHeight: 0 }}>
        <div
          style={{ background: '#080c18', position: 'relative', cursor: isDragging ? 'grabbing' : 'grab' }}
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerLeave={handlePointerUp}
        >
          <Canvas camera={{ position: [0, 0.15, 3.2], fov: 50 }} gl={{ antialias: true }}>
            <color attach="background" args={['#080c18']} />
            <ambientLight intensity={0.72} color="#ffeedd" />
            <directionalLight position={[2, 4, 3]} intensity={1.3} />
            <directionalLight position={[-1, 2, -1]} intensity={0.28} color="#aaccff" />
            <DraggableAvatar appearance={appearance} rotY={rotY} />
          </Canvas>
          <div style={{ position: 'absolute', bottom: 20, left: 0, right: 0, textAlign: 'center', fontSize: 11, color: 'rgba(255,255,255,0.22)', pointerEvents: 'none' }}>
            drag to rotate
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', borderLeft: '1px solid var(--border)', minHeight: 0 }}>
          <div style={{ display: 'flex', padding: '0 20px', borderBottom: '1px solid var(--border)', gap: 2, flexShrink: 0 }}>
            {(['colors', 'face', 'body', 'accessories'] as Tab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                style={{
                  padding: '12px 14px',
                  borderRadius: 0,
                  border: 'none',
                  borderBottom: t === tab ? '2px solid var(--accent)' : '2px solid transparent',
                  background: 'none',
                  color: t === tab ? 'var(--text)' : 'var(--text-dim)',
                  fontWeight: t === tab ? 700 : 400,
                  cursor: 'pointer',
                  fontSize: 13,
                  textTransform: 'capitalize',
                  transition: 'color 120ms',
                }}
              >
                {t}
              </button>
            ))}
          </div>

          <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
            {tab === 'colors' && <ColorsTab appearance={appearance} onChange={setAppearance} />}
            {tab !== 'colors' && <ComingSoon tab={tab} />}
          </div>

          <div style={{ padding: '16px 20px', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end', gap: 10, flexShrink: 0 }}>
            <button onClick={onBack} style={backBtn}>Cancel</button>
            <button
              className="primary"
              style={{ padding: '9px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              onClick={handleSave}
            >
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ColorsTab({ appearance, onChange }: { appearance: AvatarAppearance; onChange: (a: AvatarAppearance) => void }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div>
        <div style={sectionLabel}>Skins</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 6 }}>
          {SKINS.map((skin) => {
            const selected = skin.id === appearance.id;
            return (
              <button
                key={skin.id}
                onClick={() => !skin.locked && onChange(skin)}
                title={skin.locked ? `${skin.name} · coming soon` : skin.name}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5,
                  padding: '8px 4px', borderRadius: 10,
                  border: selected ? `2px solid ${skin.bodyColor}` : '2px solid transparent',
                  background: selected ? 'rgba(255,255,255,0.07)' : 'rgba(255,255,255,0.03)',
                  cursor: skin.locked ? 'not-allowed' : 'pointer',
                  opacity: skin.locked ? 0.38 : 1,
                  transition: 'border-color 100ms, background 100ms',
                }}
              >
                <div style={{ position: 'relative', width: 30, height: 30 }}>
                  <div style={{
                    width: 30, height: 30, borderRadius: '50%', background: skin.bodyColor,
                    boxShadow: selected ? `0 0 10px ${skin.bodyColor}99` : undefined,
                  }} />
                  <div style={{
                    position: 'absolute', bottom: -1, right: -1, width: 12, height: 12,
                    borderRadius: '50%', background: skin.hairColor, border: '1.5px solid rgba(0,0,0,0.5)',
                  }} />
                </div>
                <span style={{ fontSize: 9, fontWeight: 600, color: skin.locked ? 'var(--text-mute)' : selected ? 'var(--text)' : 'var(--text-dim)' }}>
                  {skin.locked ? 'locked' : skin.name}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <div style={sectionLabel}>Fine-tune</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {([
            { key: 'bodyColor', label: 'Body' },
            { key: 'skinTone', label: 'Skin' },
            { key: 'hairColor', label: 'Hair' },
            { key: 'eyeColor', label: 'Eyes' },
            { key: 'chairColor', label: 'Chair' },
          ] as { key: keyof AvatarAppearance; label: string }[]).map(({ key, label }) => (
            <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 12, fontSize: 13 }}>
              <span style={{ width: 48, color: 'var(--text-dim)' }}>{label}</span>
              <input
                type="color"
                value={appearance[key] as string}
                onChange={(e) => onChange({ ...appearance, id: 'custom', name: 'Custom', [key]: e.target.value })}
                style={{ width: 36, height: 28, borderRadius: 6, border: '1px solid var(--border)', cursor: 'pointer', background: 'none', padding: 2 }}
              />
              <span style={{ fontSize: 11, color: 'var(--text-mute)', fontFamily: 'JetBrains Mono, monospace' }}>
                {(appearance[key] as string).toUpperCase()}
              </span>
            </label>
          ))}
        </div>
      </div>
    </div>
  );
}

function ComingSoon({ tab }: { tab: Tab }) {
  const info: Record<Tab, { title: string; desc: string }> = {
    colors: { title: '', desc: '' },
    face: { title: 'Face customization', desc: 'Eye shapes, expressions, brow styles, and more.' },
    body: { title: 'Body styles', desc: 'Different proportions and outfit base shapes.' },
    accessories: { title: 'Accessories', desc: 'Hats, glasses, bags, and desk props.' },
  };
  const { title, desc } = info[tab];
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 260, gap: 12, textAlign: 'center', padding: 24 }}>
      <div style={{ width: 48, height: 48, borderRadius: 14, border: '1px dashed rgba(255,255,255,0.14)', display: 'grid', placeItems: 'center', fontSize: 22, color: 'rgba(255,255,255,0.18)' }}>+</div>
      <div style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{title}</div>
      <div style={{ fontSize: 13, color: 'var(--text-dim)', maxWidth: 240, lineHeight: 1.5 }}>{desc}</div>
      <div style={{ fontSize: 11, color: 'var(--text-mute)', padding: '4px 12px', borderRadius: 999, border: '1px solid var(--border)', marginTop: 4 }}>part of the paid plan</div>
    </div>
  );
}

const sectionLabel: React.CSSProperties = {
  fontSize: 11, fontWeight: 700, color: 'var(--text-mute)',
  letterSpacing: 0.8, textTransform: 'uppercase', marginBottom: 10,
};

const backBtn: React.CSSProperties = {
  padding: '6px 16px', borderRadius: 999,
  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.06)',
  color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13,
};
