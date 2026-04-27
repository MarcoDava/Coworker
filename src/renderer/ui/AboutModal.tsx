type Props = { onClose: () => void };

const SHORTCUTS = [
  { key: 'Alt (hold)', action: 'Peek at partner\'s screen' },
  { key: 'Space', action: 'Call out slacking' },
  { key: 'Esc', action: 'Exit session / cancel dispute' },
];

export function AboutModal({ onClose }: Props) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0,0,0,0.6)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 440,
          background: 'var(--panel-solid)',
          border: '1px solid var(--border-strong)',
          borderRadius: 20,
          padding: '32px 32px 28px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          gap: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <div>
            <h2 style={{ margin: '0 0 4px', fontSize: 22, fontWeight: 700 }}>Coworker</h2>
            <div style={{ color: 'var(--text-mute)', fontSize: 12 }}>v0.1.0</div>
          </div>
          <button
            className="ghost"
            style={{ padding: '6px 10px', fontSize: 16, lineHeight: 1 }}
            onClick={onClose}
          >
            ✕
          </button>
        </div>

        <div>
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'var(--text-mute)', textTransform: 'uppercase', marginBottom: 10 }}>
            Keyboard shortcuts
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {SHORTCUTS.map(({ key, action }) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  padding: '8px 12px',
                  borderRadius: 8,
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ color: 'var(--text-dim)', fontSize: 13 }}>{action}</span>
                <kbd
                  style={{
                    fontFamily: 'JetBrains Mono, monospace',
                    fontSize: 11,
                    padding: '3px 8px',
                    borderRadius: 6,
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid var(--border-strong)',
                    color: 'var(--text)',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {key}
                </kbd>
              </div>
            ))}
          </div>
        </div>

        <div
          style={{
            padding: '14px 16px',
            borderRadius: 10,
            background: 'rgba(90,168,255,0.06)',
            border: '1px solid rgba(90,168,255,0.18)',
          }}
        >
          <div style={{ fontSize: 11, fontWeight: 600, letterSpacing: 0.8, color: 'rgba(90,168,255,0.7)', textTransform: 'uppercase', marginBottom: 6 }}>
            Privacy
          </div>
          <p style={{ margin: 0, color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.6 }}>
            Screen capture is streamed peer-to-peer via WebRTC directly to your session partner.
            No video is sent to or stored on any server.
          </p>
        </div>
      </div>
    </div>
  );
}
