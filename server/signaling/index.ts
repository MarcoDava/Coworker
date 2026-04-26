import { WebSocketServer, WebSocket } from 'ws';

const PORT = Number(process.env.PORT ?? process.env.SIGNALING_PORT ?? 8787);

type PeerRole = 'host' | 'guest';
type LobbyProfile = {
  displayName: string;
  bio: string;
  avatarSeed: string;
};

type RoomPeer = {
  id: string;
  ws: WebSocket;
  role: PeerRole;
  profile: LobbyProfile;
};

type ClientMessage =
  | { type: 'join'; room: string; id: string; role?: PeerRole; profile?: LobbyProfile }
  | { type: 'signal'; to: string; payload: unknown }
  | { type: 'profile:update'; profile: LobbyProfile }
  | { type: 'room:start'; durationMin: 25 | 50 | 90 };

const rooms = new Map<string, RoomPeer[]>();
const wss = new WebSocketServer({ port: PORT });

function sendJson(ws: WebSocket, payload: unknown) {
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function hostIdFor(peers: RoomPeer[]) {
  return peers.find((peer) => peer.role === 'host')?.id ?? peers[0]?.id ?? null;
}

function broadcastRoomState(room: string) {
  const peers = rooms.get(room) ?? [];
  const payload = {
    type: 'room-state',
    hostId: hostIdFor(peers),
    members: peers.map((peer) => ({
      id: peer.id,
      role: peer.role,
      profile: peer.profile,
    })),
  };

  for (const peer of peers) {
    sendJson(peer.ws, payload);
  }
}

wss.on('connection', (ws) => {
  let joinedRoom: string | null = null;
  let peerId: string | null = null;

  ws.on('message', (raw) => {
    let msg: ClientMessage;
    try {
      msg = JSON.parse(raw.toString()) as ClientMessage;
    } catch {
      return;
    }

    if (msg.type === 'join' && msg.room && msg.id) {
      joinedRoom = msg.room;
      peerId = msg.id;

      const peers = rooms.get(joinedRoom) ?? [];
      for (const peer of peers) {
        sendJson(peer.ws, { type: 'peer-joined', id: peerId });
      }

      const role = msg.role ?? (peers.length === 0 ? 'host' : 'guest');
      const profile = msg.profile ?? {
        displayName: role === 'host' ? 'host' : 'guest',
        bio: '',
        avatarSeed: msg.id,
      };

      peers.push({ id: peerId, ws, role, profile });
      rooms.set(joinedRoom, peers);

      sendJson(ws, {
        type: 'joined',
        peers: peers.filter((peer) => peer.id !== peerId).map((peer) => peer.id),
      });
      broadcastRoomState(joinedRoom);
      return;
    }

    if (!joinedRoom || !peerId) return;

    if (msg.type === 'profile:update') {
      const peers = rooms.get(joinedRoom) ?? [];
      const peer = peers.find((entry) => entry.id === peerId);
      if (!peer) return;
      peer.profile = msg.profile;
      broadcastRoomState(joinedRoom);
      return;
    }

    if (msg.type === 'room:start') {
      const peers = rooms.get(joinedRoom) ?? [];
      const hostId = hostIdFor(peers);
      if (peerId !== hostId) return;
      for (const peer of peers) {
        sendJson(peer.ws, { type: 'session:start', durationMin: msg.durationMin });
      }
      return;
    }

    if (msg.type === 'signal' && msg.to) {
      const peers = rooms.get(joinedRoom) ?? [];
      const target = peers.find((peer) => peer.id === msg.to);
      if (target) {
        sendJson(target.ws, { type: 'signal', from: peerId, payload: msg.payload });
      }
    }
  });

  ws.on('close', () => {
    if (!joinedRoom || !peerId) return;
    const peers = (rooms.get(joinedRoom) ?? []).filter((peer) => peer.id !== peerId);
    if (peers.length === 0) {
      rooms.delete(joinedRoom);
      return;
    }

    rooms.set(joinedRoom, peers);
    for (const peer of peers) {
      sendJson(peer.ws, { type: 'peer-left', id: peerId });
    }
    broadcastRoomState(joinedRoom);
  });
});

console.log(`signaling ws listening on :${PORT}`);
