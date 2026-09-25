'use client';
import { useEffect, useState } from 'react';
import api from '../../lib/api';

export default function History() {
  const [trades, setTrades] = useState([]);
  useEffect(() => { api.get('/trades').then((r) => setTrades(r.data)).catch(() => {}); }, []);

  function csv() {
    const rows = [['time', 'symbol', 'side', 'qty', 'price', 'pnl'], ...trades.map((t) => [t.createdAt, t.symbol, t.side, t.qty, t.price, t.pnl || 0])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'trades.csv'; a.click();
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center"><h2 className="text-2xl font-bold">History</h2><button className="btn-ghost" onClick={csv}>Export CSV</button></div>
      <div className="card overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-slate-400"><tr><th className="text-left p-2">Time</th><th className="text-left p-2">Symbol</th><th className="text-left p-2">Side</th><th className="text-right p-2">Qty</th><th className="text-right p-2">Price</th><th className="text-right p-2">PnL</th></tr></thead>
          <tbody>{trades.map((t) => (
            <tr key={t._id || Math.random()} className="border-t border-slate-800">
              <td className="p-2">{new Date(t.createdAt).toLocaleString()}</td><td className="p-2">{t.symbol}</td>
              <td className={`p-2 ${t.side === 'BUY' ? 'pos' : 'neg'}`}>{t.side}</td>
              <td className="p-2 text-right">{Number(t.qty).toFixed(5)}</td><td className="p-2 text-right">${Number(t.price).toLocaleString()}</td>
              <td className="p-2 text-right">{t.pnl ? `$${Number(t.pnl).toFixed(2)}` : '—'}</td>
            </tr>))}</tbody>
        </table>
        {!trades.length && <p className="text-sm text-slate-400 p-2">No trades yet.</p>}
      </div>
    </div>
  );
}
