import { Canvas, useThree } from '@react-three/fiber';
import { useEffect, useState } from 'react';
import { Library } from '../scene/Library';
import { SpaceStation } from '../scene/SpaceStation';
import { Train } from '../scene/Train';
import { Skyscraper } from '../scene/Skyscraper';
import { ENVIRONMENTS } from '../data/environments';
import { saveSceneEnv, type SceneEnv } from '../data/skins';

type CamConfig = { pos: [number, number, number]; at: [number, number, number] };

const PREVIEW_CAMERAS: Record<SceneEnv, CamConfig> = {
  library:    { pos: [4.2,  3.4,  4.0], at: [-0.4, 0.9, -2.2] },
  skyscraper: { pos: [4.2,  3.4,  4.0], at: [-0.4, 0.9, -2.2] },
  // Inside the train car looking along its length toward the bar/far door
  train:      { pos: [3.8,  2.6,  0.8], at: [-0.5, 1.0, -4.5] },
  // From the aft-right of the bridge looking toward the viewscreen/consoles
  space:      { pos: [4.0,  3.2,  2.5], at: [-0.5, 1.2, -3.0] },
};

function PreviewCamera({ env }: { env: SceneEnv }) {
  const { camera } = useThree();
  const cfg = PREVIEW_CAMERAS[env];
  useEffect(() => {
    camera.position.set(...cfg.pos);
    camera.lookAt(...cfg.at);
    camera.updateProjectionMatrix();
  }, [camera, cfg]);
  return null;
}

function PreviewScene({ env }: { env: SceneEnv }) {
  return (
    <>
      <PreviewCamera env={env} />
      {env === 'library'    && <Library />}
      {env === 'space'      && <SpaceStation />}
      {env === 'train'      && <Train />}
      {env === 'skyscraper' && <Skyscraper />}
    </>
  );
}

type Props = {
  current: SceneEnv;
  onChange: (env: SceneEnv) => void;
  onClose: () => void;
};

export function EnvironmentPicker({ current, onChange, onClose }: Props) {
  const [previewed, setPreviewed] = useState<SceneEnv>(current);

  function confirm() {
    onChange(previewed);
    saveSceneEnv(previewed);
    onClose();
  }

  return (
    <div style={{ position: 'absolute', inset: 0, background: 'var(--bg)', display: 'flex', flexDirection: 'column', zIndex: 35 }}>
      <div style={{ padding: '18px 28px', display: 'flex', alignItems: 'center', gap: 16, borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button onClick={onClose} style={backBtn}>Back</button>
        <h2 style={{ margin: 0, fontSize: 20, fontWeight: 700 }}>Environments</h2>
        <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--text-mute)' }}>click to preview · press Use to apply</span>
      </div>

      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '260px 1fr', minHeight: 0 }}>
        <div style={{ borderRight: '1px solid var(--border)', overflowY: 'auto', padding: '16px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
          {ENVIRONMENTS.map((env) => {
            const active = env.id === current;
            const selected = env.id === previewed;
            return (
              <button
                key={env.id}
                onClick={() => setPreviewed(env.id)}
                style={{
                  display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 3,
                  padding: '12px 14px', borderRadius: 12, cursor: 'pointer', textAlign: 'left',
                  border: selected
                    ? '1px solid var(--accent)'
                    : active
                      ? '1px solid rgba(255,255,255,0.18)'
                      : '1px solid transparent',
                  background: selected
                    ? 'rgba(124,108,255,0.14)'
                    : active
                      ? 'rgba(255,255,255,0.06)'
                      : 'rgba(255,255,255,0.03)',
                  transition: 'border-color 80ms, background 80ms',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
                  <span style={{ fontWeight: 700, fontSize: 14, color: selected ? 'var(--accent)' : 'var(--text)' }}>
                    {env.label}
                  </span>
                  {active && (
                    <span style={{ fontSize: 10, color: 'var(--good)', fontWeight: 700, letterSpacing: 0.5 }}>
                      ACTIVE
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>

        <div style={{ position: 'relative', background: '#060912' }}>
          <Canvas gl={{ antialias: true }} style={{ width: '100%', height: '100%' }}>
            <PreviewScene env={previewed} />
          </Canvas>
          <div style={{ position: 'absolute', bottom: 28, right: 28 }}>
            <button
              className="primary"
              style={{ padding: '10px 24px', borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: 'pointer' }}
              onClick={confirm}
            >
              Use {ENVIRONMENTS.find((e) => e.id === previewed)?.label}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

const backBtn: React.CSSProperties = {
  padding: '6px 16px', borderRadius: 999,
  border: '1px solid var(--border)', background: 'rgba(255,255,255,0.06)',
  color: 'var(--text-dim)', cursor: 'pointer', fontSize: 13, fontWeight: 600,
};
