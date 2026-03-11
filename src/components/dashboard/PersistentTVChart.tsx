import { useEffect, useRef, useState } from 'react';
import { Loader2 } from 'lucide-react';

/* ────────────────────────────────────────────────────────────────────
 * PersistentTVChart
 *
 * Uses TradingView's `tv.js` widget constructor (NOT the embed widget).
 * The widget constructor creates a full-featured chart inside an iframe
 * hosted on s.tradingview.com. TradingView stores drawing data in the
 * browser's IndexedDB under its own origin, so:
 *
 *  ✅ Drawings persist while the iframe stays in the DOM (same session)
 *  ✅ Drawings survive hide/show via CSS (modal close/reopen)
 *  ✅ Full drawing toolbar, save-image, popup, symbol change
 *  ✅ Sign into TradingView inside the chart → drawings sync to cloud
 *     and persist across reloads / devices
 * ──────────────────────────────────────────────────────────────────── */

declare global {
  interface Window {
    TradingView: any;
  }
}

/* ── Load tv.js once globally ── */
let _tvPromise: Promise<void> | null = null;

function ensureTVScript(): Promise<void> {
  if (window.TradingView) return Promise.resolve();
  if (_tvPromise) return _tvPromise;

  _tvPromise = new Promise<void>((resolve) => {
    const existing = document.querySelector('script[src*="s3.tradingview.com/tv.js"]');
    if (existing) {
      // Script tag exists but hasn't loaded yet — wait for it
      const check = () => {
        if (window.TradingView) resolve();
        else setTimeout(check, 100);
      };
      check();
      return;
    }

    const script = document.createElement('script');
    script.src = 'https://s3.tradingview.com/tv.js';
    script.async = true;
    script.onload = () => resolve();
    document.head.appendChild(script);
  });

  return _tvPromise;
}

/* ── Component ── */
interface PersistentTVChartProps {
  symbol: string;
}

export function PersistentTVChart({ symbol }: PersistentTVChartProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const widgetIdRef = useRef(`nb_tv_${Math.random().toString(36).slice(2, 8)}`);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError(false);

    ensureTVScript()
      .then(() => {
        if (cancelled || !containerRef.current) return;

        // Clear any previous widget
        containerRef.current.innerHTML = '';

        // Create inner mount-point
        const el = document.createElement('div');
        el.id = widgetIdRef.current;
        el.style.cssText = 'width:100%;height:100%';
        containerRef.current.appendChild(el);

        try {
          new window.TradingView.widget({
            container_id: widgetIdRef.current,
            autosize: true,
            symbol,
            interval: 'D',
            timezone: 'Asia/Kolkata',
            theme: 'dark',
            style: '1',
            locale: 'in',
            toolbar_bg: '#0a0a0e',
            enable_publishing: false,

            // ── Drawing & Save features ──
            save_image: true,
            hide_side_toolbar: false,   // Drawing tools visible
            hide_top_toolbar: false,
            hide_legend: false,
            allow_symbol_change: true,  // Navigate symbols inside the chart
            show_popup_button: true,    // Pop-out to TradingView (sign-in + save)
            popup_width: '1000',
            popup_height: '650',

            // ── Extras ──
            withdateranges: true,
            range: '12M',
            details: true,
            calendar: true,

            // ── Styling ──
            backgroundColor: 'rgba(10, 10, 14, 1)',
            gridColor: 'rgba(42, 46, 57, 0.3)',

            // ── Indicators ──
            studies: [
              'Volume@tv-basicstudies',
              'MASimple@tv-basicstudies',
            ],
          });
        } catch {
          if (!cancelled) setError(true);
        }

        // TradingView widget injects its iframe asynchronously
        const checkLoaded = () => {
          if (cancelled) return;
          const iframe = containerRef.current?.querySelector('iframe');
          if (iframe) {
            setLoading(false);
          } else {
            setTimeout(checkLoaded, 300);
          }
        };
        setTimeout(checkLoaded, 400);

        // Safety: if it hasn't loaded in 8s, stop spinner
        setTimeout(() => {
          if (!cancelled) setLoading(false);
        }, 8000);
      })
      .catch(() => {
        if (!cancelled) {
          setError(true);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [symbol]);

  if (error) {
    return (
      <div className="w-full h-full flex flex-col items-center justify-center gap-4 text-center p-8 bg-[#0a0a0e]">
        <div className="p-3 rounded-full bg-amber-500/10">
          <svg className="w-6 h-6 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M12 3l9 16H3L12 3z" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-white">Chart failed to load</p>
        <p className="text-xs text-gray-400 max-w-md">
          TradingView widget could not load. This may be due to an ad-blocker or network restriction.
        </p>
        <a
          href={`https://www.tradingview.com/chart/?symbol=${encodeURIComponent(symbol)}`}
          target="_blank"
          rel="noreferrer"
          className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-bold hover:bg-emerald-500/20 transition-colors"
        >
          Open on TradingView ↗
        </a>
      </div>
    );
  }

  return (
    <div className="w-full h-full relative bg-[#0a0a0e]">
      {loading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-[#0a0a0e]">
          <div className="flex flex-col items-center gap-3">
            <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
            <span className="text-xs text-gray-500">Loading chart…</span>
          </div>
        </div>
      )}
      <div ref={containerRef} className="w-full h-full" />
    </div>
  );
}
