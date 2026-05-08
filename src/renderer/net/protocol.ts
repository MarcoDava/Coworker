import type { ActiveWindowInfo } from '../../preload/index';

export type PeerMessage =
  | { type: 'activeWindow'; info: ActiveWindowInfo }
  | { type: 'idle'; idleSeconds: number }
  | { type: 'position'; x: number; y: number; z: number; rotY: number }
  | { type: 'peek'; isPeeking: boolean }
  | { type: 'callout'; targetApp: string; ts: number }
  | { type: 'reason'; text: string; calloutTs: number }
  | { type: 'reasonResolve'; calloutTs: number; accepted: boolean }
  | { type: 'pauseStart'; remainingSec: number }
  | { type: 'pauseEnd' }
  | { type: 'scoreDelta'; self: number; peer: number; note: string }
  | { type: 'typing'; isTyping: boolean }
  | { type: 'mouseMove'; nx: number; ny: number };

export type Role = 'host' | 'guest';
