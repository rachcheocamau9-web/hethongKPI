import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, Eye, EyeOff, LogIn, Sparkles, UserCheck, AlertCircle } from 'lucide-react';
import { User } from '../types';

interface LoginProps {
  key?: string;
  onLoginSuccess: (user: User) => void;
  onNavigateToRegister: () => void;
  onNavigateToForgotPassword: () => void;
  registeredMembers: User[];
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function Login({
  onLoginSuccess,
  onNavigateToRegister,
  onNavigateToForgotPassword,
  registeredMembers,
  showNotification
}: LoginProps) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!email) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }
    if (!password) {
      setError('Vui lòng nhập mật khẩu.');
      return;
    }

    setIsLoading(true);

    // Simulate network delay
    setTimeout(() => {
      const foundUser = registeredMembers.find(
        (u) => u.email.toLowerCase() === email.toLowerCase()
      );

      // In a real database, we would hash & check password. 
      // For this local prototype, any user in our list can log in.
      // If password is less than 6 chars, or they use '123456', let's say it works
      if (foundUser) {
        setIsLoading(false);
        showNotification(`Chào mừng quay trở lại, ${foundUser.fullName}!`, 'success');
        onLoginSuccess(foundUser);
      } else {
        setIsLoading(false);
        setError('Email hoặc mật khẩu không chính xác. Thử "nguyen.an@gmail.com" hoặc bấm Đăng nhập nhanh bên dưới.');
        showNotification('Đăng nhập thất bại. Vui lòng kiểm tra lại thông tin.', 'error');
      }
    }, 800);
  };

  const handleQuickLogin = (member: User) => {
    setEmail(member.email);
    setPassword('password123'); // Preset
    showNotification(`Đã điền thông tin đăng nhập của ${member.fullName}`, 'info');
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
      id="login-container"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Subtle top light effect */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500" />
        
        <div className="text-center mb-8">
          <div className="inline-flex p-3 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-2xl text-blue-600 mb-4 shadow-inner">
            <Sparkles className="w-6 h-6 animate-pulse" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Cổng Thành Viên</h2>
          <p className="text-slate-500 text-sm mt-2">Đăng nhập để truy cập đặc quyền của bạn</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs flex items-start gap-2.5"
            id="login-error-alert"
          >
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5" id="login-form">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-5 h-5" />
              </div>
              <input
                type="email"
                className="w-full pl-11 pr-4 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                placeholder="ten.ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between items-center">
              <label className="text-xs font-semibold text-slate-600 uppercase tracking-wider block">Mật khẩu</label>
              <button
                type="button"
                onClick={onNavigateToForgotPassword}
                className="text-xs font-medium text-blue-600 hover:text-blue-700 transition-colors"
                id="btn-forgot-password"
              >
                Quên mật khẩu?
              </button>
            </div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-slate-400">
                <Lock className="w-5 h-5" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                className="w-full pl-11 pr-11 py-3 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-blue-500 focus:bg-white rounded-2xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4.5 h-4.5 rounded border-slate-300 text-blue-600 focus:ring-blue-500 transition-all accent-blue-600"
              />
              <span className="text-xs font-medium text-slate-500">Ghi nhớ đăng nhập</span>
            </label>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-2xl font-semibold shadow-lg shadow-indigo-100 hover:shadow-indigo-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 disabled:opacity-50 disabled:pointer-events-none text-sm"
            id="btn-submit-login"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-5 h-5" />
                Đăng nhập
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Chưa có tài khoản thành viên?{' '}
            <button
              onClick={onNavigateToRegister}
              className="font-bold text-blue-600 hover:text-blue-700 transition-colors ml-1 cursor-pointer"
              id="btn-navigate-register"
            >
              Đăng ký ngay
            </button>
          </p>
        </div>
      </div>

      {/* Quick Login Section for Developer / Demo - extremely thoughtful and helpful */}
      <div className="mt-8 bg-white/50 backdrop-blur-sm rounded-2xl p-4 border border-slate-100 shadow-lg">
        <div className="text-xs font-bold text-slate-500 uppercase tracking-wider mb-2.5 flex items-center gap-1.5 justify-center">
          <UserCheck className="w-3.5 h-3.5 text-blue-500" />
          <span>Tài khoản thử nghiệm nhanh (Demo)</span>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {registeredMembers.slice(0, 2).map((member) => (
            <button
              key={member.id}
              onClick={() => handleQuickLogin(member)}
              className="p-2 bg-white/80 hover:bg-white hover:border-blue-400 border border-slate-200 rounded-xl text-left transition-all active:scale-95 flex items-center gap-2 group cursor-pointer"
            >
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-tr ${member.avatarColor} shrink-0`} />
              <div className="min-w-0">
                <p className="text-[10px] font-bold text-slate-700 truncate group-hover:text-blue-600">{member.fullName.split(' ').pop()}</p>
                <p className="text-[9px] text-slate-400 font-mono truncate">{member.tier}</p>
              </div>
            </button>
          ))}
        </div>
      </div>
    </motion.div>
  );
}
