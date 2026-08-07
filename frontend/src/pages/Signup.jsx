import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Navbar from "../components/Navbar";

export default function Signup() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const { signup, login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (!email.trim()) { setError("Enter your email to create an account."); return; }
    setLoading(true);
    try {
      if (signup) await signup(email, "");
      else await login(email, ""); // Fallback: just log in
      navigate("/");
    } catch (err) {
      setError(err.message || "Signup failed.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="flex flex-col items-center justify-center px-4 py-20">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-10 md:p-12 text-center">
            <h2 className="text-3xl font-black text-gray-900 mb-2">Join Para PH</h2>
            <p className="text-gray-500 text-sm mb-8">No passwords. Just enter your email and start commuting smarter.</p>
            {error && <div className="mb-5 px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>}
            <form onSubmit={handleSubmit} className="space-y-4">
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com" autoFocus
                className="w-full px-4 py-3 rounded-xl text-sm border border-gray-300 focus:outline-none focus:ring-2 focus:ring-purple-500 text-center" />
              <button type="submit" disabled={loading}
                className="w-full py-3 rounded-xl font-bold text-sm text-white bg-purple-800 hover:bg-purple-700 disabled:opacity-50 transition-colors">
                {loading ? "Creating account…" : "Create Free Account"}
              </button>
            </form>
            <p className="mt-6 text-sm text-gray-500">
              Already have an account? <Link to="/login" className="text-purple-800 font-semibold hover:underline">Sign In</Link>
            </p>
            <p className="mt-4 text-xs text-gray-400">
              By signing up, you agree to our <Link to="/privacy-policy" className="underline">Privacy Policy</Link>.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
