'use client';
import { useState } from 'react';
import api from '../../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Backtest() {
  const [form, setForm] = useState({ symbol: 'BTCUSDT', strategy: 'SMA_CROSS', timeframe: '1h', capital: 10000 });
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);

  async function run(e) {
    e.preventDefault();
    setLoading(true);
    try { const { data } = await api.post('/backtest', form); setRes(data); }
    catch {} finally { setLoading(false); }
  }

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Backtest — test before you risk</h2>
      <form onSubmit={run} className="card grid md:grid-cols-5 gap-3">
        <select className="input" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>
          {['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'].map((s) => <option key={s}>{s}</option>)}
        </select>
        <select className="input" value={form.strategy} onChange={(e) => setForm({ ...form, strategy: e.target.value })}>
          <option value="SMA_CROSS">SMA Crossover</option>
          <option value="RSI_MEAN">RSI Mean-Reversion</option>
          <option value="MACD_TREND">MACD Trend</option>
        </select>
        <select className="input" value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}>
          {['15m', '1h', '4h', '1d'].map((t) => <option key={t}>{t}</option>)}
        </select>
        <input className="input" type="number" value={form.capital} onChange={(e) => setForm({ ...form, capital: +e.target.value })} />
        <button className="btn" disabled={loading}>{loading ? 'Running…' : 'Run'}</button>
      </form>
      {res && (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {[['Final', `$${res.final}`], ['Returns', `${res.returnsPct}%`], ['Max DD', `${res.maxDrawdownPct}%`], ['Win rate', `${res.winRatePct}%`]].map(([k, v]) => (
              <div key={k} className="card"><p className="text-xs text-slate-400">{k}</p><p className="text-xl font-bold">{v}</p></div>
            ))}
          </div>
          <div className="card h-72">
            <ResponsiveContainer><LineChart data={res.equity}><XAxis dataKey="time" hide /><YAxis domain={['auto', 'auto']} /><Tooltip /><Line type="monotone" dataKey="value" dot={false} stroke="#10b981" /></LineChart></ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  );
}
