import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, User, Eye, EyeOff, AlertCircle, KeyRound, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();

  // Form States
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Login Flow
  const handleLogin = async (e) => {
    e.preventDefault();
    
    const login = loginInput;
    const password = passwordInput;

    if (!login.trim() || !password.trim()) {
      setErrorMsg('Iltimos, login va parolni kiriting.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    try {
      console.log("Bazaga so'rov ketmoqda...", login.trim(), password.trim());
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('login', login.trim())
        .eq('password', password.trim());

      console.log("Supabase toza javob:", data, error);

      if (error || !data || data.length === 0) {
        setErrorMsg('Login yoki parol noto\'g\'ri.');
        setIsLoading(false);
        return;
      }

      const matchedUser = data[0];
      
      // Save user to localStorage (both 'user' as requested, and 'unitask_user' for dashboard compatibility)
      localStorage.setItem('user', JSON.stringify(matchedUser));
      localStorage.setItem('unitask_user', JSON.stringify(matchedUser));

      // Check user role and navigate
      if (matchedUser.role === 'teacher') {
        navigate('/teacher');
      } else if (matchedUser.role === 'student') {
        navigate('/student');
      } else {
        setErrorMsg('Login yoki parol noto\'g\'ri.');
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setErrorMsg('Login yoki parol noto\'g\'ri.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Glow Effects */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/45">
          
          {/* Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              UniTask
            </h2>
            <p className="text-slate-400 text-sm font-medium">
              Universitet Vazifalar Boshqaruvi Tizimi
            </p>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-950/30 border border-red-900/55 text-red-200 text-sm mb-6">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <p className="font-semibold">{errorMsg}</p>
            </div>
          )}

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-6">
            {/* Login Input */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2 ml-1" htmlFor="login">
                Foydalanuvchi logini
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <User className="h-5 w-5" />
                </div>
                <input
                  id="login"
                  type="text"
                  placeholder="admin, student123..."
                  value={loginInput}
                  onChange={(e) => setLoginInput(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                />
              </div>
            </div>

            {/* Password Input */}
            <div>
              <label className="block text-slate-300 text-sm font-semibold mb-2 ml-1" htmlFor="password">
                Parol
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                  <Lock className="h-5 w-5" />
                </div>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={passwordInput}
                  onChange={(e) => setPasswordInput(e.target.value)}
                  disabled={isLoading}
                  required
                  className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 pl-12 pr-12 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                >
                  {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                </button>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isLoading}
              className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed cursor-pointer"
            >
              {isLoading ? (
                <span className="flex items-center justify-center gap-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Kutilmoqda...
                </span>
              ) : (
                'Tizimga kirish'
              )}
            </button>
          </form>

        </div>
      </div>
    </div>
  );
}
