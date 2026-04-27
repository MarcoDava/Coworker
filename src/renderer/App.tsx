import { useState } from 'react';
import { Hero } from './screens/Hero';
import { Onboarding } from './screens/Onboarding';
import { Lobby, type LobbyConfig } from './screens/Lobby';
import { Session } from './screens/Session';
import { Scoreboard } from './screens/Scoreboard';
import { useScoreStore } from './game/scoreStore';

type Phase = 'onboarding' | 'hero' | 'lobby' | 'session' | 'scoreboard';

const ONBOARDED_KEY = 'coworker_v1_onboarded';

export function App() {
  const [phase, setPhase] = useState<Phase>(
    localStorage.getItem(ONBOARDED_KEY) ? 'hero' : 'onboarding'
  );
  const [cfg, setCfg] = useState<LobbyConfig | null>(null);
  const reset = useScoreStore((s) => s.reset);

  if (phase === 'onboarding') {
    return (
      <Onboarding
        onDone={() => {
          localStorage.setItem(ONBOARDED_KEY, '1');
          setPhase('hero');
        }}
      />
    );
  }

  if (phase === 'hero') {
    return <Hero onEnter={() => setPhase('lobby')} />;
  }

  if (phase === 'lobby' || !cfg) {
    return (
      <Lobby
        onStart={(c) => {
          reset();
          setCfg(c);
          setPhase('session');
        }}
      />
    );
  }

  if (phase === 'session') {
    return (
      <Session
        cfg={cfg}
        onFinish={() => setPhase('scoreboard')}
        onQuit={() => {
          reset();
          setPhase('lobby');
        }}
      />
    );
  }

  return (
    <Scoreboard
      onRematch={() => {
        reset();
        setPhase('session');
      }}
      onExit={() => {
        reset();
        setPhase('lobby');
      }}
    />
  );
}
