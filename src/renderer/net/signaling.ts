import type { AvatarAppearance } from '../data/skins';

export type LobbyProfile = {
  displayName: string;
  bio: string;
  avatarSeed: string;
  appearance?: AvatarAppearance;
};

export type LobbyMember = {
  id: string;
  role: 'host' | 'guest';
  profile: LobbyProfile;
};

export type SignalingMessage =
  | { type: 'joined'; peers: string[] }
  | { type: 'peer-joined'; id: string }
  | { type: 'peer-left'; id: string }
  | { type: 'signal'; from: string; payload: unknown }
  | { type: 'room-state'; hostId: string | null; members: LobbyMember[] }
  | { type: 'session:start'; durationMin: number; pauseCap: number; pauseDurationSec: number };

export class SignalingClient {
  private ws: WebSocket;
  private handlers = new Set<(m: SignalingMessage) => void>();
  private isOpen = false;
  private pending: string[] = [];
  private _onOpen: (() => void) | null = null;
  private _onError: ((reason: string) => void) | null = null;
  private _onDisconnect: (() => void) | null = null;
  private didOpen = false;

  get connected() {
    return this.isOpen;
  }

  private send(raw: string) {
    if (this.isOpen && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(raw);
      return;
    }
    this.pending.push(raw);
  }

  constructor(
    url: string,
    public room: string,
    public id: string,
    role: 'host' | 'guest',
    profile: LobbyProfile
  ) {
    this.ws = new WebSocket(url);
    this.ws.addEventListener('open', () => {
      this.isOpen = true;
      this.didOpen = true;
      this.ws.send(JSON.stringify({ type: 'join', room, id, role, profile }));
      for (const raw of this.pending) {
        this.ws.send(raw);
      }
      this.pending = [];
      this._onOpen?.();
    });
    this.ws.addEventListener('message', (e) => {
      try {
        const msg = JSON.parse(e.data as string) as SignalingMessage;
        for (const handler of this.handlers) handler(msg);
      } catch {
        /* ignore */
      }
    });
    this.ws.addEventListener('error', () => {
      if (!this.didOpen) {
        this._onError?.('Could not connect to signaling server. Is it running?');
      }
    });
    this.ws.addEventListener('close', () => {
      const wasOpen = this.isOpen;
      this.isOpen = false;
      this.pending = [];
      if (!this.didOpen) {
        this._onError?.('Connection to signaling server failed.');
      } else if (wasOpen) {
        this._onDisconnect?.();
      }
    });
  }

  set onOpen(cb: (() => void) | null) { this._onOpen = cb; }
  set onError(cb: ((reason: string) => void) | null) { this._onError = cb; }
  set onDisconnect(cb: (() => void) | null) { this._onDisconnect = cb; }

  onMessage(cb: (m: SignalingMessage) => void) {
    this.handlers.add(cb);
    return () => this.handlers.delete(cb);
  }

  sendSignal(to: string, payload: unknown) {
    this.send(JSON.stringify({ type: 'signal', to, payload }));
  }

  sendProfileUpdate(profile: LobbyProfile) {
    this.send(JSON.stringify({ type: 'profile:update', profile }));
  }

  startSession(durationMin: number, pauseCap: number, pauseDurationSec: number) {
    this.send(JSON.stringify({ type: 'room:start', durationMin, pauseCap, pauseDurationSec }));
  }

  close() {
    this._onOpen = null;
    this._onError = null;
    this._onDisconnect = null;
    this.ws.close();
  }
}
