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
import { DEFAULT_HOTKEYS, useHotkeys } from '../game/hotkeys';
import { useScoreStore } from '../game/scoreStore';
import { isSlacking } from '../game/appClassifier';
import { SCORING } from '../game/scoring';
import type { ActiveWindowInfo } from '../../preload/index';

type Props = {
  cfg: LobbyConfig;
  onFinish: () => void;
};

const SELF_LAPTOP: [number, number, number] = [-1.8, 0, -2];
const PEER_LAPTOP: [number, number, number] = [1.8, 0, -2];
const IDLE_THRESHOLD_SEC = 120;

export function Session({ cfg, onFinish }: Props) {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peeking, setPeeking] = useState(false);
  const [cameraMode, setCameraMode] = useState<CameraMode>('overhead');
  const [secondsLeft, setSecondsLeft] = useState(cfg.durationMin * 60);
  const [selfActiveWindow, setSelfActiveWindow] = useState<ActiveWindowInfo | null>(null);
  const [peerActiveWindow, setPeerActiveWindow] = useState<ActiveWindowInfo | null>(null);
  const [peerIdleSec, setPeerIdleSec] = useState(0);
  const [incomingReason, setIncomingReason] = useState<{ reason: string; calloutTs: number } | null>(null);
  const [pendingReasonUi, setPendingReasonUi] = useState<{ targetApp: string; deadline: number; calloutTs: number } | null>(null);

  const peerRef = useRef<PeerConnection | null>(null);
  const sigRef = useRef<SignalingClient | null>(null);

  const store = useScoreStore();

  // 1) capture our own desktop
  useEffect(() => {
    let mounted = true;
    navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 24 }, audio: false }).then((s) => {
      if (mounted) setLocalStream(s);
    });
    return () => { mounted = false; };
  }, []);

  // 2) signaling + peer
  useEffect(() => {
    if (!localStream) return;
    const myId = `${cfg.role}-${Math.random().toString(36).slice(2, 8)}`;
    const sig = new SignalingClient(cfg.signalingUrl, cfg.room, myId);
    sigRef.current = sig;

    const handlers = {
      onRemoteStream: (s: MediaStream) => setRemoteStream(s),
      onData: (m: PeerMessage) => handlePeerMessage(m),
      onConnect: () => {},
      onClose: () => {},
    };

    const off = sig.onMessage((msg) => {
      if (msg.type === 'joined' && msg.peers.length > 0) {
        const remoteId = msg.peers[0];
        peerRef.current = new PeerConnection(sig, remoteId, cfg.role === 'host', localStream, handlers);
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
  }, [localStream, cfg.role, cfg.room, cfg.signalingUrl]);

  // 3) timer
  useEffect(() => {
    const id = setInterval(() => {
      setSecondsLeft((s) => {
        if (s <= 1) {
          clearInterval(id);
          setTimeout(onFinish, 500);
          return 0;
        }
        return store.isPaused ? s : s - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, [onFinish, store.isPaused]);

  // 4) active window polling (ours → broadcast to peer)
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

  // 5) idle detection (ours → broadcast; apply idle penalty to peer)
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

  // 6) apply idle penalty to peer when their idle exceeds threshold
  useEffect(() => {
    if (peerIdleSec > IDLE_THRESHOLD_SEC && !store.pausedByPeer) {
      store.applyDelta(SCORING.idleTick * -1, SCORING.idleTick, 'peer idle');
      peerRef.current?.send({ type: 'scoreDelta', self: SCORING.idleTick, peer: 0, note: 'idle' });
    }
  }, [peerIdleSec, store]);

  // 6.5) camera mode toggle — V for view
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.repeat) return;
      if (e.key === 'v' || e.key === 'V') {
        setCameraMode((m) => (m === 'overhead' ? 'firstPerson' : 'overhead'));
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  // 7) Rich Presence + RPC init
  useEffect(() => {
    const api = window.coworker;
    if (!api) return;
    api.rpc.init();
    const endTs = Math.floor(Date.now() / 1000) + cfg.durationMin * 60;
    api.rpc.update({
      details: `locked in with a friend`,
      state: `room ${cfg.room}`,
      endTimestamp: endTs,
    });
  }, [cfg.durationMin, cfg.room]);

  function handlePeerMessage(m: PeerMessage) {
    if (m.type === 'activeWindow') setPeerActiveWindow(m.info);
    else if (m.type === 'idle') setPeerIdleSec(m.idleSeconds);
    else if (m.type === 'peek') {/* decorative */}
    else if (m.type === 'callout') {
      // peer called us out while on `targetApp`. If WE are on a valid app, open dispute path.
      const weAreSlacking = isSlacking(selfActiveWindow, store.appList);
      if (weAreSlacking) {
        // callout was valid — we lose points. peer will self-apply.
      } else {
        // wait for reason message
      }
    } else if (m.type === 'reason') {
      setIncomingReason({ reason: m.text, calloutTs: m.calloutTs });
    } else if (m.type === 'reasonResolve') {
      if (m.accepted) {
        store.applyDelta(SCORING.unjustCalloutAccepted, -SCORING.unjustCalloutAccepted, 'reason accepted');
      } else {
        store.applyDelta(SCORING.unjustCalloutRejected, 0, 'reason rejected');
      }
    } else if (m.type === 'pauseStart') {
      store.markPause('peer', true);
    } else if (m.type === 'pauseEnd') {
      store.markPause('peer', false);
    } else if (m.type === 'scoreDelta') {
      // mirror: peer reports THEIR delta; swap for our view
      store.applyDelta(m.peer, m.self, m.note);
    }
  }

  // hotkeys
  useHotkeys(DEFAULT_HOTKEYS, {
    onPeekDown: () => {
      setPeeking(true);
      peerRef.current?.send({ type: 'peek', isPeeking: true });
    },
    onPeekUp: () => {
      setPeeking(false);
      peerRef.current?.send({ type: 'peek', isPeeking: false });
    },
    onCallout: () => {
      if (!peeking) return;
      const targetApp = peerActiveWindow?.app ?? 'unknown';
      peerRef.current?.send({ type: 'callout', targetApp, ts: Date.now() });
      const valid = isSlacking(peerActiveWindow, store.appList);
      if (valid) {
        store.applyDelta(SCORING.validCallout, -SCORING.validCallout, `called out ${targetApp}`);
        peerRef.current?.send({ type: 'scoreDelta', self: -SCORING.validCallout, peer: SCORING.validCallout, note: `got called out on ${targetApp}` });
      } else {
        // unjust — we need to submit a reason within 15s
        const deadline = Date.now() + 15000;
        setPendingReasonUi({ targetApp, deadline, calloutTs: Date.now() });
      }
    },
    onPause: () => {
      if (store.isPaused) return;
      if (store.selfPausesUsed >= store.pauseCap) return;
      store.markPause('self', true);
      peerRef.current?.send({ type: 'pauseStart', remainingSec: store.pauseDurationSec });
      setTimeout(() => {
        store.markPause('self', false);
        peerRef.current?.send({ type: 'pauseEnd' });
      }, store.pauseDurationSec * 1000);
    },
  });

  const hudHint = useMemo(() => {
    if (store.isPaused) return 'you are paused';
    if (peeking) return `peeking — press SPACE to call out`;
    return `hold ALT to peek · V to switch view · P to pause`;
  }, [peeking, store.isPaused]);

  return (
    <div style={{ width: '100vw', height: '100vh', position: 'relative' }}>
      <Canvas shadows camera={{ position: [0, 2, 3], fov: 55 }}>
        <Library />
        <Laptop position={SELF_LAPTOP} rotationY={0.2} stream={localStream} paused={store.isPaused} label="you" />
        <Laptop position={PEER_LAPTOP} rotationY={-0.2} stream={remoteStream} paused={store.pausedByPeer} label="friend" />
        <Avatar position={[SELF_LAPTOP[0], 0, SELF_LAPTOP[2] + 0.8]} color="#5aa8ff" rotationY={Math.PI} />
        <Avatar
          position={[PEER_LAPTOP[0], 0, PEER_LAPTOP[2] + 0.8]}
          color="#ff8e5a"
          rotationY={Math.PI}
          isIdle={peerIdleSec > IDLE_THRESHOLD_SEC}
        />
        <CameraRig mode={cameraMode} peeking={peeking} selfAnchor={SELF_LAPTOP} peerAnchor={PEER_LAPTOP} />
      </Canvas>

      <div
        style={{
          position: 'absolute',
          top: 20,
          left: 20,
          display: 'flex',
          flexDirection: 'column',
          gap: 10,
          padding: 16,
          background: 'var(--panel)',
          backdropFilter: 'blur(14px)',
          WebkitBackdropFilter: 'blur(14px)',
          border: '1px solid var(--border)',
          borderRadius: 14,
          boxShadow: 'var(--shadow)',
          minWidth: 240,
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
        <div style={{ color: 'var(--text-dim)', fontSize: 12 }}>{hudHint}</div>
        <div style={{ color: 'var(--text-mute)', fontSize: 11, fontFamily: 'JetBrains Mono, monospace' }}>
          you · {selfActiveWindow?.app ?? '—'}
          <br />
          friend · {peerActiveWindow?.app ?? '—'}
        </div>
      </div>

      {peeking && (
        <div
          style={{
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
          }}
        >
          👁 peeking — press SPACE to call out
        </div>
      )}

      {store.isPaused && (
        <div
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            padding: '8px 14px',
            background: 'rgba(255,196,107,0.14)',
            border: '1px solid var(--warn)',
            borderRadius: 999,
            color: 'var(--warn)',
            fontSize: 13,
            fontWeight: 500,
          }}
        >
          ⏸ paused
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
            peerRef.current?.send({ type: 'scoreDelta', self: -SCORING.unjustNoReason, peer: 0, note: 'friend gave no reason' });
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
