import { useState, useRef, useEffect, useCallback } from 'react';
import { fetchYahooQuotes, YahooQuote } from '@/services/yahooClient';

interface TerminalLine {
  type: 'input' | 'output' | 'error' | 'info' | 'table';
  text: string;
}

const HELP_TEXT = `
┌─────────────────────────────────────────────────────────┐
│  NextBull Terminal v1.0 — Market Intelligence CLI       │
├─────────────────────────────────────────────────────────┤
│                                                         │
│  COMMANDS:                                              │
│    quote <SYMBOL>       Get live price (e.g. quote TCS) │
│    compare <S1> <S2>    Compare two stocks              │
│    batch <S1,S2,S3>     Get multiple quotes at once     │
│    watchlist             Show default watchlist          │
│    nifty                 NIFTY 50 & Bank NIFTY levels   │
│    crypto                Top crypto prices               │
│    commodities           Gold, Silver, Crude Oil prices  │
│    forex                 Key forex rates                 │
│    clear                 Clear terminal screen           │
│    help                  Show this help                  │
│                                                         │
│  TIPS:                                                  │
│    • Type any NSE symbol directly (e.g. RELIANCE)       │
│    • Use .NS suffix for Yahoo (auto-added)              │
│    • Arrow Up/Down for command history                   │
│                                                         │
└─────────────────────────────────────────────────────────┘`;

const WATCHLIST_SYMBOLS = [
  'RELIANCE.NS', 'TCS.NS', 'INFY.NS', 'HDFCBANK.NS', 'ICICIBANK.NS',
  'ITC.NS', 'SBIN.NS', 'BHARTIARTL.NS', 'TATAMOTORS.NS', 'LT.NS',
];
const CRYPTO_SYMBOLS = ['BTC-USD', 'ETH-USD', 'SOL-USD', 'XRP-USD', 'DOGE-USD', 'ADA-USD'];
const COMMODITY_SYMBOLS = ['GC=F', 'SI=F', 'CL=F', 'BZ=F'];
const FOREX_SYMBOLS = ['USDINR=X', 'EURUSD=X', 'GBPUSD=X', 'USDJPY=X'];
const INDEX_SYMBOLS = ['^NSEI', '^NSEBANK', '^BSESN', '^INDIAVIX'];

function formatQuote(q: YahooQuote): string {
  const arrow = q.change >= 0 ? '▲' : '▼';
  const sign = q.change >= 0 ? '+' : '';
  const color = q.change >= 0 ? 'green' : 'red';
  const priceStr = q.price.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  const changeStr = `${sign}${q.change.toFixed(2)} (${sign}${q.changePercent.toFixed(2)}%)`;
  const vol = q.volume >= 1_000_000
    ? `${(q.volume / 1_000_000).toFixed(1)}M`
    : q.volume >= 1_000
    ? `${(q.volume / 1_000).toFixed(1)}K`
    : q.volume.toString();

  return `  ${q.name.padEnd(22)} ₹${priceStr.padStart(12)}  ${arrow} ${changeStr.padStart(16)}  H:${q.high.toFixed(2)} L:${q.low.toFixed(2)}  Vol:${vol}`;
}

function formatTable(quotes: Record<string, YahooQuote | null>, symbols: string[], title: string): string[] {
  const lines: string[] = [];
  lines.push('');
  lines.push(`  ═══ ${title} ═══`);
  lines.push(`  ${'Name'.padEnd(22)} ${'Price'.padStart(14)}  ${'Change'.padStart(20)}  ${'High'.padStart(10)} ${'Low'.padStart(10)}  ${'Volume'.padStart(8)}`);
  lines.push('  ' + '─'.repeat(96));

  let hasData = false;
  for (const sym of symbols) {
    const q = quotes[sym];
    if (q) {
      hasData = true;
      lines.push(formatQuote(q));
    }
  }
  if (!hasData) {
    lines.push('  ⚠ No data available. Market may be closed.');
  }
  lines.push('');
  return lines;
}

interface BuiltInTerminalProps {
  onOpenChart?: (symbol: string) => void;
}

export function BuiltInTerminal({ onOpenChart }: BuiltInTerminalProps) {
  const [lines, setLines] = useState<TerminalLine[]>([
    { type: 'info', text: '' },
    { type: 'info', text: '  ████  NextBull Terminal v1.0  ████' },
    { type: 'info', text: '  Real-time Market Intelligence CLI' },
    { type: 'info', text: '' },
    { type: 'info', text: '  Type "help" for available commands.' },
    { type: 'info', text: '' },
  ]);
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [historyIdx, setHistoryIdx] = useState(-1);
  const [isRunning, setIsRunning] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [lines]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const addLines = useCallback((newLines: TerminalLine[]) => {
    setLines(prev => [...prev, ...newLines]);
  }, []);

  const runCommand = useCallback(async (cmd: string) => {
    const trimmed = cmd.trim();
    if (!trimmed) return;

    addLines([{ type: 'input', text: `nextbull@terminal:~$ ${trimmed}` }]);
    setHistory(prev => [trimmed, ...prev].slice(0, 50));
    setHistoryIdx(-1);
    setIsRunning(true);

    const parts = trimmed.split(/\s+/);
    const command = parts[0].toLowerCase();
    const args = parts.slice(1);

    try {
      switch (command) {
        case 'help':
          addLines(HELP_TEXT.split('\n').map(t => ({ type: 'info' as const, text: t })));
          break;

        case 'clear':
          setLines([]);
          break;

        case 'quote':
        case 'q': {
          const sym = args[0];
          if (!sym) {
            addLines([{ type: 'error', text: '  Usage: quote <SYMBOL>  (e.g. quote RELIANCE)' }]);
            break;
          }
          const yahoSym = sym.toUpperCase().includes('.') || sym.includes('=') || sym.startsWith('^')
            ? sym.toUpperCase()
            : `${sym.toUpperCase()}.NS`;
          addLines([{ type: 'info', text: `  Fetching ${yahoSym}...` }]);
          const quotes = await fetchYahooQuotes([yahoSym]);
          const q = quotes[yahoSym];
          if (q) {
            addLines(formatTable(quotes, [yahoSym], `Quote: ${q.name}`).map(t => ({ type: 'output' as const, text: t })));
          } else {
            addLines([{ type: 'error', text: `  ✗ Could not fetch data for ${yahoSym}` }]);
          }
          break;
        }

        case 'compare': {
          if (args.length < 2) {
            addLines([{ type: 'error', text: '  Usage: compare <SYM1> <SYM2>  (e.g. compare RELIANCE TCS)' }]);
            break;
          }
          const syms = args.slice(0, 2).map(s =>
            s.toUpperCase().includes('.') || s.includes('=') || s.startsWith('^')
              ? s.toUpperCase()
              : `${s.toUpperCase()}.NS`
          );
          addLines([{ type: 'info', text: `  Comparing ${syms.join(' vs ')}...` }]);
          const quotes = await fetchYahooQuotes(syms);
          addLines(formatTable(quotes, syms, 'Comparison').map(t => ({ type: 'output' as const, text: t })));
          break;
        }

        case 'batch': {
          const allSyms = args.join(',').split(',').filter(Boolean).map(s =>
            s.trim().toUpperCase().includes('.') || s.includes('=') || s.startsWith('^')
              ? s.trim().toUpperCase()
              : `${s.trim().toUpperCase()}.NS`
          );
          if (allSyms.length === 0) {
            addLines([{ type: 'error', text: '  Usage: batch SYM1,SYM2,SYM3' }]);
            break;
          }
          addLines([{ type: 'info', text: `  Fetching ${allSyms.length} symbols...` }]);
          const quotes = await fetchYahooQuotes(allSyms);
          addLines(formatTable(quotes, allSyms, 'Batch Quotes').map(t => ({ type: 'output' as const, text: t })));
          break;
        }

        case 'watchlist':
        case 'wl': {
          addLines([{ type: 'info', text: '  Loading watchlist...' }]);
          const quotes = await fetchYahooQuotes(WATCHLIST_SYMBOLS);
          addLines(formatTable(quotes, WATCHLIST_SYMBOLS, 'Default Watchlist — Top 10 NSE').map(t => ({ type: 'output' as const, text: t })));
          break;
        }

        case 'nifty':
        case 'indices': {
          addLines([{ type: 'info', text: '  Fetching Indian indices...' }]);
          const quotes = await fetchYahooQuotes(INDEX_SYMBOLS);
          addLines(formatTable(quotes, INDEX_SYMBOLS, 'Indian Market Indices').map(t => ({ type: 'output' as const, text: t })));
          break;
        }

        case 'crypto': {
          addLines([{ type: 'info', text: '  Fetching crypto prices...' }]);
          const quotes = await fetchYahooQuotes(CRYPTO_SYMBOLS);
          addLines(formatTable(quotes, CRYPTO_SYMBOLS, 'Crypto Markets').map(t => ({ type: 'output' as const, text: t })));
          break;
        }

        case 'commodities':
        case 'commodity': {
          addLines([{ type: 'info', text: '  Fetching commodity prices...' }]);
          const quotes = await fetchYahooQuotes(COMMODITY_SYMBOLS);
          addLines(formatTable(quotes, COMMODITY_SYMBOLS, 'Commodities').map(t => ({ type: 'output' as const, text: t })));
          break;
        }

        case 'forex':
        case 'fx': {
          addLines([{ type: 'info', text: '  Fetching forex rates...' }]);
          const quotes = await fetchYahooQuotes(FOREX_SYMBOLS);
          addLines(formatTable(quotes, FOREX_SYMBOLS, 'Forex Rates').map(t => ({ type: 'output' as const, text: t })));
          break;
        }

        case 'chart': {
          const sym = args[0];
          if (!sym) {
            addLines([{ type: 'error', text: '  Usage: chart <SYMBOL>' }]);
            break;
          }
          const tvSym = sym.toUpperCase().includes(':') ? sym.toUpperCase() : `NSE:${sym.toUpperCase()}`;
          onOpenChart?.(tvSym);
          addLines([{ type: 'info', text: `  📈 Opening chart for ${tvSym}...` }]);
          break;
        }

        default: {
          // Treat raw text as a stock symbol
          const rawSym = trimmed.toUpperCase().includes('.') || trimmed.includes('=') || trimmed.startsWith('^')
            ? trimmed.toUpperCase()
            : `${trimmed.toUpperCase()}.NS`;
          addLines([{ type: 'info', text: `  Fetching ${rawSym}...` }]);
          const quotes = await fetchYahooQuotes([rawSym]);
          const q = quotes[rawSym];
          if (q) {
            addLines(formatTable(quotes, [rawSym], `Quote: ${q.name}`).map(t => ({ type: 'output' as const, text: t })));
          } else {
            addLines([{ type: 'error', text: `  ✗ Unknown command or symbol: "${trimmed}". Type "help" for commands.` }]);
          }
          break;
        }
      }
    } catch (err) {
      addLines([{ type: 'error', text: `  ✗ Error: ${err instanceof Error ? err.message : 'Unknown error'}` }]);
    } finally {
      setIsRunning(false);
    }
  }, [addLines, onOpenChart]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isRunning) {
      runCommand(input);
      setInput('');
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (history.length > 0) {
        const newIdx = Math.min(historyIdx + 1, history.length - 1);
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (historyIdx > 0) {
        const newIdx = historyIdx - 1;
        setHistoryIdx(newIdx);
        setInput(history[newIdx]);
      } else {
        setHistoryIdx(-1);
        setInput('');
      }
    }
  };

  const getLineColor = (type: TerminalLine['type']) => {
    switch (type) {
      case 'input': return 'text-emerald-400';
      case 'output': return 'text-gray-200';
      case 'error': return 'text-red-400';
      case 'info': return 'text-blue-400';
      case 'table': return 'text-gray-300';
      default: return 'text-gray-300';
    }
  };

  return (
    <div
      className="flex flex-col h-full bg-[#0a0c10] font-mono text-sm"
      onClick={() => inputRef.current?.focus()}
    >
      {/* Output area */}
      <div className="flex-1 overflow-auto px-4 py-3 select-text">
        {lines.map((line, i) => (
          <div key={i} className={`${getLineColor(line.type)} whitespace-pre leading-6`}>
            {line.text}
          </div>
        ))}
        <div ref={endRef} />
      </div>

      {/* Input line */}
      <div className="shrink-0 flex items-center gap-2 px-4 py-3 border-t border-white/[0.06] bg-[#0d0f14]">
        <span className="text-emerald-500 text-xs shrink-0">nextbull@terminal:~$</span>
        <input
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          disabled={isRunning}
          placeholder={isRunning ? 'Running...' : 'Type a command or stock symbol...'}
          className="flex-1 bg-transparent text-gray-100 outline-none placeholder:text-gray-600 text-sm"
          autoFocus
        />
      </div>
    </div>
  );
}
