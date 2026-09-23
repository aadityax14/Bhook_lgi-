import React, { useState } from 'react';
import { Lock, ArrowLeft } from 'lucide-react';

export default function AdminLogin({ onLogin, onBack }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = (e) => {
    e.preventDefault();

    // Temporary admin credentials
    if (username === 'admin' && password === 'bhooklgi123') {
      setError('');
      onLogin();
    } else {
      setError('Invalid admin username or password');
    }
  };

  return (
    <div className="min-h-screen bg-brand-cream flex items-center justify-center px-4">
      <div className="w-full max-w-md">

        {/* Logo / Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-brand-yellow text-brand-black text-3xl font-black shadow-lg">
            B
          </div>

          <h1 className="mt-4 text-3xl font-black text-brand-black">
            Bhook_Lgi Admin
          </h1>

          <p className="mt-1 text-sm text-gray-500 font-medium">
            Kitchen Control Panel
          </p>
        </div>

        {/* Login Card */}
        <div className="bg-white rounded-3xl p-6 sm:p-8 shadow-xl border border-gray-100">

          <div className="flex items-center gap-3 mb-6">
            <div className="w-11 h-11 rounded-xl bg-brand-yellow flex items-center justify-center">
              <Lock className="w-5 h-5 text-brand-black" />
            </div>

            <div>
              <h2 className="font-black text-lg">
                Admin Login
              </h2>
              <p className="text-xs text-gray-500">
                Enter your admin credentials
              </p>
            </div>
          </div>

          <form onSubmit={handleLogin} className="space-y-4">

            {/* Username */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Username
              </label>

              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Enter username"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20"
              />
            </div>

            {/* Password */}
            <div>
              <label className="block text-sm font-bold text-gray-700 mb-2">
                Password
              </label>

              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 outline-none focus:border-brand-yellow focus:ring-2 focus:ring-brand-yellow/20"
              />
            </div>

            {/* Error */}
            {error && (
              <div className="rounded-xl bg-red-50 border border-red-100 px-4 py-3 text-sm font-semibold text-red-600">
                {error}
              </div>
            )}

            {/* Login */}
            <button
              type="submit"
              className="w-full rounded-xl bg-brand-yellow text-brand-black py-3.5 font-black hover:scale-[1.01] transition"
            >
              Login to Dashboard
            </button>
          </form>

          {/* Back */}
          <button
            onClick={onBack}
            className="mt-5 w-full flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-brand-black transition"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Customer App
          </button>

        </div>
      </div>
    </div>
  );
}