import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import OTPInput from '../components/OTPInput';
import AuthPageLayout from '../components/AuthPageLayout';

const API = import.meta.env.VITE_API_URL ?? 'http://localhost:8000';

function EmailIcon() {
  return (
    <svg className="w-7 h-7 text-purple-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
      <polyline points="22,6 12,13 2,6" />
    </svg>
  );
}


// Step 2 of the signup flow
export default function SignupOTPStep({ uid, email, onBack }) {
  const [otp, setOtp]                 = useState('');
  const [resendCooldown, setCooldown] = useState(0);
  const [error, setError]             = useState('');
  const [loading, setLoading]         = useState(false);

  const { loginWithCustomToken } = useAuth();
  const navigate = useNavigate();

  // Countdown ticker for resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => {
      setCooldown((c) => {
        if (c <= 1) { clearInterval(t); return 0; }
        return c - 1;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  const handleVerify = async (e) => {
    e.preventDefault();
    setError('');

    if (otp.replace(/\s/g, '').length < 6) {
      setError('Please enter the full 6-digit code.');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API}/api/v1/auth/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid, otp }),
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.message ?? 'Verification failed.');
        return;
      }

      await loginWithCustomToken(data.customToken);
      navigate('/');
    } catch {
      setError('Network error. Check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = useCallback(async () => {
    if (resendCooldown > 0) return;
    setError('');

    try {
      const res = await fetch(`${API}/api/v1/auth/resend-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ uid }),
      });
      const data = await res.json();

      if (!res.ok) {
        if (res.status === 429) { setCooldown(data.retryAfter ?? 60); return; }
        setError(data.message ?? 'Failed to resend code.');
        return;
      }

      setOtp('');
      setCooldown(60);
    } catch {
      setError('Network error. Failed to resend code.');
    }
  }, [uid, resendCooldown]);

  return (
    <AuthPageLayout variant="split">
      {/* Icon */}
      <div className="flex justify-center mb-4">
        <div className="w-14 h-14 rounded-full flex items-center justify-center bg-purple-50 border border-purple-200">
          <EmailIcon />
        </div>
      </div>

      <h2 className="text-3xl md:text-4xl font-black text-gray-900 text-center mb-2">
        Check your email
      </h2>
      <p className="text-base md:text-lg text-gray-600 text-center mb-8">
        We sent a 6-digit code to{' '}
        <span className="text-purple-600 font-semibold">{email}</span>
      </p>

      {error && (
        <div className="mb-5 px-5 py-4 rounded-xl bg-red-50 border border-red-200 text-red-600 text-base text-center">
          {error}
        </div>
      )}

      <form onSubmit={handleVerify} className="space-y-6">
        <OTPInput value={otp} onChange={setOtp} disabled={loading} />

        <button
          type="submit"
          disabled={loading || otp.replace(/\s/g, '').length < 6}
          className="w-full py-5 rounded-full font-bold text-lg md:text-xl text-white
                     bg-purple-900 hover:bg-pink-700
                     disabled:opacity-50 disabled:cursor-not-allowed
                     transform hover:scale-[1.02] active:scale-[0.98] transition-all duration-200
                     shadow-lg shadow-purple-500/20"
        >
          {loading ? 'Verifying\u2026' : 'Verify code'}
        </button>
      </form>

      {/* Resend */}
      <div className="mt-6 text-center">
        {resendCooldown > 0 ? (
          <p className="text-base text-gray-500">
            Resend in <span className="text-gray-800 font-bold">{resendCooldown}s</span>
          </p>
        ) : (
          <button
            type="button"
            onClick={handleResend}
            className="text-base text-purple-800 hover:text-purple-900 font-bold transition-colors"
          >
            Didn't receive it? Resend code
          </button>
        )}
      </div>

      <button
        type="button"
        onClick={() => { setOtp(''); setError(''); onBack(); }}
        className="w-full mt-4 text-base text-gray-500 hover:text-gray-700 transition-colors"
      >
        &larr; Back to sign up
      </button>
    </AuthPageLayout>
  );
}
