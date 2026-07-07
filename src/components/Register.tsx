import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Mail, Lock, User as UserIcon, Phone, ShieldCheck, ArrowRight, UserPlus, Sparkles, Check } from 'lucide-react';
import { User } from '../types';
import { AVATAR_GRADIENTS } from '../utils/mockData';

interface RegisterProps {
  key?: string;
  onRegisterSuccess: (newUser: User) => void;
  onNavigateToLogin: () => void;
  showNotification: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function Register({
  onRegisterSuccess,
  onNavigateToLogin,
  showNotification
}: RegisterProps) {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [selectedGradient, setSelectedGradient] = useState(AVATAR_GRADIENTS[0].bgClass);
  const [selectedTier, setSelectedTier] = useState<'Silver' | 'Gold' | 'Platinum'>('Silver');
  const [agreeTerms, setAgreeTerms] = useState(false);
  
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0); // 0 to 4

  // Check password strength
  useEffect(() => {
    let strength = 0;
    if (password.length >= 6) strength += 1;
    if (/[A-Z]/.test(password)) strength += 1;
    if (/[0-9]/.test(password)) strength += 1;
    if (/[^A-Za-z0-9]/.test(password)) strength += 1;
    setPasswordStrength(strength);
  }, [password]);

  const getStrengthText = () => {
    if (password.length === 0) return '';
    if (passwordStrength <= 1) return 'Yếu';
    if (passwordStrength === 2) return 'Trung bình';
    if (passwordStrength === 3) return 'Mạnh';
    return 'Rất mạnh';
  };

  const getStrengthColor = () => {
    if (passwordStrength <= 1) return 'bg-rose-500';
    if (passwordStrength === 2) return 'bg-amber-500';
    if (passwordStrength === 3) return 'bg-emerald-500';
    return 'bg-blue-600';
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!fullName.trim()) {
      setError('Vui lòng nhập họ và tên.');
      return;
    }
    if (!email.trim() || !/\S+@\S+\.\S+/.test(email)) {
      setError('Vui lòng nhập địa chỉ email hợp lệ.');
      return;
    }
    if (!phone.trim() || !/^\d{9,11}$/.test(phone.replace(/[\s.-]/g, ''))) {
      setError('Vui lòng nhập số điện thoại từ 9 đến 11 chữ số.');
      return;
    }
    if (password.length < 6) {
      setError('Mật khẩu phải chứa ít nhất 6 ký tự.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không trùng khớp.');
      return;
    }
    if (!agreeTerms) {
      setError('Bạn cần đồng ý với Điều khoản & Điều kiện thành viên.');
      return;
    }

    setIsLoading(true);

    // Simulate database registration
    setTimeout(() => {
      const newUser: User = {
        id: `user-${Date.now()}`,
        email: email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim(),
        bio: `Thành viên mới gia nhập nhóm hạng ${selectedTier}!`,
        avatarColor: selectedGradient,
        role: 'member',
        tier: selectedTier,
        points: selectedTier === 'Platinum' ? 1000 : selectedTier === 'Gold' ? 500 : 200, // starting points based on Tier
        joinedDate: new Date().toISOString().split('T')[0],
        checkInStreak: 0,
        lastCheckIn: null,
      };

      setIsLoading(false);
      showNotification('Đăng ký thành viên thành công!', 'success');
      onRegisterSuccess(newUser);
    }, 1000);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-lg"
      id="register-container"
    >
      <div className="bg-white/80 backdrop-blur-md rounded-3xl p-8 shadow-2xl border border-slate-100 relative overflow-hidden">
        {/* Top bar indicator */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-gradient-to-r from-teal-500 via-emerald-500 to-blue-500" />

        <div className="text-center mb-6">
          <div className="inline-flex p-3 bg-gradient-to-tr from-emerald-100 to-teal-100 rounded-2xl text-emerald-600 mb-3 shadow-inner">
            <UserPlus className="w-6 h-6" />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Đăng Ký Thành Viên</h2>
          <p className="text-slate-500 text-sm mt-1">Trở thành một phần của cộng đồng đặc quyền</p>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-5 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs flex items-start gap-2.5"
            id="register-error-alert"
          >
            <Mail className="w-4 h-4 shrink-0 mt-0.5 text-rose-500" />
            <span>{error}</span>
          </motion.div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4" id="register-form">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Họ và tên */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Họ và Tên</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <UserIcon className="w-4.5 h-4.5" />
                </div>
                <input
                  type="text"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                  placeholder="Nguyễn Văn A"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>

            {/* Số điện thoại */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Số điện thoại</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Phone className="w-4.5 h-4.5" />
                </div>
                <input
                  type="tel"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                  placeholder="0901234567"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div className="space-y-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Email</label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                <Mail className="w-4.5 h-4.5" />
              </div>
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                placeholder="ten.ban@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Mật khẩu */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                  placeholder="Tối thiểu 6 ký tự"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
              {/* Strength indicator */}
              {password && (
                <div className="mt-1.5 space-y-1">
                  <div className="flex justify-between items-center text-[10px]">
                    <span className="text-slate-400 font-medium">Độ mạnh:</span>
                    <span className="font-bold text-slate-600">{getStrengthText()}</span>
                  </div>
                  <div className="h-1 w-full bg-slate-100 rounded-full overflow-hidden flex gap-0.5">
                    {[1, 2, 3, 4].map((level) => (
                      <div
                        key={level}
                        className={`h-full flex-1 transition-all duration-300 ${
                          passwordStrength >= level ? getStrengthColor() : 'bg-slate-200'
                        }`}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Nhập lại mật khẩu */}
            <div className="space-y-1">
              <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Xác nhận mật khẩu</label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-slate-400">
                  <Lock className="w-4.5 h-4.5" />
                </div>
                <input
                  type="password"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-200 focus:border-emerald-500 focus:bg-white rounded-xl text-slate-800 placeholder-slate-400 focus:outline-none transition-all text-sm"
                  placeholder="Xác nhận mật khẩu"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  disabled={isLoading}
                />
              </div>
            </div>
          </div>

          {/* Chọn Hạng Thành Viên */}
          <div className="space-y-1.5 pt-1">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              <span>Hạng Thành Viên Đăng Ký</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['Silver', 'Gold', 'Platinum'] as const).map((tier) => {
                const getTierStyle = () => {
                  if (tier === 'Silver') return selectedTier === 'Silver' ? 'border-slate-400 bg-slate-50 text-slate-800 shadow-inner ring-1 ring-slate-400' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600';
                  if (tier === 'Gold') return selectedTier === 'Gold' ? 'border-amber-400 bg-amber-50/50 text-amber-900 shadow-inner ring-1 ring-amber-400' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600';
                  return selectedTier === 'Platinum' ? 'border-indigo-400 bg-indigo-50/50 text-indigo-900 shadow-inner ring-1 ring-indigo-400' : 'border-slate-200 bg-white hover:bg-slate-50 text-slate-600';
                };
                return (
                  <button
                    key={tier}
                    type="button"
                    onClick={() => setSelectedTier(tier)}
                    className={`py-2 px-3 border-2 rounded-xl text-xs font-bold transition-all text-center flex flex-col items-center justify-center cursor-pointer ${getTierStyle()}`}
                  >
                    <span>{tier}</span>
                    <span className="text-[9px] font-normal text-slate-400 mt-0.5">
                      {tier === 'Silver' ? '+200đ' : tier === 'Gold' ? '+500đ' : '+1000đ'}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Chọn Màu Sắc Avatar */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">Chọn Màu Đại Diện (Avatar)</label>
            <div className="flex flex-wrap gap-2 justify-between bg-slate-50/50 p-2.5 rounded-xl border border-slate-100">
              {AVATAR_GRADIENTS.map((grad) => (
                <button
                  key={grad.id}
                  type="button"
                  onClick={() => setSelectedGradient(grad.bgClass)}
                  className={`w-7 h-7 rounded-full bg-gradient-to-tr ${grad.bgClass} flex items-center justify-center transition-transform hover:scale-110 shadow-sm relative shrink-0 cursor-pointer`}
                  title={grad.name}
                >
                  {selectedGradient === grad.bgClass && (
                    <div className="w-4 h-4 rounded-full bg-white/95 flex items-center justify-center shadow-md">
                      <Check className="w-2.5 h-2.5 text-slate-800 stroke-[3]" />
                    </div>
                  )}
                </button>
              ))}
            </div>
          </div>

          {/* Điều khoản */}
          <label className="flex items-start gap-2.5 cursor-pointer pt-1 select-none">
            <input
              type="checkbox"
              checked={agreeTerms}
              onChange={(e) => setAgreeTerms(e.target.checked)}
              className="w-4.5 h-4.5 mt-0.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500 transition-all accent-emerald-600 cursor-pointer"
            />
            <span className="text-xs text-slate-500 leading-normal">
              Tôi đồng ý với{' '}
              <a href="#" className="font-semibold text-emerald-600 hover:underline">Điều khoản</a> &{' '}
              <a href="#" className="font-semibold text-emerald-600 hover:underline">Chính sách bảo mật</a> của cộng đồng thành viên.
            </span>
          </label>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full py-3.5 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white rounded-2xl font-bold shadow-lg shadow-teal-100 hover:shadow-teal-200 active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer mt-3 text-sm"
            id="btn-submit-register"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              <>
                <ShieldCheck className="w-5 h-5" />
                Đăng ký tài khoản
                <ArrowRight className="w-4 h-4 ml-0.5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500">
            Đã là thành viên?{' '}
            <button
              onClick={onNavigateToLogin}
              className="font-bold text-emerald-600 hover:text-emerald-700 transition-colors ml-1 cursor-pointer"
              id="btn-navigate-login"
            >
              Đăng nhập ngay
            </button>
          </p>
        </div>
      </div>
    </motion.div>
  );
}
