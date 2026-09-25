'use client';
import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import api, { logout } from '../lib/api';
import { Mark, TickerTape } from '../components/ui';

const NAV = [
  { href: '/', label: 'Desk', icon: 'M4 20 L9 20 L12 8 L16 24 L19 14 L28 14' },
  { href: '/markets/BTCUSDT', label: 'Markets', icon: 'M4 24 L12 16 L18 20 L28 8' },
  { href: '/bots', label: 'Bots', icon: 'M6 6 h20 M6 16 h20 M6 26 h12' },
  { href: '/backtest', label: 'Lab', icon: 'M12 4 v10 l-6 8 h16 l-6 -8 z' },
  { href: '/history', label: 'Ledger', icon: 'M6 5 h20 v22 h-20 z M10 11 h12 M10 16 h12 M10 21 h7' }
];

export default function AppShell({ children }) {
  const path = usePathname();
  const router = useRouter();
  const [tape, setTape] = useState([]);
  const [authed, setAuthed] = useState(false);

  useEffect(() => {
    api.get('/market/prices').then((r) => setTape(r.data)).catch(() => {});
    const t = setInterval(() => api.get('/market/prices').then((r) => setTape(r.data)).catch(() => {}), 20000);
    setAuthed(!!localStorage.getItem('token'));
    return () => clearInterval(t);
  }, [path]);

  const isActive = (h) => (h === '/' ? path === '/' : path.startsWith(h.split('/').slice(0, 2).join('/')));

  return (
    <div className="min-h-screen flex">
      {/* icon rail */}
      <aside className="hidden md:flex w-[76px] shrink-0 flex-col items-center py-5 gap-2 border-r border-line bg-ink/60 backdrop-blur sticky top-0 h-screen">
        <a href="/" className="mb-5" aria-label="TradePilot home"><Mark size={34} /></a>
        {NAV.map((n) => (
          <a key={n.href} href={n.href} title={n.label} className={`rail-link ${isActive(n.href) ? 'active' : ''}`}>
            <svg width="21" height="21" viewBox="0 0 32 32" fill="none">
              <path d={n.icon} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </a>
        ))}
        <div className="mt-auto flex flex-col items-center gap-3">
          <span className="flex items-center gap-1.5 font-mono text-[10px] text-mist"><span className="dot-live" />LIVE</span>
          {authed ? (
            <button
              className="rail-link"
              title="Sign out"
              onClick={() => { logout(); setAuthed(false); router.push('/login'); }}
            >
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <path d="M13 6 h-7 v20 h7 M18 11 l7 5 -7 5 M24 16 h-12" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
          ) : (
            <a href="/login" className="rail-link" title="Sign in">
              <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="11" r="6" stroke="currentColor" strokeWidth="2.2" />
                <path d="M6 27 c2-6 6-8 10-8 s8 2 10 8" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" />
              </svg>
            </a>
          )}
        </div>
      </aside>

      <div className="flex-1 min-w-0">
        <TickerTape items={tape} />
        {/* top bar */}
        <header className="flex items-center gap-3 px-4 md:px-8 py-3.5 border-b border-line sticky top-0 bg-ink/80 backdrop-blur z-40">
          <a href="/" className="md:hidden"><Mark size={28} /></a>
          <div className="hidden sm:block">
            <p className="eyebrow">TradePilot terminal</p>
            <p className="font-mono text-[11px] text-mist">paper · binance feed · 20s engine</p>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <span className="pill pill-idle hidden sm:inline-flex"><span className="dot-live" />engine live</span>
            <a href="/bots" className="btn-mint !py-2">Deploy bot</a>
          </div>
        </header>

        <main className="px-4 md:px-8 py-6 md:py-8 max-w-[1360px] mx-auto pb-28 md:pb-12">{children}</main>
      </div>

      {/* mobile tab bar */}
      <nav className="md:hidden fixed bottom-0 inset-x-0 z-50 border-t border-line bg-ink/90 backdrop-blur flex justify-around py-2">
        {NAV.map((n) => (
          <a key={n.href} href={n.href} className={`flex flex-col items-center gap-1 px-3 py-1 ${isActive(n.href) ? 'text-mint' : 'text-mist'}`}>
            <svg width="20" height="20" viewBox="0 0 32 32" fill="none">
              <path d={n.icon} stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <span className="font-mono text-[9.5px] uppercase tracking-widest">{n.label}</span>
          </a>
        ))}
      </nav>
    </div>
  );
}
