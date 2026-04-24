import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.SIGNALING_PORT ?? 8787);

type RoomPeer = { id: string; ws: WebSocket };
const rooms = new Map<string, RoomPeer[]>();

const wss = new WebSocketServer({ port: PORT });

wss.on('connection', (ws) => {
  let joinedRoom: string | null = null;
  let peerId: string | null = null;

  ws.on('message', (raw) => {
    let msg: { type: string; room?: string; id?: string; to?: string; payload?: unknown };
    try {
      msg = JSON.parse(raw.toString());
    } catch {
      return;
    }

    if (msg.type === 'join' && msg.room && msg.id) {
      joinedRoom = msg.room;
      peerId = msg.id;
      const peers = rooms.get(joinedRoom) ?? [];
      // notify existing peers of new arrival
      for (const p of peers) {
        p.ws.send(JSON.stringify({ type: 'peer-joined', id: peerId }));
      }
      peers.push({ id: peerId, ws });
      rooms.set(joinedRoom, peers);
      ws.send(JSON.stringify({ type: 'joined', peers: peers.filter((p) => p.id !== peerId).map((p) => p.id) }));
      return;
    }

    if (msg.type === 'signal' && joinedRoom && msg.to) {
      const peers = rooms.get(joinedRoom) ?? [];
      const target = peers.find((p) => p.id === msg.to);
      if (target) {
        target.ws.send(JSON.stringify({ type: 'signal', from: peerId, payload: msg.payload }));
      }
    }
  });

  ws.on('close', () => {
    if (!joinedRoom || !peerId) return;
    const peers = (rooms.get(joinedRoom) ?? []).filter((p) => p.id !== peerId);
    if (peers.length === 0) rooms.delete(joinedRoom);
    else {
      rooms.set(joinedRoom, peers);
      for (const p of peers) p.ws.send(JSON.stringify({ type: 'peer-left', id: peerId }));
    }
  });
});

console.log(`signaling ws listening on :${PORT}`);
