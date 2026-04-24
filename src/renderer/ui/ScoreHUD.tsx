import { useScoreStore } from '../game/scoreStore';

export function ScoreHUD() {
  const self = useScoreStore((s) => s.selfScore);
  const peer = useScoreStore((s) => s.peerScore);
  return (
    <div style={{ display: 'flex', gap: 8, fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>
      <Chip label="you" value={self} color="var(--good)" />
      <Chip label="friend" value={peer} color="var(--bad)" />
    </div>
  );
}

function Chip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: '6px 10px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid var(--border)',
        borderRadius: 999,
      }}
    >
      <span style={{ width: 7, height: 7, borderRadius: 999, background: color, boxShadow: `0 0 8px ${color}` }} />
      <span style={{ color: 'var(--text-dim)' }}>{label}</span>
      <span style={{ color: 'var(--text)', fontWeight: 600 }}>{value}</span>
    </div>
  );
}
