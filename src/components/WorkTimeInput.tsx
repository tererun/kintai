'use client';

import { useState, useEffect, useRef } from 'react';

interface WorkTimeInputProps {
  mode: 'endTime' | 'duration';
  onModeChange: (mode: 'endTime' | 'duration') => void;
  onEndTimeChange: (endTime: string) => void;
}

function formatTime(date: Date): string {
  return date.toTimeString().slice(0, 5);
}

function addHours(date: Date, hours: number): Date {
  return new Date(date.getTime() + hours * 60 * 60 * 1000);
}

function calculateDuration(start: Date, endTime: string): number {
  const [hours, minutes] = endTime.split(':').map(Number);
  const end = new Date(start);
  end.setHours(hours, minutes, 0, 0);
  if (end <= start) {
    end.setDate(end.getDate() + 1);
  }
  return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
}

export function WorkTimeInput({ mode, onModeChange, onEndTimeChange }: WorkTimeInputProps) {
  const [endTime, setEndTime] = useState('18:00');
  const [duration, setDuration] = useState(8);
  const [now, setNow] = useState<Date | null>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    setNow(new Date());
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (mode === 'duration' && !initializedRef.current && now) {
      initializedRef.current = true;
      const calculated = formatTime(addHours(now, duration));
      setEndTime(calculated);
      onEndTimeChange(calculated);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, now]);

  const handleEndTimeChange = (value: string) => {
    setEndTime(value);
    onEndTimeChange(value);
    if (mode === 'endTime' && now) {
      const dur = calculateDuration(now, value);
      setDuration(Math.round(dur * 10) / 10);
    }
  };

  const handleDurationChange = (value: number) => {
    if (!now) return;
    setDuration(value);
    const calculated = formatTime(addHours(now, value));
    setEndTime(calculated);
    onEndTimeChange(calculated);
  };

  const displayDuration = now && mode === 'endTime' ? calculateDuration(now, endTime) : duration;
  const displayHours = Math.floor(displayDuration);
  const displayMinutes = Math.round((displayDuration - displayHours) * 60);
  const nowDisplay = now ? formatTime(now) : '--:--';

  return (
    <div className="space-y-5">
      <div className="inline-flex p-1 rounded-xl bg-[var(--background)] border border-[var(--border)]">
        <button
          onClick={() => onModeChange('endTime')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            mode === 'endTime'
              ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          終了時刻指定
        </button>
        <button
          onClick={() => onModeChange('duration')}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            mode === 'duration'
              ? 'bg-[var(--surface)] text-[var(--foreground)] shadow-sm'
              : 'text-[var(--muted)] hover:text-[var(--foreground)]'
          }`}
        >
          勤務時間指定
        </button>
      </div>

      <div className="flex items-center gap-4">
        {mode === 'endTime' ? (
          <div className="flex items-center gap-3">
            <label className="text-sm text-[var(--muted)]">終了予定</label>
            <input
              type="time"
              value={endTime}
              onChange={(e) => handleEndTimeChange(e.target.value)}
              className="px-4 py-2.5 text-lg font-medium border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200"
            />
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <label className="text-sm text-[var(--muted)]">勤務時間</label>
            <div className="relative">
              <input
                type="number"
                min="0.5"
                max="24"
                step="0.5"
                value={duration}
                onChange={(e) => handleDurationChange(parseFloat(e.target.value))}
                className="w-24 px-4 py-2.5 text-lg font-medium border-2 border-[var(--border)] rounded-xl bg-[var(--surface)] focus:border-[var(--accent)] focus:outline-none transition-colors duration-200 pr-12"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-[var(--muted)]">時間</span>
            </div>
          </div>
        )}
      </div>

      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] p-4">
        <div className="relative z-10 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-white/80 dark:bg-black/30 flex items-center justify-center">
              <span className="text-2xl">⏱</span>
            </div>
            <div>
              <p className="text-sm text-[var(--muted)]">勤務予定</p>
              <p className="text-xl font-serif font-medium">
                {displayHours}時間{displayMinutes > 0 ? `${displayMinutes}分` : ''}
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm text-[var(--muted)]">{nowDisplay} → {endTime}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
