'use client';
import { useEffect, useRef, useState } from 'react';
import api from '../../../lib/api';
import { SectionHead, fmt$ } from '../../../components/ui';

const COIN = { BTCUSDT: 'Bitcoin', ETHUSDT: 'Ethereum', SOLUSDT: 'Solana', BNBUSDT: 'BNB' };
const TFS = ['15m', '1h', '4h', '1d'];

export default function MarketPage({ params }) {
  const { symbol } = params;
  const ref = useRef(null);
  const [tf, setTf] = useState('1h');
  const [q, setQ] = useState(null);
  const [stat, setStat] = useState(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let chart;
    setFailed(false);
    (async () => {
      try {
        const { createChart } = await import('lightweight-charts');
        const [{ data: kl }, { data: quote }] = await Promise.all([
          api.get(`/market/klines/${symbol}?interval=${tf}&limit=200`),
          api.get(`/market/prices`)
        ]);
        if (!kl?.length) { setFailed(true); return; }
        setQ((quote.find((x) => x.symbol === symbol)) || null);
        const closes = kl.map((k) => k.close);
        setStat({
          chg: ((closes[closes.length - 1] - closes[0]) / closes[0]) * 100,
          hi: Math.max(...kl.map((k) => k.high)), lo: Math.min(...kl.map((k) => k.low))
        });
        if (!ref.current) return;
        ref.current.innerHTML = '';
        chart = createChart(ref.current, {
          layout: { background: { color: 'transparent' }, textColor: '#8B93A7', fontFamily: 'JetBrains Mono' },
          grid: { vertLines: { color: 'rgba(255,255,255,.05)' }, horzLines: { color: 'rgba(255,255,255,.05)' } },
          width: ref.current.clientWidth, height: 420,
          rightPriceScale: { borderColor: 'rgba(255,255,255,.12)' },
          timeScale: { borderColor: 'rgba(255,255,255,.12)' }
        });
        const s = chart.addCandlestickSeries({ upColor: '#3DF5A6', downColor: '#FF5C5C', wickUpColor: '#3DF5A6', wickDownColor: '#FF5C5C', borderVisible: false });
        s.setData(kl.map((k) => ({ time: Math.floor(k.openTime / 1000), open: k.open, high: k.high, low: k.low, close: k.close })));
      } catch { setFailed(true); }
    })();
    return () => { try { chart?.remove(); } catch {} };
  }, [symbol, tf]);

  const up = Number(q?.changePct ?? stat?.chg ?? 0) >= 0;

  return (
    <div className="space-y-4 animate-rise">
      <SectionHead kick="Terminal" title={`${COIN[symbol] || symbol} / USDT`}
        sub="Live Binance candles. Deploy a bot on this market in one click."
        right={
          <div className="flex gap-1.5 p-1 panel !rounded-xl">
            {TFS.map((t) => (
              <button key={t} onClick={() => setTf(t)}
                className={`font-mono text-[12px] px-3 py-1.5 rounded-lg transition ${tf === t ? 'bg-mint text-ink font-semibold' : 'text-mist hover:text-white'}`}>{t}</button>
            ))}
          </div>
        } />

      <div className="grid grid-cols-12 gap-4">
        <div className="panel col-span-12 xl:col-span-8 p-5">
          <div className="flex items-center gap-4 mb-3 flex-wrap">
            <p className="num text-white text-[30px] font-medium">{q ? fmt$(q.price) : '—'}</p>
            <span className={`pill ${up ? 'pill-up' : 'pill-dn'}`}>{up ? '▲' : '▼'} {q ? `${Number(q.changePct).toFixed(2)}%` : stat ? `${stat.chg.toFixed(2)}% window` : '—'} · 24h</span>
            <span className="ml-auto pill pill-idle"><span className="dot-live" />binance spot</span>
          </div>
          <div ref={ref} className="w-full" />
          {failed && (
            <div className="rounded-xl border border-coral/25 bg-coral/10 px-4 py-3 mt-3 font-mono text-[12px] text-coral">
              Feed unreachable for {symbol} — check the symbol or retry in a few seconds.
            </div>
          )}
          <div className="grid grid-cols-3 gap-3 mt-4">
            {[['Window high', stat?.hi], ['Window low', stat?.lo], ['24h volume', q?.volume]].map(([k, v]) => (
              <div key={k} className="rounded-xl border border-line bg-ink/50 px-4 py-3">
                <p className="eyebrow">{k}</p>
                <p className="num text-white text-[15px] mt-1">{v ? Number(v).toLocaleString() : '—'}</p>
              </div>
            ))}
          </div>
        </div>

        {/* launch ticket */}
        <div className="col-span-12 xl:col-span-4 space-y-4">
          <div className="panel p-5">
            <p className="eyebrow mb-3">Launch bot on {symbol.replace('USDT', '')}</p>
            <QuickLaunch symbol={symbol} />
          </div>
          <div className="panel p-5">
            <p className="eyebrow mb-2">How fills work</p>
            <ol className="text-[13px] text-mist space-y-2 leading-relaxed list-none">
              <li><b className="text-fog font-disp">01 —</b> Engine reads the 9/21, RSI or MACD signal every 20 seconds.</li>
              <li><b className="text-fog font-disp">02 —</b> BUY commits the ticket capital at the live print, minus 0.1%.</li>
              <li><b className="text-fog font-disp">03 —</b> Stop and target rails exit automatically and park the bot.</li>
            </ol>
            <a href="/backtest" className="btn-line w-full block text-center mt-4">Prove it in the Lab →</a>
          </div>
        </div>
      </div>
    </div>
  );
}

function QuickLaunch({ symbol }) {
  const [f, setF] = useState({ strategy: 'SMA_CROSS', capital: 5000 });
  const [done, setDone] = useState('');
  async function go(e) {
    e.preventDefault(); setDone('');
    try {
      const { data } = await api.post('/bots', { name: `${symbol.replace('USDT', '')} Quick`, symbol, strategy: f.strategy, capital: f.capital });
      await api.patch(`/bots/${data._id}/start`);
      setDone('Live — watch fills in Ledger.');
    } catch { setDone('Sign in first, then launch.'); }
  }
  return (
    <form onSubmit={go} className="space-y-3">
      <div><label className="lbl">Strategy</label>
        <select className="field" value={f.strategy} onChange={(e) => setF({ ...f, strategy: e.target.value })}>
          <option value="SMA_CROSS">SMA Crossover — trend</option>
          <option value="RSI_MEAN">RSI Reversion — range</option>
          <option value="MACD_TREND">MACD Momentum — balanced</option>
        </select></div>
      <div><label className="lbl">Capital $</label>
        <input className="field num" type="number" min="100" value={f.capital} onChange={(e) => setF({ ...f, capital: +e.target.value })} /></div>
      <button className="btn-mint w-full">Launch & start →</button>
      {done && <p className="font-mono text-[12px] text-mint">{done}</p>}
    </form>
  );
}
