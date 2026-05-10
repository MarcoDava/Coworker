import type { ActiveWindowInfo } from '../../preload/index';
import type { AppList } from '../game/appClassifier';

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
  | { type: 'mouseMove'; nx: number; ny: number }
  | { type: 'appList'; list: AppList };

export type Role = 'host' | 'guest';
