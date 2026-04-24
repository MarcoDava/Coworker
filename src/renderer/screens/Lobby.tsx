import { useState } from 'react';
import { AppListEditor } from '../ui/AppListEditor';

export type LobbyConfig = {
  displayName: string;
  room: string;
  role: 'host' | 'guest';
  durationMin: 25 | 50 | 90;
  signalingUrl: string;
};

type Props = { onStart: (cfg: LobbyConfig) => void };

function randomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

const card: React.CSSProperties = {
  background: 'var(--panel)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 24,
  boxShadow: 'var(--shadow)',
};

export function Lobby({ onStart }: Props) {
  const [displayName, setDisplayName] = useState('you');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [room, setRoom] = useState(randomCode());
  const [duration, setDuration] = useState<25 | 50 | 90>(25);
  const [signalingUrl, setSignalingUrl] = useState('ws://localhost:8787');

  const missing: string[] = [];
  if (!displayName.trim()) missing.push('display name');
  if (room.trim().length < 4) missing.push('room code (4–6 digits)');
  const canStart = missing.length === 0;

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        overflowX: 'hidden',
      }}
    >
      <div
        style={{
          minHeight: '100%',
          display: 'flex',
          justifyContent: 'center',
          padding: '48px 24px 64px',
          boxSizing: 'border-box',
        }}
      >
      <div style={{ width: '100%', maxWidth: 560, display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ textAlign: 'center', marginBottom: 8 }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 10,
              padding: '6px 14px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.03)',
              color: 'var(--text-dim)',
              fontSize: 12,
              letterSpacing: 0.2,
            }}
          >
            <span style={{ width: 8, height: 8, borderRadius: 999, background: 'var(--good)', boxShadow: '0 0 8px var(--good)' }} />
            standalone · webrtc · p2p
          </div>
          <h1 style={{ fontSize: 48, margin: '16px 0 6px', fontWeight: 700 }}>
            <span style={{ background: 'linear-gradient(90deg,#b7adff,#8aa9ff)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>coworker</span>
          </h1>
          <div style={{ color: 'var(--text-dim)', fontSize: 15 }}>lock in with a friend. peek. get peeked.</div>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', gap: 8, marginBottom: 18 }}>
            <button
              onClick={() => { setMode('create'); setRoom(randomCode()); }}
              className={mode === 'create' ? 'primary' : ''}
              style={{ flex: 1 }}
            >
              Create room
            </button>
            <button
              onClick={() => { setMode('join'); setRoom(''); }}
              className={mode === 'join' ? 'primary' : ''}
              style={{ flex: 1 }}
            >
              Join room
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
            <label>
              Display name
              <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="your name" />
            </label>
            <label>
              Duration
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value) as 25 | 50 | 90)}>
                <option value={25}>25 minutes</option>
                <option value={50}>50 minutes</option>
                <option value={90}>90 minutes</option>
              </select>
            </label>
          </div>

          <label style={{ marginTop: 14 }}>
            Room code
            <input
              value={room}
              onChange={(e) => setRoom(e.target.value.replace(/\D/g, '').slice(0, 6))}
              maxLength={6}
              placeholder="6 digits"
              style={{
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 28,
                letterSpacing: 8,
                textAlign: 'center',
                padding: '14px 12px',
              }}
            />
          </label>

          <label style={{ marginTop: 14 }}>
            Signaling server
            <input value={signalingUrl} onChange={(e) => setSignalingUrl(e.target.value)} />
          </label>
        </div>

        <div style={card}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
            <h3 style={{ margin: 0 }}>Focus rules</h3>
            <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>both sides share this list</span>
          </div>
          <AppListEditor />
        </div>

        <button
          className="primary"
          style={{
            padding: '16px 20px',
            fontSize: 17,
            fontWeight: 600,
            borderRadius: 'var(--radius)',
            width: '100%',
          }}
          disabled={!canStart}
          onClick={() =>
            onStart({
              displayName: displayName.trim(),
              room: room.trim(),
              role: mode === 'create' ? 'host' : 'guest',
              durationMin: duration,
              signalingUrl,
            })
          }
        >
          ▶  Start session
        </button>
        {!canStart && (
          <div style={{ color: 'var(--warn)', fontSize: 12, textAlign: 'center' }}>
            fill in: {missing.join(', ')}
          </div>
        )}
        <div style={{ color: 'var(--text-mute)', fontSize: 12, textAlign: 'center' }}>
          hold <kbd style={kbd}>Alt</kbd> to peek · <kbd style={kbd}>Space</kbd> to call out · <kbd style={kbd}>P</kbd> to pause
        </div>
      </div>
      </div>
    </div>
  );
}

const kbd: React.CSSProperties = {
  fontFamily: 'JetBrains Mono, monospace',
  fontSize: 11,
  padding: '2px 6px',
  border: '1px solid var(--border-strong)',
  borderRadius: 4,
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text-dim)',
};
