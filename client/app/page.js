'use client';
import { useEffect, useState } from 'react';
import api from '../lib/api';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [prices, setPrices] = useState([]);
  const [err, setErr] = useState('');

  useEffect(() => {
    api.get('/portfolio').then((r) => setData(r.data)).catch(() => setErr('Login to see live portfolio — API needs JWT. Markets still work without login.'));
    api.get('/market/prices').then((r) => setPrices(r.data)).catch(() => {});
  }, []);

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">Dashboard</h2>
      {err && <div className="card text-amber-300 text-sm">{err}</div>}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          ['Total value', data ? `$${data.total}` : '—'],
          ['P&L', data ? `$${data.pnl}` : '—'],
          ['Win rate', data ? `${data.winRate}%` : '—'],
          ['Active bots', data ? data.activeBots : '—']
        ].map(([k, v]) => (
          <div key={k} className="card"><p className="text-xs text-slate-400">{k}</p><p className="text-xl font-bold mt-1">{v}</p></div>
        ))}
      </div>

      <div className="card">
        <h3 className="font-semibold mb-3">Live market (Binance)</h3>
        <div className="grid md:grid-cols-4 gap-3">
          {prices.map((p) => (
            <a key={p.symbol} href={`/markets/${p.symbol}`} className="bg-slate-800 rounded-xl p-3 hover:bg-slate-700">
              <p className="font-bold">{p.symbol}</p>
              <p>${p.price?.toLocaleString()}</p>
              <p className={p.changePct >= 0 ? 'pos' : 'neg'}>{p.changePct}%</p>
            </a>
          ))}
        </div>
      </div>

      <div className="card">
        <h3 className="font-semibold mb-2">Recent trades</h3>
        {!data?.recent?.length && <p className="text-sm text-slate-400">No trades yet — create a bot and press Start.</p>}
        {data?.recent?.map((t) => (
          <div key={t._id || Math.random()} className="flex justify-between text-sm py-1 border-b border-slate-800">
            <span>{t.symbol} <b className={t.side === 'BUY' ? 'pos' : 'neg'}>{t.side}</b></span>
            <span>{t.qty?.toFixed(5)} @ ${t.price?.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
