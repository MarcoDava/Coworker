export type SignalingMessage =
  | { type: 'joined'; peers: string[] }
  | { type: 'peer-joined'; id: string }
  | { type: 'peer-left'; id: string }
  | { type: 'signal'; from: string; payload: unknown };

export class SignalingClient {
  private ws: WebSocket;
  private handlers = new Set<(m: SignalingMessage) => void>();

  constructor(url: string, public room: string, public id: string) {
    this.ws = new WebSocket(url);
    this.ws.addEventListener('open', () => {
      this.ws.send(JSON.stringify({ type: 'join', room, id }));
    });
    this.ws.addEventListener('message', (e) => {
      try {
        const msg = JSON.parse(e.data) as SignalingMessage;
        for (const h of this.handlers) h(msg);
      } catch {
        /* ignore */
      }
    });
  }

  onMessage(cb: (m: SignalingMessage) => void) {
    this.handlers.add(cb);
    return () => this.handlers.delete(cb);
  }

  sendSignal(to: string, payload: unknown) {
    this.ws.send(JSON.stringify({ type: 'signal', to, payload }));
  }

  close() {
    this.ws.close();
  }
}
