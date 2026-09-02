import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Mail, ArrowLeft, CheckCircle2, KeyRound } from 'lucide-react';
import { authApi } from '../api/auth.api';
import { useToast } from '../context/ToastContext';
import { GlassCard } from '../components/common/GlassCard';
import { AnimatedButton } from '../components/common/AnimatedButton';

export const ForgotPasswordPage: React.FC = () => {
  const toast = useToast();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error('Please enter your email address.');
      return;
    }

    setIsLoading(true);
    try {
      const msg = await authApi.forgotPassword({ email });
      setIsSent(true);
      toast.success(msg || 'Password reset link sent to your email!');
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Failed to send password reset email.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center p-4 bg-gradient-to-br from-rose-100 via-purple-100 to-amber-100 overflow-hidden">
      {/* Background Ambient Glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-rose-400/30 blur-3xl pointer-events-none" />
      <div className="fixed -bottom-40 -right-40 w-96 h-96 rounded-full bg-purple-400/30 blur-3xl pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard hoverEffect={false} className="shadow-2xl shadow-rose-900/10 backdrop-blur-2xl">
          {/* Header */}
          <div className="text-center mb-8">
            <div className="w-14 h-14 rounded-3xl bg-gradient-to-tr from-rose-500 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-xl shadow-rose-200 mx-auto mb-4">
              <KeyRound className="w-7 h-7" />
            </div>
            <h2 className="text-2xl font-black text-slate-800 tracking-tight">Forgot Password?</h2>
            <p className="text-xs font-semibold text-slate-500 mt-1">
              Enter your email to receive a password reset token & link
            </p>
          </div>

          {isSent ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center space-y-5"
            >
              <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-medium flex flex-col items-center gap-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
                <p className="font-bold text-sm text-emerald-900">Email Dispatched!</p>
                <p>
                  If an account exists for <strong>{email}</strong>, you will receive a Brevo email containing your password reset link & security token.
                </p>
              </div>

              <div className="space-y-3 pt-2">
                <Link to={`/reset-password?email=${encodeURIComponent(email)}`}>
                  <AnimatedButton className="w-full" size="md" icon={<KeyRound className="w-4 h-4" />}>
                    Enter Reset Token
                  </AnimatedButton>
                </Link>

                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors pt-2"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-1.5">
                  Registered Email Address
                </label>
                <div className="relative">
                  <Mail className="w-5 h-5 text-slate-700 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10" />
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="name@example.com"
                    className="w-full pl-11 pr-4 py-3 rounded-2xl glass-input text-sm font-medium"
                    required
                  />
                </div>
              </div>

              <AnimatedButton
                type="submit"
                isLoading={isLoading}
                className="w-full py-3.5 text-sm font-bold shadow-lg shadow-rose-200"
                icon={<Sparkles className="w-4 h-4" />}
              >
                Send Password Reset Email
              </AnimatedButton>

              <div className="text-center pt-2">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-2 text-xs font-bold text-slate-600 hover:text-rose-600 transition-colors"
                >
                  <ArrowLeft className="w-4 h-4" />
                  <span>Back to Sign In</span>
                </Link>
              </div>
            </form>
          )}
        </GlassCard>
      </motion.div>
    </div>
  );
};
