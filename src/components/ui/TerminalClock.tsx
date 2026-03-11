import { useState, useEffect, memo } from 'react';

interface TerminalClockProps {
  /** 'time' = HH:MM:SS only, 'datetime' = date + time, 'full' = weekday + date + time */
  format?: 'time' | 'datetime' | 'full';
  className?: string;
  /** Optional second line with date (rendered below the time) */
  showDate?: boolean;
  dateClassName?: string;
  /** Customize the date format options */
  dateOptions?: Intl.DateTimeFormatOptions;
}

/**
 * Self-contained clock that only re-renders itself every second.
 * Use this instead of putting setInterval(setCurrentTime, 1000) in parent components,
 * which would cascade re-renders through the entire subtree.
 */
const TerminalClock = memo(({
  format = 'time',
  className = '',
  showDate = false,
  dateClassName = '',
  dateOptions,
}: TerminalClockProps) => {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);

  const timeStr = now.toLocaleTimeString('en-US', { hour12: false });

  const dateStr = (() => {
    if (format === 'full') {
      return now.toLocaleString('en-US', {
        weekday: 'short',
        month: 'short',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
      });
    }
    if (showDate || format === 'datetime') {
      return now.toLocaleDateString('en-US', dateOptions ?? {
        month: 'short',
        day: '2-digit',
      }).toUpperCase();
    }
    return '';
  })();

  if (format === 'full') {
    return <span className={className}>{dateStr}</span>;
  }

  return (
    <>
      <span className={className}>{timeStr}</span>
      {showDate && dateStr && <span className={dateClassName}>{dateStr}</span>}
    </>
  );
});

TerminalClock.displayName = 'TerminalClock';

export { TerminalClock };
export default TerminalClock;
