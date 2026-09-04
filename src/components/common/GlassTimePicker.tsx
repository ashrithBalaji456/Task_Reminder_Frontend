import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Check } from 'lucide-react';

interface GlassTimePickerProps {
  value: string; // HH:mm format (24-hour e.g. "10:00" or "14:30")
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  popoverPosition?: 'bottom' | 'top';
  align?: 'left' | 'right';
}

export const GlassTimePicker: React.FC<GlassTimePickerProps> = ({
  value,
  onChange,
  placeholder = 'Select time...',
  className = '',
  popoverPosition = 'top',
  align = 'left',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [mode, setMode] = useState<'hour' | 'minute'>('hour');
  const [isDragging, setIsDragging] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const dialRef = useRef<HTMLDivElement>(null);

  // Parse initial HH:mm 24-hour value into 12-hour components
  const { initialHour12, initialMinute, initialAmPm } = useMemo<{
    initialHour12: number;
    initialMinute: number;
    initialAmPm: 'AM' | 'PM';
  }>(() => {
    let h = 9;
    let m = 0;
    if (value && value.includes(':')) {
      const parts = value.split(':').map(Number);
      h = parts[0] ?? 9;
      m = parts[1] ?? 0;
    }
    const ampm: 'AM' | 'PM' = h >= 12 ? 'PM' : 'AM';
    let h12 = h % 12;
    if (h12 === 0) h12 = 12;
    return { initialHour12: h12, initialMinute: m, initialAmPm: ampm };
  }, [value]);

  const [selectedHour12, setSelectedHour12] = useState<number>(initialHour12);
  const [selectedMinute, setSelectedMinute] = useState<number>(initialMinute);
  const [selectedAmPm, setSelectedAmPm] = useState<'AM' | 'PM'>(initialAmPm);

  // Sync state when value changes externally or popover opens
  useEffect(() => {
    setSelectedHour12(initialHour12);
    setSelectedMinute(initialMinute);
    setSelectedAmPm(initialAmPm);
  }, [initialHour12, initialMinute, initialAmPm, isOpen]);

  // Close popover on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Format 12-hour + AM/PM back to 24-hour "HH:mm"
  const format24Hour = (h12: number, min: number, ampm: 'AM' | 'PM') => {
    let h24 = h12 % 12;
    if (ampm === 'PM') h24 += 12;
    const hStr = String(h24).padStart(2, '0');
    const mStr = String(min).padStart(2, '0');
    return `${hStr}:${mStr}`;
  };

  const handleConfirm = () => {
    const time24 = format24Hour(selectedHour12, selectedMinute, selectedAmPm);
    onChange(time24);
    setIsOpen(false);
  };

  const handleAmPmChange = (ampm: 'AM' | 'PM') => {
    setSelectedAmPm(ampm);
    onChange(format24Hour(selectedHour12, selectedMinute, ampm));
  };

  // Formatted display string for input button (e.g. "10:00 AM")
  const displayString = useMemo(() => {
    const hStr = String(selectedHour12).padStart(2, '0');
    const mStr = String(selectedMinute).padStart(2, '0');
    return `${hStr}:${mStr} ${selectedAmPm}`;
  }, [selectedHour12, selectedMinute, selectedAmPm]);

  // Geometry Constants
  const clockCenter = 110; // Center of 220px x 220px container
  const handRadius = 75; // Exact radius matching number centers

  // Angles (deg from top 12 o'clock clockwise)
  const hourAngle = (selectedHour12 % 12) * 30; // 30 deg per hour
  const minuteAngle = (selectedMinute / 60) * 360; // 6 deg per minute (360 / 60 = 6)

  const currentAngle = mode === 'hour' ? hourAngle : minuteAngle;

  const handRad = (currentAngle - 90) * (Math.PI / 180);
  const handX = clockCenter + handRadius * Math.cos(handRad);
  const handY = clockCenter + handRadius * Math.sin(handRad);

  // Hour Numbers (12 at top, 1, 2, 3...)
  const hourNumbers = [12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11];
  // Minute Numbers (00 at top, 05, 10...)
  const minuteNumbers = [0, 5, 10, 15, 20, 25, 30, 35, 40, 45, 50, 55];

  // --- Continuous Pointer Drag Handlers ---
  const updateAngleFromPointer = useCallback(
    (clientX: number, clientY: number) => {
      if (!dialRef.current) return;
      const rect = dialRef.current.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;

      const dx = clientX - cx;
      const dy = clientY - cy;

      // Calculate angle clockwise starting from top 12 o'clock (-90 deg in Cartesian)
      let angleDeg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (angleDeg < 0) angleDeg += 360;

      if (mode === 'hour') {
        let h = Math.round(angleDeg / 30);
        if (h === 0) h = 12;
        if (h > 12) h = 12;
        setSelectedHour12(h);
        onChange(format24Hour(h, selectedMinute, selectedAmPm));
      } else {
        let m = Math.round(angleDeg / 6) % 60;
        setSelectedMinute(m);
        onChange(format24Hour(selectedHour12, m, selectedAmPm));
      }
    },
    [mode, selectedHour12, selectedMinute, selectedAmPm, onChange]
  );

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.currentTarget.setPointerCapture(e.pointerId);
    setIsDragging(true);
    updateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    updateAngleFromPointer(e.clientX, e.clientY);
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}

    // Auto-advance from Hour selection to Minute selection
    if (mode === 'hour') {
      setMode('minute');
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className} ${isOpen ? 'z-50' : ''}`}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between py-3 pl-11 pr-4 rounded-2xl glass-input text-sm font-medium transition-all cursor-pointer ${
          isOpen ? 'ring-2 ring-rose-400 border-rose-400 bg-white/95 shadow-md' : ''
        }`}
      >
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none z-10 text-slate-700">
          <Clock className="w-5 h-5 text-rose-500" />
        </div>

        <span className="truncate text-slate-800 font-bold tracking-tight">
          {displayString || placeholder}
        </span>
      </button>

      {/* Floating Glassy Clock Popover Modal */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 4, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`absolute z-[100] w-80 p-5 rounded-3xl bg-white/95 backdrop-blur-2xl border border-rose-200/90 shadow-2xl shadow-rose-900/20 ${
              align === 'right' ? 'right-0' : 'left-0'
            } ${
              popoverPosition === 'top' ? 'bottom-full mb-2' : 'top-full mt-1'
            }`}
          >
            {/* Header Display & AM/PM Switcher */}
            <div className="flex items-center justify-between p-3.5 rounded-2xl bg-gradient-to-r from-rose-500/10 via-purple-500/10 to-amber-500/10 border border-purple-100 mb-4">
              <div className="flex items-baseline gap-1">
                {/* Hour Digits */}
                <button
                  type="button"
                  onClick={() => setMode('hour')}
                  className={`text-3xl font-black tracking-tight transition-colors cursor-pointer ${
                    mode === 'hour'
                      ? 'text-rose-600 underline underline-offset-4 decoration-2 decoration-rose-500'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {String(selectedHour12).padStart(2, '0')}
                </button>
                <span className="text-3xl font-black text-slate-400">:</span>
                {/* Minute Digits */}
                <button
                  type="button"
                  onClick={() => setMode('minute')}
                  className={`text-3xl font-black tracking-tight transition-colors cursor-pointer ${
                    mode === 'minute'
                      ? 'text-purple-600 underline underline-offset-4 decoration-2 decoration-purple-500'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  {String(selectedMinute).padStart(2, '0')}
                </button>
              </div>

              {/* AM / PM Toggle Pills */}
              <div className="flex flex-col gap-1 bg-white/80 p-1 rounded-xl border border-rose-100 shadow-2xs">
                <button
                  type="button"
                  onClick={() => handleAmPmChange('AM')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedAmPm === 'AM'
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  AM
                </button>
                <button
                  type="button"
                  onClick={() => handleAmPmChange('PM')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                    selectedAmPm === 'PM'
                      ? 'bg-gradient-to-r from-rose-500 to-purple-600 text-white shadow-sm'
                      : 'text-slate-500 hover:text-slate-800'
                  }`}
                >
                  PM
                </button>
              </div>
            </div>

            {/* Mode Selector Tabs (Hour vs Minute) */}
            <div className="flex items-center gap-2 mb-4 bg-slate-100/70 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setMode('hour')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'hour'
                    ? 'bg-white text-rose-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Select Hour
              </button>
              <button
                type="button"
                onClick={() => setMode('minute')}
                className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  mode === 'minute'
                    ? 'bg-white text-purple-600 shadow-xs'
                    : 'text-slate-500 hover:text-slate-800'
                }`}
              >
                Select Minute
              </button>
            </div>

            {/* Interactive Touch/Mouse Drag Analog Clock Dial */}
            <div
              ref={dialRef}
              onPointerDown={handlePointerDown}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onPointerCancel={handlePointerUp}
              style={{ touchAction: 'none' }}
              className="relative w-[220px] h-[220px] mx-auto rounded-full bg-gradient-to-br from-rose-50/80 via-purple-50/60 to-amber-50/40 border border-rose-200/60 shadow-inner flex items-center justify-center mb-5 touch-none select-none cursor-grab active:cursor-grabbing"
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none z-10">
                {/* Clock Center Pin */}
                <circle cx={clockCenter} cy={clockCenter} r="5" fill="#f43f5e" />

                {/* SVG Pointer Hand Line */}
                <line
                  x1={clockCenter}
                  y1={clockCenter}
                  x2={handX}
                  y2={handY}
                  stroke="#f43f5e"
                  strokeWidth="3"
                  strokeLinecap="round"
                />

                {/* Outer Selection Knob Circle */}
                <circle cx={handX} cy={handY} r="18" fill="url(#handGrad)" />
                <text
                  x={handX}
                  y={handY}
                  fill="#ffffff"
                  fontSize="11"
                  fontWeight="bold"
                  textAnchor="middle"
                  dominantBaseline="central"
                  className="pointer-events-none select-none"
                >
                  {mode === 'hour' ? selectedHour12 : String(selectedMinute).padStart(2, '0')}
                </text>
                <defs>
                  <linearGradient id="handGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#f43f5e" />
                    <stop offset="100%" stopColor="#9333ea" />
                  </linearGradient>
                </defs>
              </svg>

              {/* Number Markers around the 360deg dial face (pointer-events-none) */}
              {mode === 'hour'
                ? hourNumbers.map((num, idx) => {
                    const angleDeg = idx * 30 - 90;
                    const rad = angleDeg * (Math.PI / 180);
                    const x = clockCenter + handRadius * Math.cos(rad) - 16;
                    const y = clockCenter + handRadius * Math.sin(rad) - 16;
                    const isSelected = selectedHour12 === num;

                    return (
                      <div
                        key={num}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all z-20 pointer-events-none ${
                          isSelected
                            ? 'text-white scale-110'
                            : 'text-slate-700'
                        }`}
                      >
                        {num}
                      </div>
                    );
                  })
                : minuteNumbers.map((num, idx) => {
                    const angleDeg = idx * 30 - 90;
                    const rad = angleDeg * (Math.PI / 180);
                    const x = clockCenter + handRadius * Math.cos(rad) - 16;
                    const y = clockCenter + handRadius * Math.sin(rad) - 16;
                    const isSelected = selectedMinute === num;

                    return (
                      <div
                        key={num}
                        style={{ left: `${x}px`, top: `${y}px` }}
                        className={`absolute w-8 h-8 rounded-full flex items-center justify-center text-xs font-black transition-all z-20 pointer-events-none ${
                          isSelected
                            ? 'text-white scale-110'
                            : 'text-slate-700'
                        }`}
                      >
                        {String(num).padStart(2, '0')}
                      </div>
                    );
                  })}
            </div>

            {/* Action Buttons Row */}
            <div className="flex items-center justify-between pt-3 border-t border-rose-100">
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="px-3.5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-all cursor-pointer"
              >
                Cancel
              </button>

              <button
                type="button"
                onClick={handleConfirm}
                className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-gradient-to-r from-rose-500 via-purple-600 to-amber-500 hover:opacity-95 shadow-md shadow-rose-200 flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Set Time</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

