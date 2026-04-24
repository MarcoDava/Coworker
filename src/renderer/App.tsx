import { useState } from 'react';
import { Hero } from './screens/Hero';
import { Lobby, type LobbyConfig } from './screens/Lobby';
import { Session } from './screens/Session';
import { Scoreboard } from './screens/Scoreboard';
import { useScoreStore } from './game/scoreStore';

type Phase = 'hero' | 'lobby' | 'session' | 'scoreboard';

export function App() {
  const [phase, setPhase] = useState<Phase>('hero');
  const [cfg, setCfg] = useState<LobbyConfig | null>(null);
  const reset = useScoreStore((s) => s.reset);

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
    return <Session cfg={cfg} onFinish={() => setPhase('scoreboard')} />;
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
