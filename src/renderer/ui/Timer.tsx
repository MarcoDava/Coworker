export function Timer({ secondsLeft }: { secondsLeft: number }) {
  const m = Math.max(0, Math.floor(secondsLeft / 60));
  const s = Math.max(0, secondsLeft % 60);
  const urgent = secondsLeft <= 60;
  return (
    <div
      style={{
        fontFamily: 'JetBrains Mono, monospace',
        fontSize: 32,
        fontWeight: 600,
        letterSpacing: 2,
        lineHeight: 1,
        color: urgent ? 'var(--bad)' : 'var(--text)',
        textShadow: urgent ? '0 0 12px rgba(255,122,138,0.4)' : 'none',
      }}
    >
      {m.toString().padStart(2, '0')}:{s.toString().padStart(2, '0')}
    </div>
  );
}
