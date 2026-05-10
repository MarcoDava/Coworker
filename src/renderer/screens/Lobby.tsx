import { useEffect, useMemo, useRef, useState } from 'react';
import { AppListEditor } from '../ui/AppListEditor';
import { AvatarPortrait } from '../ui/AvatarPortrait';
import { CharacterScreen } from './CharacterScreen';
import { EnvironmentPicker } from '../ui/EnvironmentPicker';
import { SignalingClient, type LobbyMember, type LobbyProfile } from '../net/signaling';
import { DEFAULT_APPEARANCE, loadAppearance, loadSceneEnv, saveAppearance, type AvatarAppearance, type SceneEnv } from '../data/skins';
import { ENVIRONMENTS } from '../data/environments';

export type LobbyConfig = {
  displayName: string;
  bio: string;
  avatarSeed: string;
  room: string;
  role: 'host' | 'guest';
  durationMin: number;
  pauseCap: number;
  pauseDurationSec: number;
  signalingUrl: string;
  appearance: AvatarAppearance;
  peerAppearance: AvatarAppearance;
  peerDisplayName: string;
  /** Self-stated session intent (Focusmate-style "what are you working on"). */
  sessionGoal: string;
  /** Peer's stated session intent. */
  peerSessionGoal: string;
  soloMode: boolean;
  playerCount: number;
};

type Props = { onStart: (cfg: LobbyConfig) => void };

const BIO_FALLBACKS = [
  'crickets...',
  'all aim, no alt-tabs',
  'building quietly',
  'locked in and caffeinated',
  'typing noises only',
  'zero yapping, max focus',
];

const card: React.CSSProperties = {
  background: 'var(--panel)',
  backdropFilter: 'blur(16px)',
  WebkitBackdropFilter: 'blur(16px)',
  border: '1px solid var(--border)',
  borderRadius: 'var(--radius)',
  padding: 24,
  boxShadow: 'var(--shadow)',
};

function randomCode() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

function randomId() {
  return Math.random().toString(36).slice(2, 10);
}

function fallbackBio(seed: string) {
  let total = 0;
  for (const char of seed) total += char.charCodeAt(0);
  return BIO_FALLBACKS[total % BIO_FALLBACKS.length];
}

function QueueCard({
  member,
  isSelf,
  isLeader,
}: {
  member: LobbyMember;
  isSelf: boolean;
  isLeader: boolean;
}) {
  const bio = member.profile.bio.trim() || fallbackBio(member.profile.avatarSeed || member.id);
  const appearance = member.profile.appearance ?? DEFAULT_APPEARANCE;

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        borderRadius: 24,
        border: isSelf ? '1px solid rgba(133,190,255,0.45)' : '1px solid rgba(255,255,255,0.08)',
        background: isSelf ? 'rgba(109, 160, 245, 0.08)' : 'rgba(255,255,255,0.03)',
        overflow: 'hidden',
      }}
    >
      <AvatarPortrait appearance={appearance} height={140} />
      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <span style={{ fontSize: 15, fontWeight: 700 }}>{member.profile.displayName}</span>
          {isSelf && <span style={tagStyle}>you</span>}
          {isLeader && <span style={tagStyle}>party leader</span>}
        </div>
        <div style={{ color: 'var(--text-dim)', fontSize: 12, lineHeight: 1.35 }}>{bio}</div>
      </div>
    </div>
  );
}

export function Lobby({ onStart }: Props) {
  const clientRef = useRef<SignalingClient | null>(null);
  const selfIdRef = useRef(randomId());
  const avatarSeedRef = useRef(randomId());
  const membersRef = useRef<LobbyMember[]>([]);
  const autoJoinPendingRef = useRef(true);

  const [displayName, setDisplayName] = useState('you');
  const [bio, setBio] = useState('');
  const [sessionGoal, setSessionGoal] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [room, setRoom] = useState(randomCode());
  const [duration, setDuration] = useState(25);
  const [durationInput, setDurationInput] = useState('25');
  const [signalingUrl, setSignalingUrl] = useState('wss://coworker-production-d667.up.railway.app');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [joined, setJoined] = useState(false);
  const [members, setMembers] = useState<LobbyMember[]>([]);
  const [hostId, setHostId] = useState<string | null>(null);
  const [connectionNote, setConnectionNote] = useState('Enter the queue to sync this room.');
  const [appearance, setAppearance] = useState<AvatarAppearance>(() => loadAppearance());
  const [sceneEnv, setSceneEnv] = useState<SceneEnv>(() => loadSceneEnv());
  const [charScreenOpen, setCharScreenOpen] = useState(false);
  const [envPickerOpen, setEnvPickerOpen] = useState(false);
  const [pauseCap, setPauseCap] = useState(2);
  const [pauseDurationSec, setPauseDurationSec] = useState(180);

  const role = mode === 'create' ? 'host' : 'guest';
  const profile = useMemo<LobbyProfile>(
    () => ({
      displayName: displayName.trim() || 'you',
      bio: bio.trim(),
      avatarSeed: avatarSeedRef.current,
      appearance,
      goal: sessionGoal.trim(),
    }),
    [bio, displayName, appearance, sessionGoal]
  );

  const missing: string[] = [];
  if (!displayName.trim()) missing.push('display name');
  if (room.trim().length < 4) missing.push('room code');
  if (!signalingUrl.trim()) missing.push('signaling server');
  const canQueue = missing.length === 0;
  const selfId = selfIdRef.current;
  const queueReady = members.length >= 1;
  const isLeader = hostId === selfId;

  function leaveQueue() {
    clientRef.current?.close();
    clientRef.current = null;
    setJoined(false);
    setMembers([]);
    setHostId(null);
    setConnectionNote('Left the queue.');
  }

  function joinQueue() {
    if (!canQueue) return;
    clientRef.current?.close();

    const client = new SignalingClient(signalingUrl.trim(), room.trim(), selfId, role, profile);
    clientRef.current = client;
    setJoined(true);
    setConnectionNote('Connecting to queue...');

    client.onOpen = () => {
      setConnectionNote('Queue connected. Waiting for another coworker...');
    };

    client.onError = (reason) => {
      setJoined(false);
      setMembers([]);
      setHostId(null);
      clientRef.current = null;
      setConnectionNote(reason);
    };

    client.onDisconnect = () => {
      setJoined(false);
      setMembers([]);
      setHostId(null);
      clientRef.current = null;
      setConnectionNote('Disconnected from signaling server.');
    };

    client.onMessage((message) => {
      if (message.type === 'joined') {
        return;
      }
      if (message.type === 'room-state') {
        setMembers(message.members);
        setHostId(message.hostId);
        const n = message.members.length;
        if (n < 2) {
          setConnectionNote('Waiting for more players...');
        } else if (n <= 4) {
          setConnectionNote(message.hostId === selfId ? `${n} in queue. Launch when ready.` : `${n} in queue. Waiting for the host to launch.`);
        } else {
          setConnectionNote('This room is crowded. Only up to four players should continue.');
        }
        return;
      }
      if (message.type === 'session:start') {
        const peer = membersRef.current.find((m) => m.id !== selfId);
        const peerAppearance = peer?.profile.appearance ?? DEFAULT_APPEARANCE;
        const peerDisplayName = peer?.profile.displayName?.trim() || 'friend';
        const peerSessionGoal = peer?.profile.goal?.trim() || '';
        onStart({
          displayName: profile.displayName,
          bio: profile.bio,
          avatarSeed: profile.avatarSeed,
          room: room.trim(),
          role,
          durationMin: message.durationMin,
          pauseCap: message.pauseCap,
          pauseDurationSec: message.pauseDurationSec,
          signalingUrl: signalingUrl.trim(),
          appearance,
          peerAppearance,
          peerDisplayName,
          sessionGoal: profile.goal ?? '',
          peerSessionGoal,
          soloMode: false,
          playerCount: membersRef.current.length,
        });
      }
    });
  }

  useEffect(() => {
    if (!joined || !clientRef.current) return;
    clientRef.current.sendProfileUpdate(profile);
  }, [joined, profile]);

  useEffect(() => {
    membersRef.current = members;
  }, [members]);

  useEffect(() => {
    saveAppearance(appearance);
  }, [appearance]);

  useEffect(() => {
    return () => {
      clientRef.current?.close();
      clientRef.current = null;
    };
  }, []);

  useEffect(() => {
    if (autoJoinPendingRef.current && mode === 'create' && canQueue && !joined) {
      autoJoinPendingRef.current = false;
      joinQueue();
    }
  });

  if (charScreenOpen) {
    return (
      <CharacterScreen
        onBack={() => {
          setCharScreenOpen(false);
          setAppearance(loadAppearance());
        }}
      />
    );
  }

  if (envPickerOpen) {
    return (
      <EnvironmentPicker
        current={sceneEnv}
        onChange={(env) => setSceneEnv(env)}
        onClose={() => setEnvPickerOpen(false)}
      />
    );
  }

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
        <div style={{ width: '100%', maxWidth: 960, display: 'flex', flexDirection: 'column', gap: 20 }}>
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
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: queueReady ? 'var(--good)' : 'var(--warn)',
                  boxShadow: queueReady ? '0 0 8px var(--good)' : '0 0 8px var(--warn)',
                }}
              />
              queue lobby
            </div>
            <h1 style={{ fontSize: 48, margin: '16px 0 6px', fontWeight: 800 }}>coworker queue</h1>
            <div style={{ color: 'var(--text-dim)', fontSize: 15 }}>
              drop into a room, show your card, and launch when everyone&apos;s here.
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.1fr 0.9fr', gap: 20 }}>
            <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 18 }}>
              <div>
                <h2 style={{ margin: 0, fontSize: 26 }}>Party Queue</h2>
                <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>{connectionNote}</div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 14 }}>
                {members.map((member) => (
                  <QueueCard
                    key={member.id}
                    member={member}
                    isSelf={member.id === selfId}
                    isLeader={member.id === hostId}
                  />
                ))}
              </div>

              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap' }}>
                {mode === 'join' && !joined && (
                  <button
                    className="primary"
                    style={primaryButtonStyle}
                    disabled={!canQueue}
                    onClick={joinQueue}
                  >
                    Enter Queue
                  </button>
                )}
                {joined && (
                  <>
                    <button
                      className="primary"
                      style={primaryButtonStyle}
                      disabled={!queueReady || !isLeader}
                      onClick={() => clientRef.current?.startSession(duration, pauseCap, pauseDurationSec)}
                    >
                      {isLeader ? 'Launch Session' : 'Waiting For Host'}
                    </button>
                    <button style={secondaryButtonStyle} onClick={leaveQueue}>
                      Leave Queue
                    </button>
                  </>
                )}
              </div>

              {!canQueue && <div style={{ color: 'var(--warn)', fontSize: 12 }}>fill in: {missing.join(', ')}</div>}
              {joined && !isLeader && queueReady && (
                <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>
                  The host controls launch. Your profile changes update live for everyone in the lobby.
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ ...card, display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
                  <button
                    onClick={() => {
                      if (mode !== 'create') {
                        if (joined) leaveQueue();
                        setMode('create');
                        setRoom(randomCode());
                        autoJoinPendingRef.current = true;
                      }
                    }}
                    className={mode === 'create' ? 'primary' : ''}
                    style={{ flex: 1 }}
                  >
                    Create room
                  </button>
                  <button
                    onClick={() => {
                      if (joined) leaveQueue();
                      autoJoinPendingRef.current = false;
                      setMode('join');
                      setRoom('');
                    }}
                    className={mode === 'join' ? 'primary' : ''}
                    style={{ flex: 1 }}
                  >
                    Join room
                  </button>
                </div>

                <label>
                  Username
                  <input
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="your name"
                  />
                </label>

                <label>
                  Bio
                  <textarea
                    value={bio}
                    onChange={(e) => setBio(e.target.value.slice(0, 120))}
                    placeholder={fallbackBio(profile.avatarSeed)}
                    rows={3}
                    style={textareaStyle}
                  />
                </label>

                <label>
                  Working on
                  <textarea
                    value={sessionGoal}
                    onChange={(e) => setSessionGoal(e.target.value.slice(0, 100))}
                    placeholder="ship the migration / draft the email / read chapter 4"
                    rows={2}
                    style={textareaStyle}
                  />
                </label>

                <label>
                  Duration
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center' }}>
                    <input
                      type="number"
                      min={1}
                      max={480}
                      value={durationInput}
                      onChange={(e) => {
                        setDurationInput(e.target.value);
                        const n = parseInt(e.target.value, 10);
                        if (!isNaN(n) && n >= 1) setDuration(n);
                      }}
                      disabled={!isLeader && joined}
                      style={{ width: 72, textAlign: 'center' }}
                    />
                    <span style={{ color: 'var(--text-mute)', fontSize: 13 }}>min</span>
                    <div style={{ display: 'flex', gap: 4, marginLeft: 4 }}>
                      {[25, 50, 90].map((n) => (
                        <button
                          key={n}
                          disabled={!isLeader && joined}
                          onClick={() => { setDuration(n); setDurationInput(String(n)); }}
                          style={{
                            padding: '4px 8px',
                            fontSize: 12,
                            borderRadius: 6,
                            background: duration === n ? 'rgba(124,108,255,0.2)' : 'rgba(255,255,255,0.04)',
                            borderColor: duration === n ? 'var(--accent)' : undefined,
                            color: duration === n ? 'var(--accent)' : 'var(--text-dim)',
                          }}
                        >
                          {n}m
                        </button>
                      ))}
                    </div>
                  </div>
                </label>

                <label>
                  Room code
                  <input
                    value={room}
                    onChange={(e) => setRoom(e.target.value.replace(/\D/g, '').slice(0, 6))}
                    maxLength={6}
                    placeholder="6 digits"
                    style={{
                      fontFamily: 'JetBrains Mono, monospace',
                      fontSize: 24,
                      letterSpacing: 8,
                      textAlign: 'center',
                      padding: '14px 12px',
                    }}
                    disabled={joined}
                  />
                </label>

                <div>
                  <button
                    className="ghost"
                    style={{ fontSize: 12, color: 'var(--text-mute)', padding: '4px 0', border: 'none', background: 'none' }}
                    onClick={() => setShowAdvanced((v) => !v)}
                  >
                    {showAdvanced ? '▾' : '▸'} Advanced
                  </button>
                  {showAdvanced && (
                    <label style={{ marginTop: 8 }}>
                      Signaling server
                      <input value={signalingUrl} onChange={(e) => setSignalingUrl(e.target.value)} disabled={joined} />
                    </label>
                  )}
                </div>
              </div>

              <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 2px' }}>Environment</h3>
                  <div style={{ color: 'var(--text-mute)', fontSize: 12 }}>
                    {ENVIRONMENTS.find((e) => e.id === sceneEnv)?.label ?? sceneEnv} · only you see this
                  </div>
                </div>
                <button onClick={() => setEnvPickerOpen(true)} style={changeBtnStyle}>Change</button>
              </div>

              <div style={{ ...card, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
                <div>
                  <h3 style={{ margin: '0 0 2px' }}>Your character</h3>
                  <div style={{ color: 'var(--text-mute)', fontSize: 12 }}>more skins coming with the paid plan</div>
                </div>
                <button onClick={() => setCharScreenOpen(true)} style={changeBtnStyle}>Customize</button>
              </div>

              <div style={card}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 12 }}>
                  <h3 style={{ margin: 0 }}>Focus rules</h3>
                  <span style={{ color: 'var(--text-mute)', fontSize: 12 }}>shared across the pair</span>
                </div>
                <AppListEditor />
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10, marginTop: 16 }}>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Pause cap</span>
                    <input
                      type="number"
                      min={0}
                      max={10}
                      value={pauseCap}
                      onChange={(e) => setPauseCap(Math.max(0, Math.min(10, Number(e.target.value) || 0)))}
                    />
                  </label>
                  <label style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 13 }}>
                    <span style={{ color: 'var(--text-dim)' }}>Pause duration (sec)</span>
                    <input
                      type="number"
                      min={30}
                      max={600}
                      value={pauseDurationSec}
                      onChange={(e) => setPauseDurationSec(Math.max(30, Math.min(600, Number(e.target.value) || 30)))}
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

const primaryButtonStyle: React.CSSProperties = {
  padding: '16px 20px',
  fontSize: 16,
  fontWeight: 700,
  borderRadius: 18,
};

const secondaryButtonStyle: React.CSSProperties = {
  padding: '16px 20px',
  fontSize: 16,
  fontWeight: 700,
  borderRadius: 18,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.04)',
  color: 'var(--text)',
};

const tagStyle: React.CSSProperties = {
  padding: '3px 8px',
  borderRadius: 999,
  background: 'rgba(255,255,255,0.06)',
  border: '1px solid rgba(255,255,255,0.08)',
  fontSize: 11,
  color: 'var(--text-dim)',
};

const textareaStyle: React.CSSProperties = {
  width: '100%',
  minHeight: 88,
  resize: 'vertical',
  boxSizing: 'border-box',
  background: 'rgba(255,255,255,0.02)',
  color: 'var(--text)',
  border: '1px solid var(--border)',
  borderRadius: 12,
  padding: '12px 14px',
  font: 'inherit',
};

const changeBtnStyle: React.CSSProperties = {
  padding: '7px 16px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.06)',
  color: 'var(--text-dim)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
  whiteSpace: 'nowrap',
  flexShrink: 0,
};
