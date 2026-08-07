import { useState } from 'react';
import { Link } from 'react-router-dom';
import AuthPageLayout from '../components/AuthPageLayout';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

// ── Helpers ──────────────────────────────────────────────────────────────────

function getPasswordStrength(pw) {
  const checks = {
    length:    pw.length >= 8,
    uppercase: /[A-Z]/.test(pw),
    lowercase: /[a-z]/.test(pw),
    number:    /[0-9]/.test(pw),
  };
  return { checks, score: Object.values(checks).filter(Boolean).length };
}

const STRENGTH_COLORS = ['', '#ef4444', '#f97316', '#eab308', '#4f00cd'];
const STRENGTH_LABELS = ['', 'Weak', 'Fair', 'Good', 'Strong'];

// ── Small icons ───────────────────────────────────────────────────────────────

function CheckIcon() {
  return (
    <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function EyeIcon({ open }) {
  return open ? (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ) : (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
      <line x1="1" y1="1" x2="23" y2="23" />
    </svg>
  );
}

// ── Role option data ──────────────────────────────────────────────────────────

const ROLE_OPTIONS = [
  {
    value: 'commuter',
    label: 'Commuter',
    desc: 'I want to look for routes',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="7" r="4" />
        <path d="M5.5 20a6.5 6.5 0 0 1 13 0" />
      </svg>
    ),
  },
  {
    value: 'driver',
    label: 'Driver',
    desc: 'I offer rides',
    icon: (
      <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <circle cx="12" cy="12" r="10" />
        <circle cx="12" cy="12" r="3" />
        <line x1="12" y1="2" x2="12" y2="9" />
        <line x1="12" y1="15" x2="12" y2="22" />
        <line x1="2" y1="12" x2="9" y2="12" />
        <line x1="15" y1="12" x2="22" y2="12" />
      </svg>
    ),
  },
];

const inputClass = `w-full px-5 py-4 rounded-xl text-gray-900 text-lg placeholder-gray-400
  bg-gray-50 border-2 border-gray-200
  focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all`;

// Components
export default function SignupDetailsStep({ onSuccess }) {
  const [name, setName]               = useState('');
  const [email, setEmail]             = useState('');
  const [contact, setContact]         = useState('');
  const [password, setPassword]       = useState('');
  const [confirmPassword, setConfirm] = useState('');
  const [showPassword, setShowPw]     = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [role, setRole]               = useState('commuter');
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const { checks: pwChecks, score: pwScore } = getPasswordStrength(password);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (password !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }
    if (pwScore < 4) {
      setError('Password does not meet all requirements.');
      return;
    }

    setLoading(true);
    try {
      const normalizedContact = contact.startsWith('0') ? contact : `0${contact}`;

      const res = await fetch(`${API}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, contact: normalizedContact, password, role }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Registration failed. Please try again.');
        return;
      }

      onSuccess({ uid: data.uid, email });
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthPageLayout variant="split">
      <div className="text-center mb-10">
        <h2 className="text-4xl md:text-[2.25rem] font-black text-gray-900 mb-3">Create your account</h2>
        <p className="text-gray-600 text-lg md:text-xl leading-snug">Become part of Metro Manila's commuting community</p>
      </div>

      {error && (
        <div className="mb-5 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-base">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {/* Full Name */}
        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Full name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            placeholder="Juan dela Cruz"
            required
            className={inputClass}
          />
        </div>

        {/* Email */}
        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Email address</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            placeholder="you@example.com"
            required
            className={inputClass}
          />
        </div>

        {/* Mobile Number */}
        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Mobile number</label>
          <div className="flex gap-2">
            <div className="flex items-center px-5 rounded-xl bg-gray-50 border-2 border-gray-200 text-gray-800 text-lg select-none whitespace-nowrap font-bold">
              PH +63
            </div>
            <input
              type="tel"
              value={contact}
              onChange={(e) => setContact(e.target.value.replace(/\D/g, '').slice(0, 10))}
              autoComplete="tel"
              placeholder="9XXXXXXXXX"
              required
              inputMode="numeric"
              className={`flex-1 px-5 py-4 rounded-xl text-gray-900 text-lg placeholder-gray-400
                bg-gray-50 border-2 border-gray-200
                focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all`}
            />
          </div>
          <p className="mt-2 text-sm text-gray-500">Enter 10 digits starting with 9 (e.g. 9171234567)</p>
        </div>

        {/* Password */}
        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Password</label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              required
              className={`${inputClass} pr-12`}
            />
            <button type="button" onClick={() => setShowPw((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <EyeIcon open={showPassword} />
            </button>
          </div>

          {password && (
            <div className="mt-3 space-y-2">
              <div className="flex gap-1.5">
                {Array.from({ length: 4 }, (_, i) => (
                  <div key={i} className="h-1.5 flex-1 rounded-full transition-all duration-300"
                    style={{ background: i < pwScore ? STRENGTH_COLORS[pwScore] : '#e5e7eb' }} />
                ))}
              </div>
              <p className="text-base font-bold" style={{ color: STRENGTH_COLORS[pwScore] }}>
                {STRENGTH_LABELS[pwScore]}
              </p>
              <ul className="grid grid-cols-2 gap-x-3 gap-y-1">
                {[['length', '8+ characters'], ['uppercase', 'Uppercase letter'], ['lowercase', 'Lowercase letter'], ['number', 'Number']].map(([key, label]) => (
                  <li key={key} className={`flex items-center gap-1.5 text-sm transition-colors ${pwChecks[key] ? 'text-green-600 font-semibold' : 'text-gray-500'}`}>
                    {pwChecks[key] && <CheckIcon />}
                    {label}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block text-base font-bold text-gray-800 mb-2">Confirm password</label>
          <div className="relative">
            <input
              type={showConfirm ? 'text' : 'password'}
              value={confirmPassword}
              onChange={(e) => setConfirm(e.target.value)}
              autoComplete="new-password"
              placeholder="••••••••"
              required
              className="w-full px-5 py-4 pr-12 rounded-xl text-lg placeholder-gray-400 bg-gray-50 border-2 border-gray-200 focus:outline-none focus:ring-2 focus:ring-purple-600 focus:border-purple-600 transition-all"
              style={{ color: confirmPassword ? (confirmPassword === password ? '#16a34a' : '#dc2626') : '#111827' }}
            />
            <button type="button" onClick={() => setShowConfirm((v) => !v)} tabIndex={-1} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
              <EyeIcon open={showConfirm} />
            </button>
          </div>
        </div>

        {/* Role Selection */}
        <div>
          <label className="block text-base font-bold text-gray-800 mb-4 text-center">I am a&hellip;</label>
          <div className="grid grid-cols-2 gap-5">
            {ROLE_OPTIONS.map(({ value, label, desc, icon }) => {
              const active = role === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRole(value)}
                  className="flex flex-col items-center gap-4 p-7 md:p-8 rounded-2xl border-2 text-center transition-all duration-200 transform hover:scale-105"
                  style={{
                    background:  active ? 'rgba(236,72,153,0.08)' : 'white',
                    borderColor: active ? '#310775' : '#e5e7eb',
                    boxShadow:   active ? '0 4px 12px rgba(236,72,153,0.2)' : 'none',
                  }}
                >
                  <span style={{ color: active ? '#310775' : '#9ca3af' }}>{icon}</span>
                  <div>
                    <span className={`font-black text-lg md:text-xl block mb-1 ${active ? 'text-gray-900' : 'text-gray-400'}`}>{label}</span>
                    <span className={`text-sm ${active ? 'text-purple-900' : 'text-gray-500'}`}>{desc}</span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-6 py-5 rounded-full font-black text-lg md:text-xl text-white
                     bg-purple-900 hover:bg-pink-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                     shadow-lg shadow-purple-500/20"
        >
          {loading ? 'Creating account\u2026' : 'Create Account'}
        </button>
      </form>

      <div className="mt-8 text-center space-y-3">
        <p className="text-base md:text-lg text-gray-600">
          Already part of Para?{' '}
          <Link to="/login" className="text-purple-800 hover:text-purple-900 font-bold transition-colors">
            Sign in here
          </Link>
        </p>
        <p className="text-sm text-gray-500">
          By signing up, you're joining a community of commuters helping each other navigate Metro Manila
        </p>
      </div>
    </AuthPageLayout>
  );
}
