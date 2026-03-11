import { useState, useEffect, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import {
  ExternalLink,
  Shield,
  CheckCircle2,
  AlertCircle,
  Loader2,
  X,
  Search,
  KeyRound,
  Zap,
} from 'lucide-react';
import { NextBullLogo } from '@/components/NextBullLogo';
import DeltaAccountSummary from '@/components/trading/DeltaAccountSummary';

/* ═══════════════════════════════════════════
   DATA
   ═══════════════════════════════════════════ */

interface BrokerConnection {
  broker: string;
  is_active: boolean;
  broker_user_id: string | null;
  user_name: string | null;
  email: string | null;
  token_expiry: string | null;
}

interface BrokerInfo {
  id: string;
  name: string;
  desc: string;
  badges: string[];
  logoUrl: string;
  devUrl: string;
  docsUrl: string;
}

// Broker type determines the connect flow
const OAUTH_BROKERS = ['zerodha', 'upstox', 'angelone', 'dhan', 'fyers', 'fivepaisa'];
const API_KEY_BROKERS = ['delta'];
// Everything else is "coming soon"

const getBrokerType = (id: string): 'oauth' | 'api-key' | 'coming-soon' => {
  if (OAUTH_BROKERS.includes(id)) return 'oauth';
  if (API_KEY_BROKERS.includes(id)) return 'api-key';
  return 'coming-soon';
};

const BROKERS: BrokerInfo[] = [
  { id: 'zerodha', name: 'Zerodha', desc: 'India\'s largest stock broker', badges: ['Stocks', 'F&O', 'MF'], logoUrl: 'https://www.google.com/s2/favicons?domain=zerodha.com&sz=128', devUrl: 'https://developers.kite.trade/', docsUrl: 'https://kite.trade/docs/connect/v3/' },
  { id: 'upstox', name: 'Upstox', desc: 'Next-gen trading platform', badges: ['Stocks', 'F&O', 'IPO'], logoUrl: 'https://www.google.com/s2/favicons?domain=upstox.com&sz=128', devUrl: 'https://account.upstox.com/developer/apps', docsUrl: 'https://upstox.com/developer/api-documentation/' },
  { id: 'delta', name: 'Delta Exchange', desc: 'Crypto derivatives exchange', badges: ['Crypto', 'F&O', 'API'], logoUrl: 'https://www.google.com/s2/favicons?domain=delta.exchange&sz=128', devUrl: 'https://docs.delta.exchange/', docsUrl: 'https://docs.delta.exchange/' },
  { id: 'groww', name: 'Groww', desc: 'Stocks, MF & more', badges: ['Stocks', 'MF', 'SIP'], logoUrl: 'https://www.google.com/s2/favicons?domain=groww.in&sz=128', devUrl: 'https://groww.in/', docsUrl: 'https://groww.in/' },
  { id: 'angelone', name: 'Angel One', desc: 'Smart API & algo trading', badges: ['Stocks', 'F&O', 'Algo'], logoUrl: 'https://www.google.com/s2/favicons?domain=angelone.in&sz=128', devUrl: 'https://smartapi.angelone.in/', docsUrl: 'https://smartapi.angelone.in/docs' },
  { id: 'dhan', name: 'Dhan', desc: 'Lightning-fast trading', badges: ['Stocks', 'Options', 'API'], logoUrl: 'https://www.google.com/s2/favicons?domain=dhan.co&sz=128', devUrl: 'https://dhanhq.co/', docsUrl: 'https://dhanhq.co/docs/v2/' },
  { id: 'fyers', name: 'Fyers', desc: 'Built for active traders', badges: ['Stocks', 'F&O', 'Charts'], logoUrl: 'https://assets.fyers.in/images/favicon.png', devUrl: 'https://myapi.fyers.in/', docsUrl: 'https://myapi.fyers.in/docsv3' },
  { id: 'fivepaisa', name: '5Paisa', desc: 'Flat ₹20 per trade', badges: ['Stocks', 'F&O', 'MF'], logoUrl: 'https://www.google.com/s2/favicons?domain=5paisa.com&sz=128', devUrl: 'https://www.5paisa.com/developerapi', docsUrl: 'https://www.5paisa.com/developerapi' },
  { id: 'iifl', name: 'IIFL Securities', desc: 'Research & advisory', badges: ['Stocks', 'Research', 'MF'], logoUrl: 'https://www.google.com/s2/favicons?domain=indiainfoline.com&sz=128', devUrl: 'https://www.indiainfoline.com/', docsUrl: 'https://www.indiainfoline.com/' },
  { id: 'motilal', name: 'Motilal Oswal', desc: 'Premium broker with PMS', badges: ['Stocks', 'PMS', 'F&O'], logoUrl: 'https://www.google.com/s2/favicons?domain=motilaloswal.com&sz=128', devUrl: 'https://www.motilaloswal.com/', docsUrl: 'https://www.motilaloswal.com/' },
  { id: 'icici', name: 'ICICI Direct', desc: 'Full-service broking', badges: ['Stocks', 'MF', 'Bonds'], logoUrl: 'https://www.icicidirect.com/favicon.ico', devUrl: 'https://www.icicidirect.com/', docsUrl: 'https://www.icicidirect.com/' },
  { id: 'hdfc', name: 'HDFC Securities', desc: 'Bank-backed brokerage', badges: ['Stocks', 'MF', 'IPO'], logoUrl: 'https://www.google.com/s2/favicons?domain=hdfcsec.com&sz=128', devUrl: 'https://www.hdfcsec.com/', docsUrl: 'https://www.hdfcsec.com/' },
  { id: 'kotak', name: 'Kotak Securities', desc: 'Neo trading platform', badges: ['Stocks', 'F&O', 'NeoPlus'], logoUrl: 'https://www.google.com/s2/favicons?domain=kotakneo.com&sz=128', devUrl: 'https://www.kotaksecurities.com/', docsUrl: 'https://www.kotaksecurities.com/' },
];

/* ═══════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════ */
const ConnectBroker = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterTab, setFilterTab] = useState('all');
  const [connections, setConnections] = useState<BrokerConnection[]>([]);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const [supabaseDown, setSupabaseDown] = useState(false);

  // connect modal state
  const [activeBroker, setActiveBroker] = useState<BrokerInfo | null>(null);
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [isConnecting, setIsConnecting] = useState(false);
  const [oauthError, setOauthError] = useState('');

  const { toast } = useToast();
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  useEffect(() => { if (!loading && !user) navigate('/auth'); }, [user, loading, navigate]);

  // ── Load connections from DB ──
  const fetchStatus = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase.from('broker_connections')
        .select('broker, is_active, broker_user_id, user_name, email, token_expiry')
        .eq('user_id', user.id).eq('is_active', true);
      if (!error && data) setConnections(data);
      if (error) {
        console.error('DB fetch error:', error);
        const msg = error.message || '';
        if (msg.includes('Failed to fetch') || msg.includes('timeout') || msg.includes('ERR_CONNECTION_TIMED_OUT')) {
          setSupabaseDown(true);
        }
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION_TIMED_OUT') || msg.includes('NetworkError')) {
        setSupabaseDown(true);
      }
    } finally { setLoadingStatus(false); }
  }, [user]);

  useEffect(() => { fetchStatus(); }, [fetchStatus]);

  // ── OAuth callback: detect auth code in URL after broker redirects back ──
  useEffect(() => {
    const code = searchParams.get('code') || searchParams.get('request_token') || searchParams.get('auth_code');
    const broker = sessionStorage.getItem('nextbull_oauth_broker');
    if (!code || !broker || !user) return;

    // Clear immediately so we don't re-process on re-renders
    sessionStorage.removeItem('nextbull_oauth_broker');

    (async () => {
      setIsConnecting(true);
      try {
        const { data, error } = await supabase.functions.invoke('upstox-auth', {
          body: {
            action: 'callback',
            broker,
            code,
            redirect_uri: `${window.location.origin}/connect-broker`,
          },
        });
        if (error || data?.error) throw new Error(data?.error || data?.message || error?.message);
        toast({
          title: `${data.broker_name || broker} Connected!`,
          description: `Welcome, ${data.user_name || 'trader'}! Your account is now linked.`,
        });
        await fetchStatus();
      } catch (err) {
        console.error('OAuth callback error:', err);
        toast({ title: 'Connection failed', description: err instanceof Error ? err.message : 'Failed to connect broker', variant: 'destructive' });
      } finally {
        setIsConnecting(false);
        navigate('/connect-broker', { replace: true });
      }
    })();
  }, [searchParams, user, fetchStatus, navigate, toast]);

  // ── Save connection to DB ──
  const saveToDB = async (brokerId: string, phone?: string) => {
    if (!user) { toast({ title: 'Not logged in', description: 'Please log in to connect a broker.', variant: 'destructive' }); return false; }

    const isNetworkError = (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      return msg.includes('Failed to fetch') || msg.includes('ERR_CONNECTION_TIMED_OUT') || msg.includes('NetworkError');
    };

    try {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Trader';

      const row = {
        user_id: user.id,
        broker: brokerId,
        access_token: null,
        token_expiry: null,
        broker_user_id: phone ? `${brokerId.toUpperCase()}-${phone.slice(-4)}` : brokerId.toUpperCase(),
        email: user.email || null,
        user_name: name,
        is_active: true,
        phone_number: phone || null,
        connection_method: phone ? 'otp' : 'api',
      };

      // Try upsert first
      const { error: upsertError } = await supabase
        .from('broker_connections')
        .upsert(row, { onConflict: 'user_id,broker' });

      if (upsertError) {
        console.error('Upsert error:', upsertError);

        if (isNetworkError(upsertError)) {
          toast({ title: 'Supabase unreachable', description: 'Check your internet/VPN/firewall and try again.', variant: 'destructive' });
          return false;
        }

        // Fallback: try check-then-update/insert for constraint issues
        const { data: existing } = await supabase
          .from('broker_connections')
          .select('id')
          .eq('user_id', user.id)
          .eq('broker', brokerId)
          .maybeSingle();

        if (existing) {
          const { error: updateError } = await supabase
            .from('broker_connections')
            .update(row)
            .eq('user_id', user.id)
            .eq('broker', brokerId);

          if (updateError) {
            console.error('DB update error:', updateError);
            toast({ title: 'Connection Error', description: updateError.message, variant: 'destructive' });
            return false;
          }
        } else {
          const { error: insertError } = await supabase
            .from('broker_connections')
            .insert(row);

          if (insertError) {
            console.error('DB insert error:', insertError);
            toast({ title: 'Connection Error', description: insertError.message, variant: 'destructive' });
            return false;
          }
        }
      }

      return true;
    } catch (err) {
      console.error('saveToDB exception:', err);
      if (isNetworkError(err)) {
        toast({ title: 'Supabase unreachable', description: 'Check your internet/VPN/firewall and try again.', variant: 'destructive' });
      } else {
        toast({ title: 'Connection Error', description: err instanceof Error ? err.message : 'Unknown error saving connection.', variant: 'destructive' });
      }
      return false;
    }
  };

  // ── OAuth Connect: one-click redirect to broker login ──
  const handleOAuthConnect = async () => {
    if (!activeBroker) return;
    setIsConnecting(true);
    setOauthError('');
    try {
      const { data, error } = await supabase.functions.invoke('upstox-auth', {
        body: {
          action: 'initiate',
          broker: activeBroker.id,
          redirect_uri: `${window.location.origin}/connect-broker`,
        },
      });
      if (error || data?.error) {
        const errMsg = data?.message || data?.error || error?.message || 'Unknown error';
        if (data?.error === 'not_configured') {
          setOauthError(`${activeBroker.name} is not configured on the server yet. Admin needs to set API credentials in Supabase secrets.`);
        } else {
          setOauthError(errMsg);
        }
        setIsConnecting(false);
        return;
      }

      // Direct-token brokers (e.g. Dhan) connect instantly without redirect
      if (data?.direct_connected) {
        toast({
          title: `${data.broker_name || activeBroker.name} Connected!`,
          description: `Welcome, ${data.user_name || 'trader'}! Your account is now linked.`,
        });
        await fetchStatus();
        closeModal();
        setIsConnecting(false);
        return;
      }

      // OAuth brokers: redirect to broker's login page
      sessionStorage.setItem('nextbull_oauth_broker', activeBroker.id);
      window.location.href = data.login_url;
    } catch (err) {
      console.error('OAuth initiate error:', err);
      setOauthError(err instanceof Error ? err.message : 'Failed to start connection');
      setIsConnecting(false);
    }
  };

  // ── Delta API key connect: save key/secret locally + DB ──
  const handleDeltaConnect = async () => {
    if (!apiKey || !apiSecret || !activeBroker) return;
    setIsConnecting(true);
    try {
      localStorage.setItem('delta_api_key', apiKey);
      localStorage.setItem('delta_api_secret', apiSecret);
      const saved = await saveToDB(activeBroker.id);
      if (saved) {
        toast({ title: `${activeBroker.name} Connected!`, description: 'API credentials saved securely.' });
        await fetchStatus();
        closeModal();
      } else {
        localStorage.removeItem('delta_api_key');
        localStorage.removeItem('delta_api_secret');
      }
    } catch (err) {
      console.error('Delta connect error:', err);
      localStorage.removeItem('delta_api_key');
      localStorage.removeItem('delta_api_secret');
      toast({ title: 'Connection Failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' });
    } finally {
      setIsConnecting(false);
    }
  };

  const handleDisconnect = async (brokerId: string) => {
    if (!user) return;
    const { error } = await supabase.from('broker_connections').update({ is_active: false, access_token: null }).eq('user_id', user.id).eq('broker', brokerId);
    if (error) {
      toast({ title: 'Disconnect Error', description: error.message, variant: 'destructive' });
      return;
    }
    setConnections(prev => prev.filter(c => c.broker !== brokerId));
    toast({ title: 'Disconnected', description: `Broker has been disconnected.` });
  };

  const closeModal = () => {
    setActiveBroker(null); setApiKey(''); setApiSecret('');
    setOauthError(''); setIsConnecting(false);
  };

  if (loading) return <div className="flex items-center justify-center h-[60vh]"><Loader2 className="h-8 w-8 animate-spin" style={{ color: '#2962ff' }} /></div>;
  if (!user) return null;

  const tabs = ['all', 'connected', 'stocks', 'f&o'];
  const filtered = BROKERS.filter(b => {
    if (searchQuery && !b.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    if (filterTab === 'connected') return connections.some(c => c.broker === b.id && c.is_active);
    if (filterTab === 'stocks') return b.badges.includes('Stocks');
    if (filterTab === 'f&o') return b.badges.includes('F&O');
    return true;
  });

  /* ═══ INLINE STYLES (TradingView exact colors) ═══ */
  const TV = {
    bg: '#131722',
    surface: '#1e222d',
    surfaceHover: '#262b3d',
    border: '#2a2e39',
    borderHover: '#363c4e',
    blue: '#2962ff',
    blueHover: '#1e53e5',
    text: '#d1d4dc',
    textSecondary: '#787b86',
    textMuted: '#4c525e',
    success: '#26a69a',
    successBg: 'rgba(38,166,154,0.12)',
    danger: '#ef5350',
  };

  return (
    <div style={{ background: TV.bg, minHeight: 'calc(100vh - 3.5rem)', color: TV.text }}>

      {/* Full-screen overlay during OAuth callback processing */}
      {isConnecting && !activeBroker && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', zIndex: 200,
        }}>
          <Loader2 style={{ width: 40, height: 40, color: TV.blue, marginBottom: 16, animation: 'spin 1s linear infinite' }} />
          <p style={{ color: TV.text, fontSize: 16, fontWeight: 600 }}>Connecting your broker...</p>
          <p style={{ color: TV.textSecondary, fontSize: 12, marginTop: 8 }}>Verifying your login and linking your account</p>
        </div>
      )}

      <div style={{ maxWidth: 1100, margin: '0 auto', padding: '32px 24px' }}>

        {supabaseDown && (
          <div style={{
            marginBottom: 16,
            padding: '12px 14px',
            borderRadius: 8,
            border: `1px solid ${TV.danger}55`,
            background: `${TV.danger}15`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
              <AlertCircle style={{ width: 16, height: 16, color: TV.danger, marginTop: 2 }} />
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: TV.text }}>Supabase is unreachable</div>
                <div style={{ fontSize: 12, color: TV.textSecondary, marginTop: 2 }}>
                  Broker connection status can’t be loaded/saved right now (connection timeout). Check internet/VPN/firewall and retry.
                </div>
              </div>
            </div>
            <button
              onClick={() => { setSupabaseDown(false); setLoadingStatus(true); fetchStatus(); }}
              style={{
                padding: '8px 12px',
                borderRadius: 6,
                fontSize: 12,
                fontWeight: 700,
                background: TV.blue,
                color: '#fff',
                border: 'none',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              Retry
            </button>
          </div>
        )}

        {/* ── HEADER ── */}
        <div style={{ marginBottom: 8 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <NextBullLogo size="sm" glow animated showText={false} />
            <div>
              <h1 style={{ fontSize: 24, fontWeight: 700, color: '#60a5fa', letterSpacing: '0.04em', fontFamily: 'monospace', textShadow: '0 0 12px rgba(59,130,246,0.4)' }}>
                BROKER CONNECTIONS
              </h1>
              <p style={{ fontSize: 12, color: '#6b7280', marginTop: 2, fontFamily: 'monospace', letterSpacing: '0.05em' }}>
                CONNECT YOUR BROKER ACCOUNT TO TRADE DIRECTLY FROM <span style={{ color: '#60a5fa', textShadow: '0 0 8px rgba(59,130,246,0.3)' }}>NEXTBULL GPT</span>
              </p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8, padding: '4px 12px', borderRadius: 999, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)' }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981', boxShadow: '0 0 6px rgba(16,185,129,0.4)' }} />
              <span style={{ fontSize: 10, color: '#10b981', fontWeight: 700, fontFamily: 'monospace' }}>SECURE</span>
            </div>
          </div>
        </div>

        {/* ── SEARCH + TABS ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 24, marginTop: 20 }}>
          <div style={{ position: 'relative' }}>
            <Search style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', width: 16, height: 16, color: TV.textMuted }} />
            <input
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search brokers..."
              style={{
                width: '100%', padding: '10px 12px 10px 36px', borderRadius: 6,
                background: TV.surface, border: `1px solid ${TV.border}`, color: TV.text,
                fontSize: 13, outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = TV.blue; }}
              onBlur={e => { e.target.style.borderColor = TV.border; }}
            />
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {tabs.map(tab => (
              <button
                key={tab}
                onClick={() => setFilterTab(tab)}
                style={{
                  padding: '6px 14px', borderRadius: 4, fontSize: 12, fontWeight: 600,
                  textTransform: 'uppercase', letterSpacing: '0.04em', cursor: 'pointer', border: 'none',
                  background: filterTab === tab ? TV.blue : 'transparent',
                  color: filterTab === tab ? '#fff' : TV.textSecondary,
                  transition: 'all 0.15s',
                }}
              >
                {tab === 'connected' ? `Connected (${connections.filter(c => c.is_active).length})` : tab}
              </button>
            ))}
          </div>
        </div>

        {/* ── BROKER GRID ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 12 }}>
          {filtered.map(broker => {
            const isConnected = connections.some(c => c.broker === broker.id && c.is_active);
            const conn = connections.find(c => c.broker === broker.id && c.is_active);

            return (
              <div
                key={broker.id}
                style={{
                  background: TV.surface,
                  border: `1px solid ${isConnected ? TV.success : TV.border}`,
                  borderRadius: 8,
                  padding: 20,
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                  position: 'relative',
                }}
                onMouseEnter={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = isConnected ? TV.success : TV.borderHover;
                  (e.currentTarget as HTMLElement).style.background = TV.surfaceHover;
                }}
                onMouseLeave={e => {
                  (e.currentTarget as HTMLElement).style.borderColor = isConnected ? TV.success : TV.border;
                  (e.currentTarget as HTMLElement).style.background = TV.surface;
                }}
                onClick={() => { if (!isConnected) setActiveBroker(broker); }}
              >
                {/* Connected indicator */}
                {isConnected && (
                  <div style={{
                    position: 'absolute', top: 12, right: 12, display: 'flex', alignItems: 'center', gap: 4,
                    fontSize: 10, fontWeight: 600, color: TV.success, background: TV.successBg,
                    padding: '3px 8px', borderRadius: 4, textTransform: 'uppercase', letterSpacing: '0.05em',
                  }}>
                    <CheckCircle2 style={{ width: 10, height: 10 }} /> Connected
                  </div>
                )}

                {/* Large Centered Logo */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12, marginBottom: 32, marginTop: 8 }}>
                  <div style={{
                    width: 96, height: 96, borderRadius: 24, background: 'rgba(38, 43, 61, 0.4)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
                    border: `2px solid ${TV.border}`, flexShrink: 0,
                    boxShadow: '0 12px 32px -12px rgba(0,0,0,0.6)', transition: 'all 0.3s'
                  }} className="group-hover:border-blue-500/50 group-hover:bg-blue-500/10">
                    <img src={broker.logoUrl} alt={broker.name}
                      style={{ width: 68, height: 68, objectFit: 'contain' }}
                      onError={e => {
                        (e.target as HTMLImageElement).style.display = 'none';
                        const p = (e.target as HTMLImageElement).parentElement!;
                        p.innerText = broker.name.substring(0, 2);
                        p.style.fontSize = '32px';
                        p.style.fontWeight = '800';
                        p.style.color = TV.blue;
                      }}
                    />
                  </div>
                </div>

                {/* CTA */}
                {isConnected ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 11, color: TV.textSecondary }}>
                        {conn?.user_name || conn?.broker_user_id || 'Connected'}
                      </span>
                      <button
                        onClick={e => { e.stopPropagation(); handleDisconnect(broker.id); }}
                        style={{
                          fontSize: 11, fontWeight: 600, color: TV.danger, background: 'transparent',
                          border: `1px solid ${TV.danger}33`, borderRadius: 4, padding: '4px 10px',
                          cursor: 'pointer', transition: 'all 0.15s',
                        }}
                        onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = `${TV.danger}15`; }}
                        onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
                      >
                        Disconnect
                      </button>
                    </div>
                    {broker.id === 'delta' && (
                      <div onClick={e => e.stopPropagation()} style={{ cursor: 'default' }}>
                        <DeltaAccountSummary />
                      </div>
                    )}
                  </div>
                ) : (
                  <button
                    onClick={e => { e.stopPropagation(); setActiveBroker(broker); }}
                    style={{
                      width: '100%', padding: '8px 0', borderRadius: 4, fontSize: 13, fontWeight: 600,
                      background: TV.blue, color: '#fff', border: 'none', cursor: 'pointer',
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget as HTMLElement).style.background = TV.blueHover; }}
                    onMouseLeave={e => { (e.currentTarget as HTMLElement).style.background = TV.blue; }}
                  >
                    Connect
                  </button>
                )}
              </div>
            );
          })}
        </div>

        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: TV.textSecondary }}>
            <p style={{ fontSize: 14 }}>No brokers found</p>
            <p style={{ fontSize: 12, marginTop: 4 }}>Try a different search term</p>
          </div>
        )}

        {/* ── FOOTER ── */}
        <div style={{ marginTop: 32, padding: '16px 20px', background: TV.surface, borderRadius: 8, border: `1px solid ${TV.border}`, display: 'flex', alignItems: 'flex-start', gap: 12 }}>
          <Shield style={{ width: 18, height: 18, color: TV.blue, flexShrink: 0, marginTop: 2 }} />
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: TV.text, marginBottom: 4 }}>Secure Connection</div>
            <div style={{ fontSize: 12, color: TV.textSecondary, lineHeight: 1.5 }}>
              All connections are encrypted. NextBull GPT never stores your broker password. Connections are saved to your secure account and can be revoked anytime.
            </div>
          </div>
        </div>
      </div>

      {/* ═══════════════════════════════════════════
          MODAL OVERLAY (TradingView-style)
          ═══════════════════════════════════════════ */}
      {activeBroker && (
        <div
          style={{
            position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.7)', display: 'flex',
            alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: 16,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: TV.surface, borderRadius: 12, border: `1px solid ${TV.border}`,
              width: '100%', maxWidth: 440, maxHeight: '90vh', overflow: 'auto',
              boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 24px 16px', borderBottom: `1px solid ${TV.border}` }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(38, 43, 61, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', border: `1px solid ${TV.border}` }}>
                  <img src={activeBroker.logoUrl} alt="Broker Logo" style={{ width: 32, height: 32, objectFit: 'contain' }}
                    onError={e => { (e.target as HTMLImageElement).style.display = 'none'; }}
                  />
                </div>
                <div>
                  <div style={{ fontSize: 16, fontWeight: 600, color: TV.text }}>Connect Account</div>
                  <div style={{ fontSize: 11, color: TV.textSecondary }}>{activeBroker.desc}</div>
                </div>
              </div>
              <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: TV.textSecondary, padding: 4 }}>
                <X style={{ width: 18, height: 18 }} />
              </button>
            </div>

            {/* Modal Body */}
            <div style={{ padding: 24 }}>

              {/* ═══ OAuth Brokers (Zerodha, Upstox, Fyers, Dhan, etc.) ═══ */}
              {getBrokerType(activeBroker.id) === 'oauth' && (
                <div style={{ textAlign: 'center' }}>
                  {/* Info */}
                  <div style={{ padding: '16px', background: TV.bg, borderRadius: 8, border: `1px solid ${TV.border}`, marginBottom: 20 }}>
                    <Shield style={{ width: 24, height: 24, color: TV.success, margin: '0 auto 8px' }} />
                    <p style={{ fontSize: 13, color: TV.text, fontWeight: 600, marginBottom: 4 }}>Secure Login</p>
                    <p style={{ fontSize: 12, color: TV.textSecondary, lineHeight: 1.6 }}>
                      You'll be redirected to <strong style={{ color: TV.text }}>{activeBroker.name}'s official website</strong> to log in securely.
                      After logging in, you'll be automatically brought back to NextBull.
                    </p>
                    <p style={{ fontSize: 11, color: TV.textMuted, marginTop: 8 }}>
                      NextBull never sees your broker password.
                    </p>
                  </div>

                  {/* Error message */}
                  {oauthError && (
                    <div style={{ padding: '10px 14px', background: `${TV.danger}15`, border: `1px solid ${TV.danger}33`, borderRadius: 6, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'flex-start' }}>
                      <AlertCircle style={{ width: 14, height: 14, color: TV.danger, flexShrink: 0, marginTop: 1 }} />
                      <p style={{ fontSize: 11, color: TV.textSecondary, textAlign: 'left', lineHeight: 1.5 }}>{oauthError}</p>
                    </div>
                  )}

                  {/* Connect button */}
                  <button
                    onClick={handleOAuthConnect}
                    disabled={isConnecting}
                    style={{
                      width: '100%', padding: '12px 0', borderRadius: 8, fontSize: 14, fontWeight: 700,
                      background: isConnecting ? TV.textMuted : TV.blue, color: '#fff',
                      border: 'none', cursor: isConnecting ? 'not-allowed' : 'pointer',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { if (!isConnecting) (e.currentTarget).style.background = TV.blueHover; }}
                    onMouseLeave={e => { if (!isConnecting) (e.currentTarget).style.background = TV.blue; }}
                  >
                    {isConnecting ? (
                      <><Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} /> Redirecting...</>
                    ) : (
                      <><ExternalLink style={{ width: 16, height: 16 }} /> Continue to {activeBroker.name}</>
                    )}
                  </button>

                  <p style={{ fontSize: 10, color: TV.textMuted, marginTop: 12 }}>
                    By connecting, you agree to share your account details with NextBull
                  </p>
                </div>
              )}

              {/* ═══ API Key Brokers (Delta Exchange) ═══ */}
              {getBrokerType(activeBroker.id) === 'api-key' && (
                <div>
                  <div style={{ padding: '12px 14px', background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.15)', borderRadius: 6, marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <KeyRound style={{ width: 16, height: 16, color: '#ff9800', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 11, color: TV.textSecondary, lineHeight: 1.5 }}>
                      Get your API credentials from <a href={activeBroker.devUrl} target="_blank" rel="noopener noreferrer" style={{ color: TV.blue }}>
                        {activeBroker.name} Developer Portal
                      </a>. Keys are stored locally on your device.
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 18 }}>
                    <div>
                      <label style={{ fontSize: 12, color: TV.textSecondary, display: 'block', marginBottom: 6 }}>API Key</label>
                      <input value={apiKey} onChange={e => setApiKey(e.target.value)} placeholder="Enter API key"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}
                        onFocus={e => { e.target.style.borderColor = TV.blue; }} onBlur={e => { e.target.style.borderColor = TV.border; }}
                      />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, color: TV.textSecondary, display: 'block', marginBottom: 6 }}>API Secret</label>
                      <input type="password" value={apiSecret} onChange={e => setApiSecret(e.target.value)} placeholder="Enter API secret"
                        style={{ width: '100%', padding: '10px 12px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 13, outline: 'none' }}
                        onFocus={e => { e.target.style.borderColor = TV.blue; }} onBlur={e => { e.target.style.borderColor = TV.border; }}
                      />
                    </div>
                  </div>

                  <button onClick={handleDeltaConnect} disabled={!apiKey || !apiSecret || isConnecting}
                    style={{
                      width: '100%', padding: '10px 0', borderRadius: 6, fontSize: 13, fontWeight: 600,
                      background: apiKey && apiSecret && !isConnecting ? TV.blue : TV.textMuted, color: '#fff',
                      border: 'none', cursor: apiKey && apiSecret && !isConnecting ? 'pointer' : 'not-allowed',
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                    }}>
                    {isConnecting && <Loader2 style={{ width: 14, height: 14, animation: 'spin 1s linear infinite' }} />}
                    {isConnecting ? 'Connecting...' : 'Connect'}
                  </button>
                </div>
              )}

              {/* ═══ Coming Soon Brokers ═══ */}
              {getBrokerType(activeBroker.id) === 'coming-soon' && (
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <Zap style={{ width: 32, height: 32, color: TV.textMuted, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: 16, fontWeight: 700, color: TV.text, marginBottom: 4 }}>Coming Soon</p>
                  <p style={{ fontSize: 12, color: TV.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>
                    {activeBroker.name} integration is under development.<br />
                    We'll notify you when it's ready.
                  </p>
                  <a href={activeBroker.devUrl} target="_blank" rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '8px 16px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                      background: 'transparent', color: TV.textSecondary, border: `1px solid ${TV.border}`,
                      textDecoration: 'none',
                    }}>
                    <ExternalLink style={{ width: 12, height: 12 }} /> Visit {activeBroker.name}
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectBroker;
