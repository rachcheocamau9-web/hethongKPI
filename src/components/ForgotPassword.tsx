import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Mail, ArrowLeft, KeyRound, AlertCircle, ShieldAlert, CheckCircle2, Lock, Eye, EyeOff } from 'lucide-react';
import { User } from '../types';

interface ForgotPasswordProps {
  key?: string;
  onNavigateToLogin: () => void;
  registeredMembers: User[];
  onUpdateUserPassword: (email: string, newPassword: string) => boolean;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

type Step = 'EMAIL' | 'OTP' | 'RESET';

export default function ForgotPassword({
  onNavigateToLogin,
  registeredMembers,
  onUpdateUserPassword,
  showNotification
}: ForgotPasswordProps) {
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  
  const [step, setStep] = useState<Step>('EMAIL');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleEmailSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setError('Vui lòng nhập địa chỉ email.');
      return;
    }

    const userExists = registeredMembers.some(u => u.email.toLowerCase() === trimmedEmail);
    if (!userExists) {
      setError('Email này chưa được đăng ký trong hệ thống.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('OTP');
      showNotification('Mã khôi phục OTP đã được gửi đến email của bạn!', 'success');
      showNotification('Gợi ý Demo: Nhập mã OTP là 888888', 'info');
    }, 1000);
  };

  const handleOtpSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (otp !== '888888') {
      setError('Mã xác thực OTP không chính xác. Gợi ý: 888888');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      setStep('RESET');
      showNotification('Xác thực OTP thành công. Vui lòng thiết lập mật khẩu mới.', 'success');
    }, 600);
  };

  const handleResetSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (newPassword.length < 6) {
      setError('Mật khẩu mới phải dài ít nhất 6 ký tự.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      const success = onUpdateUserPassword(email, newPassword);
      setIsLoading(false);
      if (success) {
        showNotification('Thay đổi mật khẩu thành công! Hãy đăng nhập.', 'success');
        onNavigateToLogin();
      } else {
        setError('Đã xảy ra lỗi không mong muốn. Thử lại sau.');
      }
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-md"
      id="forgot-password-container"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Top styling */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-amber-500 via-orange-500 to-rose-500" />

        <button
          onClick={onNavigateToLogin}
          className="inline-flex items-center gap-1 text-xs font-bold text-slate-500 hover:text-slate-800 transition-colors mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4.5 h-4.5" />
          Quay lại Đăng nhập
        </button>

        {step === 'EMAIL' && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-gradient-to-tr from-orange-100 to-amber-100 rounded-2xl text-orange-600 mb-3">
                <KeyRound className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Khôi Phục Mật Khẩu</h2>
              <p className="text-slate-500 text-xs mt-1">Nhập email đăng ký của bạn để nhận mã xác thực OTP khôi phục tài khoản</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleEmailSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email Đăng Ký</label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                    <Mail className="w-4.5 h-4.5" />
                  </div>
                  <input
                    type="email"
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-orange-500 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                    placeholder="ten.ban@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-orange-600 to-amber-500 hover:from-orange-700 hover:to-amber-600 text-white rounded-xl font-bold shadow-lg shadow-orange-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Gửi mã xác thực OTP'
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'OTP' && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-gradient-to-tr from-blue-100 to-indigo-100 rounded-2xl text-blue-600 mb-3">
                <ShieldAlert className="w-6 h-6 animate-bounce" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Xác Thực OTP</h2>
              <p className="text-slate-500 text-xs mt-1">Mã OTP đã được gửi về {email}. Nhập mã gồm 6 số bên dưới để tiếp tục.</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleOtpSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block text-center">Nhập Mã OTP</label>
                <input
                  type="text"
                  maxLength={6}
                  required
                  className="w-full py-3 bg-slate-50/50 text-center tracking-[1em] font-mono text-xl font-bold border border-slate-200 focus:border-indigo-500 focus:bg-white rounded-xl text-slate-800 focus:outline-none transition-all placeholder:tracking-normal placeholder:font-sans placeholder:text-sm"
                  placeholder="------"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Xác nhận mã OTP'
                )}
              </button>
            </form>
          </div>
        )}

        {step === 'RESET' && (
          <div>
            <div className="text-center mb-6">
              <div className="inline-flex p-3 bg-gradient-to-tr from-emerald-100 to-green-100 rounded-2xl text-emerald-600 mb-3">
                <CheckCircle2 className="w-6 h-6" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Đặt Mật Khẩu Mới</h2>
              <p className="text-slate-500 text-xs mt-1">Thiết lập mật khẩu bảo mật mới cho tài khoản {email}</p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleResetSubmit} className="space-y-4">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mật khẩu mới</label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                    placeholder="Tối thiểu 6 ký tự"
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    disabled={isLoading}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-slate-400 hover:text-slate-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Xác nhận mật khẩu mới</label>
                <input
                  type="password"
                  required
                  className="w-full px-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                  placeholder="Nhập lại mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full py-3 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-xl font-bold shadow-lg shadow-teal-100 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-2 text-sm"
              >
                {isLoading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  'Xác nhận thay đổi'
                )}
              </button>
            </form>
          </div>
        )}
      </div>
    </motion.div>
  );
}
