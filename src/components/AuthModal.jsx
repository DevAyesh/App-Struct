import React from 'react';
import { HiX, HiCheckCircle, HiEye, HiEyeOff } from 'react-icons/hi';
import { GoogleLogin } from '@react-oauth/google';

export default function AuthModal({
  isOpen,
  onClose,
  isAuthMode,
  setIsAuthMode,
  loginForm,
  setLoginForm,
  error,
  setError,
  authSuccess,
  setAuthSuccess,
  showPassword,
  setShowPassword,
  showConfirmPassword,
  setShowConfirmPassword,
  handleLogin,
  handleRegister,
  handleResetPassword,
  handleForgotPassword,
  API_URL,
  persistSession,
  showToast
}) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-zinc-950/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white rounded-xl border border-zinc-200 p-6 max-w-sm w-full shadow-2xl">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-lg font-bold text-zinc-950">
              {isAuthMode === 'login'
                ? 'Sign in to AppStruct'
                : isAuthMode === 'register'
                ? 'Create an account'
                : isAuthMode === 'forgot'
                ? 'Reset Password'
                : 'Set New Password'}
            </h2>
            <p className="text-xs text-zinc-500 mt-0.5">
              {isAuthMode === 'login'
                ? 'Enter your credentials to access your architecture workspace.'
                : isAuthMode === 'register'
                ? 'Get started generating production-grade technical blueprints.'
                : isAuthMode === 'forgot'
                ? 'Enter your registered email to receive a password reset link.'
                : 'Enter your new password to restore account access.'}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              onClose();
              setError(null);
              setAuthSuccess(null);
            }}
            className="text-zinc-400 hover:text-zinc-700 p-1 rounded-md"
          >
            <HiX className="w-4 h-4" />
          </button>
        </div>

        {/* Tab switch (only in login/register) */}
        {isAuthMode !== 'reset' && isAuthMode !== 'forgot' && (
          <div className="flex p-0.5 bg-zinc-100 rounded-lg mb-4 text-xs font-medium">
            <button
              type="button"
              onClick={() => {
                setIsAuthMode('login');
                setError(null);
                setAuthSuccess(null);
              }}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                isAuthMode === 'login' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500'
              }`}
            >
              Sign In
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAuthMode('register');
                setError(null);
                setAuthSuccess(null);
              }}
              className={`flex-1 py-1.5 rounded-md transition-all ${
                isAuthMode === 'register' ? 'bg-white text-zinc-900 shadow-2xs font-semibold' : 'text-zinc-500'
              }`}
            >
              Sign Up
            </button>
          </div>
        )}

        {authSuccess && (
          <div className="mb-4 p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
            <HiCheckCircle className="w-4 h-4 text-emerald-600 flex-shrink-0" />
            <span>{authSuccess}</span>
          </div>
        )}

        {error && (
          <div className="mb-4 p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
            <span>{error}</span>
            <button type="button" onClick={() => setError(null)}>
              <HiX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        <form
          onSubmit={(e) => {
            if (isAuthMode === 'login') handleLogin(e);
            else if (isAuthMode === 'register') handleRegister(e);
            else if (isAuthMode === 'forgot') {
              e.preventDefault();
              handleForgotPassword(loginForm.email);
            } else if (isAuthMode === 'reset') {
              handleResetPassword(e);
            }
          }}
          className="space-y-3"
        >
          {isAuthMode !== 'reset' && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Email address</label>
              <input
                type="email"
                required
                value={loginForm.email}
                onChange={(e) => setLoginForm({ ...loginForm, email: e.target.value })}
                placeholder="developer@example.com"
                className="w-full px-3 py-2 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
              />
            </div>
          )}

          {isAuthMode !== 'forgot' && (
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-medium text-zinc-700">
                  {isAuthMode === 'reset' ? 'New Password' : 'Password'}
                </label>
                {isAuthMode === 'login' && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsAuthMode('forgot');
                      setError(null);
                      setAuthSuccess(null);
                    }}
                    className="text-[11px] text-zinc-500 hover:text-zinc-950 transition-colors"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-9 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700"
                >
                  {showPassword ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          {(isAuthMode === 'register' || isAuthMode === 'reset') && (
            <div>
              <label className="block text-xs font-medium text-zinc-700 mb-1">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  required
                  value={loginForm.confirmPassword}
                  onChange={(e) => setLoginForm({ ...loginForm, confirmPassword: e.target.value })}
                  placeholder="••••••••"
                  className="w-full px-3 py-2 pr-9 text-xs border border-zinc-200 rounded-md focus:outline-none focus:ring-2 focus:ring-zinc-900"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-2.5 top-2 text-zinc-400 hover:text-zinc-700"
                >
                  {showConfirmPassword ? <HiEyeOff className="w-4 h-4" /> : <HiEye className="w-4 h-4" />}
                </button>
              </div>
            </div>
          )}

          <button
            type="submit"
            className="w-full mt-2 py-2 bg-zinc-900 hover:bg-zinc-800 text-white text-xs font-semibold rounded-md shadow-2xs transition-colors"
          >
            {isAuthMode === 'login'
              ? 'Sign In'
              : isAuthMode === 'register'
              ? 'Create Account'
              : isAuthMode === 'forgot'
              ? 'Send Reset Link'
              : 'Save New Password'}
          </button>

          {isAuthMode === 'forgot' && (
            <div className="text-center pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsAuthMode('login');
                  setError(null);
                  setAuthSuccess(null);
                }}
                className="text-xs text-zinc-600 hover:text-zinc-950 font-medium transition-colors"
              >
                ← Back to Sign In
              </button>
            </div>
          )}
        </form>

        {isAuthMode === 'login' && (
          <div className="mt-4 pt-4 border-t border-zinc-100">
            <GoogleLogin
              onSuccess={async (cred) => {
                try {
                  const res = await fetch(`${API_URL}/api/auth/google`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify({ credential: cred.credential })
                  });
                  const data = await res.json();
                  if (!res.ok) throw new Error(data.message || 'Google login failed');
                  persistSession(data.token, data.user);
                  onClose();
                  showToast('Signed in with Google');
                } catch (err) {
                  setError(err.message);
                }
              }}
              onError={() => setError('Google login failed')}
              useOneTap={false}
              theme="outline"
              size="medium"
              width="100%"
            />
          </div>
        )}
      </div>
    </div>
  );
}
