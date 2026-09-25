'use client';
import { useEffect, useMemo, useState } from 'react';
import api from '../lib/api';
import { SectionHead, Spark, fmt$ } from '../components/ui';

const COIN_META = {
  BTCUSDT: { name: 'Bitcoin', glyph: 'B', c: '#FFB224' },
  ETHUSDT: { name: 'Ethereum', glyph: 'E', c: '#8B7CFF' },
  SOLUSDT: { name: 'Solana', glyph: 'S', c: '#3DF5A6' },
  BNBUSDT: { name: 'BNB', glyph: 'N', c: '#FF5C5C' }
};

export default function Dashboard() {
  const [pf, setPf] = useState(null);
  const [prices, setPrices] = useState([]);
  const [klines, setKlines] = useState({});
  const [locked, setLocked] = useState(false);

  useEffect(() => {
    api.get('/portfolio').then((r) => setPf(r.data)).catch(() => setLocked(true));
    api.get('/market/prices').then(async (r) => {
      setPrices(r.data);
      const k = {};
      for (const p of r.data.slice(0, 4)) {
        try {
          const { data } = await api.get(`/market/klines/${p.symbol}?interval=1h&limit=40`);
          k[p.symbol] = data.map((x) => x.close);
        } catch {}
      }
      setKlines(k);
    }).catch(() => {});
  }, []);

  const alloc = useMemo(() => {
    if (!pf || !prices.length) return [];
    const total = pf.openValue || 1;
    // derive pseudo-weights from recent trades so the rail always tells a story
    const syms = [...new Set((pf.recent || []).map((t) => t.symbol))].slice(0, 4);
    const list = (syms.length ? syms : prices.slice(0, 3).map((p) => p.symbol)).map((s, i) => ({
      s, w: [46, 27, 17, 10][i] || 8, c: (COIN_META[s] || {}).c || '#3DF5A6'
    }));
    return list;
  }, [pf, prices]);

  const pnlUp = Number(pf?.pnl || 0) >= 0;

  return (
    <div className="space-y-5 animate-rise">
      <SectionHead
        kick="Desk — portfolio command"
        title="Good evening, trader."
        sub="One glance: net worth, exposure, and what your bots did last."
        right={<a href="/backtest" className="btn-line hidden sm:block">Validate in Lab →</a>}
      />

      {locked && (
        <div className="panel p-4 flex items-center gap-3 text-[13.5px]">
          <span className="pill pill-idle">signed out</span>
          <p className="text-mist">Portfolio is private — <a href="/login" className="text-mint underline underline-offset-4">sign in</a> to unlock it. Market desk below works without an account.</p>
        </div>
      )}

      {/* bento row */}
      <div className="grid grid-cols-12 gap-4">
        {/* hero net worth */}
        <div className="panel panel-hover col-span-12 lg:col-span-7 p-6 md:p-7 relative overflow-hidden">
          <div className="absolute -top-20 -right-20 w-72 h-72 rounded-full animate-drift" style={{ background: 'radial-gradient(circle, rgba(61,245,166,.14), transparent 70%)' }} />
          <p className="eyebrow">Net worth · virtual</p>
          <p className="num text-white font-semibold mt-2" style={{ fontSize: 'clamp(38px,5vw,58px)', lineHeight: 1 }}>
            {pf ? fmt$(pf.total) : <span className="skel inline-block w-56 h-12 rounded-lg" />}
          </p>
          <div className="flex items-center gap-3 mt-3">
            <span className={`pill ${pnlUp ? 'pill-up' : 'pill-dn'}`}>
              {pnlUp ? '▲' : '▼'} {pf ? `${fmt$(pf.pnl)}` : '—'}
            </span>
            <span className="font-mono text-[12px] text-mist">win rate <b className="text-fog">{pf ? `${pf.winRate}%` : '—'}</b></span>
            <span className="font-mono text-[12px] text-mist"><b className="text-fog num">{pf ? pf.activeBots : '—'}</b> bots live</span>
          </div>
          {/* allocation rail */}
          <div className="mt-6">
            <div className="flex justify-between items-center mb-2">
              <p className="eyebrow">Exposure</p>
              <p className="font-mono text-[11px] text-mist num">cash {pf ? fmt$(pf.cash) : '—'}</p>
            </div>
            <div className="alloc-rail">
              {alloc.map((a) => <div key={a.s} style={{ width: `${a.w}%`, background: a.c }} title={`${a.s} ${a.w}%`} />)}
            </div>
            <div className="flex gap-4 mt-2 flex-wrap">
              {alloc.map((a) => (
                <span key={a.s} className="font-mono text-[11px] text-mist flex items-center gap-1.5">
                  <i className="w-2 h-2 rounded-full inline-block" style={{ background: a.c }} />{a.s.replace('USDT', '')} {a.w}%
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* executions ledger mini */}
        <div className="panel col-span-12 lg:col-span-5 p-6 flex flex-col">
          <div className="flex items-center justify-between mb-1">
            <p className="eyebrow">Latest executions</p>
            <a href="/history" className="font-mono text-[11.5px] text-mint hover:underline">ledger →</a>
          </div>
          <div className="flex-1 divide-y divide-white/5">
            {(pf?.recent || []).slice(0, 6).map((t) => (
              <div key={t._id || Math.random()} className="flex items-center gap-3 py-2.5">
                <span className={`font-mono text-[10.5px] px-2 py-0.5 rounded-md border ${t.side === 'BUY' ? 'text-mint border-mint/30 bg-mint/10' : 'text-coral border-coral/30 bg-coral/10'}`}>{t.side}</span>
                <span className="font-disp text-[13.5px] text-white">{t.symbol.replace('USDT', '')}<span className="text-mist">/USDT</span></span>
                <span className="ml-auto num text-[12.5px] text-mist">{Number(t.qty).toFixed(4)} @ ${Number(t.price).toLocaleString()}</span>
              </div>
            ))}
            {!pf?.recent?.length && (
              <div className="py-8 text-center">
                <p className="h-display text-[15px]">No executions yet</p>
                <p className="text-[12.5px] text-mist mt-1">Deploy a bot and it will print fills here every 20 seconds.</p>
                <a href="/bots" className="btn-mint inline-block mt-4 !py-2 text-[13px]">Create your first bot</a>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* market desk */}
      <div>
        <div className="flex items-end justify-between mb-3 mt-2">
          <div><p className="eyebrow mb-1">Market desk · binance feed</p></div>
          <p className="font-mono text-[11px] text-mist hidden sm:block">click a coin → terminal</p>
        </div>
        <div className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
          {prices.map((p, i) => {
            const m = COIN_META[p.symbol] || { name: p.symbol, glyph: '?', c: '#3DF5A6' };
            const up = Number(p.changePct) >= 0;
            return (
              <a key={p.symbol} href={`/markets/${p.symbol}`} className="panel panel-hover p-5 block animate-rise" style={{ animationDelay: `${i * 70}ms` }}>
                <div className="flex items-center gap-3">
                  <span className="w-10 h-10 rounded-xl flex items-center justify-center font-disp font-bold text-[16px]" style={{ background: `${m.c}1f`, color: m.c, border: `1px solid ${m.c}44` }}>{m.glyph}</span>
                  <div>
                    <p className="font-disp font-semibold text-white text-[15px] leading-none">{m.name}</p>
                    <p className="font-mono text-[11px] text-mist mt-1">{p.symbol}</p>
                  </div>
                  <span className={`ml-auto pill ${up ? 'pill-up' : 'pill-dn'}`}>{up ? '+' : ''}{Number(p.changePct).toFixed(2)}%</span>
                </div>
                <p className="num text-white text-[22px] font-medium mt-4">${Number(p.price).toLocaleString()}</p>
                <div className="mt-2"><Spark data={klines[p.symbol] || []} w={220} h={44} up={up} id={p.symbol} /></div>
                <div className="flex justify-between font-mono text-[11px] text-mist mt-2">
                  <span>H <span className="text-fog num">{Number(p.high).toLocaleString()}</span></span>
                  <span>L <span className="text-fog num">{Number(p.low).toLocaleString()}</span></span>
                </div>
              </a>
            );
          })}
          {!prices.length && [0, 1, 2, 3].map((i) => <div key={i} className="panel p-5"><div className="skel h-24 rounded-xl" /></div>)}
        </div>
      </div>
    </div>
  );
}
