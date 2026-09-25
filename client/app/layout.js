import './globals.css';
import AppShell from './shell';

export const metadata = {
  title: 'TradePilot — Paper Trading Terminal',
  description: 'Rule-based crypto paper trading: live bots, backtests, portfolio analytics.'
};

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600&family=JetBrains+Mono:wght@400;500;600&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="grain">
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
