'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';
import { SectionHead, Sigil, Empty, fmt$ } from '../../components/ui';

const STRATS = [
  { id: 'SMA_CROSS', name: 'SMA Crossover', code: '9 / 21', desc: 'Rides sustained trends. Fast average crossing above slow = momentum confirmed.', best: 'Trending markets' },
  { id: 'RSI_MEAN', name: 'RSI Reversion', code: '14 · 30/70', desc: 'Fades extremes. Buys panic, sells euphoria. Patient by design.', best: 'Ranging markets' },
  { id: 'MACD_TREND', name: 'MACD Momentum', code: '12·26·9', desc: 'The balanced operator. Catches mid-trend entries with fewer whipsaws.', best: 'Mixed regimes' }
];

export default function Bots() {
  const [bots, setBots] = useState([]);
  const [gated, setGated] = useState(false);
  const [form, setForm] = useState({ name: '', symbol: 'BTCUSDT', strategy: 'SMA_CROSS', capital: 5000, stopLossPct: 2, takeProfitPct: 4 });
  const load = () => api.get('/bots').then((r) => { setBots(r.data); setGated(false); }).catch(() => setGated(true));
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    await api.post('/bots', { ...form, name: form.name || `${form.symbol.replace('USDT', '')} ${STRATS.find((s) => s.id === form.strategy).name}` });
    setForm({ ...form, name: '' });
    load();
  }
  async function act(id, a) { await api.patch(`/bots/${id}/${a}`); load(); }
  async function del(id) { if (confirm('Retire this bot? Open positions stop being managed.')) { await api.delete(`/bots/${id}`); load(); } }

  const picked = STRATS.find((s) => s.id === form.strategy);

  return (
    <div className="space-y-6 animate-rise">
      <SectionHead kick="Bot floor — deploy & command" title="Your trading desk." sub="Each bot owns one position, pays 0.1% per side, and obeys its stop rails." />

      {gated && (
        <div className="panel p-4 text-[13.5px] text-mist">Bot control is private — <a href="/login" className="text-mint underline underline-offset-4">sign in</a> to deploy.</div>
      )}

      {/* strategy picker */}
      <div className="grid md:grid-cols-3 gap-4">
        {STRATS.map((s) => {
          const on = form.strategy === s.id;
          return (
            <button key={s.id} onClick={() => setForm({ ...form, strategy: s.id })}
              className={`panel p-5 text-left transition ${on ? '!border-mint/50 shadow-[0_18px_50px_-22px_rgba(61,245,166,.35)]' : 'panel-hover'}`}>
              <Sigil strategy={s.id} />
              <p className="h-display text-[16px] mt-3">{s.name} <span className="font-mono text-[11px] text-mist font-normal">· {s.code}</span></p>
              <p className="text-[12.5px] text-mist mt-1.5 leading-relaxed">{s.desc}</p>
              <p className="font-mono text-[10.5px] uppercase tracking-[0.16em] text-mint/80 mt-3">◆ {s.best}</p>
            </button>
          );
        })}
      </div>

      {/* deploy ticket */}
      <form onSubmit={create} className="panel p-5 md:p-6">
        <div className="flex items-center gap-3 mb-4">
          <p className="eyebrow">Deploy ticket — {picked.name}</p>
          <span className="ml-auto pill pill-idle">paper · no real funds</span>
        </div>
        <div className="grid md:grid-cols-6 gap-3">
          <div className="md:col-span-2"><label className="lbl">Desk name</label>
            <input className="field" placeholder="e.g. Night Owl BTC" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div><label className="lbl">Market</label>
            <select className="field" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>
              {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'].map((s) => <option key={s}>{s}</option>)}
            </select></div>
          <div><label className="lbl">Capital $</label>
            <input className="field num" type="number" min="100" value={form.capital} onChange={(e) => setForm({ ...form, capital: +e.target.value })} /></div>
          <div><label className="lbl">Stop %</label>
            <input className="field num" type="number" step="0.5" value={form.stopLossPct} onChange={(e) => setForm({ ...form, stopLossPct: +e.target.value })} /></div>
          <div><label className="lbl">Target %</label>
            <input className="field num" type="number" step="0.5" value={form.takeProfitPct} onChange={(e) => setForm({ ...form, takeProfitPct: +e.target.value })} /></div>
        </div>
        <div className="flex items-center gap-3 mt-4">
          <button className="btn-mint">Deploy {picked.name} →</button>
          <p className="font-mono text-[11px] text-mist">engine scans every 20s</p>
        </div>
      </form>

      {/* fleet */}
      {bots.length ? (
        <div className="grid md:grid-cols-2 gap-4">
          {bots.map((b) => {
            const live = b.status === 'active';
            const inPos = b.position && b.position.qty > 0;
            return (
              <div key={b._id} className="panel panel-hover p-5">
                <div className="flex items-start gap-3">
                  <Sigil strategy={b.strategy} />
                  <div className="min-w-0">
                    <p className="h-display text-[16px] truncate">{b.name}</p>
                    <p className="font-mono text-[11px] text-mist mt-0.5">{b.symbol} · {b.timeframe} · {fmt$(b.capital)}</p>
                  </div>
                  <span className={`ml-auto pill ${live ? 'pill-up' : 'pill-idle'}`}>{live && <span className="dot-live" />}{b.status}</span>
                </div>
                {/* stop rails visual */}
                <div className="mt-4 flex items-center gap-2 font-mono text-[10.5px] text-mist">
                  <span className="text-coral">-{b.stopLossPct}%</span>
                  <div className="flex-1 h-1.5 rounded-full bg-white/5 relative overflow-hidden">
                    <div className="absolute inset-y-0 left-0 w-[22%] bg-coral/50 rounded-full" />
                    <div className="absolute inset-y-0 right-0 w-[30%] bg-mint/50 rounded-full" />
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white border border-ink" title="entry" />
                  </div>
                  <span className="text-mint">+{b.takeProfitPct}%</span>
                </div>
                <div className="flex items-center gap-2 mt-4">
                  <span className={`font-mono text-[11px] px-2 py-1 rounded-md border ${inPos ? 'text-amber border-amber/30 bg-amber/10' : 'text-mist border-line'}`}>
                    {inPos ? `IN POSITION · ${Number(b.position.qty).toFixed(4)} @ $${Number(b.position.entryPrice).toLocaleString()}` : 'FLAT · awaiting signal'}
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <div className={`switch ${live ? 'ml-0' : ''}`} data-on={live} onClick={() => act(b._id, live ? 'stop' : 'start')} title={live ? 'Stop' : 'Start'}><span /></div>
                  <button className="font-disp text-[13px] text-mist hover:text-white" onClick={() => act(b._id, live ? 'stop' : 'start')}>{live ? 'Running — tap to stop' : 'Stopped — tap to run'}</button>
                  <button className="btn-danger ml-auto" onClick={() => del(b._id)}>Retire</button>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <Empty title="Fleet is empty" hint="Pick a strategy above, fund a ticket, and hit deploy. Your first fill lands within a minute when the signal fires."
          action={<a href="/backtest" className="btn-line inline-block">Or prove it in the Lab first →</a>} />
      )}
    </div>
  );
}
