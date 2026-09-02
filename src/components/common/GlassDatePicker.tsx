import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';

interface GlassDatePickerProps {
  value: string; // YYYY-MM-DD
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minDate?: string;
  popoverPosition?: 'bottom' | 'top';
  align?: 'left' | 'right';
}

export const GlassDatePicker: React.FC<GlassDatePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select date...',
  className = '',
  minDate,
  popoverPosition = 'bottom',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current selected date or fallback to today
  const selectedDate = value ? new Date(value + 'T00:00:00') : null;

  // View state for navigating calendar months
  const [viewDate, setViewDate] = useState(() => {
    return selectedDate ? new Date(selectedDate) : new Date();
  });

  // Sync view date if value changes from outside
  useEffect(() => {
    if (value) {
      setViewDate(new Date(value + 'T00:00:00'));
    }
  }, [value]);

  // Close calendar popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];

  const daysOfWeek = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];

  const prevMonth = () => {
    setViewDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setViewDate(new Date(year, month + 1, 1));
  };

  const handleDateClick = (day: number) => {
    const formattedMonth = String(month + 1).padStart(2, '0');
    const formattedDay = String(day).padStart(2, '0');
    const dateStr = `${year}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setIsOpen(false);
  };

  const handleTodayClick = () => {
    const today = new Date();
    const formattedMonth = String(today.getMonth() + 1).padStart(2, '0');
    const formattedDay = String(today.getDate()).padStart(2, '0');
    const dateStr = `${today.getFullYear()}-${formattedMonth}-${formattedDay}`;
    onChange(dateStr);
    setViewDate(today);
    setIsOpen(false);
  };

  // Calendar math
  const firstDayOfMonth = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrevMonth = new Date(year, month, 0).getDate();

  // Today comparison
  const todayObj = new Date();
  const isCurrentMonthToday =
    todayObj.getFullYear() === year && todayObj.getMonth() === month;
  const todayDateNumber = todayObj.getDate();

  // Format date display for trigger button
  const displayString = selectedDate
    ? selectedDate.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      })
    : '';

  return (
    <div ref={containerRef} className={`relative ${className} ${isOpen ? 'z-50' : ''}`}>
      {/* Trigger Input Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between py-3 pl-11 pr-4 rounded-2xl glass-input text-sm font-medium transition-all cursor-pointer ${
          isOpen ? 'ring-2 ring-rose-400 border-rose-400 bg-white/95 shadow-md' : ''
        }`}
      >
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-700">
          <CalendarIcon className="w-5 h-5" />
        </div>

        <span className={`truncate ${displayString ? 'text-slate-800 font-semibold' : 'text-slate-400'}`}>
          {displayString || placeholder}
        </span>
      </button>

      {/* Floating Glass Calendar Popover */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] w-72 p-4 rounded-3xl bg-white/95 backdrop-blur-2xl border border-rose-200/90 shadow-2xl shadow-rose-900/15 ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${
              popoverPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-1'
            }`}
          >
            {/* Header: Month & Year + Controls */}
            <div className="flex items-center justify-between mb-3 px-1">
              <span className="text-sm font-black text-slate-800 tracking-tight">
                {monthNames[month]} {year}
              </span>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={prevMonth}
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={nextMonth}
                  className="p-1.5 rounded-xl hover:bg-rose-50 text-slate-600 hover:text-rose-600 transition-colors cursor-pointer"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Weekday Names */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {daysOfWeek.map((day) => (
                <span key={day} className="text-[11px] font-bold text-slate-400 uppercase py-1">
                  {day}
                </span>
              ))}
            </div>

            {/* Days Grid */}
            <div className="grid grid-cols-7 gap-1 text-center">
              {/* Prev Month Padding Days */}
              {Array.from({ length: firstDayOfMonth }).map((_, idx) => (
                <span
                  key={`prev-${idx}`}
                  className="text-xs text-slate-300 py-2 font-medium"
                >
                  {daysInPrevMonth - firstDayOfMonth + idx + 1}
                </span>
              ))}

              {/* Current Month Days */}
              {Array.from({ length: daysInMonth }).map((_, idx) => {
                const dayNum = idx + 1;
                const isSelected =
                  selectedDate &&
                  selectedDate.getFullYear() === year &&
                  selectedDate.getMonth() === month &&
                  selectedDate.getDate() === dayNum;

                const isToday = isCurrentMonthToday && todayDateNumber === dayNum;

                return (
                  <button
                    key={`day-${dayNum}`}
                    type="button"
                    onClick={() => handleDateClick(dayNum)}
                    className={`text-xs py-2 rounded-xl font-bold transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-gradient-to-tr from-rose-500 to-purple-600 text-white shadow-md shadow-rose-200 scale-105'
                        : isToday
                        ? 'bg-rose-50 text-rose-700 border border-rose-300 font-black'
                        : 'text-slate-700 hover:bg-rose-50 hover:text-rose-600'
                    }`}
                  >
                    {dayNum}
                  </button>
                );
              })}
            </div>

            {/* Footer Action Row */}
            <div className="flex items-center justify-between pt-3 mt-2 border-t border-rose-100">
              <button
                type="button"
                onClick={handleTodayClick}
                className="text-xs font-bold text-rose-600 hover:text-rose-700 transition-colors cursor-pointer"
              >
                Today
              </button>
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  setIsOpen(false);
                }}
                className="text-xs font-semibold text-slate-400 hover:text-slate-600 transition-colors cursor-pointer"
              >
                Clear
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
