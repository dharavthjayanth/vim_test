import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function LoginPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Please fill in all fields.'); return; }
    if (mode === 'register' && !name) { setError('Please enter your name.'); return; }

    // MVP: store mock auth in localStorage
    const instructor = { name: name || email.split('@')[0], email };
    localStorage.setItem('vcvsp_user', JSON.stringify(instructor));
    navigate('/setup');
  }

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-10">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-accent/20 border border-accent/30 mb-4">
            <span className="text-3xl">🎓</span>
          </div>
          <h1 className="text-2xl font-bold text-white">VCVSP</h1>
          <p className="text-slate-400 text-sm mt-1">Virtual Classroom Simulation Platform</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl p-8">
          {/* Tab toggle */}
          <div className="flex rounded-lg bg-surface border border-border p-1 mb-6">
            {(['login','register'] as const).map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(''); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${
                  mode === m
                    ? 'bg-accent text-white shadow'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {m === 'login' ? 'Sign In' : 'Register'}
              </button>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'register' && (
              <div>
                <label className="block text-sm text-slate-400 mb-1">Full Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="Kavya Sharma"
                  className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-accent text-sm"
                />
              </div>
            )}
            <div>
              <label className="block text-sm text-slate-400 mb-1">Email</label>
              <input
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="you@example.com"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-accent text-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-slate-400 mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-surface border border-border rounded-lg px-4 py-2.5 text-white placeholder-slate-600 focus:outline-none focus:border-accent text-sm"
              />
            </div>

            {error && (
              <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              className="w-full bg-accent hover:bg-indigo-500 text-white font-semibold py-2.5 rounded-lg transition-colors text-sm mt-2"
            >
              {mode === 'login' ? 'Sign In →' : 'Create Account →'}
            </button>
          </form>

          {/* Demo shortcut */}
          <div className="mt-6 pt-6 border-t border-border text-center">
            <p className="text-xs text-slate-500 mb-3">Demo Mode — skip login</p>
            <button
              onClick={() => {
                localStorage.setItem('vcvsp_user', JSON.stringify({ name: 'Demo Instructor', email: 'demo@vcvsp.ai' }));
                navigate('/setup');
              }}
              className="text-sm text-accent hover:text-indigo-400 font-medium transition-colors"
            >
              Enter as Demo Instructor →
            </button>
          </div>
        </div>

        <p className="text-center text-xs text-slate-600 mt-6">
          VCVSP MVP v1.0 · AI-Powered Instructor Readiness Simulation
        </p>
      </div>
    </div>
  );
}
