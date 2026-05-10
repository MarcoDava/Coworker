import { useState } from 'react';

type Props = { onDone: () => void };

const STEPS = [
  {
    icon: '🏛',
    title: 'Welcome to Coworker',
    body: 'A shared virtual workspace for two. You and a friend sit at in-world laptops in a 3D library and hold each other accountable — for real.',
  },
  {
    icon: '🖥',
    title: 'Your screen, live',
    body: 'Your real desktop is streamed directly to your session partner\'s in-world laptop via WebRTC — peer-to-peer. No server sees or records your screen.',
  },
  {
    icon: '👁',
    title: 'Peek & call out',
    body: 'Hold Alt to peek at your partner\'s screen. If they\'re slacking, press Space to call them out and score a point. False calls cost you — so be sure.',
  },
  {
    icon: '🌱',
    title: 'Set an intent, watch it grow',
    body: 'Type what you\'re working on in the lobby — your friend sees it as a thought bubble at session start. A small focus tree on your desk grows as the session goes; pause too much and it wilts.',
  },
  {
    icon: '👋',
    title: 'React without breaking flow',
    body: 'Press E to open the emote wheel — wave, lock in, gg, or rip. Your friend\'s avatar reacts physically to whatever you send. No typing, no chat tab, no flow break.',
  },
  {
    icon: '⚡',
    title: 'Before you start',
    body: 'You\'ll need to run the signaling server once so both players can find each other. Check the lobby for setup instructions.',
  },
];

export function Onboarding({ onDone }: Props) {
  const [step, setStep] = useState(0);
  const isLast = step === STEPS.length - 1;
  const current = STEPS[step];

  return (
    <div
      style={{
        position: 'absolute',
        inset: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background:
          'radial-gradient(1200px 600px at 50% 110%, rgba(124,108,255,0.22), transparent 60%),' +
          'linear-gradient(180deg, rgba(11,11,18,0.0) 0%, rgba(11,11,18,0.9) 100%),' +
          'var(--bg)',
        padding: 24,
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 520,
          background: 'var(--panel)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          border: '1px solid var(--border-strong)',
          borderRadius: 20,
          padding: '44px 40px 36px',
          boxShadow: 'var(--shadow)',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          textAlign: 'center',
          gap: 0,
        }}
      >
        <div style={{ fontSize: 52, marginBottom: 20, lineHeight: 1 }}>{current.icon}</div>

        <h2 style={{ margin: '0 0 14px', fontSize: 26, fontWeight: 700 }}>{current.title}</h2>

        <p
          style={{
            margin: '0 0 36px',
            color: 'var(--text-dim)',
            fontSize: 15,
            lineHeight: 1.65,
            maxWidth: 400,
          }}
        >
          {current.body}
        </p>

        <div style={{ display: 'flex', gap: 8, marginBottom: 32 }}>
          {STEPS.map((_, i) => (
            <div
              key={i}
              style={{
                width: i === step ? 20 : 8,
                height: 8,
                borderRadius: 999,
                background: i === step ? 'var(--accent)' : 'rgba(255,255,255,0.14)',
                transition: 'width 200ms ease, background 200ms ease',
              }}
            />
          ))}
        </div>

        <div style={{ display: 'flex', gap: 10, width: '100%' }}>
          {step > 0 && (
            <button
              style={{ flex: 1, padding: '12px 0', borderRadius: 12 }}
              onClick={() => setStep((s) => s - 1)}
            >
              Back
            </button>
          )}
          <button
            className="primary"
            style={{ flex: 2, padding: '12px 0', borderRadius: 12, fontSize: 15, fontWeight: 700 }}
            onClick={() => (isLast ? onDone() : setStep((s) => s + 1))}
          >
            {isLast ? "Let's go" : 'Next'}
          </button>
        </div>

        <button
          className="ghost"
          style={{ marginTop: 12, fontSize: 12, color: 'var(--text-mute)', padding: '6px 12px' }}
          onClick={onDone}
        >
          Skip intro
        </button>
      </div>
    </div>
  );
}
