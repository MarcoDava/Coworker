import { Billboard, Html } from '@react-three/drei';
import { useEffect, useState } from 'react';
import type { EmoteKind } from '../net/protocol';

type Props = {
  /** Avatar root world position. Bubble pops above the head. */
  position: [number, number, number];
  /** Latest emote + timestamp. Bubble shows for EMOTE_DURATION_MS then auto-clears. */
  emote: { kind: EmoteKind; ts: number } | null;
  /** Pill border tint — typically the emoter's body color. */
  color: string;
};

const HEAD_OFFSET_Y = 2.45;
const EMOTE_DURATION_MS = 2200;

const LABELS: Record<EmoteKind, string> = {
  wave:   'hi!',
  nice:   'nice',
  lockin: 'lock in',
  gg:     'gg',
  rip:    'rip',
  oof:    'oof',
};

const HUES: Record<EmoteKind, string> = {
  wave:   '#7ec6ff',
  nice:   '#7ae0a3',
  lockin: '#b48cff',
  gg:     '#ffd76b',
  rip:    '#a0a8b5',
  oof:    '#ff7a8a',
};

export function EmoteBubble({ position, emote, color }: Props) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!emote) { setVisible(false); return; }
    setVisible(true);
    const id = setTimeout(() => setVisible(false), EMOTE_DURATION_MS);
    return () => clearTimeout(id);
  }, [emote?.ts, emote?.kind]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!visible || !emote) return null;

  const accent = HUES[emote.kind];

  return (
    <Billboard position={[position[0], position[1] + HEAD_OFFSET_Y, position[2]]} follow>
      <Html
        center
        distanceFactor={5}
        zIndexRange={[20, 0]}
        style={{ pointerEvents: 'none', userSelect: 'none' }}
      >
        <div
          key={emote.ts}
          style={{
            padding: '6px 14px',
            borderRadius: 999,
            background: '#fff8ef',
            border: `2px solid ${accent}`,
            boxShadow: `0 4px 16px ${accent}55, 0 0 0 1px ${color}33`,
            color: '#1a1a25',
            fontFamily: 'JetBrains Mono, monospace',
            fontSize: 13,
            fontWeight: 700,
            letterSpacing: 1,
            textTransform: 'uppercase',
            animation: 'emote-pop 220ms cubic-bezier(0.34, 1.56, 0.64, 1)',
            whiteSpace: 'nowrap',
          }}
        >
          {LABELS[emote.kind]}
        </div>
        <style>{`@keyframes emote-pop{0%{transform:translateY(8px) scale(0.7);opacity:0}60%{transform:translateY(-2px) scale(1.08);opacity:1}100%{transform:translateY(0) scale(1);opacity:1}}`}</style>
      </Html>
    </Billboard>
  );
}
