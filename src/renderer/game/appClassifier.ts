import type { ActiveWindowInfo } from '../../preload/index';

export type AppListMode = 'blacklist' | 'whitelist';
export type AppList = { mode: AppListMode; entries: string[] };

export function isSlacking(info: ActiveWindowInfo | null, list: AppList): boolean {
  if (!info) return false;
  const hay = `${info.app} ${info.title} ${info.url ?? ''}`.toLowerCase();
  const hit = list.entries.some((e) => e.trim() && hay.includes(e.trim().toLowerCase()));
  return list.mode === 'blacklist' ? hit : !hit;
}
