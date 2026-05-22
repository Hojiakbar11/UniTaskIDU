import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Lock, User, Eye, EyeOff, AlertCircle, KeyRound, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const navigate = useNavigate();
  
  // Tab Switcher
  const [isSignUp, setIsSignUp] = useState(false);

  // Login States
  const [loginInput, setLoginInput] = useState('');
  const [passwordInput, setPasswordInput] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  // Sign Up States
  const [signUpFullName, setSignUpFullName] = useState('');
  const [signUpLogin, setSignUpLogin] = useState('');
  const [signUpPassword, setSignUpPassword] = useState('');
  const [signUpRole, setSignUpRole] = useState('student');
  const [showSignUpPassword, setShowSignUpPassword] = useState(false);

  // Loading & Error States
  const [isLoading, setIsLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Handle Login Flow
  const handleLogin = async (e) => {
    e.preventDefault();
    if (!loginInput.trim() || !passwordInput) {
      setErrorMsg('Iltimos, login va parolni kiriting.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    console.log("Kiritildi:", loginInput, passwordInput);

    try {
      // Supabase'dan foydalanuvchini login bo'yicha qidirish
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('login', loginInput.trim());

      console.log("Supabase Response (Login):", data, error);

      if (error) {
        console.error('Supabase query error:', error);
        setErrorMsg('Tizimga ulanishda xatolik yuz berdi.');
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const matchedUser = data[0];
        
        // Parolni ochiq matnda taqqoslash
        if (matchedUser.password === passwordInput) {
          localStorage.setItem('unitask_user', JSON.stringify({
            id: matchedUser.id,
            full_name: matchedUser.full_name,
            login: matchedUser.login,
            role: matchedUser.role,
            group_id: matchedUser.group_id
          }));

          if (matchedUser.role === 'teacher') {
            navigate('/teacher');
          } else if (matchedUser.role === 'student') {
            navigate('/student');
          } else {
            setErrorMsg('Noma\'lum foydalanuvchi roli.');
          }
        } else {
          setErrorMsg('Login yoki parol noto\'g\'ri.');
        }
      } else {
        setErrorMsg('Login yoki parol noto\'g\'ri.');
      }
    } catch (err) {
      console.error('Unexpected auth error:', err);
      setErrorMsg('Kutilmagan xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  // Handle Sign Up Flow
  const handleSignUp = async (e) => {
    e.preventDefault();
    if (!signUpFullName.trim() || !signUpLogin.trim() || !signUpPassword) {
      setErrorMsg('Iltimos, barcha maydonlarni to\'ldiring.');
      return;
    }

    setIsLoading(true);
    setErrorMsg('');

    console.log("Kiritildi (Sign Up):", signUpFullName, signUpLogin, signUpPassword, signUpRole);

    try {
      // Supabase'ga yangi foydalanuvchi qo'shish
      const { data, error } = await supabase
        .from('users')
        .insert([
          {
            full_name: signUpFullName.trim(),
            login: signUpLogin.trim(),
            password: signUpPassword,
            role: signUpRole
          }
        ])
        .select();

      console.log("Supabase Response (Sign Up):", data, error);

      if (error) {
        console.error('Supabase signup error:', error);
        // Agar login avvalroq band bo'lsa (unique constraint)
        if (error.code === '23505') {
          setErrorMsg('Ushbu login band, boshqasini tanlang.');
        } else {
          setErrorMsg('Ro\'yxatdan o\'tishda xatolik yuz berdi: ' + error.message);
        }
        setIsLoading(false);
        return;
      }

      if (data && data.length > 0) {
        const newUser = data[0];

        // Muvaffaqiyatli ro'yxatdan o'tildi, srazu tizimga kirish
        localStorage.setItem('unitask_user', JSON.stringify({
          id: newUser.id,
          full_name: newUser.full_name,
          login: newUser.login,
          role: newUser.role,
          group_id: newUser.group_id
        }));

        if (newUser.role === 'teacher') {
          navigate('/teacher');
        } else if (newUser.role === 'student') {
          navigate('/student');
        } else {
          setErrorMsg('Noma\'lum roldagi foydalanuvchi yaratildi.');
        }
      } else {
        setErrorMsg('Foydalanuvchi yaratildi, lekin tizimga kirishda muammo yuz berdi.');
      }
    } catch (err) {
      console.error('Unexpected signup error:', err);
      setErrorMsg('Kutilmagan xatolik yuz berdi.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-955 bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden font-sans">
      {/* Decorative Glow Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-600/10 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2 pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-violet-600/10 rounded-full blur-3xl translate-x-1/2 translate-y-1/2 pointer-events-none"></div>

      <div className="w-full max-w-md relative z-10">
        {/* Card */}
        <div className="bg-slate-900/50 border border-slate-800/80 backdrop-blur-xl rounded-3xl p-8 shadow-2xl shadow-black/40">
          
          {/* Logo / Header */}
          <div className="text-center mb-8">
            <div className="inline-flex h-14 w-14 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 items-center justify-center shadow-xl shadow-indigo-500/20 mb-4">
              <KeyRound className="h-7 w-7 text-white" />
            </div>
            <h2 className="text-3xl font-extrabold tracking-tight text-white mb-2">
              UniTask
            </h2>
            <p className="text-slate-400 text-sm">
              Universitet Vazifalar Boshqaruvi Tizimi
            </p>
          </div>

          {/* Tab Switcher */}
          <div className="flex border-b border-slate-800 mb-6">
            <button
              type="button"
              onClick={() => {
                setIsSignUp(false);
                setErrorMsg('');
              }}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                !isSignUp
                  ? 'border-indigo-500 text-white font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Kirish
            </button>
            <button
              type="button"
              onClick={() => {
                setIsSignUp(true);
                setErrorMsg('');
              }}
              className={`flex-1 pb-3 text-sm font-bold border-b-2 transition-all ${
                isSignUp
                  ? 'border-indigo-500 text-white font-extrabold'
                  : 'border-transparent text-slate-500 hover:text-slate-300'
              }`}
            >
              Qayd etish (Test)
            </button>
          </div>

          {/* Error Message */}
          {errorMsg && (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-950/30 border border-red-900/55 text-red-200 text-sm mb-6">
              <AlertCircle className="h-5 w-5 shrink-0 text-red-400" />
              <p className="font-medium">{errorMsg}</p>
            </div>
          )}

          {/* Forms */}
          {!isSignUp ? (
            /* Login Form */
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
                className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
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
          ) : (
            /* Sign Up Form (Test Mode) */
            <form onSubmit={handleSignUp} className="space-y-5">
              {/* Full Name Input */}
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2 ml-1" htmlFor="signup-fullname">
                  To'liq ism
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="signup-fullname"
                    type="text"
                    placeholder="Ism sharif..."
                    value={signUpFullName}
                    onChange={(e) => setSignUpFullName(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Login Input */}
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2 ml-1" htmlFor="signup-login">
                  Login
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-500">
                    <User className="h-5 w-5" />
                  </div>
                  <input
                    id="signup-login"
                    type="text"
                    placeholder="teacher1, student1..."
                    value={signUpLogin}
                    onChange={(e) => setSignUpLogin(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 pl-12 pr-4 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                </div>
              </div>

              {/* Password Input */}
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2 ml-1" htmlFor="signup-password">
                  Parol
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-slate-555 text-slate-500">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    id="signup-password"
                    type={showSignUpPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={signUpPassword}
                    onChange={(e) => setSignUpPassword(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 pl-12 pr-12 text-sm outline-none placeholder:text-slate-600 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowSignUpPassword(!showSignUpPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-500 hover:text-slate-300 transition-colors"
                  >
                    {showSignUpPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
                  </button>
                </div>
              </div>

              {/* Role Select Dropdown */}
              <div>
                <label className="block text-slate-300 text-sm font-semibold mb-2 ml-1" htmlFor="signup-role">
                  Roli
                </label>
                <div className="relative">
                  <select
                    id="signup-role"
                    value={signUpRole}
                    onChange={(e) => setSignUpRole(e.target.value)}
                    disabled={isLoading}
                    className="w-full bg-slate-950/60 border border-slate-800 text-white rounded-2xl py-3.5 px-4 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-500/20 transition-all font-medium appearance-none cursor-pointer"
                  >
                    <option value="student" className="bg-slate-900 text-white">Student (Talaba)</option>
                    <option value="teacher" className="bg-slate-900 text-white">Teacher (O'qituvchi)</option>
                  </select>
                  <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none text-slate-500">
                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full relative group overflow-hidden rounded-2xl bg-gradient-to-r from-indigo-500 to-violet-600 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/35 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed mt-2"
              >
                {isLoading ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Kutilmoqda...
                  </span>
                ) : (
                  "Ro'yxatdan o'tish"
                )}
              </button>
            </form>
          )}

        </div>
      </div>
    </div>
  );
}
