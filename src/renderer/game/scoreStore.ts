import { create } from 'zustand';
import type { AppList } from './appClassifier';

export type ScoreLogEntry = {
  ts: number;
  who: 'self' | 'peer';
  delta: number;
  note: string;
};

export type PendingCallout = {
  ts: number;
  targetApp: string;
  deadline: number;
};

type State = {
  selfScore: number;
  peerScore: number;
  log: ScoreLogEntry[];
  appList: AppList;
  selfPausesUsed: number;
  peerPausesUsed: number;
  pauseCap: number;
  pauseDurationSec: number;
  isPaused: boolean;
  pausedByPeer: boolean;
  pendingCallout: PendingCallout | null;
  /** Wall-clock ms when the current focus streak started; resets on pause or self-loss. */
  streakStartTs: number;
  applyDelta: (self: number, peer: number, note: string) => void;
  setAppList: (list: AppList) => void;
  setPauseConfig: (cap: number, durationSec: number) => void;
  markPause: (who: 'self' | 'peer', on: boolean) => void;
  setPendingCallout: (c: PendingCallout | null) => void;
  reset: () => void;
};

export const useScoreStore = create<State>((set) => ({
  selfScore: 0,
  peerScore: 0,
  log: [],
  appList: { mode: 'blacklist', entries: ['youtube', 'twitter', 'reddit', 'tiktok'] },
  selfPausesUsed: 0,
  peerPausesUsed: 0,
  pauseCap: 2,
  pauseDurationSec: 180,
  isPaused: false,
  pausedByPeer: false,
  pendingCallout: null,
  streakStartTs: Date.now(),
  applyDelta: (self, peer, note) =>
    set((s) => ({
      selfScore: s.selfScore + self,
      peerScore: s.peerScore + peer,
      log: [...s.log, { ts: Date.now(), who: self !== 0 ? 'self' : 'peer', delta: self || peer, note }],
      // self loss breaks the streak (got called out / no reason / unjust callout)
      streakStartTs: self < 0 ? Date.now() : s.streakStartTs,
    })),
  setAppList: (appList) => set({ appList }),
  setPauseConfig: (pauseCap, pauseDurationSec) => set({ pauseCap, pauseDurationSec }),
  markPause: (who, on) =>
    set((s) => ({
      isPaused: who === 'self' ? on : s.isPaused,
      pausedByPeer: who === 'peer' ? on : s.pausedByPeer,
      selfPausesUsed: who === 'self' && on ? s.selfPausesUsed + 1 : s.selfPausesUsed,
      peerPausesUsed: who === 'peer' && on ? s.peerPausesUsed + 1 : s.peerPausesUsed,
      // self pause start/end resets the streak
      streakStartTs: who === 'self' ? Date.now() : s.streakStartTs,
    })),
  setPendingCallout: (pendingCallout) => set({ pendingCallout }),
  reset: () =>
    set({
      selfScore: 0,
      peerScore: 0,
      log: [],
      selfPausesUsed: 0,
      peerPausesUsed: 0,
      isPaused: false,
      pausedByPeer: false,
      pendingCallout: null,
      streakStartTs: Date.now(),
    }),
}));
