import { useState, useEffect, useCallback } from 'react';
import { X } from 'lucide-react';
import { PersistentTVChart } from './PersistentTVChart';

/* ────────────────────────────────────────────────────────────────────
 * StockSearchModal — Full-screen chart overlay
 *
 * KEY DESIGN: Uses CSS visibility/opacity instead of Dialog's
 * mount/unmount approach. This keeps the TradingView iframe ALIVE
 * in the DOM when the modal is "closed", so all drawings, indicators,
 * and chart state are preserved within the session.
 *
 * When reopened for the SAME symbol → chart appears instantly with
 * all drawings intact (iframe was never destroyed).
 *
 * When opened for a DIFFERENT symbol → widget is recreated for the
 * new symbol (old drawings for the previous symbol stay in
 * TradingView's IndexedDB and will restore if you return to that
 * symbol while signed into TradingView).
 *
 * For cross-reload / cross-device persistence:
 *   → Sign into TradingView (free account) inside the chart.
 *     All drawings sync to TradingView's cloud automatically.
 * ──────────────────────────────────────────────────────────────────── */

interface StockSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
  symbol: string | null;
}

export function StockSearchModal({ isOpen, onClose, symbol }: StockSearchModalProps) {
  // Keep the last non-null symbol so the chart stays mounted when the
  // overlay is hidden. This is the core of the keep-alive approach.
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  // Only update when a new non-null symbol comes in
  useEffect(() => {
    if (symbol) {
      setActiveSymbol(symbol.trim().toUpperCase());
    }
  }, [symbol]);

  // Escape key to close
  const handleEsc = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    },
    [onClose],
  );

  useEffect(() => {
    if (!isOpen) return;
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, handleEsc]);

  // Lock body scroll when open
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  // Don't render anything until we have at least one symbol
  if (!activeSymbol && !isOpen) return null;

  return (
    <div
      className={`fixed inset-0 z-50 flex flex-col transition-all duration-200 ${
        isOpen
          ? 'opacity-100 visible'
          : 'opacity-0 invisible pointer-events-none'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Content */}
      <div className="relative z-10 flex flex-col w-full h-full bg-[#0a0a0e]">
        {/* ── Header ── */}
        <div className="shrink-0 flex items-center justify-between px-4 py-2.5 border-b border-white/[0.06] bg-[#0e1017]/95 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
              <span className="text-emerald-500 font-bold text-xs tabular-nums">TV</span>
            </div>
            <div>
              <h2 className="text-base font-bold tracking-tight text-white">
                Advanced Analysis:{' '}
                <span className="text-emerald-400">{activeSymbol || '—'}</span>
              </h2>
              <p className="text-[11px] text-gray-500 flex items-center gap-1.5">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Drawings auto-saved within session · Sign into TradingView for permanent save
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="hidden sm:inline text-[10px] text-gray-600">
              Press{' '}
              <kbd className="px-1 py-0.5 bg-white/10 rounded text-gray-400 border border-white/10 text-[9px] font-mono">
                Esc
              </kbd>{' '}
              to close
            </span>
            <button
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-colors"
              title="Close chart"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ── Chart — stays mounted to preserve drawings ── */}
        <div className="flex-1 min-h-0">
          {activeSymbol && <PersistentTVChart symbol={activeSymbol} />}
        </div>
      </div>
    </div>
  );
}
