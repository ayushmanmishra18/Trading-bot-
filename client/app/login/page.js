'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '../../lib/api';

export default function Login() {
  const [mode, setMode] = useState('login');
  const [form, setForm] = useState({ name: '', email: 'demo@tradepilot.app', password: 'demo1234' });
  const [msg, setMsg] = useState('');
  const router = useRouter();

  async function submit(e) {
    e.preventDefault();
    setMsg('');
    try {
      const url = mode === 'login' ? '/auth/login' : '/auth/register';
      const { data } = await api.post(url, form);
      localStorage.setItem('token', data.token);
      router.push('/');
    } catch (e) { setMsg(e.response?.data?.error || 'Failed'); }
  }

  return (
    <div className="max-w-sm mx-auto mt-16 card">
      <h2 className="text-xl font-bold mb-4">{mode === 'login' ? 'Welcome back' : 'Create account'} — $100k virtual cash</h2>
      <form onSubmit={submit} className="space-y-3">
        {mode === 'register' && <input className="input" placeholder="Name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />}
        <input className="input" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
        <input className="input" type="password" placeholder="Password (min 6)" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} />
        <button className="btn w-full">{mode === 'login' ? 'Login' : 'Register'}</button>
      </form>
      {msg && <p className="text-sm text-red-400 mt-3">{msg}</p>}
      <button className="text-sm text-slate-400 mt-4 underline" onClick={() => setMode(mode === 'login' ? 'register' : 'login')}>
        {mode === 'login' ? 'New here? Register' : 'Have an account? Login'}
      </button>
    </div>
  );
}
