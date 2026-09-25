import './globals.css';

export const metadata = { title: 'TradePilot — Paper Trading Bot', description: 'College project: crypto paper trading' };

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <body>
        <div className="min-h-screen flex">
          <aside className="w-56 shrink-0 border-r border-slate-800 p-4 hidden md:block">
            <h1 className="text-xl font-bold mb-6">📈 TradePilot</h1>
            <nav className="flex flex-col gap-1">
              <a className="navlink" href="/">Dashboard</a>
              <a className="navlink" href="/markets/BTCUSDT">Markets</a>
              <a className="navlink" href="/bots">Bots</a>
              <a className="navlink" href="/backtest">Backtest</a>
              <a className="navlink" href="/history">History</a>
              <a className="navlink" href="/login">Login</a>
            </nav>
            <p className="text-xs text-slate-500 mt-8">Paper trading • No real money<br/>Free data: Binance</p>
          </aside>
          <main className="flex-1 p-4 md:p-8 max-w-6xl w-full">{children}</main>
        </div>
      </body>
    </html>
  );
}
