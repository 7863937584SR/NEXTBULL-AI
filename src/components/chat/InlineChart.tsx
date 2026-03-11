import { useState } from 'react';
import { TVLazyWidget } from '@/components/dashboard/TVLazyWidget';
import { Maximize2, Minimize2, TrendingUp } from 'lucide-react';

const TVUrl = 'https://s3.tradingview.com/external-embedding/embed-widget-';

interface InlineChartProps {
  symbol: string;
  name: string;
  onExpand?: () => void;
}

export function InlineChart({ symbol, name, onExpand }: InlineChartProps) {
  const [interval, setInterval] = useState<'1' | '5' | '15' | '60' | 'D' | 'W'>('D');
  const [collapsed, setCollapsed] = useState(false);

  const intervals: { label: string; value: typeof interval }[] = [
    { label: '1m', value: '1' },
    { label: '5m', value: '5' },
    { label: '15m', value: '15' },
    { label: '1H', value: '60' },
    { label: '1D', value: 'D' },
    { label: '1W', value: 'W' },
  ];

  if (collapsed) {
    return (
      <button
        onClick={() => setCollapsed(false)}
        className="w-full flex items-center gap-2 px-3 py-2 rounded-lg bg-white/[0.03] border border-white/[0.06] text-gray-400 hover:text-gray-200 hover:bg-white/[0.06] transition-colors text-xs"
      >
        <TrendingUp className="w-3.5 h-3.5 text-emerald-500" />
        <span>Show {name} chart</span>
        <Maximize2 className="w-3 h-3 ml-auto" />
      </button>
    );
  }

  return (
    <div className="mt-3 mb-1 rounded-xl overflow-hidden border border-white/[0.08] bg-[#0a0a0e]">
      {/* Chart header */}
      <div className="flex items-center justify-between px-3 py-2 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[12px] font-semibold text-white">{name}</span>
          <span className="text-[10px] text-gray-500 font-mono">{symbol}</span>
        </div>
        <div className="flex items-center gap-1">
          {/* Timeframe selector */}
          {intervals.map((tf) => (
            <button
              key={tf.value}
              onClick={() => setInterval(tf.value)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                interval === tf.value
                  ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                  : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
              }`}
            >
              {tf.label}
            </button>
          ))}
          <div className="w-px h-4 bg-white/10 mx-1" />
          {onExpand && (
            <button
              onClick={onExpand}
              className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
              title="Open fullscreen chart"
            >
              <Maximize2 className="w-3.5 h-3.5" />
            </button>
          )}
          <button
            onClick={() => setCollapsed(true)}
            className="p-1 rounded text-gray-500 hover:text-white hover:bg-white/10 transition-colors"
            title="Collapse chart"
          >
            <Minimize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Chart body */}
      <div className="w-full" style={{ height: 380 }}>
        <TVLazyWidget
          key={`${symbol}-${interval}`}
          src={`${TVUrl}advanced-chart.js`}
          height="100%"
          skeletonHeight="h-[380px]"
          config={{
            autosize: true,
            symbol: symbol,
            interval: interval,
            timezone: 'Asia/Kolkata',
            theme: 'dark',
            style: '1',
            locale: 'in',
            enable_publishing: false,
            backgroundColor: 'rgba(10, 10, 14, 1)',
            gridColor: 'rgba(42, 46, 57, 0.3)',
            hide_top_toolbar: true,
            hide_side_toolbar: true,
            hide_legend: false,
            save_image: false,
            hide_volume: false,
            allow_symbol_change: false,
            studies: ['Volume@tv-basicstudies', 'MASimple@tv-basicstudies'],
          }}
        />
      </div>
    </div>
  );
}
