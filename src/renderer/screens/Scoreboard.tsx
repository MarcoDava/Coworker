import { Canvas } from '@react-three/fiber';
import { useScoreStore } from '../game/scoreStore';
import { Avatar } from '../scene/Avatar';
import { DEFAULT_APPEARANCE, loadAppearance } from '../data/skins';

type Props = { onRematch: () => void; onExit: () => void };

export function Scoreboard({ onRematch, onExit }: Props) {
  const { selfScore, peerScore, log } = useScoreStore();
  const youWon = selfScore > peerScore;
  const tie = selfScore === peerScore;
  const appearance = loadAppearance() ?? DEFAULT_APPEARANCE;
  const selfMood = tie ? undefined : youWon ? 'victory' as const : 'defeat' as const;

  return (
    <div style={{ position: 'absolute', inset: 0, overflowY: 'auto', overflowX: 'hidden' }}>
      <div style={{ minHeight: '100%', display: 'flex', justifyContent: 'center', padding: 48, boxSizing: 'border-box' }}>
      <div style={{ width: '100%', maxWidth: 720, display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: 'var(--text-dim)', fontSize: 13, letterSpacing: 2, textTransform: 'uppercase' }}>session ended</div>
          <h1 style={{ fontSize: 56, margin: '8px 0', fontWeight: 700 }}>
            {tie ? 'tie' : youWon ? (
              <span style={{ background: 'linear-gradient(90deg,#b7ffc7,#7ae0a3)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>you won</span>
            ) : (
              <span style={{ background: 'linear-gradient(90deg,#ffb7c3,#ff7a8a)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>you lost</span>
            )}
          </h1>
        </div>

        <div style={{ height: 200, borderRadius: 'var(--radius)', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <Canvas camera={{ position: [0, 1.4, 2.2], fov: 42 }} style={{ background: 'transparent' }}>
            <ambientLight intensity={0.6} />
            <directionalLight position={[2, 4, 2]} intensity={1.2} />
            <Avatar
              position={[0, 0, 0]}
              rotationY={0}
              color={appearance.bodyColor}
              skinColor={appearance.skinTone}
              hairColor={appearance.hairColor}
              eyeColor={appearance.eyeColor}
              chairColor={appearance.chairColor}
              mood={selfMood}
            />
          </Canvas>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
          <ScoreTile label="you" value={selfScore} color="var(--good)" winner={youWon} />
          <ScoreTile label="friend" value={peerScore} color="var(--bad)" winner={!youWon && !tie} />
        </div>

        <div
          style={{
            background: 'var(--panel)',
            backdropFilter: 'blur(16px)',
            WebkitBackdropFilter: 'blur(16px)',
            border: '1px solid var(--border)',
            borderRadius: 'var(--radius)',
            boxShadow: 'var(--shadow)',
            overflow: 'hidden',
          }}
        >
          <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
            <div style={{ fontWeight: 600 }}>Event log</div>
            <div style={{ color: 'var(--text-mute)', fontSize: 13 }}>{log.length} events</div>
          </div>
          <div style={{ maxHeight: 320, overflowY: 'auto' }}>
            {log.length === 0 ? (
              <div style={{ padding: 20, color: 'var(--text-mute)', textAlign: 'center' }}>no scoring events</div>
            ) : (
              log.map((e, i) => (
                <div
                  key={i}
                  style={{
                    display: 'grid',
                    gridTemplateColumns: '80px 1fr auto',
                    alignItems: 'center',
                    padding: '10px 18px',
                    borderBottom: i < log.length - 1 ? '1px solid var(--border)' : 'none',
                    fontSize: 14,
                  }}
                >
                  <span style={{ color: e.who === 'self' ? 'var(--good)' : 'var(--bad)', fontWeight: 500 }}>{e.who}</span>
                  <span style={{ color: 'var(--text-dim)' }}>{e.note}</span>
                  <span
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontWeight: 600,
                      color: e.delta > 0 ? 'var(--good)' : 'var(--bad)',
                    }}
                  >
                    {e.delta > 0 ? '+' : ''}{e.delta}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <button className="primary" style={{ flex: 1, padding: '12px 16px' }} onClick={onRematch}>Rematch</button>
          <button style={{ flex: 1, padding: '12px 16px' }} onClick={onExit}>Exit to lobby</button>
        </div>
      </div>
      </div>
    </div>
  );
}

function ScoreTile({ label, value, color, winner }: { label: string; value: number; color: string; winner: boolean }) {
  return (
    <div
      style={{
        position: 'relative',
        padding: 24,
        background: 'var(--panel)',
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${winner ? color : 'var(--border)'}`,
        borderRadius: 'var(--radius)',
        boxShadow: winner ? `0 0 40px ${color}22, var(--shadow)` : 'var(--shadow)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-dim)', fontSize: 13, marginBottom: 8 }}>
        <span style={{ width: 8, height: 8, borderRadius: 999, background: color, boxShadow: `0 0 10px ${color}` }} />
        {label}
        {winner && <span style={{ marginLeft: 'auto', color, fontWeight: 600 }}>winner</span>}
      </div>
      <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 48, fontWeight: 700, color: 'var(--text)' }}>
        {value}
      </div>
    </div>
  );
}
