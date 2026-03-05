import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Loader2, TrendingUp, TrendingDown, Wallet, Activity, Globe } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

export default function DeltaAccountSummary() {
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [balances, setBalances] = useState<any[]>([]);
    const [positions, setPositions] = useState<any[]>([]);
    const [environment, setEnvironment] = useState<'global' | 'india' | 'testnet' | 'india_testnet'>(
        (localStorage.getItem('delta_environment') as any) || 'india'
    );

    useEffect(() => {
        fetchAccountData();
    }, [environment]);

    const fetchAccountData = async () => {
        try {
            setLoading(true);
            setError('');

            const apiKey = localStorage.getItem('delta_api_key');
            const apiSecret = localStorage.getItem('delta_api_secret');

            if (!apiKey || !apiSecret) {
                setError('Delta API keys not found in local storage.');
                return;
            }

            // We'll use the raw fetch method to ensure VITE_DELTA_SUPABASE_URL is used if set
            const url = import.meta.env.VITE_DELTA_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
            const anon = import.meta.env.VITE_DELTA_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

            const res = await fetch(`${String(url).replace(/\/$/, '')}/functions/v1/delta-account`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    apikey: anon,
                    Authorization: `Bearer ${anon}`,
                },
                body: JSON.stringify({
                    api_key: apiKey,
                    api_secret: apiSecret,
                    environment: environment
                }),
            });

            const data = await res.json();
            if (!res.ok || data.error) {
                const detail = data.detail ? `: ${data.detail}` : '';
                throw new Error(`${data.error || 'Failed to fetch account data'}${detail}`);
            }

            setBalances(data.balances || []);
            setPositions(data.positions || []);

        } catch (err: any) {
            setError(err.message || 'Error loading account data');
        } finally {
            setLoading(false);
        }
    };

    const nextEnvironment = () => {
        const envs: Array<'global' | 'india' | 'testnet' | 'india_testnet'> = ['india', 'global', 'testnet', 'india_testnet'];
        const currentIndex = envs.indexOf(environment);
        const nextIndex = (currentIndex + 1) % envs.length;
        const newEnv = envs[nextIndex];
        setEnvironment(newEnv);
        localStorage.setItem('delta_environment', newEnv);
    };

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center p-6 text-slate-400">
                <Loader2 className="w-6 h-6 animate-spin mb-2" />
                <span className="text-xs">Loading Delta ({environment.toUpperCase()})...</span>
            </div>
        );
    }

    // Filter out zero balances for cleaner UI
    const activeBalances = balances.filter(b => parseFloat(b.balance) > 0);
    // Filter out closed positions
    const activePositions = positions.filter(p => p.size !== 0);

    return (
        <div className="mt-4 space-y-3 border-t border-slate-700/50 pt-4">
            <div className="flex items-center justify-between gap-2 text-sm font-semibold text-slate-200">
                <div className="flex items-center gap-2">
                    <Wallet className="w-4 h-4 text-blue-400" /> Wallet Balance
                </div>
                <button
                    onClick={nextEnvironment}
                    className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 border border-slate-700 text-[10px] text-slate-300 transition-colors"
                    title="Switch Delta Exchange"
                >
                    <Globe className="w-3 h-3 text-blue-400" />
                    {environment.toUpperCase()}
                </button>
            </div>

            {error && (
                <div className="p-3 text-[11px] text-red-400 bg-red-500/10 border border-red-500/20 rounded flex flex-col gap-1">
                    <div className="font-bold flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        API Error (v2)
                    </div>
                    {error}
                    <button
                        onClick={() => fetchAccountData()}
                        className="mt-1 text-slate-400 hover:text-white underline text-left"
                    >
                        Retry connecting
                    </button>
                </div>
            )}

            <div className="grid grid-cols-2 gap-2">
                {activeBalances.length > 0 ? (
                    activeBalances.map((bal, i) => (
                        <div key={i} className="bg-slate-800/50 rounded-md p-2 border border-slate-700">
                            <div className="text-xs text-slate-400">{bal.asset_symbol}</div>
                            <div className="text-sm font-bold text-slate-200">{parseFloat(bal.balance).toFixed(4)}</div>
                        </div>
                    ))
                ) : !error && (
                    <div className="col-span-2 text-xs text-slate-500">No active balances</div>
                )}
            </div>

            <div className="flex items-center gap-2 text-sm font-semibold text-slate-200 mt-4">
                <Activity className="w-4 h-4 text-emerald-400" /> Open Positions
            </div>
            <div className="space-y-2">
                {activePositions.length > 0 ? (
                    activePositions.map((pos, i) => {
                        const pnl = parseFloat(pos.unrealized_pnl) || 0;
                        const isProfit = pnl >= 0;
                        const isLong = pos.size > 0;
                        return (
                            <div key={i} className="bg-slate-800/50 rounded-md p-3 border border-slate-700 flex flex-col gap-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-2">
                                        <span className={`text-[10px] px-1.5 py-0.5 rounded font-bold uppercase ${isLong ? 'bg-emerald-500/20 text-emerald-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {isLong ? 'LONG' : 'SHORT'}
                                        </span>
                                        <span className="text-sm font-bold text-slate-200">{pos.product_symbol}</span>
                                    </div>
                                    <div className={`text-sm font-bold flex items-center gap-1 ${isProfit ? 'text-emerald-400' : 'text-red-400'}`}>
                                        {isProfit ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
                                        {pnl >= 0 ? '+' : ''}{pnl.toFixed(2)}
                                    </div>
                                </div>
                                <div className="flex justify-between text-xs text-slate-400">
                                    <div>Size: <span className="text-slate-300 font-medium">{Math.abs(pos.size)}</span></div>
                                    <div>Entry: <span className="text-slate-300 font-medium">{parseFloat(pos.entry_price).toFixed(2)}</span></div>
                                </div>
                            </div>
                        );
                    })
                ) : !error && (
                    <div className="text-xs text-slate-500">No open positions</div>
                )}
            </div>
        </div>
    );
}
