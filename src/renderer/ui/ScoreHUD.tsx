import { useEffect, useState } from 'react';
import { useScoreStore } from '../game/scoreStore';

function formatStreak(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  if (m === 0) return `${s}s`;
  if (m < 60) return `${m}m ${s.toString().padStart(2, '0')}s`;
  const h = Math.floor(m / 60);
  return `${h}h ${(m % 60).toString().padStart(2, '0')}m`;
}

export function ScoreHUD() {
  const self = useScoreStore((s) => s.selfScore);
  const peer = useScoreStore((s) => s.peerScore);
  const streakStartTs = useScoreStore((s) => s.streakStartTs);
  const isPaused = useScoreStore((s) => s.isPaused);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  const streakMs = isPaused ? 0 : now - streakStartTs;
  const streakActive = streakMs > 30_000;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6, fontFamily: 'JetBrains Mono, monospace', fontSize: 14 }}>
      <div style={{ display: 'flex', gap: 8 }}>
        <Chip label="you" value={self} color="var(--good)" />
        <Chip label="friend" value={peer} color="var(--bad)" />
      </div>
      <div
        style={{
          display: 'inline-flex',
          alignSelf: 'flex-start',
          alignItems: 'center',
          gap: 6,
          padding: '4px 10px',
          borderRadius: 999,
          border: `1px solid ${streakActive ? 'var(--accent)' : 'var(--border)'}`,
          background: streakActive ? 'rgba(124,108,255,0.10)' : 'rgba(255,255,255,0.03)',
          color: streakActive ? 'var(--text)' : 'var(--text-dim)',
          fontSize: 11,
          letterSpacing: 0.5,
          boxShadow: streakActive ? '0 0 14px rgba(124,108,255,0.20)' : 'none',
          transition: 'all 200ms',
        }}
      >
        <span style={{ opacity: 0.65 }}>streak</span>
        <span style={{ fontWeight: 600 }}>{formatStreak(streakMs)}</span>
      </div>
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
