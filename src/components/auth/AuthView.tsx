import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Heart, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  ArrowLeft, 
  Sparkles, 
  ShieldCheck, 
  User, 
  Flame, 
  RefreshCw,
  CheckCircle2
} from 'lucide-react';
import { triggerHaptic } from '../../lib/capacitor';
import { UserProfile } from '../../types';

export type AuthMode = 'welcome' | 'login' | 'signup' | 'forgot_password' | 'password_reset' | 'email_verify';

interface AuthViewProps {
  onLoginSuccess: (user?: UserProfile) => void;
  onStartOnboarding: (tempAccountData: { email: string; name?: string }) => void;
  initialMode?: AuthMode;
}

// Full-screen cinematic human photography backgrounds for each auth stage
const AUTH_BACKGROUNDS: Record<AuthMode, string> = {
  welcome: 'https://images.unsplash.com/photo-1522529599102-193c0d76b5b6?auto=format&fit=crop&w=1200&q=85',
  login: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1200&q=85',
  signup: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=1200&q=85',
  forgot_password: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&w=1200&q=85',
  password_reset: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&w=1200&q=85',
  email_verify: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&w=1200&q=85'
};

export const AuthView: React.FC<AuthViewProps> = ({
  onLoginSuccess,
  onStartOnboarding,
  initialMode = 'welcome'
}) => {
  const [mode, setMode] = useState<AuthMode>(initialMode);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // OTP Verification & Reset States
  const [otpCode, setOtpCode] = useState(['', '', '', '', '', '']);
  const [resendTimer, setResendTimer] = useState(45);
  const [isResending, setIsResending] = useState(false);

  const clearErrors = () => setError(null);

  const handleModeChange = (newMode: AuthMode) => {
    triggerHaptic('light');
    clearErrors();
    setMode(newMode);
  };

  const handleLogin = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearErrors();

    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      triggerHaptic('heavy');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      triggerHaptic('heavy');
      return;
    }

    setIsLoading(true);
    triggerHaptic('medium');

    setTimeout(() => {
      setIsLoading(false);
      triggerHaptic('success');
      onLoginSuccess();
    }, 500);
  };

  const handleQuickDemoLogin = (type: 'alex' | 'victoria' | 'shindara') => {
    triggerHaptic('medium');
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
      onLoginSuccess();
    }, 350);
  };

  const handleSignUp = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearErrors();

    if (!name.trim()) {
      setError('Please enter your first name');
      triggerHaptic('heavy');
      return;
    }
    if (!email.trim() || !email.includes('@')) {
      setError('Please enter a valid email address');
      triggerHaptic('heavy');
      return;
    }
    if (!password || password.length < 6) {
      setError('Password must be at least 6 characters');
      triggerHaptic('heavy');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      triggerHaptic('heavy');
      return;
    }

    setIsLoading(true);
    triggerHaptic('medium');

    setTimeout(() => {
      setIsLoading(false);
      triggerHaptic('success');
      // Advance directly to Onboarding
      onStartOnboarding({ email, name });
    }, 500);
  };

  const handleForgotPassword = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearErrors();

    if (!email.trim() || !email.includes('@')) {
      setError('Enter your registered email address');
      triggerHaptic('heavy');
      return;
    }

    setIsLoading(true);
    triggerHaptic('medium');

    setTimeout(() => {
      setIsLoading(false);
      setMode('email_verify');
    }, 500);
  };

  const handleVerifyOtp = () => {
    const fullCode = otpCode.join('');
    if (fullCode.length < 6) {
      setError('Please enter the 6-digit verification code');
      triggerHaptic('heavy');
      return;
    }

    setIsLoading(true);
    triggerHaptic('medium');

    setTimeout(() => {
      setIsLoading(false);
      if (mode === 'email_verify') {
        // If from forgot password -> go to password reset
        setMode('password_reset');
      } else {
        // From signup -> go to onboarding
        onStartOnboarding({ email: email || 'user@crest.app', name: name || 'User' });
      }
    }, 500);
  };

  const handlePasswordReset = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    clearErrors();

    if (!password || password.length < 6) {
      setError('New password must be at least 6 characters');
      triggerHaptic('heavy');
      return;
    }
    if (password !== confirmPassword) {
      setError('Passwords do not match');
      triggerHaptic('heavy');
      return;
    }

    setIsLoading(true);
    triggerHaptic('medium');

    setTimeout(() => {
      setIsLoading(false);
      triggerHaptic('success');
      setMode('login');
    }, 500);
  };

  const handleOtpChange = (index: number, val: string) => {
    if (val.length > 1) {
      val = val.slice(-1);
    }
    const newOtp = [...otpCode];
    newOtp[index] = val;
    setOtpCode(newOtp);

    // Auto-focus next input
    if (val && index < 5) {
      const nextInput = document.getElementById(`cinematic-otp-${index + 1}`);
      if (nextInput) nextInput.focus();
    }
  };

  return (
    <div className="relative w-full h-full min-h-screen flex flex-col justify-between overflow-hidden bg-black select-none">
      {/* 1. CINEMATIC FULL-SCREEN PHOTOGRAPH BACKGROUND */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        <AnimatePresence mode="wait">
          <motion.img
            key={mode}
            src={AUTH_BACKGROUNDS[mode] || AUTH_BACKGROUNDS.welcome}
            alt="CREST Community"
            className="w-full h-full object-cover object-center transform scale-100"
            initial={{ scale: 1.08, opacity: 0.3 }}
            animate={{ scale: 1.0, opacity: 1 }}
            exit={{ opacity: 0.2 }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
          />
        </AnimatePresence>

        {/* 2. SMOOTH DEEP DARK GRADIENT FROM BOTTOM UPWARD */}
        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/85 via-black/40 to-transparent pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-transparent to-transparent pointer-events-none" />
      </div>

      {/* TOP HEADER BAR (Logo or Back Navigation) */}
      <div className="relative z-10 w-full pt-5 px-5 flex items-center justify-between">
        {mode !== 'welcome' ? (
          <button
            onClick={() => handleModeChange(mode === 'password_reset' ? 'login' : 'welcome')}
            className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md border border-white/10 flex items-center justify-center text-white/90 hover:text-white hover:bg-black/60 transition-all"
            aria-label="Back"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-rose-500 via-pink-500 to-amber-400 flex items-center justify-center shadow-lg">
              <Flame className="w-4 h-4 text-white fill-white" />
            </div>
            <span className="text-sm font-black tracking-widest bg-gradient-to-r from-white via-rose-100 to-amber-200 bg-clip-text text-transparent">
              CREST
            </span>
          </div>
        )}

        {/* Live Verified Tag */}
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/40 backdrop-blur-md border border-white/10">
          <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-[11px] font-semibold text-gray-200">Verified Singles</span>
        </div>
      </div>

      {/* 3. ALL INTERACTIVE CONTENT LIVES IN THE BOTTOM AREA */}
      <div className="relative z-10 mt-auto w-full px-5 pb-8 pt-4 flex flex-col justify-end">
        <AnimatePresence mode="wait">
          {/* ========================================================================= */}
          {/* MODE: WELCOME / LANDING */}
          {/* ========================================================================= */}
          {mode === 'welcome' && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-4"
            >
              <div className="space-y-1.5">
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md border border-white/15 text-rose-300 text-xs font-bold">
                  <Sparkles className="w-3.5 h-3.5 text-amber-300 fill-amber-300" />
                  <span>Curated Dating & Intentional Chemistry</span>
                </div>
                <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight text-white leading-tight">
                  Real Sparks.<br />
                  <span className="bg-gradient-to-r from-rose-400 via-pink-400 to-amber-300 bg-clip-text text-transparent">
                    Authentic Connection.
                  </span>
                </h1>
                <p className="text-xs sm:text-sm text-gray-300 font-normal leading-relaxed line-clamp-2">
                  Meet attractive, verified adults looking for meaningful relationships and shared passions.
                </p>
              </div>

              {/* Primary Action Buttons */}
              <div className="space-y-2.5 pt-2">
                <button
                  onClick={() => handleModeChange('signup')}
                  className="w-full py-4 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold rounded-2xl text-sm shadow-xl shadow-rose-950/40 flex items-center justify-center gap-2 hover:scale-[1.01] active:scale-[0.99] transition-all"
                >
                  <Heart className="w-4 h-4 fill-white" />
                  <span>Create Account / Sign Up</span>
                </button>

                <button
                  onClick={() => handleModeChange('login')}
                  className="w-full py-3.5 bg-white/10 hover:bg-white/15 backdrop-blur-md text-white font-bold rounded-2xl text-sm border border-white/15 flex items-center justify-center gap-2 transition-all"
                >
                  <span>Log In to Existing Account</span>
                </button>
              </div>

              {/* Instant Tour & Demo Fast-Track */}
              <div className="pt-2 flex items-center justify-between text-[11px] text-gray-400 border-t border-white/10">
                <button
                  onClick={() => {
                    triggerHaptic('medium');
                    onStartOnboarding({ email: 'alex.morgan@crest.app', name: 'Alex' });
                  }}
                  className="text-amber-300 hover:text-amber-200 font-bold flex items-center gap-1 transition-colors"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Preview 10-Slide Onboarding</span>
                </button>

                <div className="flex items-center gap-1.5">
                  <span>Fast Demo:</span>
                  <button
                    onClick={() => handleQuickDemoLogin('alex')}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-rose-300 font-bold border border-white/10 transition-colors"
                  >
                    Alex
                  </button>
                  <button
                    onClick={() => handleQuickDemoLogin('victoria')}
                    className="px-2 py-0.5 rounded-lg bg-white/10 hover:bg-white/20 text-pink-300 font-bold border border-white/10 transition-colors"
                  >
                    Victoria
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE: LOG IN */}
          {/* ========================================================================= */}
          {mode === 'login' && (
            <motion.div
              key="login"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3.5"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Welcome Back</h2>
                <p className="text-xs text-gray-300">Sign in to continue discovering matches</p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <form onSubmit={handleLogin} className="space-y-2.5">
                {/* Email Field */}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400 transition-colors"
                  />
                </div>

                {/* Password Field */}
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    className="w-full pl-10 pr-11 py-3 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400 transition-colors"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Forgot Password */}
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => handleModeChange('forgot_password')}
                    className="text-xs text-rose-300 hover:text-rose-200 font-semibold"
                  >
                    Forgot password?
                  </button>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 hover:from-rose-600 hover:to-pink-600 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Sign In</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="pt-2 text-center">
                <p className="text-xs text-gray-400">
                  Don't have an account?{' '}
                  <button
                    onClick={() => handleModeChange('signup')}
                    className="text-rose-300 font-bold hover:underline"
                  >
                    Sign Up
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE: SIGN UP */}
          {/* ========================================================================= */}
          {mode === 'signup' && (
            <motion.div
              key="signup"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3"
            >
              <div>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white">Create Account</h2>
                <p className="text-xs text-gray-300">Join CREST & meet intentional singles</p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                  <span className="font-semibold">{error}</span>
                </div>
              )}

              <form onSubmit={handleSignUp} className="space-y-2">
                {/* First Name */}
                <div className="relative">
                  <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="First Name"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400 transition-colors"
                  />
                </div>

                {/* Email Field */}
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Email address"
                    className="w-full pl-10 pr-4 py-2.5 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400 transition-colors"
                  />
                </div>

                {/* Password Fields */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="Password"
                      className="w-full px-3.5 py-2.5 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400 transition-colors"
                    />
                  </div>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="Confirm"
                      className="w-full px-3.5 py-2.5 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400 transition-colors"
                    />
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 via-pink-500 to-amber-500 hover:from-rose-600 hover:to-amber-600 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2 transition-all active:scale-[0.99]"
                >
                  {isLoading ? (
                    <RefreshCw className="w-4 h-4 animate-spin" />
                  ) : (
                    <>
                      <span>Continue to Onboarding</span>
                      <ArrowRight className="w-4 h-4" />
                    </>
                  )}
                </button>
              </form>

              <div className="text-center pt-1">
                <p className="text-xs text-gray-400">
                  Already have an account?{' '}
                  <button
                    onClick={() => handleModeChange('login')}
                    className="text-rose-300 font-bold hover:underline"
                  >
                    Log In
                  </button>
                </p>
              </div>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE: FORGOT PASSWORD */}
          {/* ========================================================================= */}
          {mode === 'forgot_password' && (
            <motion.div
              key="forgot_password"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3.5"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-white">Reset Password</h2>
                <p className="text-xs text-gray-300">Enter your email to receive a 6-digit recovery code</p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handleForgotPassword} className="space-y-3">
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Registered Email"
                    className="w-full pl-10 pr-4 py-3 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Send Recovery Code</span>}
                </button>
              </form>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE: OTP VERIFY */}
          {/* ========================================================================= */}
          {mode === 'email_verify' && (
            <motion.div
              key="email_verify"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3.5"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-white">Enter 6-Digit Code</h2>
                <p className="text-xs text-gray-300">We sent a verification code to {email || 'your email'}</p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* 6 Digit Inputs */}
              <div className="flex justify-between gap-1.5 py-1">
                {otpCode.map((digit, idx) => (
                  <input
                    key={idx}
                    id={`cinematic-otp-${idx}`}
                    type="text"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => handleOtpChange(idx, e.target.value)}
                    className="w-11 h-12 text-center text-lg font-bold bg-black/50 backdrop-blur-md border border-white/20 rounded-xl text-white focus:outline-none focus:border-rose-400 focus:bg-rose-950/20 transition-all"
                  />
                ))}
              </div>

              <div className="flex items-center justify-between text-xs text-gray-400">
                <button
                  type="button"
                  onClick={() => setOtpCode(['7', '4', '2', '9', '1', '0'])}
                  className="text-amber-300 font-semibold hover:underline"
                >
                  Auto-fill demo code (742910)
                </button>
                <span>Resend in {resendTimer}s</span>
              </div>

              <button
                onClick={handleVerifyOtp}
                disabled={isLoading}
                className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-pink-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2"
              >
                {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Verify & Continue</span>}
              </button>
            </motion.div>
          )}

          {/* ========================================================================= */}
          {/* MODE: PASSWORD RESET */}
          {/* ========================================================================= */}
          {mode === 'password_reset' && (
            <motion.div
              key="password_reset"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.35 }}
              className="space-y-3.5"
            >
              <div>
                <h2 className="text-2xl font-extrabold text-white">Create New Password</h2>
                <p className="text-xs text-gray-300">Set a secure password for your CREST account</p>
              </div>

              {error && (
                <div className="p-2.5 rounded-xl bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              <form onSubmit={handlePasswordReset} className="space-y-2.5">
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="New Password (min 6 chars)"
                  className="w-full px-4 py-3 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Confirm New Password"
                  className="w-full px-4 py-3 bg-black/50 backdrop-blur-md border border-white/15 rounded-2xl text-white placeholder-gray-400 text-sm focus:outline-none focus:border-rose-400"
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className="w-full py-3.5 bg-gradient-to-r from-rose-500 to-amber-500 text-white font-bold rounded-2xl text-sm shadow-xl flex items-center justify-center gap-2"
                >
                  {isLoading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <span>Update Password & Log In</span>}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};
