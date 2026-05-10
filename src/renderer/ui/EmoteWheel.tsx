import { useEffect, useRef, useState } from 'react';
import { EMOTES, type EmoteKind } from '../net/protocol';

type Props = {
  open: boolean;
  onSelect: (kind: EmoteKind) => void;
  onClose: () => void;
};

const RADIUS = 110;
const SLICE_RADIUS = 42;

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

/**
 * Hold-to-open radial menu. Hover slice → release E to send. Esc cancels.
 */
export function EmoteWheel({ open, onSelect, onClose }: Props) {
  const [hover, setHover] = useState<EmoteKind | null>(null);
  const hoverRef = useRef<EmoteKind | null>(null);

  useEffect(() => { hoverRef.current = hover; }, [hover]);

  useEffect(() => {
    if (!open) { setHover(null); return; }

    const onMouseMove = (e: MouseEvent) => {
      const cx = window.innerWidth / 2;
      const cy = window.innerHeight / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.hypot(dx, dy);
      if (dist < 30) { setHover(null); return; }
      const angle = Math.atan2(dy, dx);
      // Slice 0 starts at -90° (top), proceeds clockwise.
      let normalized = angle + Math.PI / 2;
      if (normalized < 0) normalized += Math.PI * 2;
      const slice = Math.floor((normalized / (Math.PI * 2)) * EMOTES.length);
      setHover(EMOTES[slice % EMOTES.length]);
    };

    const onKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'e') {
        const pick = hoverRef.current;
        if (pick) onSelect(pick);
        onClose();
      }
    };
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { e.preventDefault(); onClose(); }
    };

    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('keyup', onKeyUp);
    window.addEventListener('keydown', onKeyDown);
    return () => {
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('keyup', onKeyUp);
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [open, onSelect, onClose]);

  if (!open) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        pointerEvents: 'none',
        zIndex: 40,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(8, 10, 18, 0.35)',
        backdropFilter: 'blur(2px)',
      }}
    >
      <div
        style={{
          position: 'relative',
          width: (RADIUS + SLICE_RADIUS) * 2,
          height: (RADIUS + SLICE_RADIUS) * 2,
        }}
      >
        <div
          style={{
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)',
            width: 70,
            height: 70,
            borderRadius: '50%',
            background: 'rgba(18, 22, 32, 0.85)',
            border: '1.5px solid rgba(255,255,255,0.12)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'rgba(255,255,255,0.55)',
            fontSize: 11,
            fontFamily: 'JetBrains Mono, monospace',
            letterSpacing: 1,
            textTransform: 'uppercase',
          }}
        >
          emote
        </div>

        {EMOTES.map((kind, i) => {
          const angle = -Math.PI / 2 + (i / EMOTES.length) * Math.PI * 2;
          const x = Math.cos(angle) * RADIUS;
          const y = Math.sin(angle) * RADIUS;
          const active = hover === kind;
          const accent = HUES[kind];
          return (
            <div
              key={kind}
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                width: SLICE_RADIUS * 2,
                height: SLICE_RADIUS * 2,
                marginLeft: -SLICE_RADIUS,
                marginTop: -SLICE_RADIUS,
                transform: `translate(${x}px, ${y}px) scale(${active ? 1.12 : 1})`,
                borderRadius: '50%',
                background: active ? accent : 'rgba(18, 22, 32, 0.92)',
                border: `2px solid ${active ? '#fff' : accent}`,
                boxShadow: active ? `0 0 24px ${accent}` : `0 0 12px ${accent}33`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: active ? '#1a1a25' : accent,
                fontFamily: 'JetBrains Mono, monospace',
                fontSize: 12,
                fontWeight: 700,
                letterSpacing: 0.5,
                textTransform: 'uppercase',
                transition: 'transform 120ms, box-shadow 120ms, background 120ms',
              }}
            >
              {LABELS[kind]}
            </div>
          );
        })}
      </div>
    </div>
  );
}
