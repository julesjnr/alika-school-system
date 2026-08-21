import React, { useEffect, useState } from 'react';
import { AlertCircle, CheckCircle2, KeyRound, Mail, RefreshCw, X } from 'lucide-react';
import { Student, Lecturer } from '../types';

interface PasswordRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSwitchToLogin: () => void;
  students: Student[];
  lecturers: Lecturer[];
}

/** The server deliberately owns account lookup so this dialog cannot reveal accounts. */
export default function PasswordRecoveryModal({ isOpen, onClose, onSwitchToLogin }: PasswordRecoveryModalProps) {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorText, setErrorText] = useState('');
  const [successText, setSuccessText] = useState('');

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setErrorText('');
      setSuccessText('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setErrorText('');
    setSuccessText('');
    setIsLoading(true);
    try {
      const response = await fetch('/api/auth/reset-request', {
        method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ email }),
      });
      const body = await response.json();
      if (!response.ok || !body.success) throw new Error(body.error || 'Unable to process the request.');
      setSuccessText(body.message || 'If an eligible account exists, a password-reset link will be sent shortly.');
    } catch (error: any) {
      setErrorText(error.message || 'Unable to reach the password recovery service.');
    } finally {
      setIsLoading(false);
    }
  };

  return <div className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-slate-950/80 p-4 backdrop-blur-md">
    <div className="relative my-8 w-full max-w-lg overflow-hidden rounded-3xl border border-slate-100 bg-white p-6 shadow-2xl dark:border-slate-800 dark:bg-slate-900 md:p-8">
      <div className="absolute inset-x-0 top-0 h-1.5 bg-gradient-to-r from-blue-500 via-blue-600 to-indigo-600" />
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-2"><div className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-600 text-xs font-bold text-white">ED</div><div><span className="block font-mono text-[9px] font-bold uppercase tracking-widest text-slate-400">Security Suite</span><span className="text-sm font-extrabold text-slate-900 dark:text-slate-100">Password Recovery Gateway</span></div></div>
        <button type="button" onClick={onClose} className="rounded-full p-1.5 text-slate-400 hover:bg-slate-50 hover:text-slate-800 dark:hover:bg-slate-800 dark:hover:text-slate-100"><X className="h-4 w-4" /></button>
      </div>
      {errorText && <div className="mb-4 flex gap-2 rounded-xl border border-red-100 bg-red-50 px-3.5 py-3 text-xs font-medium text-red-600"><AlertCircle className="h-4 w-4 shrink-0" />{errorText}</div>}
      {successText && <div className="mb-4 flex gap-2 rounded-xl border border-emerald-100 bg-emerald-50 px-3.5 py-3 text-xs font-medium text-emerald-700"><CheckCircle2 className="h-4 w-4 shrink-0" />{successText}</div>}
      <div className="mb-5 space-y-1"><h3 className="flex items-center gap-2 text-base font-bold text-slate-900 dark:text-slate-100"><KeyRound className="h-4 w-4 text-blue-600" />Reset administrator password</h3><p className="text-xs leading-relaxed text-slate-500">Enter your registered administrator email. For security, we cannot confirm whether an account exists.</p></div>
      <form onSubmit={submit} className="space-y-4"><label className="block text-[10px] font-bold uppercase tracking-widest text-slate-400">Registered email address<div className="relative mt-1.5"><Mail className="absolute left-3.5 top-3.5 h-4 w-4 text-slate-400" /><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} autoComplete="email" placeholder="admin@example.edu" className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 pl-10 text-xs text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-100" /></div></label><button type="submit" disabled={isLoading} className="flex w-full items-center justify-center gap-2 rounded-xl bg-blue-600 px-6 py-3 text-xs font-extrabold uppercase tracking-wider text-white shadow-md hover:bg-blue-700 disabled:opacity-50">{isLoading ? <><RefreshCw className="h-4 w-4 animate-spin" />Sending secure link...</> : <>Email reset link</>}</button></form>
      <button type="button" onClick={onSwitchToLogin} className="mt-5 w-full text-xs font-semibold text-blue-600 hover:underline">Return to sign in</button>
    </div>
  </div>;
}
