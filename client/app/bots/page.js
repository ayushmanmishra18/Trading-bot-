'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

const STRATS = [
  { id: 'SMA_CROSS', name: 'SMA Crossover (9/21)', desc: 'Buy when fast MA crosses above slow MA. Best for trends.' },
  { id: 'RSI_MEAN', name: 'RSI Mean-Reversion', desc: 'Buy oversold (<30), sell overbought (>70). Best sideways.' },
  { id: 'MACD_TREND', name: 'MACD Trend', desc: 'Buy on MACD bullish cross. Balanced.' }
];

export default function Bots() {
  const [bots, setBots] = useState([]);
  const [form, setForm] = useState({ name: 'BTC SMA Bot', symbol: 'BTCUSDT', strategy: 'SMA_CROSS', capital: 5000 });
  const load = () => api.get('/bots').then((r) => setBots(r.data)).catch(() => {});
  useEffect(() => { load(); }, []);

  async function create(e) {
    e.preventDefault();
    await api.post('/bots', form);
    setForm({ ...form, name: '' });
    load();
  }
  async function act(id, a) { await api.patch(`/bots/${id}/${a}`); load(); }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Bots</h2>
      <form onSubmit={create} className="card grid md:grid-cols-5 gap-3">
        <input className="input" placeholder="Bot name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
        <select className="input" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>
          {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}>
          {STRATS.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>
        <input className="input" type="number" min="100" value={form.capital} onChange={(e) => setForm({ ...form, capital: +e.target.value })} />
        <button className="btn">Create</button>
      </form>
      <div className="grid md:grid-cols-2 gap-4">
        {bots.map((b) => (
          <div key={b._id} className="card">
            <div className="flex justify-between"><b>{b.name}</b><span className={b.status === 'active' ? 'pos' : 'text-slate-400'}>{b.status}</span></div>
            <p className="text-sm text-slate-400 mt-1">{b.symbol} • {b.strategy} • ${b.capital}</p>
            <div className="flex gap-2 mt-3">
              {b.status === 'active' ? <button className="btn-ghost" onClick={() => act(b._id, 'stop')}>Stop</button>
                : <button className="btn" onClick={() => act(b._id, 'start')}>Start</button>}
              <button className="btn-ghost" onClick={() => api.delete(`/bots/${b._id}`).then(load)}>Delete</button>
            </div>
          </div>
        ))}
      </div>
      {!bots.length && <p className="text-slate-400 text-sm">No bots yet — login first, then create one above. Engine checks signals every 20s.</p>}
    </div>
  );
}
