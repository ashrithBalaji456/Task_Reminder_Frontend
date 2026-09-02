import React from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Bell, CheckCircle2, BarChart3, ShieldCheck, ArrowRight } from 'lucide-react';
import { AnimatedButton } from '../components/common/AnimatedButton';
import { GlassCard } from '../components/common/GlassCard';

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: Bell,
      title: 'Smart Brevo Reminders',
      description: 'Customizable email notifications (10m, 30m, 1h, 1d) delivered straight to your inbox.',
      color: 'from-pink-500 to-rose-500',
    },
    {
      icon: CheckCircle2,
      title: 'Daily Task Occurrences',
      description: 'Organize tasks for today, tomorrow, or future dates with smooth move & complete actions.',
      color: 'from-purple-500 to-indigo-500',
    },
    {
      icon: BarChart3,
      title: 'Productivity Reports',
      description: 'Weekly and monthly automated email reports with embedded PNG trend charts.',
      color: 'from-amber-400 to-orange-500',
    },
    {
      icon: ShieldCheck,
      title: 'Multi-User Isolation',
      description: 'Secure JWT authentication with BCrypt hashing keeping your personal task data private.',
      color: 'from-emerald-400 to-teal-500',
    },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-rose-50 via-purple-50 to-amber-50 relative overflow-hidden flex flex-col justify-between p-6 sm:p-12">
      {/* Background ambient glows */}
      <div className="fixed -top-40 -left-40 w-96 h-96 rounded-full bg-rose-300/40 blur-3xl pointer-events-none" />
      <div className="fixed top-1/2 -right-40 w-96 h-96 rounded-full bg-purple-300/40 blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="max-w-6xl w-full mx-auto flex items-center justify-between z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-rose-400 via-pink-500 to-purple-600 flex items-center justify-center text-white shadow-md shadow-rose-200">
            <Sparkles className="w-5 h-5" />
          </div>
          <span className="font-extrabold text-xl text-slate-800 tracking-tight">RemindMe 🌸</span>
        </div>

        <div className="flex items-center gap-3">
          <AnimatedButton variant="ghost" onClick={() => navigate('/login')}>
            Sign In
          </AnimatedButton>
          <AnimatedButton onClick={() => navigate('/register')} icon={<ArrowRight className="w-4 h-4" />}>
            Get Started
          </AnimatedButton>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-4xl w-full mx-auto my-12 text-center z-10 space-y-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card border border-rose-200/80 text-rose-600 font-semibold text-xs uppercase tracking-wider shadow-xs"
        >
          <Sparkles className="w-4 h-4" />
          <span>Production-Ready Task & Productivity Platform</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl sm:text-6xl font-black text-slate-900 tracking-tight leading-tight"
        >
          Plan Today.{' '}
          <span className="bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 bg-clip-text text-transparent">
            Never Forget Tomorrow.
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="text-lg text-slate-600 max-w-2xl mx-auto font-normal leading-relaxed"
        >
          A peaceful, modern task manager designed to help you organize work, receive timely email alerts, track history, and review productivity analytics.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="flex items-center justify-center gap-4 pt-4"
        >
          <AnimatedButton size="lg" onClick={() => navigate('/register')} icon={<ArrowRight className="w-5 h-5" />}>
            Create Free Account
          </AnimatedButton>
          <AnimatedButton size="lg" variant="secondary" onClick={() => navigate('/login')}>
            Sign In to Dashboard
          </AnimatedButton>
        </motion.div>

        {/* Feature Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-12 text-left">
          {features.map((feat, index) => {
            const Icon = feat.icon;
            return (
              <GlassCard key={index} className="space-y-3">
                <div className={`w-12 h-12 rounded-2xl bg-gradient-to-tr ${feat.color} flex items-center justify-center text-white shadow-md`}>
                  <Icon className="w-6 h-6" />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{feat.title}</h3>
                <p className="text-sm text-slate-600 leading-relaxed">{feat.description}</p>
              </GlassCard>
            );
          })}
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-6xl w-full mx-auto text-center text-xs text-slate-400 py-6 z-10 border-t border-rose-100/60">
        © 2026 Task Reminder Service. All rights reserved.
      </footer>
    </div>
  );
};
