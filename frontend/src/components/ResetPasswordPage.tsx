import React, { useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound } from 'lucide-react';

export default function ResetPasswordPage({ onLogin }: { onLogin: () => void }) {
  const token = new URLSearchParams(window.location.search).get('token') || '';
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [saving, setSaving] = useState(false);
  const valid = password.length >= 12 && /[a-z]/.test(password) && /[A-Z]/.test(password) && /\d/.test(password) && /[^A-Za-z0-9]/.test(password);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault(); setError(''); setSuccess('');
    if (!token) return setError('This password-reset link is invalid or incomplete.');
    if (!valid) return setError('Use at least 12 characters with uppercase, lowercase, a number, and a symbol.');
    if (password !== confirmation) return setError('Passwords do not match.');
    setSaving(true);
    try {
      const response = await fetch('/api/auth/reset-password', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, newPassword: password }) });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to reset password.');
      setSuccess('Password reset successfully. Redirecting to sign in...');
      window.setTimeout(onLogin, 1200);
    } catch (err: any) { setError(err.message || 'Unable to reset password.'); } finally { setSaving(false); }
  };
  return <div className="flex min-h-screen items-center justify-center bg-slate-900 p-4 text-slate-100"><div className="w-full max-w-md rounded-3xl border border-slate-700 bg-slate-800/90 p-8 shadow-2xl"><div className="mb-7 text-center"><div className="mb-3 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-blue-600/20 text-blue-400"><KeyRound className="h-8 w-8" /></div><h1 className="text-2xl font-black">Set a new password</h1><p className="mt-2 text-xs leading-relaxed text-slate-400">Choose a strong new password for your administrator account.</p></div>{error && <div className="mb-5 flex gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs text-rose-300"><AlertCircle className="h-4 w-4 shrink-0" />{error}</div>}{success && <div className="mb-5 flex gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs text-emerald-300"><CheckCircle2 className="h-4 w-4 shrink-0" />{success}</div>}<form onSubmit={submit} className="space-y-4"><label className="block text-xs font-bold uppercase tracking-wider text-slate-400">New password<input type="password" autoComplete="new-password" value={password} onChange={(e) => setPassword(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-blue-500" required /></label><label className="block text-xs font-bold uppercase tracking-wider text-slate-400">Confirm new password<input type="password" autoComplete="new-password" value={confirmation} onChange={(e) => setConfirmation(e.target.value)} className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-900 p-3 text-sm text-white outline-none focus:border-blue-500" required /></label><p className="text-[11px] text-slate-400">At least 12 characters, including uppercase, lowercase, number, and symbol.</p><button disabled={saving} className="w-full rounded-xl bg-blue-600 py-3.5 text-sm font-extrabold text-white hover:bg-blue-500 disabled:opacity-50">{saving ? 'Resetting password...' : 'Reset password'}</button></form></div></div>;
}
