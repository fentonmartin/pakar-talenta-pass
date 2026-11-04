'use client';

import { useState } from 'react';

export interface SmtpFormValue {
  host: string;
  port: number;
  user: string;
  from: string;
  secure: boolean;
}

const inputCls =
  'w-full rounded-xl border border-slate-300 bg-white px-4 py-2.5 text-sm text-slate-900 placeholder-slate-400 focus:border-[#7a2fff] focus:outline-none focus:ring-2 focus:ring-[#7a2fff]/20';

function Alert({ kind, msg }: { kind: 'ok' | 'err'; msg: string }) {
  if (!msg) return null;
  return (
    <p className={`rounded-lg px-3 py-2 text-sm ${kind === 'ok' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-600'}`}>
      {msg}
    </p>
  );
}

/**
 * Admin settings — change password + SMTP configuration.
 */
export function SettingsForm({ initial }: { initial: SmtpFormValue }) {
  // Password
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [confirmPw, setConfirmPw] = useState('');
  const [pwMsg, setPwMsg] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);

  // SMTP
  const [host, setHost] = useState(initial.host);
  const [port, setPort] = useState(String(initial.port));
  const [user, setUser] = useState(initial.user);
  const [pass, setPass] = useState('');
  const [fromEmail, setFromEmail] = useState(initial.from);
  const [fromName, setFromName] = useState('');
  const [secure, setSecure] = useState(initial.secure);
  const [smtpMsg, setSmtpMsg] = useState<{ kind: 'ok' | 'err'; msg: string } | null>(null);
  const [testing, setTesting] = useState(false);

  async function changePassword(e: React.FormEvent) {
    e.preventDefault();
    setPwMsg(null);
    if (newPw !== confirmPw) {
      setPwMsg({ kind: 'err', msg: 'New password and confirmation do not match.' });
      return;
    }
    const res = await fetch('/api/auth/change-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ currentPassword: currentPw, newPassword: newPw }),
    });
    const json = await res.json();
    if (res.ok) {
      setPwMsg({ kind: 'ok', msg: 'Password updated successfully.' });
      setCurrentPw('');
      setNewPw('');
      setConfirmPw('');
    } else {
      setPwMsg({ kind: 'err', msg: json.error || 'Failed to change password.' });
    }
  }

  async function saveSmtp(e: React.FormEvent) {
    e.preventDefault();
    setSmtpMsg(null);
    const res = await fetch('/api/settings/smtp', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host, port, user, pass, fromEmail, fromName, secure }),
    });
    const json = await res.json();
    if (res.ok) {
      setSmtpMsg({ kind: 'ok', msg: 'SMTP configuration saved.' });
      setPass('');
    } else {
      setSmtpMsg({ kind: 'err', msg: json.error || 'Failed to save SMTP.' });
    }
  }

  async function testSmtp(e: React.FormEvent) {
    e.preventDefault();
    setTesting(true);
    setSmtpMsg(null);
    try {
      const res = await fetch('/api/smtp/test', { method: 'POST' });
      const json = await res.json();
      setSmtpMsg(
        res.ok
          ? { kind: 'ok', msg: 'Test email sent successfully.' }
          : { kind: 'err', msg: json.error || 'SMTP test failed.' },
      );
    } catch {
      setSmtpMsg({ kind: 'err', msg: 'SMTP test failed.' });
    } finally {
      setTesting(false);
    }
  }

  return (
    <div className="grid gap-6">
      {/* Change password */}
      <div className="glass rounded-[16px] border border-slate-200/70 p-6">
        <h2 className="mb-5 text-sm font-mono uppercase tracking-wider text-[#7a2fff]/70">Change Admin Password</h2>
        <form onSubmit={changePassword} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Current Password</label>
            <input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} required className={inputCls} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">New Password</label>
              <input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} required className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Confirm New Password</label>
              <input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} required className={inputCls} />
            </div>
          </div>
          <Alert kind={pwMsg?.kind ?? 'ok'} msg={pwMsg?.msg ?? ''} />
          <button type="submit" className="rounded-xl bg-gradient-to-r from-[#7722ff] to-[#5d16da] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-700/25 transition hover:opacity-90">
            Update Password
          </button>
        </form>
      </div>

      {/* SMTP */}
      <div className="glass rounded-[16px] border border-slate-200/70 p-6">
        <h2 className="mb-1 text-sm font-mono uppercase tracking-wider text-[#7a2fff]/70">SMTP Configuration</h2>
        <p className="mb-5 text-xs text-slate-400">Used to send pass emails. Values here override the environment.</p>
        <form onSubmit={saveSmtp} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Host</label>
              <input value={host} onChange={(e) => setHost(e.target.value)} placeholder="smtp.gmail.com" className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Port</label>
              <input value={port} onChange={(e) => setPort(e.target.value)} type="number" className={inputCls} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Username</label>
              <input value={user} onChange={(e) => setUser(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
              <input type="password" value={pass} onChange={(e) => setPass(e.target.value)} placeholder="Leave blank to keep current" className={inputCls} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">From Email</label>
              <input value={fromEmail} onChange={(e) => setFromEmail(e.target.value)} className={inputCls} />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-slate-700">From Name</label>
              <input value={fromName} onChange={(e) => setFromName(e.target.value)} className={inputCls} />
            </div>
          </div>
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={secure} onChange={(e) => setSecure(e.target.checked)} className="h-4 w-4 accent-[#7722ff]" />
            Use SSL/TLS (port 465)
          </label>

          <Alert kind={smtpMsg?.kind ?? 'ok'} msg={smtpMsg?.msg ?? ''} />

          <div className="flex items-center gap-3">
            <button type="submit" className="rounded-xl bg-gradient-to-r from-[#7722ff] to-[#5d16da] px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-purple-700/25 transition hover:opacity-90">
              Save SMTP
            </button>
            <button
              type="button"
              onClick={testSmtp}
              disabled={testing}
              className="rounded-xl border border-slate-300 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-[#7a2fff] hover:text-[#7a2fff] disabled:opacity-50"
            >
              {testing ? 'Sending test...' : 'Send test email'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}