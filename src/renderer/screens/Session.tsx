import { Canvas } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { LobbyConfig } from './Lobby';
import { loadSceneEnv, saveSceneEnv, type SceneEnv } from '../data/skins';
import { SEAT_LAYOUTS } from '../data/seatLayouts';
import { Library } from '../scene/Library';
import { SpaceStation } from '../scene/SpaceStation';
import { Train } from '../scene/Train';
import { Skyscraper } from '../scene/Skyscraper';
import { Laptop } from '../scene/Laptop';
import { FocusTree } from '../scene/FocusTree';
import { CoffeeMug } from '../scene/CoffeeMug';
import { Avatar } from '../scene/Avatar';
import { AvatarLabel } from '../scene/AvatarLabel';
import { EmoteBubble } from '../scene/EmoteBubble';
import { GoalBubble } from '../scene/GoalBubble';
import { EmoteWheel } from '../ui/EmoteWheel';
import { CameraRig, type CameraMode } from '../scene/Camera';
import { EnvironmentPicker } from '../ui/EnvironmentPicker';
import { Timer } from '../ui/Timer';
import { ScoreHUD } from '../ui/ScoreHUD';
import { ReasonPrompt } from '../ui/ReasonPrompt';
import { DisputeToast } from '../ui/DisputeToast';
import { SignalingClient } from '../net/signaling';
import { PeerConnection } from '../net/peer';
import type { EmoteKind, PeerMessage } from '../net/protocol';
import { DEFAULT_HOTKEYS, LOOK_MODIFIER_OPTIONS, type LookModifier, useHotkeys } from '../game/hotkeys';
import { useFreeLook } from '../game/useFreeLook';
import { isEditableTarget } from '../game/inputUtils';
import { useScoreStore } from '../game/scoreStore';
import { isSlacking } from '../game/appClassifier';
import { SCORING } from '../game/scoring';
import type { ActiveWindowInfo } from '../../preload/index';

type Props = {
  cfg: LobbyConfig;
  onFinish: () => void;
  onQuit: () => void;
};

// Slot indices within SEAT_LAYOUTS: guest=0 (left), host=1 (right)
const GUEST_SLOT = 0;
const HOST_SLOT  = 1;
const IDLE_THRESHOLD_SEC = 120;
const QUIT_PHRASE = 'im a chicken, buk buk';
const SCREEN_MODE_HOTKEY = 'm';

export function Session({ cfg, onFinish, onQuit }: Props) {
  const sessionRoom = useMemo(() => `${cfg.room}:session`, [cfg.room]);
  const sessionStartTs = useMemo(() => Date.now(), []);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peeking, setPeeking] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overhead');
  const [menuOpen, setMenuOpen] = useState(false);
  const { freeLookRef, draggingRef, lookModifier, setLookModifier, lookHeld, onCanvasMouseDown, reset: resetFreeLook } = useFreeLook(menuOpen);
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [envPickerOpen, setEnvPickerOpen] = useState(false);
  const [quitText, setQuitText] = useState('');
  const [screenMode, setScreenMode] = useState(false);
  const [screenHudVisible, setScreenHudVisible] = useState(true);
  const [secondsLeft, setSecondsLeft] = useState(cfg.durationMin * 60);
  const [selfActiveWindow, setSelfActiveWindow] = useState<ActiveWindowInfo | null>(null);
  const [peerActiveWindow, setPeerActiveWindow] = useState<ActiveWindowInfo | null>(null);
  const [peerIdleSec, setPeerIdleSec] = useState(0);
  const [incomingReason, setIncomingReason] = useState<{ reason: string; calloutTs: number } | null>(null);
  const [pendingReasonUi, setPendingReasonUi] = useState<{ targetApp: string; deadline: number; calloutTs: number } | null>(null);
  const [selfTyping, setSelfTyping] = useState(false);
  const [peerTyping, setPeerTyping] = useState(false);
  const [peerLeft, setPeerLeft] = useState(false);
  const [musicVolume, setMusicVolume] = useState(0.25);
  const [sceneEnv, setSceneEnv] = useState<SceneEnv>(() => loadSceneEnv());
  const [emoteWheelOpen, setEmoteWheelOpen] = useState(false);
  const [selfEmote, setSelfEmote] = useState<{ kind: EmoteKind; ts: number } | null>(null);
  const [peerEmote, setPeerEmote] = useState<{ kind: EmoteKind; ts: number } | null>(null);
  const lastEmoteTsRef = useRef(0);

  const peerRef = useRef<PeerConnection | null>(null);
  const screenModeRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const lastIdlePenaltyRef = useRef(0);
  const peerPauseEndsAtRef = useRef<number | null>(null);
  const [peerPauseSecsLeft, setPeerPauseSecsLeft] = useState<number | null>(null);
  const selfMouseRef = useRef({ nx: 0.5, ny: 0.5, active: false });
  const peerMouseRef = useRef({ nx: 0.5, ny: 0.5, active: false });
  const peerMouseTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isPaused = useScoreStore((s) => s.isPaused);
  const pausedByPeer = useScoreStore((s) => s.pausedByPeer);
  const selfPausesUsed = useScoreStore((s) => s.selfPausesUsed);
  const pauseCap = useScoreStore((s) => s.pauseCap);
  const pauseDurationSec = useScoreStore((s) => s.pauseDurationSec);
  const appList = useScoreStore((s) => s.appList);
  const applyDelta = useScoreStore((s) => s.applyDelta);
  const markPause = useScoreStore((s) => s.markPause);
  const setPauseConfig = useScoreStore((s) => s.setPauseConfig);
  const selfSlot = cfg.role === 'host' ? HOST_SLOT : GUEST_SLOT;
  const peerSlot = cfg.role === 'host' ? GUEST_SLOT : HOST_SLOT;
  const layout = SEAT_LAYOUTS[sceneEnv];
  const selfSeat = layout[selfSlot];
  const peerSeat = layout[peerSlot];
  const selfLaptop = selfSeat.laptop;
  const peerLaptop = peerSeat.laptop;

  useEffect(() => {
    setPauseConfig(cfg.pauseCap, cfg.pauseDurationSec);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function setScreenModeActive(active: boolean) {
    screenModeRef.current = active;
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
    let mounted = true;
    navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 24 }, audio: false }).then((stream) => {
      if (!mounted) return;
      window.coworker?.capture.setProtection(true);
      setLocalStream(stream);
    }).catch(() => {});
    return () => {
      mounted = false;
      window.coworker?.capture.setProtection(false);
    };
  }, []);

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
      onConnect: () => {
        if (cfg.role === 'host') {
          const list = useScoreStore.getState().appList;
          peerRef.current?.send({ type: 'appList', list });
        }
      },
      onClose: () => {},
    };

    const off = sig.onMessage((msg) => {
      if (msg.type === 'joined' && msg.peers.length > 0) {
        peerRef.current = new PeerConnection(sig, msg.peers[0], cfg.role === 'host', localStream, handlers);
      } else if (msg.type === 'peer-joined') {
        if (!peerRef.current) {
          peerRef.current = new PeerConnection(sig, msg.id, cfg.role === 'host', localStream, handlers);
        }
      } else if (msg.type === 'signal') {
        peerRef.current?.acceptSignal(msg.payload);
      } else if (msg.type === 'peer-left') {
        peerRef.current?.destroy();
        peerRef.current = null;
        setRemoteStream(null);
        setPeerLeft(true);
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
        return isPaused ? seconds : seconds - 1;
      });
    }, 1000);

    return () => clearInterval(id);
  }, [onFinish, isPaused]);

  useEffect(() => {
    if (!pausedByPeer) return;
    const id = setInterval(() => {
      if (!peerPauseEndsAtRef.current) return;
      setPeerPauseSecsLeft(Math.max(0, Math.ceil((peerPauseEndsAtRef.current - Date.now()) / 1000)));
    }, 1000);
    return () => clearInterval(id);
  }, [pausedByPeer]);

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
      if (isPaused) return;
      const idle = await api.system.idleTime();
      peerRef.current?.send({ type: 'idle', idleSeconds: idle });
    }, 5000);

    return () => clearInterval(id);
  }, [isPaused]);

  useEffect(() => {
    if (peerIdleSec > IDLE_THRESHOLD_SEC && !pausedByPeer) {
      const now = Date.now();
      if (now - lastIdlePenaltyRef.current >= 60_000) {
        lastIdlePenaltyRef.current = now;
        applyDelta(-SCORING.idleTick, SCORING.idleTick, 'peer idle');
        peerRef.current?.send({ type: 'scoreDelta', self: SCORING.idleTick, peer: -SCORING.idleTick, note: 'idle' });
      }
    }
  }, [peerIdleSec, pausedByPeer, applyDelta]);


  useEffect(() => {
    const api = window.coworker;
    if (!api) return;

    const offHud = api.window.onScreenModeToggleHud(() => {
      setScreenHudVisible((visible) => !visible);
    });
    const offToggle = api.window.onToggleMode(() => {
      void setScreenModeActive(!screenModeRef.current);
    });
    return () => {
      offHud();
      offToggle();
      void api.window.setScreenMode(false);
    };
  }, []);

  useEffect(() => {
    const bg = screenMode && window.coworker ? 'transparent' : '';
    document.documentElement.style.background = bg;
    document.body.style.background = bg;
    const root = document.getElementById('root');
    if (root) root.style.background = bg;
  }, [screenMode]);

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;
    const onKey = () => {
      setSelfTyping(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => setSelfTyping(false), 700);
    };
    window.addEventListener('keydown', onKey);
    const offGlobal = window.coworker?.global?.onKeyActivity(onKey);
    return () => {
      window.removeEventListener('keydown', onKey);
      offGlobal?.();
      clearTimeout(timeout);
    };
  }, []);

  useEffect(() => {
    peerRef.current?.send({ type: 'typing', isTyping: selfTyping });
  }, [selfTyping]);

  useEffect(() => {
    let selfMouseTimeout: ReturnType<typeof setTimeout> | null = null;
    let lastSend = 0;
    const onMouseMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth;
      const ny = e.clientY / window.innerHeight;
      selfMouseRef.current.nx = nx;
      selfMouseRef.current.ny = ny;
      selfMouseRef.current.active = true;
      if (selfMouseTimeout) clearTimeout(selfMouseTimeout);
      selfMouseTimeout = setTimeout(() => { selfMouseRef.current.active = false; }, 1500);
      const now = Date.now();
      if (now - lastSend > 66) {
        lastSend = now;
        peerRef.current?.send({ type: 'mouseMove', nx, ny });
      }
    };
    window.addEventListener('mousemove', onMouseMove);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      if (selfMouseTimeout) clearTimeout(selfMouseTimeout);
    };
  }, []);

  useEffect(() => {
    const audio = new Audio();
    audio.src = 'https://stream.zeno.fm/f3wvbbqmdg8uv';
    audio.loop = true;
    audio.volume = musicVolume;
    audioRef.current = audio;
    audio.play().catch(() => {});
    return () => {
      audio.pause();
      audio.src = '';
      audioRef.current = null;
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (audioRef.current) audioRef.current.volume = musicVolume;
  }, [musicVolume]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (isEditableTarget(e.target)) return;
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

      if (menuOpen || e.repeat) return;

      if (e.key === 'v' || e.key === 'V') {
        setCameraMode((mode) => (mode === 'overhead' ? 'firstPerson' : 'overhead'));
        return;
      }

      if (e.key.toLowerCase() === 'e') {
        if (!screenMode) setEmoteWheelOpen(true);
        return;
      }

      if (e.key.toLowerCase() === SCREEN_MODE_HOTKEY) {
        void setScreenModeActive(true);
      }
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [menuOpen, screenMode]);

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
        applyDelta(SCORING.unjustCalloutAccepted, -SCORING.unjustCalloutAccepted, 'reason accepted');
      } else {
        applyDelta(SCORING.unjustCalloutRejected, 0, 'reason rejected');
      }
      return;
    }
    if (message.type === 'appList') {
      useScoreStore.getState().setAppList(message.list);
      return;
    }
    if (message.type === 'pauseStart') {
      markPause('peer', true);
      peerPauseEndsAtRef.current = Date.now() + message.remainingSec * 1000;
      setPeerPauseSecsLeft(message.remainingSec);
      return;
    }
    if (message.type === 'pauseEnd') {
      markPause('peer', false);
      peerPauseEndsAtRef.current = null;
      setPeerPauseSecsLeft(null);
      return;
    }
    if (message.type === 'scoreDelta') {
      applyDelta(message.peer, message.self, message.note);
    }
    if (message.type === 'typing') {
      setPeerTyping(message.isTyping);
    }
    if (message.type === 'mouseMove') {
      peerMouseRef.current.nx = message.nx;
      peerMouseRef.current.ny = message.ny;
      peerMouseRef.current.active = true;
      if (peerMouseTimeout.current) clearTimeout(peerMouseTimeout.current);
      peerMouseTimeout.current = setTimeout(() => { peerMouseRef.current.active = false; }, 1500);
    }
    if (message.type === 'emote') {
      setPeerEmote({ kind: message.kind, ts: message.ts });
    }
  }

  function sendEmote(kind: EmoteKind) {
    const now = Date.now();
    if (now - lastEmoteTsRef.current < 600) return; // simple cooldown / spam guard
    lastEmoteTsRef.current = now;
    setSelfEmote({ kind, ts: now });
    peerRef.current?.send({ type: 'emote', kind, ts: now });
  }

  useHotkeys(
    DEFAULT_HOTKEYS,
    {
      onPeekDown: () => {
        if (menuOpen || screenMode) return;
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

        const valid = isSlacking(peerActiveWindow, appList);
        if (valid) {
          applyDelta(SCORING.validCallout, -SCORING.validCallout, `called out ${targetApp}`);
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

        if (isPaused) {
          markPause('self', false);
          peerRef.current?.send({ type: 'pauseEnd' });
          return;
        }

        if (selfPausesUsed >= pauseCap) return;
        markPause('self', true);
        peerRef.current?.send({ type: 'pauseStart', remainingSec: pauseDurationSec });
      },
    }
  );

  const hudHint = useMemo(() => {
    if (screenMode) return 'screen mode active · Esc exits · Ctrl+Shift+H toggles overlay';
    if (isPaused) return 'paused - press P again to resume';
    if (cameraMode === 'firstPerson') {
      return `hold ${lookModifier} and drag to look · V switch view · E emote · M work mode`;
    }
    if (peeking) return 'peeking - press SPACE to call out';
    return `hold ${lookModifier} + drag · Tab peek · V view · E emote · M work mode`;
  }, [cameraMode, lookModifier, peeking, screenMode, isPaused]);

  const quitReady = quitText.trim().toLowerCase() === QUIT_PHRASE;

  if (screenMode) {
    return (
      <div style={{ width: '100vw', height: '100vh', position: 'relative', background: 'transparent', pointerEvents: 'none' }}>
        {screenHudVisible && (
          <div style={workModeHud}>
            <Timer secondsLeft={secondsLeft} />
            <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.45)', fontFamily: 'JetBrains Mono, monospace', letterSpacing: 0.5 }}>
              double-tap Esc · enter scene
            </div>
            {peerActiveWindow && (
              <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.35)', fontFamily: 'JetBrains Mono, monospace' }}>
                friend · {peerActiveWindow.app}
              </div>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <div
      ref={rootRef}
      onMouseDown={onCanvasMouseDown}
      style={{
        width: '100vw',
        height: '100vh',
        position: 'relative',
        cursor:
          lookHeld
            ? draggingRef.current
              ? 'grabbing'
              : 'grab'
            : 'default',
      }}
    >
      <Canvas
        shadows
        gl={{ stencil: true }}
        camera={{ position: [0, 1.8, 2.5], fov: 42 }}
        onCreated={({ gl }) => {
          gl.domElement.addEventListener('webglcontextlost', (e) => e.preventDefault(), false);
        }}
      >
        {sceneEnv === 'library' && <Library />}
        {sceneEnv === 'space' && <SpaceStation />}
        {sceneEnv === 'train' && <Train />}
        {sceneEnv === 'skyscraper' && <Skyscraper />}
        <Laptop
          position={selfLaptop}
          rotationY={0}
          stream={localStream}
          paused={isPaused}
          label="you"
          onDoubleClick={() => void setScreenModeActive(true)}
        />
        {cfg.playerCount > 1 && !peerLeft && (
          <Laptop position={peerLaptop} rotationY={0} stream={remoteStream} paused={pausedByPeer} label="friend" />
        )}
        <FocusTree
          laptopPosition={selfLaptop}
          growth={1 - secondsLeft / Math.max(1, cfg.durationMin * 60)}
          withered={isPaused}
          side={1}
        />
        <CoffeeMug laptopPosition={selfLaptop} color={cfg.appearance.bodyColor} side={-1} />
        {cfg.playerCount > 1 && !peerLeft && (
          <>
            <FocusTree
              laptopPosition={peerLaptop}
              growth={1 - secondsLeft / Math.max(1, cfg.durationMin * 60)}
              withered={pausedByPeer || peerIdleSec > IDLE_THRESHOLD_SEC}
              side={1}
            />
            <CoffeeMug laptopPosition={peerLaptop} color={cfg.peerAppearance.bodyColor} side={-1} />
          </>
        )}
        {cameraMode !== 'firstPerson' && (
          <Avatar
            position={[selfLaptop[0], 0, selfLaptop[2] + selfSeat.avatarZOffset]}
            color={cfg.appearance.bodyColor}
            skinColor={cfg.appearance.skinTone}
            hairColor={cfg.appearance.hairColor}
            eyeColor={cfg.appearance.eyeColor}
            chairColor={cfg.appearance.chairColor}
            rotationY={Math.PI}
            isTyping={selfTyping}
            focused={screenMode}
            lookRef={freeLookRef}
            mouseRef={selfMouseRef}
          />
        )}
        {cfg.playerCount > 1 && (
          <Avatar
            position={[peerLaptop[0], 0, peerLaptop[2] + peerSeat.avatarZOffset]}
            color={cfg.peerAppearance.bodyColor}
            skinColor={cfg.peerAppearance.skinTone}
            hairColor={cfg.peerAppearance.hairColor}
            eyeColor={cfg.peerAppearance.eyeColor}
            chairColor={cfg.peerAppearance.chairColor}
            rotationY={Math.PI}
            isIdle={peerIdleSec > IDLE_THRESHOLD_SEC}
            isTyping={peerTyping}
            trackCamera
            mouseRef={peerMouseRef}
          />
        )}
        {cameraMode !== 'firstPerson' && (
          <AvatarLabel
            position={[selfLaptop[0], 0, selfLaptop[2] + selfSeat.avatarZOffset]}
            name={cfg.displayName}
            color={cfg.appearance.bodyColor}
            status={isPaused ? 'paused' : selfTyping ? 'typing' : undefined}
          />
        )}
        {cfg.playerCount > 1 && !peerLeft && (
          <AvatarLabel
            position={[peerLaptop[0], 0, peerLaptop[2] + peerSeat.avatarZOffset]}
            name={cfg.peerDisplayName}
            color={cfg.peerAppearance.bodyColor}
            status={
              pausedByPeer
                ? 'paused'
                : peerIdleSec > IDLE_THRESHOLD_SEC
                  ? 'idle'
                  : peerTyping
                    ? 'typing'
                    : undefined
            }
          />
        )}
        {cameraMode !== 'firstPerson' && (
          <EmoteBubble
            position={[selfLaptop[0], 0, selfLaptop[2] + selfSeat.avatarZOffset]}
            emote={selfEmote}
            color={cfg.appearance.bodyColor}
          />
        )}
        {cfg.playerCount > 1 && !peerLeft && (
          <EmoteBubble
            position={[peerLaptop[0], 0, peerLaptop[2] + peerSeat.avatarZOffset]}
            emote={peerEmote}
            color={cfg.peerAppearance.bodyColor}
          />
        )}
        {cameraMode !== 'firstPerson' && cfg.sessionGoal && (
          <GoalBubble
            position={[selfLaptop[0], 0, selfLaptop[2] + selfSeat.avatarZOffset]}
            goal={cfg.sessionGoal}
            color={cfg.appearance.bodyColor}
            startedAt={sessionStartTs}
          />
        )}
        {cfg.playerCount > 1 && !peerLeft && cfg.peerSessionGoal && (
          <GoalBubble
            position={[peerLaptop[0], 0, peerLaptop[2] + peerSeat.avatarZOffset]}
            goal={cfg.peerSessionGoal}
            color={cfg.peerAppearance.bodyColor}
            startedAt={sessionStartTs}
          />
        )}
        <CameraRig
          mode={cameraMode}
          peeking={peeking}
          selfAnchor={selfLaptop}
          peerAnchor={peerLaptop}
          freeLookRef={freeLookRef}
        />
      </Canvas>

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
          <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{hudHint}</div>
          <div style={{ color: 'var(--text-mute)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
            you · {selfActiveWindow?.app ?? '—'}
            <br />
            friend · {peerActiveWindow?.app ?? '—'}
          </div>
          {(cfg.sessionGoal || cfg.peerSessionGoal) && (
            <div
              style={{
                marginTop: 4,
                paddingTop: 8,
                borderTop: '1px solid var(--border)',
                color: 'var(--text-dim)',
                fontSize: 11,
                lineHeight: 1.5,
                fontStyle: 'italic',
              }}
            >
              {cfg.sessionGoal && <div>you: {cfg.sessionGoal}</div>}
              {cfg.peerSessionGoal && <div>friend: {cfg.peerSessionGoal}</div>}
            </div>
          )}
        </div>
      )}

      {!screenMode && peeking && <div style={pillStyle}>peeking - press SPACE to call out</div>}

      {(!screenMode || screenHudVisible) && isPaused && (
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

      {(!screenMode || screenHudVisible) && pausedByPeer && (
        <div
          style={{
            ...pillStyle,
            left: 'auto',
            right: 20,
            top: 60,
            transform: 'none',
            background: 'rgba(180,140,255,0.12)',
            border: '1px solid rgba(180,140,255,0.5)',
            color: 'rgba(200,170,255,1)',
          }}
        >
          friend paused{peerPauseSecsLeft !== null ? ` · ${peerPauseSecsLeft}s` : ''}
        </div>
      )}

      {menuOpen && (
        <div style={menuOverlay}>
          <div style={menuCard}>
            {!optionsOpen ? (
              <>
                <h2 style={{ margin: 0, fontSize: 26, color: 'var(--text)' }}>Session Menu</h2>
                <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
                  The session is still live. Use this when you need a quick escape hatch without losing your place.
                </div>
                <button style={menuPrimaryButton} onClick={() => setMenuOpen(false)}>
                  Resume
                </button>
                <button style={menuButton} onClick={() => { setMenuOpen(false); setEnvPickerOpen(true); }}>
                  Environments
                </button>
                <button style={menuButton} onClick={() => setOptionsOpen(true)}>
                  Options
                </button>
                <div style={quitBox}>
                  <div style={{ fontWeight: 600, color: 'var(--text)' }}>Quit lock-in</div>
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
                <h2 style={{ margin: 0, fontSize: 26, color: 'var(--text)' }}>Options</h2>
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
                <label style={{ display: 'flex', flexDirection: 'column', gap: 8, fontSize: 14, color: 'var(--text)' }}>
                  Music volume
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <input
                      type="range"
                      min={0}
                      max={1}
                      step={0.05}
                      value={musicVolume}
                      onChange={(e) => setMusicVolume(Number(e.target.value))}
                      style={{ flex: 1 }}
                    />
                    <span style={{ fontSize: 12, color: 'var(--text-dim)', minWidth: 32 }}>
                      {Math.round(musicVolume * 100)}%
                    </span>
                  </div>
                </label>
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
            applyDelta(SCORING.unjustNoReason, 0, 'no reason given');
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

      {peerLeft && (
        <div style={menuOverlay}>
          <div style={menuCard}>
            <h2 style={{ margin: 0, fontSize: 26, color: 'var(--text)' }}>Your friend left</h2>
            <div style={{ color: 'var(--text-dim)', fontSize: 14 }}>
              Your co-working partner disconnected. You can keep going solo or end the session.
            </div>
            <button style={menuPrimaryButton} onClick={() => setPeerLeft(false)}>
              Keep going
            </button>
            <button style={menuButton} onClick={onQuit}>
              End session
            </button>
          </div>
        </div>
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

      {envPickerOpen && (
        <EnvironmentPicker
          current={sceneEnv}
          onChange={(env) => { setSceneEnv(env); saveSceneEnv(env); }}
          onClose={() => setEnvPickerOpen(false)}
        />
      )}

      <EmoteWheel
        open={emoteWheelOpen}
        onSelect={sendEmote}
        onClose={() => setEmoteWheelOpen(false)}
      />
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
  background: 'rgba(18, 22, 35, 0.97)',
  boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
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
  border: '1px solid var(--border)',
  background: 'rgba(255,255,255,0.04)',
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

const workModeHud: React.CSSProperties = {
  position: 'absolute',
  top: 16,
  right: 16,
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
  padding: '10px 14px',
  borderRadius: 12,
  background: 'rgba(10,10,18,0.55)',
  backdropFilter: 'blur(12px)',
  WebkitBackdropFilter: 'blur(12px)',
  border: '1px solid rgba(255,255,255,0.08)',
  pointerEvents: 'none',
  zIndex: 20,
};
