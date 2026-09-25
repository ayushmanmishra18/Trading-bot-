'use client';
import { useEffect, useRef } from 'react';
import api from '../../../lib/api';

export default function MarketPage({ params }) {
  const { symbol } = params;
  const ref = useRef(null);

  useEffect(() => {
    let chart, series;
    (async () => {
      const { createChart } = await import('lightweight-charts');
      const { data } = await api.get(`/market/klines/${symbol}?interval=1h&limit=200`);
      chart = createChart(ref.current, { layout: { background: { color: 'transparent' }, textColor: '#cbd5e1' }, width: ref.current.clientWidth, height: 380 });
      series = chart.addCandlestickSeries({ upColor: '#16a34a', downColor: '#dc2626' });
      series.setData(data.map((k) => ({ time: k.openTime / 1000, open: k.open, high: k.high, low: k.low, close: k.close })));
    })();
    return () => chart?.remove();
  }, [symbol]);

  return (
    <div className="space-y-4">
      <h2 className="text-2xl font-bold">{symbol} — live candles (Binance)</h2>
      <div className="card"><div ref={ref} /></div>
      <p className="text-sm text-slate-400">Tip: create a bot on this symbol from the Bots page, then watch paper trades appear in History.</p>
    </div>
  );
}
