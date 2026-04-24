import { useEffect, useState } from 'react';

type Props = {
  targetApp: string;
  deadlineMs: number;
  onSubmit: (reason: string) => void;
  onTimeout: () => void;
};

export function ReasonPrompt({ targetApp, deadlineMs, onSubmit, onTimeout }: Props) {
  const [text, setText] = useState('');
  const totalMs = 15000;
  const [leftMs, setLeftMs] = useState(Math.max(0, deadlineMs - Date.now()));

  useEffect(() => {
    const t = setInterval(() => {
      const remaining = Math.max(0, deadlineMs - Date.now());
      setLeftMs(remaining);
      if (remaining <= 0) {
        clearInterval(t);
        onTimeout();
      }
    }, 100);
    return () => clearInterval(t);
  }, [deadlineMs, onTimeout]);

  const pct = (leftMs / totalMs) * 100;
  const leftSec = Math.ceil(leftMs / 1000);

  return (
    <div style={overlay}>
      <div style={panel}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
          <div style={iconCircle}>!</div>
          <div>
            <div style={{ fontWeight: 600 }}>Unjust call-out</div>
            <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
              Your friend was on <b style={{ color: 'var(--text)' }}>{targetApp}</b>, which counts as working.
            </div>
          </div>
        </div>

        <div style={{ marginBottom: 10, color: 'var(--text-dim)', fontSize: 13 }}>
          Give a reason or lose points:
        </div>
        <textarea
          rows={3}
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="…why did you call them out?"
          autoFocus
          style={{ width: '100%', boxSizing: 'border-box' }}
        />

        <div style={{ marginTop: 14, display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.06)', borderRadius: 4, overflow: 'hidden' }}>
            <div
              style={{
                width: `${pct}%`,
                height: '100%',
                background: leftMs < 5000 ? 'var(--bad)' : 'var(--accent)',
                transition: 'width 100ms linear',
              }}
            />
          </div>
          <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 13, color: 'var(--text-dim)', minWidth: 30, textAlign: 'right' }}>
            {leftSec}s
          </div>
          <button className="primary" onClick={() => onSubmit(text)} disabled={!text.trim()}>
            Submit
          </button>
        </div>
      </div>
    </div>
  );
}

const overlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  background: 'rgba(0,0,0,0.45)',
  backdropFilter: 'blur(6px)',
  WebkitBackdropFilter: 'blur(6px)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 20,
};

const panel: React.CSSProperties = {
  width: 460,
  background: 'var(--panel-solid)',
  border: '1px solid var(--border-strong)',
  borderRadius: 'var(--radius)',
  padding: 20,
  boxShadow: 'var(--shadow)',
};

const iconCircle: React.CSSProperties = {
  width: 32,
  height: 32,
  borderRadius: 999,
  background: 'rgba(255,196,107,0.15)',
  color: 'var(--warn)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  fontWeight: 700,
};
