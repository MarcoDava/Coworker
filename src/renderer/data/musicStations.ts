/**
 * Curated radio stations for in-session ambient music. URLs are public
 * Zeno.FM streams; swap freely without code changes.
 */

export type MusicStation = 'lofi' | 'jazz' | 'classical' | 'silence';

export const MUSIC_STATIONS: Record<MusicStation, { label: string; url: string }> = {
  lofi:      { label: 'lo-fi beats',  url: 'https://stream.zeno.fm/f3wvbbqmdg8uv' },
  jazz:      { label: 'jazz café',    url: 'https://stream.zeno.fm/0r0xa792kwzuv' },
  classical: { label: 'classical',    url: 'https://stream.zeno.fm/p5cfu0at0g8uv' },
  silence:   { label: 'silence',      url: '' },
};

const KEY = 'coworker_music_station_v1';

export function loadMusicStation(): MusicStation {
  const v = localStorage.getItem(KEY);
  if (v && v in MUSIC_STATIONS) return v as MusicStation;
  return 'lofi';
}

export function saveMusicStation(station: MusicStation): void {
  localStorage.setItem(KEY, station);
}
