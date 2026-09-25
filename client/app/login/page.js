'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';
import { Mark, Spark } from '../../components/ui';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'demo@tradepilot.app', password: 'demo1234' });
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);
  const router = useRouter();

  async function submit(e) {
    e.preventDefault(); setMsg(''); setBusy(true);
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(url, form);
      localStorage.setItem('token', data.token);
      router.push('/');
    } catch (e) { setMsg(e.response?.data?.error || e.response?.data?.errors?.[0]?.msg || 'That did not work — check the fields.'); }
    finally { setBusy(false); }
  }

  return (
    <div className="grid lg:grid-cols-2 gap-4 items-stretch animate-rise">
      {/* brand panel */}
      <div className="panel relative overflow-hidden p-8 md:p-10 hidden lg:flex flex-col justify-between min-h-[560px]">
        <div className="absolute -top-24 -left-24 w-96 h-96 rounded-full animate-drift" style={{ background: 'radial-gradient(circle, rgba(61,245,166,.13), transparent 70%)' }} />
        <div className="absolute -bottom-28 -right-20 w-[420px] h-[420px] rounded-full" style={{ background: 'radial-gradient(circle, rgba(139,124,255,.14), transparent 70%)' }} />
        <div className="flex items-center gap-3 relative"><Mark size={34} />
          <div><p className="font-disp font-bold text-white text-[17px] leading-none">TradePilot</p>
          <p className="font-mono text-[10.5px] text-mist mt-1 tracking-[0.2em]">PAPER TRADING TERMINAL</p></div>
        </div>
        <div className="relative">
          <p className="h-display leading-[1.05]" style={{ fontSize: 'clamp(30px,3.4vw,44px)' }}>Trade live markets<br />with <span className="text-mint">nothing at stake.</span></p>
          <p className="text-[14px] text-mist mt-4 max-w-md leading-relaxed">$100,000 in virtual capital. Real Binance prints. Rule-based bots you can audit line by line — then prove in the Lab before deploying a dollar of it.</p>
          <div className="mt-6 rounded-2xl border border-line bg-ink/60 p-5">
            <div className="flex justify-between items-center mb-2">
              <p className="eyebrow">BTC/USDT · sample replay</p>
              <span className="pill pill-up">+5.33%</span>
            </div>
            <Spark data={[42, 44, 43, 47, 45, 49, 48, 53, 51, 56, 55, 60, 58, 63, 66]} w={420} h={72} up id="brand" />
            <div className="flex gap-5 mt-3 font-mono text-[11px] text-mist">
              <span>STRATEGY <b className="text-fog">SMA 9/21</b></span>
              <span>FEES <b className="text-fog">0.1%</b></span>
              <span>DRAWDOWN <b className="text-fog">-3.1%</b></span>
            </div>
          </div>
        </div>
        <p className="font-mono text-[11px] text-mist relative">No broker keys · No real funds · Reviewer-ready in 10 minutes</p>
      </div>

      {/* form */}
      <div className="panel p-8 md:p-10 flex flex-col justify-center min-h-[560px]">
        <p className="eyebrow mb-2">{mode === 'login' ? 'Welcome back' : 'Claim your desk'}</p>
        <h2 className="h-display text-[26px]">{mode === 'login' ? 'Sign in to your terminal.' : 'Start with $100,000 virtual.'}</h2>
        <form onSubmit={submit} className="space-y-3.5 mt-6">
          {mode === 'register' && <div><label className="lbl">Desk name</label>
            <input className="field" placeholder="Ada Lovelace" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>}
          <div><label className="lbl">Email</label>
            <input className="field" placeholder="you@firm.com" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} /></div>
          <div><label className="lbl">Password · min 6</label>
            <input className="field" type="password" placeholder="••••••••" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} /></div>
          {msg && <p className="font-mono text-[12px] text-coral bg-coral/10 border border-coral/25 rounded-xl px-3.5 py-2.5">{msg}</p>}
          <button className="btn-mint w-full !py-3" disabled={busy}>{busy ? 'Authenticating…' : mode === 'login' ? 'Enter terminal →' : 'Create desk →'}</button>
        </form>
        <button className="text-[13px] text-mist mt-5 hover:text-white transition" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
          {mode === 'login' ? 'New here? Claim a $100k desk →' : 'Have a desk? Sign in →'}
        </button>
        <p className="font-mono text-[10.5px] text-mist/70 mt-8">Reviewer shortcut — email <b className="text-mist">demo@tradepilot.app</b> · password <b className="text-mist">demo1234</b> (after <span className="text-mist">npm run seed</span>)</p>
      </div>
    </div>
  );
}
