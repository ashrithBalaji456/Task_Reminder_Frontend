import React from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';
import { Loader2 } from 'lucide-react';

interface AnimatedButtonProps extends HTMLMotionProps<'button'> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  icon?: React.ReactNode;
  children: React.ReactNode;
}

export const AnimatedButton: React.FC<AnimatedButtonProps> = ({
  variant = 'primary',
  size = 'md',
  isLoading = false,
  icon,
  children,
  className = '',
  disabled,
  ...props
}) => {
  const sizeClasses = {
    sm: 'px-3 py-1.5 text-xs rounded-xl font-medium',
    md: 'px-5 py-2.5 text-sm rounded-2xl font-semibold',
    lg: 'px-7 py-3.5 text-base rounded-2xl font-semibold',
  };

  const variantClasses = {
    primary: 'glass-button-primary',
    secondary: 'bg-white/80 text-purple-900 border border-purple-200/60 shadow-sm hover:bg-white hover:border-purple-300',
    outline: 'bg-transparent text-rose-600 border border-rose-300/80 hover:bg-rose-50/50',
    danger: 'bg-gradient-to-r from-rose-500 to-red-600 text-white shadow-md hover:from-rose-600 hover:to-red-700',
    ghost: 'bg-transparent text-slate-600 hover:bg-slate-100/60 hover:text-slate-900',
  };

  return (
    <motion.button
      whileHover={{ scale: disabled || isLoading ? 1 : 1.02 }}
      whileTap={{ scale: disabled || isLoading ? 1 : 0.97 }}
      disabled={disabled || isLoading}
      className={`flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed ${sizeClasses[size]} ${variantClasses[variant]} ${className}`}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      <span>{children}</span>
    </motion.button>
  );
};
