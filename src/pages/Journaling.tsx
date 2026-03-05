import { useState, useEffect, useCallback, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import {
  Loader2, Plus, Trash2, BookOpen, TrendingUp, TrendingDown,
  Activity, Wallet, RefreshCw, Calendar, ArrowUpDown, Filter,
  ChevronDown, X, Save, AlertCircle, Clock, Target, Brain,
  ArrowRight, ExternalLink, BarChart3, PieChart as PieIcon,
  Pencil,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

/* ═══════════════════════════════════════════════════════
   TYPES
   ═══════════════════════════════════════════════════════ */

interface JournalEntry {
  id: string;
  user_id: string;
  trade_date: string;
  symbol: string;
  side: string;
  entry_price: number;
  exit_price: number | null;
  quantity: number;
  pnl: number | null;
  fees: number | null;
  strategy: string | null;
  notes: string | null;
  tags: string[] | null;
  emotion: string | null;
  broker: string | null;
  external_order_id: string | null;
  created_at: string;
}

interface DeltaOrder {
  id: number;
  product_symbol: string;
  side: string;
  size: number;
  state: string;
  average_fill_price: string;
  unfilled_size: number;
  created_at: string;
  order_type: string;
  paid_commission: string;
  limit_price: string;
}

interface DeltaFill {
  id: number;
  product_symbol: string;
  side: string;
  size: number;
  fill_type: string;
  price: string;
  created_at: string;
  commission: string;
  order_id: number;
}

interface DeltaPosition {
  product_symbol: string;
  size: number;
  entry_price: string;
  unrealized_pnl: string;
  realized_pnl: string;
  margin: string;
}

interface DeltaBalance {
  asset_symbol: string;
  balance: string;
  available_balance: string;
}

const EMOTIONS = [
  { value: 'disciplined', label: '🎯 Disciplined', color: 'text-emerald-400' },
  { value: 'confident', label: '💪 Confident', color: 'text-cyan-400' },
  { value: 'neutral', label: '😐 Neutral', color: 'text-gray-400' },
  { value: 'fearful', label: '😨 Fearful', color: 'text-yellow-400' },
  { value: 'greedy', label: '🤑 Greedy', color: 'text-amber-400' },
  { value: 'fomo', label: '😰 FOMO', color: 'text-orange-400' },
  { value: 'revenge', label: '😤 Revenge', color: 'text-red-400' },
];

const STRATEGIES = ['Scalping', 'Swing', 'Breakout', 'Reversal', 'Trend Following', 'Mean Reversion', 'News Based', 'Other'];

/* ═══════════════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════════════ */

const Journaling = () => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [showAddModal, setShowAddModal] = useState(false);
  const [editEntry, setEditEntry] = useState<JournalEntry | null>(null);
  const [activeTab, setActiveTab] = useState<'journal' | 'live' | 'analytics'>('journal');
  const [filterSide, setFilterSide] = useState<string>('all');

  useEffect(() => { if (!authLoading && !user) navigate('/auth'); }, [user, authLoading, navigate]);

  const deltaApiKey = typeof window !== 'undefined' ? localStorage.getItem('delta_api_key') : null;
  const deltaApiSecret = typeof window !== 'undefined' ? localStorage.getItem('delta_api_secret') : null;
  const deltaEnv = typeof window !== 'undefined' ? (localStorage.getItem('delta_environment') as string) || 'india' : 'india';
  const isDeltaConnected = Boolean(deltaApiKey && deltaApiSecret);

  // ── Fetch journal entries from Supabase ──
  const { data: journalEntries = [], isLoading: journalLoading, refetch: refetchJournal } = useQuery({
    queryKey: ['trade-journal', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('trade_journal')
        .select('*')
        .eq('user_id', user.id)
        .order('trade_date', { ascending: false });
      if (error) throw error;
      return (data || []) as JournalEntry[];
    },
    enabled: !!user,
    refetchInterval: false,
  });

  // ── Fetch live Delta data ──
  const { data: deltaData, isLoading: deltaLoading, refetch: refetchDelta } = useQuery({
    queryKey: ['delta-history', deltaApiKey],
    queryFn: async () => {
      if (!deltaApiKey || !deltaApiSecret) return null;
      const url = import.meta.env.VITE_DELTA_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
      const anon = import.meta.env.VITE_DELTA_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

      const res = await fetch(`${String(url).replace(/\/$/, '')}/functions/v1/delta-history`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anon,
          Authorization: `Bearer ${anon}`,
        },
        body: JSON.stringify({
          api_key: deltaApiKey,
          api_secret: deltaApiSecret,
          environment: deltaEnv,
          page_size: 100,
        }),
      });

      const data = await res.json();
      if (!res.ok || data.error) throw new Error(data.error || data.detail || 'Failed to fetch Delta history');
      return data as {
        orders: DeltaOrder[];
        fills: DeltaFill[];
        positions: DeltaPosition[];
        balances: DeltaBalance[];
      };
    },
    enabled: isDeltaConnected,
    refetchInterval: 60000,
    staleTime: 30000,
  });

  // ── Computed stats ──
  const stats = useMemo(() => {
    const entries = journalEntries.filter(e => e.pnl !== null);
    const totalPnl = entries.reduce((s, e) => s + (e.pnl || 0), 0);
    const wins = entries.filter(e => (e.pnl || 0) > 0);
    const losses = entries.filter(e => (e.pnl || 0) < 0);
    const winRate = entries.length > 0 ? (wins.length / entries.length) * 100 : 0;
    const avgWin = wins.length > 0 ? wins.reduce((s, e) => s + (e.pnl || 0), 0) / wins.length : 0;
    const avgLoss = losses.length > 0 ? Math.abs(losses.reduce((s, e) => s + (e.pnl || 0), 0) / losses.length) : 0;
    const profitFactor = avgLoss > 0 ? avgWin / avgLoss : avgWin > 0 ? Infinity : 0;
    const totalFees = entries.reduce((s, e) => s + (e.fees || 0), 0);

    return { totalPnl, winRate, avgWin, avgLoss, profitFactor, totalTrades: entries.length, wins: wins.length, losses: losses.length, totalFees };
  }, [journalEntries]);

  // ── Equity curve data ──
  const equityCurve = useMemo(() => {
    const sorted = [...journalEntries].filter(e => e.pnl !== null).sort((a, b) => new Date(a.trade_date).getTime() - new Date(b.trade_date).getTime());
    let cumPnl = 0;
    return sorted.map(e => {
      cumPnl += e.pnl || 0;
      return {
        date: new Date(e.trade_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' }),
        pnl: cumPnl,
        daily: e.pnl || 0,
      };
    });
  }, [journalEntries]);

  // ── Emotion breakdown ──
  const emotionData = useMemo(() => {
    const counts: Record<string, number> = {};
    journalEntries.forEach(e => {
      if (e.emotion) counts[e.emotion] = (counts[e.emotion] || 0) + 1;
    });
    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  }, [journalEntries]);

  // ── Strategy breakdown ──
  const strategyData = useMemo(() => {
    const map: Record<string, { wins: number; total: number; pnl: number }> = {};
    journalEntries.forEach(e => {
      const s = e.strategy || 'Untagged';
      if (!map[s]) map[s] = { wins: 0, total: 0, pnl: 0 };
      map[s].total++;
      map[s].pnl += e.pnl || 0;
      if ((e.pnl || 0) > 0) map[s].wins++;
    });
    return Object.entries(map).map(([name, d]) => ({ name, ...d, winRate: d.total > 0 ? (d.wins / d.total) * 100 : 0 }));
  }, [journalEntries]);

  // ── Delete journal entry ──
  const deleteEntry = async (id: string) => {
    const { error } = await supabase.from('trade_journal').delete().eq('id', id);
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Deleted', description: 'Journal entry removed.' });
      refetchJournal();
    }
  };

  // ── Import a Delta fill as a journal entry ──
  const importFill = async (fill: DeltaFill) => {
    if (!user) return;
    const { error } = await supabase.from('trade_journal').insert({
      user_id: user.id,
      trade_date: fill.created_at,
      symbol: fill.product_symbol,
      side: fill.side,
      entry_price: parseFloat(fill.price),
      quantity: fill.size,
      fees: parseFloat(fill.commission) || 0,
      broker: 'delta',
      external_order_id: String(fill.order_id),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Imported', description: `${fill.product_symbol} ${fill.side} imported to journal.` });
      refetchJournal();
    }
  };

  const filteredEntries = useMemo(() => {
    if (filterSide === 'all') return journalEntries;
    return journalEntries.filter(e => e.side === filterSide);
  }, [journalEntries, filterSide]);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#050505]">
        <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
      </div>
    );
  }
  if (!user) return null;

  const PIE_COLORS = ['#22d3ee', '#10b981', '#f59e0b', '#ef4444', '#a855f7', '#ec4899', '#6366f1'];

  return (
    <div className="h-full overflow-auto bg-[#050505] font-mono">
      {/* ── Header Bar ─────────────────────────── */}
      <div className="border-b border-cyan-500/10 px-5 py-2.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <BookOpen className="w-4 h-4 text-cyan-400" />
          <span className="text-cyan-400 font-bold text-xs tracking-[0.2em]">TRADE JOURNAL</span>
          <span className="text-gray-600 text-[10px]">│</span>
          <span className="text-gray-500 text-[10px]">{journalEntries.length} entries</span>
          {isDeltaConnected && (
            <>
              <span className="text-gray-600 text-[10px]">│</span>
              <span className="text-emerald-400 text-[10px] flex items-center gap-1">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
                DELTA CONNECTED
              </span>
            </>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { refetchJournal(); if (isDeltaConnected) refetchDelta(); }}
            className="text-gray-500 hover:text-cyan-400 transition-colors p-1"
          >
            <RefreshCw className="w-3.5 h-3.5" />
          </button>
          <Button
            onClick={() => { setEditEntry(null); setShowAddModal(true); }}
            className="h-7 text-[11px] gap-1.5 bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20 font-mono tracking-wider"
            variant="outline"
          >
            <Plus className="w-3 h-3" /> LOG TRADE
          </Button>
        </div>
      </div>

      {/* ── Tabs ───────────────────────────────── */}
      <div className="border-b border-gray-800 px-5 flex gap-0">
        {[
          { key: 'journal', label: 'JOURNAL', icon: <BookOpen className="w-3 h-3" /> },
          { key: 'live', label: 'LIVE ACCOUNT', icon: <Activity className="w-3 h-3" /> },
          { key: 'analytics', label: 'ANALYTICS', icon: <BarChart3 className="w-3 h-3" /> },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveTab(t.key as any)}
            className={`flex items-center gap-1.5 px-4 py-2.5 text-[11px] tracking-wider border-b-2 transition-colors ${activeTab === t.key
              ? 'border-cyan-400 text-cyan-400'
              : 'border-transparent text-gray-500 hover:text-gray-300'
              }`}
          >
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      <div className="p-5 space-y-4">
        {/* ══════════ STATS ROW ══════════ */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-2.5">
          <MetricCard label="TOTAL P&L" value={`₹${stats.totalPnl.toFixed(2)}`} color={stats.totalPnl >= 0 ? 'emerald' : 'red'} icon={<TrendingUp className="w-3.5 h-3.5" />} />
          <MetricCard label="WIN RATE" value={`${stats.winRate.toFixed(1)}%`} color="cyan" icon={<Target className="w-3.5 h-3.5" />} />
          <MetricCard label="TOTAL TRADES" value={String(stats.totalTrades)} color="amber" icon={<Activity className="w-3.5 h-3.5" />} />
          <MetricCard label="WINS / LOSSES" value={`${stats.wins} / ${stats.losses}`} color="purple" icon={<ArrowUpDown className="w-3.5 h-3.5" />} />
          <MetricCard label="PROFIT FACTOR" value={stats.profitFactor === Infinity ? '∞' : stats.profitFactor.toFixed(2)} color="cyan" icon={<BarChart3 className="w-3.5 h-3.5" />} />
          <MetricCard label="TOTAL FEES" value={`₹${stats.totalFees.toFixed(2)}`} color="gray" icon={<Wallet className="w-3.5 h-3.5" />} />
        </div>

        {/* ══════════ TAB: JOURNAL ══════════ */}
        {activeTab === 'journal' && (
          <div className="space-y-3">
            {/* Filters */}
            <div className="flex items-center gap-2">
              <Filter className="w-3 h-3 text-gray-500" />
              {['all', 'buy', 'sell', 'long', 'short'].map(s => (
                <button
                  key={s}
                  onClick={() => setFilterSide(s)}
                  className={`px-2.5 py-1 rounded text-[10px] tracking-wider transition-colors ${filterSide === s
                    ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/20'
                    : 'text-gray-500 hover:text-gray-300 border border-transparent'
                    }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>

            {/* Journal Entries Table */}
            <div className="border border-gray-800 rounded-lg overflow-hidden">
              <div className="bg-[#0a0a0a] grid grid-cols-12 gap-2 px-4 py-2 text-[10px] text-gray-500 tracking-wider border-b border-gray-800">
                <span className="col-span-2">DATE</span>
                <span className="col-span-2">SYMBOL</span>
                <span className="col-span-1">SIDE</span>
                <span className="col-span-1 text-right">QTY</span>
                <span className="col-span-1 text-right">ENTRY</span>
                <span className="col-span-1 text-right">EXIT</span>
                <span className="col-span-1 text-right">P&L</span>
                <span className="col-span-1">STRATEGY</span>
                <span className="col-span-1">EMOTION</span>
                <span className="col-span-1 text-right">ACTIONS</span>
              </div>

              {journalLoading ? (
                <div className="flex items-center justify-center py-10">
                  <Loader2 className="w-5 h-5 animate-spin text-cyan-400" />
                </div>
              ) : filteredEntries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 text-gray-500 text-xs">
                  <BookOpen className="w-8 h-8 mb-3 opacity-30" />
                  <p className="mb-1">No journal entries yet</p>
                  <p className="text-[10px] text-gray-600">Click "LOG TRADE" to add your first entry{isDeltaConnected ? ' or import from your Delta account' : ''}</p>
                </div>
              ) : (
                filteredEntries.map(entry => {
                  const pnl = entry.pnl || 0;
                  const isBuy = entry.side === 'buy' || entry.side === 'long';
                  const emotionObj = EMOTIONS.find(e => e.value === entry.emotion);
                  return (
                    <div key={entry.id} className="grid grid-cols-12 gap-2 px-4 py-2.5 text-[11px] border-b border-gray-800/50 hover:bg-white/[0.01] transition-colors group">
                      <span className="col-span-2 text-gray-400">
                        {new Date(entry.trade_date).toLocaleDateString('en-IN', { month: 'short', day: 'numeric', year: '2-digit' })}
                      </span>
                      <span className="col-span-2 text-white font-bold">{entry.symbol}</span>
                      <span className="col-span-1">
                        <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold tracking-wider ${isBuy ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                          {entry.side.toUpperCase()}
                        </span>
                      </span>
                      <span className="col-span-1 text-right text-gray-300">{entry.quantity}</span>
                      <span className="col-span-1 text-right text-gray-300">₹{entry.entry_price.toFixed(2)}</span>
                      <span className="col-span-1 text-right text-gray-300">{entry.exit_price ? `₹${entry.exit_price.toFixed(2)}` : '—'}</span>
                      <span className={`col-span-1 text-right font-bold ${pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                      </span>
                      <span className="col-span-1 text-gray-500 truncate text-[10px]">{entry.strategy || '—'}</span>
                      <span className="col-span-1 text-[10px]">{emotionObj ? <span className={emotionObj.color}>{emotionObj.label.split(' ')[0]}</span> : '—'}</span>
                      <span className="col-span-1 text-right flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        <button
                          onClick={() => { setEditEntry(entry); setShowAddModal(true); }}
                          className="text-gray-500 hover:text-cyan-400 transition-colors"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => deleteEntry(entry.id)}
                          className="text-gray-500 hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </span>
                    </div>
                  );
                })
              )}
            </div>

            {/* Notes preview for entries that have notes */}
            {filteredEntries.filter(e => e.notes).length > 0 && (
              <div className="border border-amber-500/15 rounded-lg bg-[#0a0a0a] p-4">
                <div className="text-amber-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                  <Brain className="w-3.5 h-3.5" /> RECENT NOTES
                </div>
                <div className="space-y-2">
                  {filteredEntries.filter(e => e.notes).slice(0, 5).map(e => (
                    <div key={e.id} className="flex gap-3 text-[11px]">
                      <span className="text-cyan-400/60 whitespace-nowrap">{e.symbol}</span>
                      <span className="text-gray-400">{e.notes}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ══════════ TAB: LIVE ACCOUNT ══════════ */}
        {activeTab === 'live' && (
          <div className="space-y-4">
            {!isDeltaConnected ? (
              <div className="border border-amber-500/15 rounded-lg bg-[#0a0a0a] p-8 text-center">
                <AlertCircle className="w-10 h-10 text-amber-400 mx-auto mb-3 opacity-50" />
                <p className="text-amber-400 text-sm font-bold mb-1">Delta Exchange Not Connected</p>
                <p className="text-gray-500 text-xs mb-4">Connect your Delta Exchange API keys to view live account data and import trades.</p>
                <Button
                  onClick={() => navigate('/connect-broker')}
                  className="gap-2 text-xs bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/20"
                  variant="outline"
                >
                  <ExternalLink className="w-3.5 h-3.5" /> Connect Broker
                </Button>
              </div>
            ) : deltaLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="ml-3 text-gray-500 text-xs">Loading Delta Exchange data...</span>
              </div>
            ) : !deltaData ? (
              <div className="border border-red-500/15 rounded-lg bg-[#0a0a0a] p-6 text-center">
                <AlertCircle className="w-8 h-8 text-red-400 mx-auto mb-2 opacity-50" />
                <p className="text-red-400 text-xs">Failed to load account data. Check your API keys.</p>
              </div>
            ) : (
              <>
                {/* Wallet Balances */}
                <div className="border border-cyan-500/15 rounded-lg bg-[#0a0a0a] p-4">
                  <div className="text-cyan-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                    <Wallet className="w-3.5 h-3.5" /> WALLET BALANCES
                    <span className="text-gray-600 ml-auto text-[10px]">{deltaEnv.toUpperCase()}</span>
                  </div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {(deltaData.balances || []).filter((b: DeltaBalance) => parseFloat(b.balance) > 0).map((b: DeltaBalance, i: number) => (
                      <div key={i} className="rounded-lg border border-gray-800 bg-[#0d0d0d] p-3">
                        <div className="text-[10px] text-gray-500 tracking-wider">{b.asset_symbol}</div>
                        <div className="text-sm font-bold text-white mt-0.5">{parseFloat(b.balance).toFixed(4)}</div>
                        <div className="text-[10px] text-gray-600 mt-0.5">Avail: {parseFloat(b.available_balance).toFixed(4)}</div>
                      </div>
                    ))}
                    {(deltaData.balances || []).filter((b: DeltaBalance) => parseFloat(b.balance) > 0).length === 0 && (
                      <div className="col-span-4 text-xs text-gray-500 py-3">No active balances</div>
                    )}
                  </div>
                </div>

                {/* Open Positions */}
                <div className="border border-emerald-500/15 rounded-lg bg-[#0a0a0a] p-4">
                  <div className="text-emerald-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                    <Activity className="w-3.5 h-3.5" /> OPEN POSITIONS
                  </div>
                  {(deltaData.positions || []).filter((p: DeltaPosition) => p.size !== 0).length === 0 ? (
                    <div className="text-xs text-gray-500 py-3">No open positions</div>
                  ) : (
                    <div className="space-y-2">
                      {(deltaData.positions || []).filter((p: DeltaPosition) => p.size !== 0).map((p: DeltaPosition, i: number) => {
                        const unrealizedPnl = parseFloat(p.unrealized_pnl) || 0;
                        const isLong = p.size > 0;
                        return (
                          <div key={i} className="flex items-center justify-between p-3 rounded-lg border border-gray-800 bg-[#0d0d0d]">
                            <div className="flex items-center gap-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${isLong ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                {isLong ? 'LONG' : 'SHORT'}
                              </span>
                              <span className="text-white font-bold text-xs">{p.product_symbol}</span>
                              <span className="text-gray-500 text-[10px]">Size: {Math.abs(p.size)}</span>
                              <span className="text-gray-500 text-[10px]">Entry: ₹{parseFloat(p.entry_price).toFixed(2)}</span>
                            </div>
                            <span className={`text-sm font-bold ${unrealizedPnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                              {unrealizedPnl >= 0 ? '+' : ''}{unrealizedPnl.toFixed(2)}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Fills — importable */}
                <div className="border border-amber-500/15 rounded-lg bg-[#0a0a0a] p-4">
                  <div className="text-amber-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5" /> RECENT FILLS
                    <span className="text-gray-600 ml-auto text-[10px]">Click import to add to journal</span>
                  </div>
                  {(deltaData.fills || []).length === 0 ? (
                    <div className="text-xs text-gray-500 py-3">No recent fills</div>
                  ) : (
                    <div className="space-y-1">
                      {(deltaData.fills || []).slice(0, 20).map((f: DeltaFill, i: number) => {
                        const alreadyImported = journalEntries.some(e => e.external_order_id === String(f.order_id));
                        return (
                          <div key={i} className="flex items-center justify-between py-2 px-3 rounded hover:bg-white/[0.02] transition-colors text-[11px] group">
                            <div className="flex items-center gap-3">
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${f.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                                {f.side.toUpperCase()}
                              </span>
                              <span className="text-white font-bold">{f.product_symbol}</span>
                              <span className="text-gray-500">×{f.size}</span>
                              <span className="text-gray-500">@₹{parseFloat(f.price).toFixed(2)}</span>
                              <span className="text-gray-600 text-[10px]">
                                {new Date(f.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                              </span>
                            </div>
                            {alreadyImported ? (
                              <span className="text-emerald-400/50 text-[10px]">✓ Imported</span>
                            ) : (
                              <button
                                onClick={() => importFill(f)}
                                className="text-cyan-400/50 hover:text-cyan-400 text-[10px] flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all"
                              >
                                <ArrowRight className="w-3 h-3" /> Import
                              </button>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>

                {/* Recent Orders */}
                <div className="border border-purple-500/15 rounded-lg bg-[#0a0a0a] p-4">
                  <div className="text-purple-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                    <ArrowUpDown className="w-3.5 h-3.5" /> ORDER HISTORY
                  </div>
                  {(deltaData.orders || []).length === 0 ? (
                    <div className="text-xs text-gray-500 py-3">No recent orders</div>
                  ) : (
                    <div className="space-y-1">
                      {(deltaData.orders || []).slice(0, 15).map((o: DeltaOrder, i: number) => (
                        <div key={i} className="flex items-center justify-between py-2 px-3 rounded hover:bg-white/[0.02] transition-colors text-[11px]">
                          <div className="flex items-center gap-3">
                            <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold ${o.side === 'buy' ? 'bg-emerald-500/15 text-emerald-400' : 'bg-red-500/15 text-red-400'}`}>
                              {o.side.toUpperCase()}
                            </span>
                            <span className="text-white font-bold">{o.product_symbol}</span>
                            <span className="text-gray-500">×{o.size}</span>
                            <span className="text-gray-500">@₹{parseFloat(o.average_fill_price || o.limit_price).toFixed(2)}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className={`text-[10px] px-1.5 py-0.5 rounded ${o.state === 'filled' ? 'bg-emerald-500/10 text-emerald-400' : o.state === 'cancelled' ? 'bg-red-500/10 text-red-400' : 'bg-gray-500/10 text-gray-400'}`}>
                              {o.state.toUpperCase()}
                            </span>
                            <span className="text-gray-600 text-[10px]">
                              {new Date(o.created_at).toLocaleDateString('en-IN', { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}

        {/* ══════════ TAB: ANALYTICS ══════════ */}
        {activeTab === 'analytics' && (
          <div className="space-y-4">
            {stats.totalTrades === 0 ? (
              <div className="border border-gray-800 rounded-lg bg-[#0a0a0a] p-12 text-center">
                <BarChart3 className="w-10 h-10 text-gray-600 mx-auto mb-3" />
                <p className="text-gray-400 text-sm">No trade data to analyze</p>
                <p className="text-gray-600 text-xs mt-1">Log some trades first to see your analytics.</p>
              </div>
            ) : (
              <>
                {/* Equity Curve */}
                <div className="border border-cyan-500/15 rounded-lg bg-[#0a0a0a] p-4">
                  <div className="text-cyan-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                    <TrendingUp className="w-3.5 h-3.5" /> EQUITY CURVE
                  </div>
                  <ResponsiveContainer width="100%" height={250}>
                    <AreaChart data={equityCurve}>
                      <defs>
                        <linearGradient id="pnlGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                          <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                      <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                        formatter={(value: number) => [`₹${value.toFixed(2)}`, 'Cumulative P&L']}
                      />
                      <Area type="monotone" dataKey="pnl" stroke="#22d3ee" fill="url(#pnlGrad)" strokeWidth={2} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>

                {/* Daily P&L bar chart */}
                <div className="border border-emerald-500/15 rounded-lg bg-[#0a0a0a] p-4">
                  <div className="text-emerald-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                    <BarChart3 className="w-3.5 h-3.5" /> DAILY P&L
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <BarChart data={equityCurve}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" />
                      <XAxis dataKey="date" stroke="#555" tick={{ fontSize: 10 }} />
                      <YAxis stroke="#555" tick={{ fontSize: 10 }} />
                      <Tooltip
                        contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 11, fontFamily: 'monospace' }}
                        formatter={(value: number) => [`₹${value.toFixed(2)}`, 'P&L']}
                      />
                      <Bar dataKey="daily" radius={[3, 3, 0, 0]} fill="#10b981">
                        {equityCurve.map((entry, i) => (
                          <Cell key={i} fill={entry.daily >= 0 ? '#10b981' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Emotion Breakdown */}
                  <div className="border border-purple-500/15 rounded-lg bg-[#0a0a0a] p-4">
                    <div className="text-purple-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                      <Brain className="w-3.5 h-3.5" /> EMOTION BREAKDOWN
                    </div>
                    {emotionData.length > 0 ? (
                      <div className="flex items-center gap-4">
                        <ResponsiveContainer width="50%" height={160}>
                          <PieChart>
                            <Pie data={emotionData} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                              {emotionData.map((_, i) => (
                                <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                              ))}
                            </Pie>
                            <Tooltip contentStyle={{ background: '#111', border: '1px solid #333', borderRadius: 8, fontSize: 10, fontFamily: 'monospace' }} />
                          </PieChart>
                        </ResponsiveContainer>
                        <div className="space-y-1.5">
                          {emotionData.map((e, i) => {
                            const emo = EMOTIONS.find(em => em.value === e.name);
                            return (
                              <div key={i} className="flex items-center gap-2 text-[10px]">
                                <span className="w-2 h-2 rounded-full" style={{ background: PIE_COLORS[i % PIE_COLORS.length] }} />
                                <span className={emo?.color || 'text-gray-400'}>{emo?.label || e.name}</span>
                                <span className="text-gray-600">({e.value})</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-3">Tag emotions on your trades to see breakdown</p>
                    )}
                  </div>

                  {/* Strategy Performance */}
                  <div className="border border-amber-500/15 rounded-lg bg-[#0a0a0a] p-4">
                    <div className="text-amber-400 font-bold text-[11px] tracking-wider mb-3 flex items-center gap-2">
                      <Target className="w-3.5 h-3.5" /> STRATEGY PERFORMANCE
                    </div>
                    {strategyData.length > 0 ? (
                      <div className="space-y-2">
                        {strategyData.map((s, i) => (
                          <div key={i} className="flex items-center justify-between py-1.5 px-2 rounded hover:bg-white/[0.02] text-[11px]">
                            <span className="text-white font-bold">{s.name}</span>
                            <div className="flex items-center gap-4">
                              <span className="text-gray-500">{s.total} trades</span>
                              <span className="text-cyan-400">{s.winRate.toFixed(0)}% WR</span>
                              <span className={`font-bold ${s.pnl >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                                ₹{s.pnl.toFixed(2)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-gray-500 py-3">Tag strategies on your trades to compare</p>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        )}
      </div>

      {/* ══════════ ADD/EDIT MODAL ══════════ */}
      {showAddModal && (
        <TradeFormModal
          entry={editEntry}
          userId={user.id}
          onClose={() => { setShowAddModal(false); setEditEntry(null); }}
          onSaved={() => { setShowAddModal(false); setEditEntry(null); refetchJournal(); }}
        />
      )}
    </div>
  );
};

/* ─── Metric Card ─────────────────────────────── */
function MetricCard({ label, value, color, icon }: { label: string; value: string; color: string; icon: React.ReactNode }) {
  const colors: Record<string, string> = {
    emerald: 'text-emerald-400 border-emerald-500/15 bg-emerald-500/5',
    red: 'text-red-400 border-red-500/15 bg-red-500/5',
    cyan: 'text-cyan-400 border-cyan-500/15 bg-cyan-500/5',
    amber: 'text-amber-400 border-amber-500/15 bg-amber-500/5',
    purple: 'text-purple-400 border-purple-500/15 bg-purple-500/5',
    gray: 'text-gray-400 border-gray-500/15 bg-gray-500/5',
  };
  return (
    <div className={`rounded-lg border p-3 ${colors[color] || colors.cyan}`}>
      <div className="flex items-center gap-1.5 opacity-50 mb-1">{icon}<span className="text-[9px] tracking-[0.15em]">{label}</span></div>
      <div className="text-base font-bold">{value}</div>
    </div>
  );
}

/* ─── Trade Form Modal ────────────────────────── */
function TradeFormModal({ entry, userId, onClose, onSaved }: {
  entry: JournalEntry | null;
  userId: string;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { toast } = useToast();
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({
    trade_date: entry?.trade_date ? new Date(entry.trade_date).toISOString().slice(0, 16) : new Date().toISOString().slice(0, 16),
    symbol: entry?.symbol || '',
    side: entry?.side || 'buy',
    entry_price: entry?.entry_price?.toString() || '',
    exit_price: entry?.exit_price?.toString() || '',
    quantity: entry?.quantity?.toString() || '',
    pnl: entry?.pnl?.toString() || '',
    fees: entry?.fees?.toString() || '0',
    strategy: entry?.strategy || '',
    notes: entry?.notes || '',
    emotion: entry?.emotion || '',
    tags: entry?.tags?.join(', ') || '',
  });

  const f = (key: string, val: string) => setForm(prev => ({ ...prev, [key]: val }));

  // Auto-calculate P&L
  useEffect(() => {
    const ep = parseFloat(form.entry_price);
    const xp = parseFloat(form.exit_price);
    const qty = parseFloat(form.quantity);
    const fees = parseFloat(form.fees) || 0;
    if (!isNaN(ep) && !isNaN(xp) && !isNaN(qty)) {
      const isBuy = form.side === 'buy' || form.side === 'long';
      const rawPnl = isBuy ? (xp - ep) * qty : (ep - xp) * qty;
      f('pnl', (rawPnl - fees).toFixed(2));
    }
  }, [form.entry_price, form.exit_price, form.quantity, form.side, form.fees]);

  const handleSave = async () => {
    if (!form.symbol || !form.entry_price || !form.quantity) {
      toast({ title: 'Missing fields', description: 'Symbol, entry price, and quantity are required.', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const payload = {
        user_id: userId,
        trade_date: new Date(form.trade_date).toISOString(),
        symbol: form.symbol.toUpperCase(),
        side: form.side,
        entry_price: parseFloat(form.entry_price),
        exit_price: form.exit_price ? parseFloat(form.exit_price) : null,
        quantity: parseFloat(form.quantity),
        pnl: form.pnl ? parseFloat(form.pnl) : null,
        fees: form.fees ? parseFloat(form.fees) : 0,
        strategy: form.strategy || null,
        notes: form.notes || null,
        emotion: form.emotion || null,
        tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        updated_at: new Date().toISOString(),
      };

      let error;
      if (entry) {
        ({ error } = await supabase.from('trade_journal').update(payload).eq('id', entry.id));
      } else {
        ({ error } = await supabase.from('trade_journal').insert(payload));
      }

      if (error) throw error;
      toast({ title: entry ? 'Updated' : 'Saved', description: `${form.symbol} trade ${entry ? 'updated' : 'logged'} successfully.` });
      onSaved();
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to save', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-[#0a0a0a] border border-cyan-500/15 rounded-xl w-full max-w-lg max-h-[90vh] overflow-auto p-5 font-mono"
        onClick={e => e.stopPropagation()}
      >
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-cyan-400 font-bold text-sm tracking-wider flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {entry ? 'EDIT TRADE' : 'LOG NEW TRADE'}
          </h2>
          <button onClick={onClose} className="text-gray-500 hover:text-white transition-colors">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-3">
          {/* Row 1: Date + Symbol */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">DATE & TIME</label>
              <Input
                type="datetime-local"
                value={form.trade_date}
                onChange={e => f('trade_date', e.target.value)}
                className="h-8 bg-[#111] border-gray-700 text-white text-xs font-mono"
              />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">SYMBOL</label>
              <Input
                value={form.symbol}
                onChange={e => f('symbol', e.target.value)}
                placeholder="BTCINR, ETHINR..."
                className="h-8 bg-[#111] border-gray-700 text-white text-xs font-mono"
              />
            </div>
          </div>

          {/* Row 2: Side */}
          <div>
            <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">SIDE</label>
            <div className="flex gap-2">
              {['buy', 'sell', 'long', 'short'].map(s => (
                <button
                  key={s}
                  onClick={() => f('side', s)}
                  className={`flex-1 py-1.5 rounded text-[10px] font-bold tracking-wider border transition-colors ${form.side === s
                    ? s === 'buy' || s === 'long'
                      ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                      : 'bg-red-500/15 border-red-500/30 text-red-400'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {s.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          {/* Row 3: Entry / Exit / Qty */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">ENTRY PRICE</label>
              <Input type="number" step="0.01" value={form.entry_price} onChange={e => f('entry_price', e.target.value)} placeholder="0.00"
                className="h-8 bg-[#111] border-gray-700 text-white text-xs font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">EXIT PRICE</label>
              <Input type="number" step="0.01" value={form.exit_price} onChange={e => f('exit_price', e.target.value)} placeholder="0.00"
                className="h-8 bg-[#111] border-gray-700 text-white text-xs font-mono" />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">QUANTITY</label>
              <Input type="number" step="0.01" value={form.quantity} onChange={e => f('quantity', e.target.value)} placeholder="0"
                className="h-8 bg-[#111] border-gray-700 text-white text-xs font-mono" />
            </div>
          </div>

          {/* Row 4: P&L / Fees */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">P&L (auto-calculated)</label>
              <Input type="number" step="0.01" value={form.pnl} onChange={e => f('pnl', e.target.value)} placeholder="0.00"
                className={`h-8 bg-[#111] border-gray-700 text-xs font-mono ${parseFloat(form.pnl) >= 0 ? 'text-emerald-400' : 'text-red-400'}`} />
            </div>
            <div>
              <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">FEES / COMMISSION</label>
              <Input type="number" step="0.01" value={form.fees} onChange={e => f('fees', e.target.value)} placeholder="0.00"
                className="h-8 bg-[#111] border-gray-700 text-white text-xs font-mono" />
            </div>
          </div>

          {/* Row 5: Strategy */}
          <div>
            <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">STRATEGY</label>
            <div className="flex flex-wrap gap-1.5">
              {STRATEGIES.map(s => (
                <button
                  key={s}
                  onClick={() => f('strategy', form.strategy === s ? '' : s)}
                  className={`px-2 py-1 rounded text-[9px] tracking-wider border transition-colors ${form.strategy === s
                    ? 'bg-cyan-500/15 border-cyan-500/20 text-cyan-400'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Row 6: Emotion */}
          <div>
            <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">EMOTION</label>
            <div className="flex flex-wrap gap-1.5">
              {EMOTIONS.map(e => (
                <button
                  key={e.value}
                  onClick={() => f('emotion', form.emotion === e.value ? '' : e.value)}
                  className={`px-2 py-1 rounded text-[9px] tracking-wider border transition-colors ${form.emotion === e.value
                    ? 'bg-purple-500/15 border-purple-500/20 text-purple-400'
                    : 'border-gray-700 text-gray-500 hover:text-gray-300'
                    }`}
                >
                  {e.label}
                </button>
              ))}
            </div>
          </div>

          {/* Row 7: Notes */}
          <div>
            <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">NOTES</label>
            <textarea
              value={form.notes}
              onChange={e => f('notes', e.target.value)}
              placeholder="What was your reasoning? What did you learn?"
              rows={3}
              className="w-full bg-[#111] border border-gray-700 rounded-md p-2 text-white text-xs font-mono resize-none focus:border-cyan-500/40 outline-none"
            />
          </div>

          {/* Row 8: Tags */}
          <div>
            <label className="text-[10px] text-gray-500 tracking-wider mb-1 block">TAGS (comma separated)</label>
            <Input
              value={form.tags}
              onChange={e => f('tags', e.target.value)}
              placeholder="breakout, nifty, earnings..."
              className="h-8 bg-[#111] border-gray-700 text-white text-xs font-mono"
            />
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <Button onClick={onClose} variant="outline" className="h-8 text-[11px] text-gray-400 border-gray-700 hover:bg-gray-800">
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={saving}
              className="h-8 text-[11px] gap-1.5 bg-cyan-500/15 border border-cyan-500/20 text-cyan-400 hover:bg-cyan-500/25 font-mono tracking-wider"
              variant="outline"
            >
              {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
              {entry ? 'UPDATE' : 'SAVE TRADE'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Journaling;
