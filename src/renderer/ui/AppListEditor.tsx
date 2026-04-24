import { useScoreStore } from '../game/scoreStore';

export function AppListEditor() {
  const list = useScoreStore((s) => s.appList);
  const setAppList = useScoreStore((s) => s.setAppList);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div style={{ display: 'flex', gap: 6, padding: 4, background: 'rgba(255,255,255,0.03)', borderRadius: 10, border: '1px solid var(--border)' }}>
        {(['blacklist', 'whitelist'] as const).map((m) => (
          <button
            key={m}
            onClick={() => setAppList({ ...list, mode: m })}
            style={{
              flex: 1,
              border: 'none',
              background: list.mode === m ? 'rgba(124,108,255,0.18)' : 'transparent',
              color: list.mode === m ? 'var(--text)' : 'var(--text-dim)',
              borderRadius: 6,
              padding: '8px 10px',
              fontWeight: 500,
            }}
          >
            {m === 'blacklist' ? 'blacklist — these = slacking' : 'whitelist — only these = working'}
          </button>
        ))}
      </div>
      <textarea
        rows={5}
        value={list.entries.join('\n')}
        onChange={(e) => setAppList({ ...list, entries: e.target.value.split('\n') })}
        placeholder={'one app or site per line\nyoutube\ntwitter\nreddit'}
        style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 13,
          lineHeight: 1.6,
          resize: 'vertical',
        }}
      />
    </div>
  );
}
