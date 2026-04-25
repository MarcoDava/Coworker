import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LobbyConfig } from './Lobby';
import { Library } from '../scene/Library';
import { Laptop } from '../scene/Laptop';
import { Avatar } from '../scene/Avatar';
import { CameraRig, type CameraMode } from '../scene/Camera';
import { Timer } from '../ui/Timer';
import { ScoreHUD } from '../ui/ScoreHUD';
import { ReasonPrompt } from '../ui/ReasonPrompt';
import { DisputeToast } from '../ui/DisputeToast';
import { SignalingClient } from '../net/signaling';
import { PeerConnection } from '../net/peer';
import type { PeerMessage } from '../net/protocol';
import { DEFAULT_HOTKEYS, LOOK_MODIFIER_OPTIONS, type LookModifier, useHotkeys } from '../game/hotkeys';
import { useScoreStore } from '../game/scoreStore';
import { isSlacking } from '../game/appClassifier';
import { SCORING } from '../game/scoring';
import type { ActiveWindowInfo } from '../../preload/index';

type Props = {
  cfg: LobbyConfig;
  onFinish: () => void;
  onQuit: () => void;
};

const SELF_LAPTOP: [number, number, number] = [-1.8, 0, -2];
const PEER_LAPTOP: [number, number, number] = [0.9, 0, -2];
const IDLE_THRESHOLD_SEC = 120;
const LOOK_STORAGE_KEY = 'coworker.lookModifier';
const QUIT_PHRASE = 'im a chicken, buk buk';
const SCREEN_MODE_HOTKEY = 'm';

function readLookModifier(): LookModifier {
  if (typeof window === 'undefined') return 'Alt';
  const saved = window.localStorage.getItem(LOOK_STORAGE_KEY);
  if (saved && LOOK_MODIFIER_OPTIONS.includes(saved as LookModifier)) {
    return saved as LookModifier;
  }
  return 'Alt';
}

export function Session({ cfg, onFinish, onQuit }: Props) {
  const sessionRoom = `${cfg.room}:session`;
  const rootRef = useRef<HTMLDivElement | null>(null);
  const screenVideoRef = useRef<HTMLVideoElement | null>(null);
  const freeLookRef = useRef({ enabled: false, yaw: 0, pitch: 0 });
  const draggingRef = useRef(false);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peeking, setPeeking] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overhead');
  const [isFullscreen, setIsFullscreen] = useState(() => Boolean(document.fullscreenElement));
  const [lookModifier, setLookModifier] = useState<LookModifier>(() => readLookModifier());
  const [lookHeld, setLookHeld] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [quitText, setQuitText] = useState('');
  const [screenMode, setScreenMode] = useState(false);
  const [screenHudVisible, setScreenHudVisible] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(cfg.durationMin * 60);
  const [selfActiveWindow, setSelfActiveWindow] = useState<ActiveWindowInfo | null>(null);
  const [peerActiveWindow, setPeerActiveWindow] = useState<ActiveWindowInfo | null>(null);
  const [peerIdleSec, setPeerIdleSec] = useState(0);
  const [incomingReason, setIncomingReason] = useState<{ reason: string; calloutTs: number } | null>(null);
  const [pendingReasonUi, setPendingReasonUi] = useState<{ targetApp: string; deadline: number; calloutTs: number } | null>(null);

  const peerRef = useRef<PeerConnection | null>(null);
  const store = useScoreStore();

  function toggleFullscreen() {
    if (document.fullscreenElement) {
      void document.exitFullscreen();
      return;
    }

    const node = rootRef.current;
    if (node) {
      void node.requestFullscreen();
    }
  }

  function resetFreeLook() {
    draggingRef.current = false;
    freeLookRef.current.enabled = false;
    freeLookRef.current.yaw = 0;
    freeLookRef.current.pitch = 0;
  }

  async function setScreenModeActive(active: boolean) {
    setScreenMode(active);
    setScreenHudVisible(true);
    if (active) {
      setMenuOpen(false);
      setOptionsOpen(false);
      resetFreeLook();
    }
    await window.coworker?.window.setScreenMode(active);
  }

  useEffect(() => {
    window.localStorage.setItem(LOOK_STORAGE_KEY, lookModifier);
  }, [lookModifier]);

  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 24 }, audio: false }).then((stream) => {
      if (mounted) setLocalStream(stream);
    });
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    const video = screenVideoRef.current;
    if (!video) return;
    if (localStream) {
      video.srcObject = localStream;
      void video.play().catch(() => {});
    } else {
      video.srcObject = null;
    }
  }, [localStream, screenMode]);

  useEffect(() => {
    if (!localStream) return;

    const myId = `${cfg.role}-${Math.random().toString(36).slice(2, 8)}`;
    const sig = new SignalingClient(cfg.signalingUrl, sessionRoom, myId, cfg.role, {
      displayName: cfg.displayName,
      bio: cfg.bio,
      avatarSeed: cfg.avatarSeed,
    });

    const handlers = {
      onRemoteStream: (stream: MediaStream) => setRemoteStream(stream),
      onData: (message: PeerMessage) => handlePeerMessage(message),
      onConnect: () => {},
      onClose: () => {},
    };

    const off = sig.onMessage((msg) => {
      if (msg.type === 'joined' && msg.peers.length > 0) {
        peerRef.current = new PeerConnection(sig, msg.peers[0], cfg.role === 'host', localStream, handlers);
      } else if (msg.type === 'peer-joined') {
        if (cfg.role === 'host') {
          peerRef.current = new PeerConnection(sig, msg.id, true, localStream, handlers);
        }
      } else if (msg.type === 'signal') {
        peerRef.current?.acceptSignal(msg.payload);
      } else if (msg.type === 'peer-left') {
        peerRef.current?.destroy();
        peerRef.current = null;
        setRemoteStream(null);
      }
    });

    return () => {
      off();
      peerRef.current?.destroy();
      sig.close();
    };
  }, [cfg.avatarSeed, cfg.bio, cfg.displayName, cfg.role, sessionRoom, cfg.signalingUrl, localStream]);

  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((seconds) => {
        if (seconds <= 1) {
          clearInterval(id);
          setTimeout(onFinish, 500);
          return 0;
        }
        return store.isPaused ? seconds : seconds - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [onFinish, store.isPaused]);

  useEffect(() => {
    const api = window.coworker;
    if (!api) return;

    api.activeWindow.start();
    const off = api.activeWindow.onUpdate((info) => {
      setSelfActiveWindow(info);
      peerRef.current?.send({ type: 'activeWindow', info });
    });

    return () => {
      off();
      api.activeWindow.stop();
    };
  }, []);

  useEffect(() => {
    const api = window.coworker;
    if (!api) return;

    const id = setInterval(async () => {
      if (store.isPaused) return;
      const idle = await api.system.idleTime();
      peerRef.current?.send({ type: 'idle', idleSeconds: idle });
    }, 5000);

    return () => clearInterval(id);
  }, [store.isPaused]);

  useEffect(() => {
    if (peerIdleSec > IDLE_THRESHOLD_SEC && !store.pausedByPeer) {
      store.applyDelta(SCORING.idleTick * -1, SCORING.idleTick, 'peer idle');
      peerRef.current?.send({ type: 'scoreDelta', self: SCORING.idleTick, peer: 0, note: 'idle' });
    }
  }, [peerIdleSec, store]);

  useEffect(() => {
    const onFullscreenChange = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener('fullscreenchange', onFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', onFullscreenChange);
  }, []);

  useEffect(() => {
    const api = window.coworker;
    if (!api) return;

    const offEscape = api.window.onScreenModeEscape(() => {
      setScreenMode(false);
      setScreenHudVisible(true);
      void api.window.setScreenMode(false);
    });
    const offHud = api.window.onScreenModeToggleHud(() => {
      setScreenHudVisible((visible) => !visible);
    });
    return () => {
      offEscape();
      offHud();
      void api.window.setScreenMode(false);
    };
  }, []);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        if (screenMode) {
          void setScreenModeActive(false);
          return;
        }
        setMenuOpen((open) => !open);
        setOptionsOpen(false);
        resetFreeLook();
        return;
      }

      if (e.repeat) return;

      if (e.key === 'v' || e.key === 'V') {
        setCameraMode((mode) => (mode === 'overhead' ? 'firstPerson' : 'overhead'));
        return;
      }

      if (e.key === 'f' || e.key === 'F') {
        toggleFullscreen();
        return;
      }

      if (e.key.toLowerCase() === SCREEN_MODE_HOTKEY) {
        void setScreenModeActive(true);
        return;
      }

      if (e.key === lookModifier) {
        setLookHeld(true);
      }
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key === lookModifier) {
        setLookHeld(false);
        resetFreeLook();
      }
    };

    window.addEventListener('keydown', onKeyDown);
    window.addEventListener('keyup', onKeyUp);
    return () => {
      window.removeEventListener('keydown', onKeyDown);
      window.removeEventListener('keyup', onKeyUp);
    };
  }, [lookModifier, screenMode]);

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!draggingRef.current) return;
      freeLookRef.current.enabled = true;
      freeLookRef.current.yaw -= e.movementX * 0.004;
      freeLookRef.current.pitch = Math.max(-1.1, Math.min(1.1, freeLookRef.current.pitch - e.movementY * 0.0035));
    };

    const onMouseUp = () => {
      draggingRef.current = false;
      if (!lookHeld) resetFreeLook();
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
    };
  }, [lookHeld]);

  useEffect(() => {
    const api = window.coworker;
    if (!api) return;

    api.rpc.init();
    api.rpc.update({
      details: 'locked in with a friend',
      state: `room ${cfg.room}`,
      endTimestamp: Math.floor(Date.now() / 1000) + cfg.durationMin * 60,
    });
  }, [cfg.durationMin, cfg.room]);

  function handlePeerMessage(message: PeerMessage) {
    if (message.type === 'activeWindow') {
      setPeerActiveWindow(message.info);
      return;
    }
    if (message.type === 'idle') {
      setPeerIdleSec(message.idleSeconds);
      return;
    }
    if (message.type === 'reason') {
      setIncomingReason({ reason: message.text, calloutTs: message.calloutTs });
      return;
    }
    if (message.type === 'reasonResolve') {
      if (message.accepted) {
        store.applyDelta(SCORING.unjustCalloutAccepted, -SCORING.unjustCalloutAccepted, 'reason accepted');
      } else {
        store.applyDelta(SCORING.unjustCalloutRejected, 0, 'reason rejected');
      }
      return;
    }
    if (message.type === 'pauseStart') {
      store.markPause('peer', true);
      return;
    }
    if (message.type === 'pauseEnd') {
      store.markPause('peer', false);
      return;
    }
    if (message.type === 'scoreDelta') {
      store.applyDelta(message.peer, message.self, message.note);
    }
  }

  useHotkeys(
    {
      ...DEFAULT_HOTKEYS,
      peek: lookModifier,
    },
    {
      onPeekDown: () => {
        if (menuOpen || screenMode) return;
        if (cameraMode === 'firstPerson') return;
        setPeeking(true);
        peerRef.current?.send({ type: 'peek', isPeeking: true });
      },
      onPeekUp: () => {
        setPeeking(false);
        peerRef.current?.send({ type: 'peek', isPeeking: false });
      },
      onCallout: () => {
        if (menuOpen || screenMode || !peeking) return;

        const targetApp = peerActiveWindow?.app ?? 'unknown';
        peerRef.current?.send({ type: 'callout', targetApp, ts: Date.now() });

        const valid = isSlacking(peerActiveWindow, store.appList);
        if (valid) {
          store.applyDelta(SCORING.validCallout, -SCORING.validCallout, `called out ${targetApp}`);
          peerRef.current?.send({
            type: 'scoreDelta',
            self: -SCORING.validCallout,
            peer: SCORING.validCallout,
            note: `got called out on ${targetApp}`,
          });
          return;
        }

        setPendingReasonUi({
          targetApp,
          deadline: Date.now() + 15000,
          calloutTs: Date.now(),
        });
      },
      onPause: () => {
        if (menuOpen || screenMode) return;

        if (store.isPaused) {
          store.markPause('self', false);
          peerRef.current?.send({ type: 'pauseEnd' });
          return;
        }

        if (store.selfPausesUsed >= store.pauseCap) return;
        store.markPause('self', true);
        peerRef.current?.send({ type: 'pauseStart', remainingSec: store.pauseDurationSec });
      },
    }
  );

  const hudHint = useMemo(() => {
    if (screenMode) return 'screen mode active · Esc exits · Ctrl+Shift+H toggles overlay';
    if (store.isPaused) return 'paused - press P again to resume';
    if (cameraMode === 'firstPerson') {
      return `hold ${lookModifier} and drag to look around · V to switch view · M for screen mode`;
    }
    if (peeking) return 'peeking - press SPACE to call out';
    return `hold ${lookModifier} to peek · V to switch view · M for screen mode`;
  }, [cameraMode, lookModifier, peeking, screenMode, store.isPaused]);

  const quitReady = quitText.trim().toLowerCase() === QUIT_PHRASE;

  return (
    <div
      ref={rootRef}
      onMouseDown={(e) => {
        if (menuOpen || screenMode) return;
        if (cameraMode !== 'firstPerson' || !lookHeld) return;
        if (e.button !== 0) return;
        draggingRef.current = true;
        freeLookRef.current.enabled = true;
      }}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        cursor:
          !screenMode && cameraMode === 'firstPerson' && lookHeld
            ? draggingRef.current
              ? 'grabbing'
              : 'grab'
            : 'default',
      }}
    >
      <Canvas shadows camera={{ position: [0, 1.8, 2.5], fov: 42 }}>
        <Library />
        <Laptop
          position={SELF_LAPTOP}
          rotationY={0}
          stream={localStream}
          paused={store.isPaused}
          label="you"
          onDoubleClick={() => void setScreenModeActive(true)}
        />
        <Laptop position={PEER_LAPTOP} rotationY={0} stream={remoteStream} paused={store.pausedByPeer} label="friend" />
        <Avatar
          position={[SELF_LAPTOP[0], 0, SELF_LAPTOP[2] + 0.8]}
          color="#5aa8ff"
          rotationY={Math.PI}
          transparent={cameraMode === 'firstPerson'}
        />
        <Avatar
          position={[PEER_LAPTOP[0], 0, PEER_LAPTOP[2] + 1.15]}
          color="#ff8e5a"
          rotationY={Math.PI}
          isIdle={peerIdleSec > IDLE_THRESHOLD_SEC}
        />
        <CameraRig
          mode={cameraMode}
          peeking={peeking}
          selfAnchor={SELF_LAPTOP}
          peerAnchor={PEER_LAPTOP}
          freeLookRef={freeLookRef}
        />
      </Canvas>

      {screenMode && (
        <div style={screenModeLayer}>
          <video ref={screenVideoRef} autoPlay muted playsInline style={screenVideoStyle} />
          <div style={screenModeEdgeGlow} />
        </div>
      )}

      {(!screenMode || screenHudVisible) && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            left: 20,
            display: 'flex',
            flexDirection: 'column',
            gap: 10,
            padding: 16,
            background: screenMode ? 'rgba(18,22,32,0.18)' : 'var(--panel)',
            backdropFilter: 'blur(14px)',
            WebkitBackdropFilter: 'blur(14px)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: 'var(--shadow)',
            minWidth: 280,
            opacity: screenMode ? 0.4 : 1,
            zIndex: 12,
          }}
        >
          <Timer secondsLeft={secondsLeft} />
          <ScoreHUD />
          <div
            style={{
              display: 'inline-flex',
              alignSelf: 'flex-start',
              alignItems: 'center',
              gap: 6,
              padding: '3px 10px',
              borderRadius: 999,
              border: '1px solid var(--border)',
              background: 'rgba(255,255,255,0.04)',
              fontSize: 11,
              color: 'var(--text-dim)',
              fontFamily: 'JetBrains Mono, monospace',
            }}
          >
            view · {cameraMode === 'overhead' ? 'overhead' : 'first-person'}
          </div>
          <button onClick={() => void setScreenModeActive(!screenMode)} style={menuButton}>
            {screenMode ? 'Exit screen mode' : 'Screen mode'}
          </button>
          <button onClick={toggleFullscreen} style={menuButton}>
            {isFullscreen ? 'Exit app fullscreen' : 'App fullscreen'}
          </button>
          <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{hudHint}</div>
          <div style={{ color: 'var(--text-mute)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
            you · {selfActiveWindow?.app ?? '—'}
            <br />
            friend · {peerActiveWindow?.app ?? '—'}
          </div>
        </div>
      )}

      {!screenMode && peeking && <div style={pillStyle}>peeking - press SPACE to call out</div>}

      {(!screenMode || screenHudVisible) && store.isPaused && (
        <div
          style={{
            ...pillStyle,
            left: 'auto',
            right: 20,
            transform: 'none',
            background: 'rgba(255,196,107,0.14)',
            border: '1px solid var(--warn)',
            color: 'var(--warn)',
          }}
        >
          paused - press P to resume
        </div>
      )}

      {menuOpen && (
        <div style={menuOverlay}>
          <div style={menuCard}>
            {!optionsOpen ? (
              <>
                <h2 style={{ margin: 0, fontSize: 26 }}>Session Menu</h2>
                <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                  The session is still live. Use this when you need a quick escape hatch without losing your place.
                </div>
                <button style={menuPrimaryButton} onClick={() => setMenuOpen(false)}>
                  Resume
                </button>
                <button style={menuButton} onClick={() => setOptionsOpen(true)}>
                  Options
                </button>
                <div style={quitBox}>
                  <div style={{ fontWeight: 600 }}>Quit lock-in</div>
                  <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                    Type <code>{QUIT_PHRASE}</code> before quitting.
                  </div>
                  <input
                    value={quitText}
                    onChange={(e) => setQuitText(e.target.value)}
                    placeholder={QUIT_PHRASE}
                    style={menuInput}
                  />
                  <button
                    style={{
                      ...menuButton,
                      opacity: quitReady ? 1 : 0.55,
                      cursor: quitReady ? 'pointer' : 'not-allowed',
                    }}
                    disabled={!quitReady}
                    onClick={onQuit}
                  >
                    Quit Session
                  </button>
                </div>
              </>
            ) : (
              <>
                <h2 style={{ margin: 0, fontSize: 26 }}>Options</h2>
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14 }}>
                  Look / peek modifier
                  <select
                    value={lookModifier}
                    onChange={(e) => setLookModifier(e.target.value as LookModifier)}
                    style={menuSelect}
                  >
                    {LOOK_MODIFIER_OPTIONS.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                </label>
                <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                  In first-person, hold the modifier and drag to free-look. In overhead view, the same key keeps the quick peek behavior.
                </div>
                <div style={{ color: 'var(--text-dim)', fontSize: 13 }}>
                  Screen mode opens your own shared screen large, keeps blurred room edges, and lets the real desktop underneath receive clicks.
                </div>
                <div style={{ color: 'var(--text-mute)', fontSize: 12 }}>
                  `Fn` is not offered here because operating systems usually intercept it before Electron can detect it reliably.
                </div>
                <button
                  style={menuPrimaryButton}
                  onClick={() => {
                    setOptionsOpen(false);
                    setQuitText('');
                  }}
                >
                  Back
                </button>
              </>
            )}
          </div>
        </div>
      )}

      {pendingReasonUi && (
        <ReasonPrompt
          targetApp={pendingReasonUi.targetApp}
          deadlineMs={pendingReasonUi.deadline}
          onSubmit={(text) => {
            peerRef.current?.send({ type: 'reason', text, calloutTs: pendingReasonUi.calloutTs });
            setPendingReasonUi(null);
          }}
          onTimeout={() => {
            store.applyDelta(SCORING.unjustNoReason, 0, 'no reason given');
            peerRef.current?.send({
              type: 'scoreDelta',
              self: -SCORING.unjustNoReason,
              peer: 0,
              note: 'friend gave no reason',
            });
            setPendingReasonUi(null);
          }}
        />
      )}

      {incomingReason && (
        <DisputeToast
          reason={incomingReason.reason}
          onAccept={() => {
            peerRef.current?.send({ type: 'reasonResolve', calloutTs: incomingReason.calloutTs, accepted: true });
            setIncomingReason(null);
          }}
          onReject={() => {
            peerRef.current?.send({ type: 'reasonResolve', calloutTs: incomingReason.calloutTs, accepted: false });
            setIncomingReason(null);
          }}
        />
      )}
    </div>
  );
}

const menuButton: React.CSSProperties = {
  alignSelf: 'flex-start',
  padding: '8px 12px',
  borderRadius: 999,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.08)',
  color: 'var(--text)',
  cursor: 'pointer',
  fontSize: 12,
  fontWeight: 600,
};

const menuPrimaryButton: React.CSSProperties = {
  ...menuButton,
  background: 'var(--accent)',
  border: '1px solid var(--accent)',
  color: '#0d1320',
};

const menuOverlay: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  display: 'grid',
  placeItems: 'center',
  background: 'rgba(12, 15, 24, 0.46)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  zIndex: 30,
};

const menuCard: React.CSSProperties = {
  width: 'min(92vw, 420px)',
  display: 'flex',
  flexDirection: 'column',
  gap: 14,
  padding: 24,
  borderRadius: 24,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.9)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.25)',
};

const menuInput: React.CSSProperties = {
  width: '100%',
  boxSizing: 'border-box',
  padding: '12px 14px',
  borderRadius: 14,
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.95)',
  color: '#1f2430',
  fontSize: 14,
};

const menuSelect: React.CSSProperties = {
  ...menuInput,
};

const quitBox: React.CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 10,
  padding: 14,
  borderRadius: 18,
  border: '1px solid rgba(0,0,0,0.08)',
  background: 'rgba(245, 239, 232, 0.8)',
};

const pillStyle: React.CSSProperties = {
  position: 'absolute',
  top: 20,
  left: '50%',
  transform: 'translateX(-50%)',
  padding: '8px 16px',
  background: 'rgba(124,108,255,0.18)',
  border: '1px solid var(--accent)',
  borderRadius: 999,
  color: 'var(--text)',
  fontSize: 13,
  fontWeight: 500,
  letterSpacing: 1,
  boxShadow: '0 0 20px rgba(124,108,255,0.25)',
  zIndex: 15,
};

const screenModeLayer: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  zIndex: 8,
  pointerEvents: 'none',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '18px',
  boxSizing: 'border-box',
};

const screenVideoStyle: React.CSSProperties = {
  width: '100%',
  height: '100%',
  objectFit: 'contain',
  borderRadius: 24,
  boxShadow: '0 30px 90px rgba(0,0,0,0.28)',
};

const screenModeEdgeGlow: React.CSSProperties = {
  position: 'absolute',
  inset: 0,
  borderRadius: 28,
  boxShadow: 'inset 0 0 80px rgba(12, 12, 20, 0.4), inset 0 0 14px rgba(255,255,255,0.12)',
  backdropFilter: 'blur(3px)',
  WebkitBackdropFilter: 'blur(3px)',
};
