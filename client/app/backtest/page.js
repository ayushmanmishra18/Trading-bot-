'use client';
import { useState } from 'react';
import api from '../../lib/api';
import { SectionHead, Verdict, fmt$ } from '../../components/ui';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, ReferenceDot } from 'recharts';

export default function Backtest() {
  const [form, setForm] = useState({ symbol: 'BTCUSDT', strategy: 'SMA_CROSS', timeframe: '1h', capital: 10000 });
  const [res, setRes] = useState(null);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState('');

  async function run(e) {
    e.preventDefault(); setLoading(true); setErr('');
    try { const { data } = await api.post('/backtest', form); setRes(data); }
    catch { setErr('Sign in to run the lab — backtests are authenticated.'); }
    finally { setLoading(false); }
  }

  const worst = res?.equity?.reduce((a, b) => (b.value < a.value ? b : a), res.equity[0]);

  return (
    <div className="space-y-5 animate-rise">
      <SectionHead kick="Strategy lab — replay history" title="Prove it before you deploy it."
        sub="Same signal functions as live trading. 500 candles, fees included." />

      <div className="grid grid-cols-12 gap-4">
        {/* param rail */}
        <form onSubmit={run} className="panel col-span-12 lg:col-span-4 p-6 space-y-4 h-fit">
          <p className="eyebrow">Experiment setup</p>
          {[
            ['Market', <select key="s" className="field" value={form.symbol} onChange={(e) => setForm({ ...form, symbol: e.target.value })}>{['BTCUSDT', 'ETHUSDT', 'SOLUSDT', 'BNBUSDT'].map((s) => <option key={s}>{s}</option>)}</select>],
            ['Regime', <select key="t" className="field" value={form.timeframe} onChange={(e) => setForm({ ...form, timeframe: e.target.value })}>{['15m', '1h', '4h', '1d'].map((t) => <option key={t}>{t}</option>)}</select>],
            ['Stake $', <input key="c" className="field num" type="number" min="100" value={form.capital} onChange={(e) => setForm({ ...form, capital: +e.target.value })} />]
          ].map(([k, el]) => <div key={k}><label className="lbl">{k}</label>{el}</div>)}
          <div>
            <label className="lbl">Strategy</label>
            <div className="space-y-2">
              {[['SMA_CROSS', 'SMA Crossover', 'trend rider'], ['RSI_MEAN', 'RSI Reversion', 'fade extremes'], ['MACD_TREND', 'MACD Momentum', 'balanced']].map(([id, n, d]) => (
                <button type="button" key={id} onClick={() => setForm({ ...form, strategy: id })}
                  className={`w-full text-left px-4 py-3 rounded-xl border transition ${form.strategy === id ? 'border-mint/60 bg-mint/[.07]' : 'border-line hover:border-white/20'}`}>
                  <span className="font-disp text-[14px] text-white">{n}</span>
                  <span className="font-mono text-[11px] text-mist ml-2">{d}</span>
                </button>
              ))}
            </div>
          </div>
          <button className="btn-mint w-full" disabled={loading}>{loading ? 'Replaying 500 candles…' : 'Run replay →'}</button>
          {err && <p className="font-mono text-[12px] text-coral">{err}</p>}
        </form>

        {/* report */}
        <div className="col-span-12 lg:col-span-8 space-y-4">
          {!res && !loading && (
            <div className="panel p-10 text-center">
              <p className="h-display text-[17px]">The bench is empty</p>
              <p className="text-[13px] text-mist mt-1.5 max-w-md mx-auto">Configure the experiment on the left and run it. You will get a verdict, an equity trace with its worst moment marked, and the last fills.</p>
            </div>
          )}
          {loading && <div className="panel p-6"><div className="skel h-56 rounded-xl" /></div>}
          {res && (
            <>
              <Verdict ret={res.returnsPct} />
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {[['Terminal value', fmt$(res.final)], ['Trades', res.totalTrades], ['Max drawdown', `${res.maxDrawdownPct}%`], ['Win rate', `${res.winRatePct}%`]].map(([k, v]) => (
                  <div key={k} className="panel px-4 py-3.5">
                    <p className="eyebrow">{k}</p>
                    <p className="num text-white text-[19px] mt-1">{v}</p>
                  </div>
                ))}
              </div>
              <div className="panel p-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="eyebrow">Equity trace · {res.symbol} {res.timeframe}</p>
                  <p className="font-mono text-[11px] text-mist">▼ worst print marked</p>
                </div>
                <div className="h-64">
                  <ResponsiveContainer>
                    <LineChart data={res.equity}>
                      <XAxis dataKey="time" hide /><YAxis domain={['auto', 'auto']} tick={{ fill: '#8B93A7', fontSize: 11 }} axisLine={false} tickLine={false} width={64} />
                      <Tooltip contentStyle={{ background: '#0C1017', border: '1px solid rgba(255,255,255,.1)', borderRadius: 12, fontSize: 12 }} labelStyle={{ display: 'none' }} />
                      <Line type="monotone" dataKey="value" dot={false} strokeWidth={2.2} stroke={Number(res.returnsPct) >= 0 ? '#3DF5A6' : '#FF5C5C'} />
                      {worst && <ReferenceDot x={worst.time} y={worst.value} r={5} fill="#FFB224" stroke="#06080C" />}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </div>
              <div className="panel p-5">
                <p className="eyebrow mb-2">Last fills in replay</p>
                {(res.trades || []).slice(-8).reverse().map((t, i) => (
                  <div key={i} className="flex items-center gap-3 py-2 border-t border-line first:border-0 text-[13px]">
                    <span className={`font-mono text-[10.5px] px-2 py-0.5 rounded-md border ${t.side === 'BUY' ? 'text-mint border-mint/30 bg-mint/10' : 'text-coral border-coral/30 bg-coral/10'}`}>{t.side}</span>
                    <span className="num text-mist">{Number(t.qty).toFixed(4)} @ ${Number(t.price).toLocaleString()}</span>
                    {t.pnl !== undefined && <span className={`ml-auto num ${t.pnl >= 0 ? 'sent' : 'sneg'}`}>{t.pnl >= 0 ? '+' : ''}${Number(t.pnl).toFixed(2)}</span>}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
