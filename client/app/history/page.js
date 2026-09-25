'use client';
import { useEffect, useMemo, useState } from 'react';
import api from '../../lib/api';
import { SectionHead, Empty } from '../../components/ui';

const FILTERS = ['All', 'BUY', 'SELL'];

export default function History() {
  const [trades, setTrades] = useState([]);
  const [f, setF] = useState('All');
  const [q, setQ] = useState('');
  const [gated, setGated] = useState(false);
  useEffect(() => { api.get('/trades').then((r) => setTrades(r.data)).catch(() => setGated(true)); }, []);

  const rows = useMemo(() => trades.filter((t) =>
    (f === 'All' || t.side === f) && (!q || t.symbol.toLowerCase().includes(q.toLowerCase()))), [trades, f, q]);

  const stats = useMemo(() => {
    const sells = trades.filter((t) => t.side === 'SELL');
    const pnl = sells.reduce((s, t) => s + (Number(t.pnl) || 0), 0);
    return { n: trades.length, pnl };
  }, [trades]);

  function csv() {
    const rows = [['time', 'symbol', 'side', 'qty', 'price', 'pnl'], ...trades.map((t) => [t.createdAt, t.symbol, t.side, t.qty, t.price, t.pnl || 0])];
    const blob = new Blob([rows.map((r) => r.join(',')).join('\n')], { type: 'text/csv' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob); a.download = 'tradepilot-ledger.csv'; a.click();
  }

  return (
    <div className="space-y-5 animate-rise">
      <SectionHead kick="Ledger — every fill, auditable" title="Execution history."
        sub={`${stats.n} prints · lifetime realized ${stats.pnl >= 0 ? '+' : ''}$${Number(stats.pnl).toFixed(2)}`}
        right={<button className="btn-line" onClick={csv}>Export CSV ↓</button>} />

      <div className="panel p-4 flex flex-wrap items-center gap-2">
        <div className="flex gap-1.5 p-1 rounded-xl border border-line">
          {FILTERS.map((x) => (
            <button key={x} onClick={() => setF(x)} className={`font-mono text-[12px] px-3.5 py-1.5 rounded-lg transition ${f === x ? 'bg-white text-ink font-semibold' : 'text-mist hover:text-white'}`}>{x}</button>
          ))}
        </div>
        <input className="field !w-52 ml-auto" placeholder="Filter symbol… e.g. SOL" value={q} onChange={(e) => setQ(e.target.value)} />
      </div>

      {gated ? (
        <Empty title="Ledger is private" hint="Sign in to see your fills. Paper ledger, real audit trail."
          action={<a href="/login" className="btn-mint inline-block !py-2 text-[13px]">Sign in →</a>} />
      ) : rows.length ? (
        <div className="panel overflow-hidden">
          <div className="overflow-x-auto">
            <table className="ledger w-full text-[13px] min-w-[720px]">
              <thead><tr className="text-left">
                <th className="p-4">Timestamp</th><th className="p-4">Market</th><th className="p-4">Side</th>
                <th className="p-4 text-right">Qty</th><th className="p-4 text-right">Print</th><th className="p-4 text-right">Realized</th><th className="p-4 text-right">Note</th>
              </tr></thead>
              <tbody>
                {rows.map((t) => (
                  <tr key={t._id || Math.random()}>
                    <td className="p-4 font-mono text-[12px] text-mist whitespace-nowrap">{new Date(t.createdAt).toLocaleString()}</td>
                    <td className="p-4 font-disp text-white">{t.symbol.replace('USDT', '')}<span className="text-mist">/USDT</span></td>
                    <td className="p-4"><span className={`font-mono text-[10.5px] px-2 py-0.5 rounded-md border ${t.side === 'BUY' ? 'text-mint border-mint/30 bg-mint/10' : 'text-coral border-coral/30 bg-coral/10'}`}>{t.side}</span></td>
                    <td className="p-4 text-right num text-mist">{Number(t.qty).toFixed(5)}</td>
                    <td className="p-4 text-right num text-white">${Number(t.price).toLocaleString()}</td>
                    <td className={`p-4 text-right num ${t.pnl ? (t.pnl >= 0 ? 'sent' : 'sneg') : 'text-mist'}`}>{t.pnl ? `${t.pnl >= 0 ? '+' : ''}$${Number(t.pnl).toFixed(2)}` : '—'}</td>
                    <td className="p-4 text-right font-mono text-[11px] text-mist">{t.reason || 'signal'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <Empty title="No prints match" hint="Loosen the filter — or deploy a bot and come back in a minute." />
      )}
    </div>
  );
}
