import SimplePeer from 'simple-peer';
import type { SignalingClient } from './signaling';
import type { PeerMessage } from './protocol';

export type PeerHandlers = {
  onRemoteStream: (stream: MediaStream) => void;
  onData: (msg: PeerMessage) => void;
  onConnect: () => void;
  onClose: () => void;
};

export class PeerConnection {
  private peer: SimplePeer.Instance | null = null;
  private dataReady = false;

  constructor(
    signaling: SignalingClient,
    remoteId: string,
    initiator: boolean,
    localStream: MediaStream,
    handlers: PeerHandlers,
  ) {
    this.peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: localStream,
      config: {
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
      },
    });

    this.peer.on('signal', (data) => {
      signaling.sendSignal(remoteId, data);
    });
    this.peer.on('stream', (stream) => handlers.onRemoteStream(stream));
    this.peer.on('connect', () => {
      this.dataReady = true;
      handlers.onConnect();
    });
    this.peer.on('data', (raw) => {
      try {
        handlers.onData(JSON.parse(raw.toString()) as PeerMessage);
      } catch {
        /* ignore */
      }
    });
    this.peer.on('close', () => handlers.onClose());
    this.peer.on('error', () => handlers.onClose());
  }

  acceptSignal(payload: unknown) {
    this.peer?.signal(payload as SimplePeer.SignalData);
  }

  send(msg: PeerMessage) {
    if (!this.peer || !this.dataReady) return;
    try {
      this.peer.send(JSON.stringify(msg));
    } catch {
      /* ignore */
    }
  }

  destroy() {
    this.peer?.destroy();
    this.peer = null;
  }
}
