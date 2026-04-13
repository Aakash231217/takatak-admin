'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import api from '@/lib/api';
import toast from 'react-hot-toast';

const ADMIN_USER = process.env.NEXT_PUBLIC_ADMIN_USERNAME || 'admin';
const ADMIN_PASS = process.env.NEXT_PUBLIC_ADMIN_PASSWORD || 'takatak@2026';
const ADMIN_PHONE = process.env.NEXT_PUBLIC_ADMIN_PHONE || '919999999999';
const OTP_CODE = process.env.NEXT_PUBLIC_OTP_CODE || '123456';

export default function LoginPage() {
  const router = useRouter();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username || !password) return;

    if (username !== ADMIN_USER || password !== ADMIN_PASS) {
      toast.error('Invalid credentials');
      return;
    }

    setLoading(true);
    try {
      // Try to get a JWT from backend via OTP (silent)
      try {
        await api.requestOtp(ADMIN_PHONE);
        const data = await api.verifyOtp(ADMIN_PHONE, OTP_CODE);
        api.setToken(data.accessToken);
        localStorage.setItem('admin_refresh_token', data.refreshToken);
        localStorage.setItem('admin_user', JSON.stringify(data.user));
      } catch {
        // Backend OTP not available — proceed without JWT
        // API calls that need auth will fail gracefully
        localStorage.setItem('admin_user', JSON.stringify({ phone: ADMIN_PHONE, role: 'ADMIN', username: 'SuperAdmin' }));
      }

      localStorage.setItem('admin_authenticated', 'true');
      toast.success('Welcome, Admin!');
      router.push('/');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-2">
            <span className="text-primary-400">TakaTak</span> Admin
          </h1>
          <p className="text-gray-400">Sign in to the management dashboard</p>
        </div>

        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="input"
              onKeyDown={(e) => e.key === 'Enter' && document.getElementById('pwd')?.focus()}
            />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-2">Password</label>
            <input
              id="pwd"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              className="input"
              onKeyDown={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <button
            onClick={handleLogin}
            disabled={loading || !username || !password}
            className="btn-primary w-full py-3"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </div>

        <p className="text-center text-gray-500 text-xs mt-6">
          TakaTak Admin Dashboard v1.0
        </p>
      </div>
    </div>
  );
}
