const CLIENT_ID = process.env.DISCORD_CLIENT_ID ?? '';

type RPC = {
  login: (opts: { clientId: string }) => Promise<unknown>;
  setActivity: (activity: Record<string, unknown>) => Promise<unknown>;
  destroy: () => Promise<unknown>;
  on: (event: string, cb: () => void) => void;
};

let client: RPC | null = null;
let ready = false;

export async function initRichPresence() {
  if (!CLIENT_ID || client) return;
  try {
    const rpc = await import('discord-rpc');
    client = new rpc.Client({ transport: 'ipc' }) as unknown as RPC;
    client.on('ready', () => {
      ready = true;
    });
    await client.login({ clientId: CLIENT_ID });
  } catch {
    client = null;
  }
}

export async function updateRichPresence(payload: {
  details: string;
  state: string;
  endTimestamp?: number;
}) {
  if (!client || !ready) return;
  try {
    await client.setActivity({
      details: payload.details,
      state: payload.state,
      endTimestamp: payload.endTimestamp,
      largeImageKey: 'library',
      instance: false,
    });
  } catch {
    /* ignore */
  }
}

export async function destroyRichPresence() {
  if (client) {
    try {
      await client.destroy();
    } catch {
      /* ignore */
    }
    client = null;
    ready = false;
  }
}
