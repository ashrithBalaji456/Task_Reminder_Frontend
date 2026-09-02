import React, { useState } from 'react';
import { Modal } from '../common/Modal';
import { AnimatedButton } from '../common/AnimatedButton';
import { GlassDatePicker } from '../common/GlassDatePicker';
import { Calendar, ArrowRight } from 'lucide-react';

interface MoveTaskModalProps {
  isOpen: boolean;
  onClose: () => void;
  taskTitle: string;
  onMoveToTomorrow: () => Promise<void>;
  onMoveToDate: (targetDate: string) => Promise<void>;
}

export const MoveTaskModal: React.FC<MoveTaskModalProps> = ({
  isOpen,
  onClose,
  taskTitle,
  onMoveToTomorrow,
  onMoveToDate,
}) => {
  const [targetDate, setTargetDate] = useState('');
  const [isSubmittingTomorrow, setIsSubmittingTomorrow] = useState(false);
  const [isSubmittingDate, setIsSubmittingDate] = useState(false);

  const handleTomorrow = async () => {
    setIsSubmittingTomorrow(true);
    try {
      await onMoveToTomorrow();
      onClose();
    } finally {
      setIsSubmittingTomorrow(false);
    }
  };

  const handleCustomDate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!targetDate) return;
    setIsSubmittingDate(true);
    try {
      await onMoveToDate(targetDate);
      onClose();
    } finally {
      setIsSubmittingDate(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Move Task" subtitle={`Reschedule "${taskTitle}"`}>
      <div className="space-y-6">
        {/* Quick Action: Move to Tomorrow */}
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-50 to-purple-50 border border-rose-200/80 flex items-center justify-between">
          <div>
            <h4 className="font-bold text-slate-800 text-sm">Move to Tomorrow</h4>
            <p className="text-xs text-slate-500">Reschedules task occurrence to tomorrow date</p>
          </div>
          <AnimatedButton
            size="sm"
            onClick={handleTomorrow}
            isLoading={isSubmittingTomorrow}
            icon={<ArrowRight className="w-4 h-4" />}
          >
            Tomorrow
          </AnimatedButton>
        </div>

        <div className="flex items-center gap-3 my-2">
          <div className="h-px bg-slate-200 flex-1" />
          <span className="text-xs font-semibold text-slate-400 uppercase">Or Choose Specific Date</span>
          <div className="h-px bg-slate-200 flex-1" />
        </div>

        {/* Custom Target Date Form */}
        <form onSubmit={handleCustomDate} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
              Target Date
            </label>
            <GlassDatePicker
              value={targetDate}
              onChange={setTargetDate}
              placeholder="Select target date..."
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2">
            <AnimatedButton type="button" variant="ghost" size="sm" onClick={onClose}>
              Cancel
            </AnimatedButton>
            <AnimatedButton
              type="submit"
              size="sm"
              isLoading={isSubmittingDate}
              disabled={!targetDate}
            >
              Move to Selected Date
            </AnimatedButton>
          </div>
        </form>
      </div>
    </Modal>
  );
};
