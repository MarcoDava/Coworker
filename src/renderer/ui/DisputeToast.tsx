type Props = {
  reason: string;
  onAccept: () => void;
  onReject: () => void;
};

export function DisputeToast({ reason, onAccept, onReject }: Props) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 32,
        left: '50%',
        transform: 'translateX(-50%)',
        background: 'var(--panel-solid)',
        border: '1px solid var(--border-strong)',
        padding: 18,
        borderRadius: 'var(--radius)',
        width: 440,
        boxShadow: 'var(--shadow)',
        zIndex: 20,
        animation: 'slideUp 180ms ease-out',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: 999,
            background: 'rgba(124,108,255,0.15)',
            color: 'var(--accent)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 700,
            fontSize: 14,
          }}
        >
          ?
        </div>
        <div style={{ fontWeight: 600 }}>Friend is disputing a call-out</div>
      </div>
      <div
        style={{
          fontStyle: 'italic',
          color: 'var(--text-dim)',
          padding: '10px 12px',
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          marginBottom: 12,
          fontSize: 14,
        }}
      >
        "{reason}"
      </div>
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button onClick={onReject}>Reject</button>
        <button className="primary" onClick={onAccept}>Accept</button>
      </div>
    </div>
  );
}
