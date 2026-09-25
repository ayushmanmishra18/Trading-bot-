'use client';

// Shared signature primitives — hand-drawn SVG identity, no generic kit look.

export function Mark({ size = 30 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" fill="none" aria-hidden>
      <rect x="1.5" y="1.5" width="29" height="29" rx="8" stroke="#3DF5A6" strokeWidth="2" />
      <path d="M6 19 L12 19 L15 11 L18.5 24 L21.5 16 L26 16" stroke="#3DF5A6" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function Spark({ data = [], w = 120, h = 36, up = true, id = 's' }) {
  if (!data.length) return <div className="skel rounded-md" style={{ width: w, height: h }} />;
  const min = Math.min(...data), max = Math.max(...data), rng = max - min || 1;
  const pts = data.map((v, i) => `${(i / (data.length - 1)) * w},${h - 3 - ((v - min) / rng) * (h - 8)}`).join(' ');
  const c = up ? '#3DF5A6' : '#FF5C5C';
  return (
    <svg width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden>
      <defs>
        <linearGradient id={`g-${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor={c} stopOpacity=".35" />
          <stop offset="1" stopColor={c} stopOpacity="0" />
        </linearGradient>
      </defs>
      <polygon points={`0,${h} ${pts} ${w},${h}`} fill={`url(#g-${id})`} />
      <polyline points={pts} fill="none" stroke={c} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export function SectionHead({ kick, title, right, sub }) {
  return (
    <div className="flex items-end justify-between gap-4 mb-4">
      <div>
        <p className="eyebrow mb-1.5">{kick}</p>
        <h2 className="h-display text-[22px] md:text-[26px] leading-none">{title}</h2>
        {sub && <p className="text-[13px] text-mist mt-1.5">{sub}</p>}
      </div>
      {right}
    </div>
  );
}

export function TickerTape({ items = [] }) {
  const row = [...items, ...items];
  return (
    <div className="ticker-mask overflow-hidden border-b border-line bg-ink/70 backdrop-blur">
      <div className="flex gap-8 whitespace-nowrap py-2 px-4 animate-tape w-max">
        {row.map((t, i) => (
          <a key={i} href={`/markets/${t.symbol}`} className="flex items-center gap-2 font-mono text-[12px] hover:text-white text-mist">
            <span className="text-fog font-semibold">{t.symbol.replace('USDT', '')}</span>
            <span className="num">${Number(t.price || 0).toLocaleString()}</span>
            <span className={Number(t.changePct) >= 0 ? 'sent' : 'sneg'}>
              {Number(t.changePct) >= 0 ? '+' : ''}{Number(t.changePct || 0).toFixed(2)}%
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}

export function Sigil({ strategy }) {
  const map = {
    SMA_CROSS: { g: ['#3DF5A6', '#1E9E6A'], glyph: 'M6 20 L11 20 L14 9 L18 23 L21 14 L26 14', tag: 'TRD' },
    RSI_MEAN: { g: ['#8B7CFF', '#4A3FD1'], glyph: 'M6 16 Q11 6 16 16 T26 16', tag: 'REV' },
    MACD_TREND: { g: ['#FFB224', '#C26E00'], glyph: 'M6 22 L13 13 L17 17 L26 7', tag: 'MOM' }
  };
  const s = map[strategy] || map.SMA_CROSS;
  return (
    <div className="flex items-center gap-3">
      <svg width="44" height="44" viewBox="0 0 32 32" aria-hidden>
        <defs><linearGradient id={`sg-${s.tag}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={s.g[0]} /><stop offset="1" stopColor={s.g[1]} />
        </linearGradient></defs>
        <rect width="32" height="32" rx="10" fill={`url(#sg-${s.tag})`} opacity=".16" />
        <path d={s.glyph} stroke={s.g[0]} strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span className="pill pill-idle">{s.tag}</span>
    </div>
  );
}

export function Empty({ title, hint, action }) {
  return (
    <div className="panel p-10 text-center">
      <div className="mx-auto mb-4 opacity-60"><Mark size={36} /></div>
      <p className="h-display text-[17px]">{title}</p>
      <p className="text-[13px] text-mist mt-1.5 max-w-sm mx-auto">{hint}</p>
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function Verdict({ ret }) {
  const good = Number(ret) >= 0;
  return (
    <div className={`panel p-5 flex items-center gap-4 border-l-4 ${good ? '!border-l-mint' : '!border-l-coral'}`}>
      <div className={`font-disp font-bold text-[26px] num ${good ? 'sent' : 'sneg'}`}>
        {good ? '+' : ''}{ret}%
      </div>
      <div>
        <p className="h-display text-[15px]">{good ? 'Strategy beats buy-and-hold on this window' : 'Strategy underperforms on this window'}</p>
        <p className="text-[12.5px] text-mist mt-0.5">Net of 0.1% fees per side. Past replay — not a promise.</p>
      </div>
    </div>
  );
}

export const fmt$ = (v) => (v === null || v === undefined || isNaN(Number(v)) ? '—' : '$' + Number(v).toLocaleString(undefined, { maximumFractionDigits: 2 }));
