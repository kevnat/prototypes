import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { usePrototypesAuth } from '../hooks/usePrototypesAuth';

export default function PrototypesGuard() {
  const { isUnlocked, loading, unlock } = usePrototypesAuth();
  const [input, setInput] = useState('');
  const [error, setError] = useState(null);
  const [checking, setChecking] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setChecking(true);
    const ok = await unlock(input);
    setChecking(false);
    if (!ok) {
      setError('Incorrect passphrase');
      setInput('');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 rounded-full border-2 border-slate-200 border-t-slate-500 animate-spin" />
      </div>
    );
  }

  if (isUnlocked) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-white flex items-center justify-center">
      <div className="w-full max-w-sm px-6">
        <div className="text-center mb-8">
          <div className="text-3xl mb-4">🔒</div>
          <h1 className="text-xl font-semibold text-slate-900">Prototypes</h1>
          <p className="text-sm text-slate-400 mt-1">Enter the passphrase to continue</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          <input
            type="password"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Passphrase"
            autoFocus
            className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-slate-300 focus:border-transparent"
          />
          {error && (
            <p className="text-xs text-red-500">{error}</p>
          )}
          <button
            type="submit"
            disabled={checking || !input}
            className="w-full py-2.5 text-sm font-medium bg-slate-900 text-white rounded-lg hover:bg-slate-700 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
          >
            {checking ? 'Checking…' : 'Continue'}
          </button>
        </form>
      </div>
    </div>
  );
}
