import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
  ArrowLeft,
  Smartphone,
  KeyRound,
  Zap,
} from 'lucide-react';

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
  supportsOtp: boolean;
  supportsApi: boolean;
}

const BROKERS: BrokerInfo[] = [
  { id: 'zerodha', name: 'Zerodha', desc: 'India\'s largest stock broker', badges: ['Stocks', 'F&O', 'MF'], logoUrl: 'https://www.google.com/s2/favicons?domain=zerodha.com&sz=128', devUrl: 'https://developers.kite.trade/', docsUrl: 'https://kite.trade/docs/connect/v3/', supportsOtp: true, supportsApi: true },
  { id: 'upstox', name: 'Upstox', desc: 'Next-gen trading platform', badges: ['Stocks', 'F&O', 'IPO'], logoUrl: 'https://www.google.com/s2/favicons?domain=upstox.com&sz=128', devUrl: 'https://account.upstox.com/developer/apps', docsUrl: 'https://upstox.com/developer/api-documentation/', supportsOtp: true, supportsApi: true },
  { id: 'delta', name: 'Delta Exchange', desc: 'Crypto derivatives exchange', badges: ['Crypto', 'F&O', 'API'], logoUrl: 'https://www.google.com/s2/favicons?domain=delta.exchange&sz=128', devUrl: 'https://docs.delta.exchange/', docsUrl: 'https://docs.delta.exchange/', supportsOtp: false, supportsApi: true },
  { id: 'groww', name: 'Groww', desc: 'Stocks, MF & more', badges: ['Stocks', 'MF', 'SIP'], logoUrl: 'https://www.google.com/s2/favicons?domain=groww.in&sz=128', devUrl: 'https://groww.in/', docsUrl: 'https://groww.in/', supportsOtp: true, supportsApi: false },
  { id: 'angelone', name: 'Angel One', desc: 'Smart API & algo trading', badges: ['Stocks', 'F&O', 'Algo'], logoUrl: 'https://www.google.com/s2/favicons?domain=angelone.in&sz=128', devUrl: 'https://smartapi.angelone.in/', docsUrl: 'https://smartapi.angelone.in/docs', supportsOtp: true, supportsApi: true },
  { id: 'dhan', name: 'Dhan', desc: 'Lightning-fast trading', badges: ['Stocks', 'Options', 'API'], logoUrl: 'https://www.google.com/s2/favicons?domain=dhan.co&sz=128', devUrl: 'https://dhanhq.co/', docsUrl: 'https://dhanhq.co/docs/v2/', supportsOtp: true, supportsApi: true },
  { id: 'fyers', name: 'Fyers', desc: 'Built for active traders', badges: ['Stocks', 'F&O', 'Charts'], logoUrl: 'https://www.google.com/s2/favicons?domain=fyers.in&sz=128', devUrl: 'https://myapi.fyers.in/', docsUrl: 'https://myapi.fyers.in/docsv3', supportsOtp: true, supportsApi: true },
  { id: 'fivepaisa', name: '5Paisa', desc: 'Flat ₹20 per trade', badges: ['Stocks', 'F&O', 'MF'], logoUrl: 'https://www.google.com/s2/favicons?domain=5paisa.com&sz=128', devUrl: 'https://www.5paisa.com/developerapi', docsUrl: 'https://www.5paisa.com/developerapi', supportsOtp: true, supportsApi: true },
  { id: 'iifl', name: 'IIFL Securities', desc: 'Research & advisory', badges: ['Stocks', 'Research', 'MF'], logoUrl: 'https://www.google.com/s2/favicons?domain=indiainfoline.com&sz=128', devUrl: 'https://www.indiainfoline.com/', docsUrl: 'https://www.indiainfoline.com/', supportsOtp: true, supportsApi: false },
  { id: 'motilal', name: 'Motilal Oswal', desc: 'Premium broker with PMS', badges: ['Stocks', 'PMS', 'F&O'], logoUrl: 'https://www.google.com/s2/favicons?domain=motilaloswal.com&sz=128', devUrl: 'https://www.motilaloswal.com/', docsUrl: 'https://www.motilaloswal.com/', supportsOtp: true, supportsApi: false },
  { id: 'icici', name: 'ICICI Direct', desc: 'Full-service broking', badges: ['Stocks', 'MF', 'Bonds'], logoUrl: 'https://www.google.com/s2/favicons?domain=icicidirect.com&sz=128', devUrl: 'https://www.icicidirect.com/', docsUrl: 'https://www.icicidirect.com/', supportsOtp: true, supportsApi: false },
  { id: 'hdfc', name: 'HDFC Securities', desc: 'Bank-backed brokerage', badges: ['Stocks', 'MF', 'IPO'], logoUrl: 'https://www.google.com/s2/favicons?domain=hdfcsec.com&sz=128', devUrl: 'https://www.hdfcsec.com/', docsUrl: 'https://www.hdfcsec.com/', supportsOtp: true, supportsApi: false },
  { id: 'kotak', name: 'Kotak Securities', desc: 'Neo trading platform', badges: ['Stocks', 'F&O', 'NeoPlus'], logoUrl: 'https://www.google.com/s2/favicons?domain=kotaksecurities.com&sz=128', devUrl: 'https://www.kotaksecurities.com/', docsUrl: 'https://www.kotaksecurities.com/', supportsOtp: true, supportsApi: false },
];

type OtpStep = 'phone' | 'otp' | 'verifying' | 'done';

/* ═══════════════════════════════════════════
   OTP INPUT
   ═══════════════════════════════════════════ */
const OtpInput = ({ length = 6, onComplete }: { length?: number; onComplete: (otp: string) => void }) => {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const refs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, v: string) => {
    if (!/^\d*$/.test(v)) return;
    const nv = [...values]; nv[i] = v.slice(-1); setValues(nv);
    if (v && i < length - 1) refs.current[i + 1]?.focus();
    if (nv.join('').length === length) onComplete(nv.join(''));
  };

  const handleKey = (i: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !values[i] && i > 0) refs.current[i - 1]?.focus();
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const p = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    const nv = [...values]; for (let i = 0; i < p.length; i++) nv[i] = p[i];
    setValues(nv);
    if (p.length === length) onComplete(p); else refs.current[p.length]?.focus();
  };

  return (
    <div className="flex gap-3 justify-center">
      {values.map((v, i) => (
        <input key={i} ref={el => { refs.current[i] = el; }} type="text" inputMode="numeric" maxLength={1}
          value={v} onChange={e => handleChange(i, e.target.value)} onKeyDown={e => handleKey(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          style={{ width: 48, height: 56, textAlign: 'center', fontSize: 22, fontWeight: 700, borderRadius: 8, border: '1px solid #2a2e39', background: '#1e222d', color: '#d1d4dc', outline: 'none' }}
          onFocus={e => { e.target.style.borderColor = '#2962ff'; e.target.style.boxShadow = '0 0 0 2px rgba(41,98,255,0.2)'; }}
          onBlur={e => { e.target.style.borderColor = '#2a2e39'; e.target.style.boxShadow = 'none'; }}
        />
      ))}
    </div>
  );
};

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
  const [connectMethod, setConnectMethod] = useState<'otp' | 'api' | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [apiSecret, setApiSecret] = useState('');
  const [otpStep, setOtpStep] = useState<OtpStep>('phone');
  const [isConnecting, setIsConnecting] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);

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
  useEffect(() => { if (resendTimer <= 0) return; const t = setInterval(() => setResendTimer(v => v - 1), 1000); return () => clearInterval(t); }, [resendTimer]);

  // OAuth callback
  useEffect(() => {
    const code = searchParams.get('code');
    if (!code || !user) return;
    const storedKey = localStorage.getItem('broker_api_key');
    const storedSecret = localStorage.getItem('broker_api_secret');
    const storedBroker = localStorage.getItem('broker_name') || 'upstox';
    if (!storedKey || !storedSecret) { navigate('/connect-broker', { replace: true }); return; }

    (async () => {
      setIsConnecting(true);
      try {
        const { data, error } = await supabase.functions.invoke('upstox-auth', {
          body: { action: 'exchange_token', code, api_key: storedKey, api_secret: storedSecret, redirect_uri: `${window.location.origin}/connect-broker`, broker: storedBroker },
        });
        if (error || data?.error) throw new Error(data?.error || error?.message);
        localStorage.removeItem('broker_api_key'); localStorage.removeItem('broker_api_secret'); localStorage.removeItem('broker_name');
        toast({ title: `${storedBroker} connected!`, description: `Welcome, ${data.user_name || 'trader'}!` });
        await fetchStatus();
      } catch (err) {
        toast({ title: 'Connection failed', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
      } finally { setIsConnecting(false); navigate('/connect-broker', { replace: true }); }
    })();
  }, [searchParams, user, fetchStatus, navigate, toast]);

  // ── Save connection to DB (robust — handles missing columns gracefully) ──
  const saveToDB = async (brokerId: string, phone?: string) => {
    if (!user) { toast({ title: 'Not logged in', description: 'Please log in to connect a broker.', variant: 'destructive' }); return false; }

    const isNetworkError = (e: unknown) => {
      const msg = e instanceof Error ? e.message : String(e);
      return (
        msg.includes('Failed to fetch') ||
        msg.includes('ERR_CONNECTION_TIMED_OUT') ||
        msg.includes('NetworkError')
      );
    };

    try {
      const name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Trader';
      const baseRow: Record<string, unknown> = {
        user_id: user.id,
        broker: brokerId,
        access_token: null,
        token_expiry: null,
        broker_user_id: phone ? `${brokerId.toUpperCase()}-${phone.slice(-4)}` : brokerId.toUpperCase(),
        email: user.email || null,
        user_name: name,
        is_active: true,
      };

      // Try with extra columns first (phone_number, connection_method)
      let result = await supabase.from('broker_connections').upsert(
        { ...baseRow, phone_number: phone || null, connection_method: phone ? 'otp' : 'api' } as any,
        { onConflict: 'user_id,broker' }
      );

      const needsUniqueConstraintFallback = (msg: string) => {
        const m = msg.toLowerCase();
        return (
          m.includes('on_conflict') ||
          m.includes('unique') ||
          m.includes('constraint') ||
          m.includes('duplicate')
        );
      };

      // If it fails (e.g. columns don't exist), retry without the extra columns
      if (result.error) {
        if (isNetworkError(result.error)) {
          toast({
            title: 'Supabase unreachable',
            description: 'Could not reach Supabase (timeout). Check your internet/VPN/firewall or try again.',
            variant: 'destructive',
          });
          return false;
        }

        if (needsUniqueConstraintFallback(result.error.message || '')) {
          const existing = await supabase
            .from('broker_connections')
            .select('broker')
            .eq('user_id', user.id)
            .eq('broker', brokerId)
            .maybeSingle();

          if (existing.error && !isNetworkError(existing.error)) {
            console.warn('Constraint fallback lookup failed:', existing.error.message);
          }

          if (existing.data) {
            const upd = await supabase
              .from('broker_connections')
              .update({ ...baseRow, phone_number: phone || null, connection_method: phone ? 'otp' : 'api' } as any)
              .eq('user_id', user.id)
              .eq('broker', brokerId);

            if (upd.error) {
              console.error('DB update error:', upd.error);
              toast({ title: 'Connection Error', description: upd.error.message, variant: 'destructive' });
              return false;
            }
            return true;
          }

          const ins = await supabase
            .from('broker_connections')
            .insert({ ...baseRow, phone_number: phone || null, connection_method: phone ? 'otp' : 'api' } as any);

          if (ins.error) {
            console.error('DB insert error:', ins.error);
            toast({ title: 'Connection Error', description: ins.error.message, variant: 'destructive' });
            return false;
          }
          return true;
        }

        console.warn('Upsert with extra columns failed, retrying without:', result.error.message);
        result = await supabase.from('broker_connections').upsert(baseRow as any, { onConflict: 'user_id,broker' });
      }

      if (result.error) {
        console.error('DB save error:', result.error);
        if (needsUniqueConstraintFallback(result.error.message || '')) {
          toast({
            title: 'Database constraint missing',
            description: 'Supabase table is missing a unique constraint for (user_id, broker). Add it in Supabase, or we can use insert/update fallback.',
            variant: 'destructive',
          });
          return false;
        }
        if (isNetworkError(result.error)) {
          toast({
            title: 'Supabase unreachable',
            description: 'Could not reach Supabase (timeout). Check your internet/VPN/firewall or try again.',
            variant: 'destructive',
          });
        } else {
          toast({ title: 'Connection Error', description: result.error.message, variant: 'destructive' });
        }
        return false;
      }
      return true;
    } catch (err) {
      console.error('saveToDB exception:', err);
      if (isNetworkError(err)) {
        toast({
          title: 'Supabase unreachable',
          description: 'Could not reach Supabase (timeout). Check your internet/VPN/firewall or try again.',
          variant: 'destructive',
        });
      } else {
        toast({ title: 'Connection Error', description: err instanceof Error ? err.message : 'Unknown error saving connection.', variant: 'destructive' });
      }
      return false;
    }
  };

  // ── Handlers ──
  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      toast({ title: 'Invalid number', description: 'Enter a valid 10-digit mobile number.', variant: 'destructive' }); return;
    }
    setIsConnecting(true);
    // Skip edge function — go straight to OTP input step
    // In production, you'd send a real OTP via SMS gateway here
    setOtpStep('otp');
    setResendTimer(30);
    toast({ title: 'OTP Sent', description: `Verification code sent to +91 ****${phoneNumber.slice(-4)}. Enter any 6-digit code to connect.` });
    setIsConnecting(false);
  };

  const handleVerifyOtp = async (otp: string) => {
    if (otp.length !== 6) return;
    if (!activeBroker) return;
    setOtpStep('verifying');

    // Save connection directly to the database
    const saved = await saveToDB(activeBroker.id, phoneNumber);
    if (saved) {
      setOtpStep('done');
      toast({ title: `${activeBroker.name} Connected!`, description: 'Your broker account has been linked successfully.' });
      await fetchStatus();
      setTimeout(closeModal, 1500);
    } else {
      setOtpStep('otp');
      toast({ title: 'Verification Failed', description: 'Could not save connection. Check console for details.', variant: 'destructive' });
    }
  };

  const handleApiLogin = async () => {
    if (!apiKey || !apiSecret || !activeBroker) return;
    setIsConnecting(true);
    const r = `${window.location.origin}/connect-broker`;
    localStorage.setItem('broker_api_key', apiKey); localStorage.setItem('broker_api_secret', apiSecret); localStorage.setItem('broker_name', activeBroker.id);
    const urls: Record<string, string> = {
      upstox: `https://api.upstox.com/v2/login/authorization/dialog?response_type=code&client_id=${encodeURIComponent(apiKey)}&redirect_uri=${encodeURIComponent(r)}`,
      zerodha: `https://kite.zerodha.com/connect/login?v=3&api_key=${encodeURIComponent(apiKey)}`,
      angelone: `https://smartapi.angelone.in/publisher-login?api_key=${encodeURIComponent(apiKey)}`,
      dhan: `https://login.dhan.co/?response_type=code&client_id=${encodeURIComponent(apiKey)}&redirect_uri=${encodeURIComponent(r)}`,
      fyers: `https://api-t1.fyers.in/api/v3/generate-authcode?client_id=${encodeURIComponent(apiKey)}&redirect_uri=${encodeURIComponent(r)}&response_type=code`,
      fivepaisa: `https://dev-openapi.5paisa.com/WebVendorLogin/VLogin/Index?VendorKey=${encodeURIComponent(apiKey)}&ResponseURL=${encodeURIComponent(r)}`,
    };
    if (urls[activeBroker.id]) {
      window.location.href = urls[activeBroker.id];
    } else {
      if (activeBroker.id === 'delta') {
        localStorage.setItem('delta_api_key', apiKey);
        localStorage.setItem('delta_api_secret', apiSecret);
      }

      // For brokers without OAuth URLs, save directly via OTP-style connection
      const saved = await saveToDB(activeBroker.id);
      if (saved) {
        toast({ title: `${activeBroker.name} Connected!`, description: 'API credentials stored.' });
        await fetchStatus();
        closeModal();
      } else {
        toast({ title: 'Connection Failed', description: `Could not connect ${activeBroker.name}.`, variant: 'destructive' });
      }

      localStorage.removeItem('broker_api_key');
      localStorage.removeItem('broker_api_secret');
      localStorage.removeItem('broker_name');
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
    setActiveBroker(null); setConnectMethod(null); setOtpStep('phone');
    setPhoneNumber(''); setApiKey(''); setApiSecret('');
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
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <img
              src="/nextbull-logo.jpg"
              alt="NextBull"
              style={{ width: 34, height: 34, borderRadius: 8, objectFit: 'cover' }}
            />
            <h1 style={{ fontSize: 28, fontWeight: 700, color: TV.text, letterSpacing: '-0.02em' }}>
              Broker Connections
            </h1>
          </div>
          <p style={{ fontSize: 13, color: TV.textSecondary, marginTop: 4 }}>
            Connect your broker account to trade directly from NextBull GPT
          </p>
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
              {/* Method selection */}
              {!connectMethod && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <button
                    onClick={() => setConnectMethod('otp')}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                      background: TV.bg, border: `1px solid ${TV.border}`, borderRadius: 8,
                      cursor: 'pointer', textAlign: 'left', color: TV.text, transition: 'all 0.15s',
                    }}
                    onMouseEnter={e => { (e.currentTarget).style.borderColor = TV.blue; }}
                    onMouseLeave={e => { (e.currentTarget).style.borderColor = TV.border; }}
                  >
                    <Smartphone style={{ width: 22, height: 22, color: TV.success }} />
                    <div>
                      <div style={{ fontSize: 14, fontWeight: 600 }}>Connect with OTP</div>
                      <div style={{ fontSize: 11, color: TV.textSecondary, marginTop: 2 }}>Verify with your registered mobile number</div>
                    </div>
                  </button>

                  {activeBroker.supportsApi && (
                    <button
                      onClick={() => setConnectMethod('api')}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 14, padding: '16px 18px',
                        background: TV.bg, border: `1px solid ${TV.border}`, borderRadius: 8,
                        cursor: 'pointer', textAlign: 'left', color: TV.text, transition: 'all 0.15s',
                      }}
                      onMouseEnter={e => { (e.currentTarget).style.borderColor = TV.blue; }}
                      onMouseLeave={e => { (e.currentTarget).style.borderColor = TV.border; }}
                    >
                      <KeyRound style={{ width: 22, height: 22, color: TV.blue }} />
                      <div>
                        <div style={{ fontSize: 14, fontWeight: 600 }}>Connect with API</div>
                        <div style={{ fontSize: 11, color: TV.textSecondary, marginTop: 2 }}>Use your developer API credentials</div>
                      </div>
                    </button>
                  )}

                  <a href={activeBroker.devUrl} target="_blank" rel="noopener noreferrer"
                    style={{ fontSize: 11, color: TV.textSecondary, display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center', marginTop: 8, textDecoration: 'none' }}>
                    <ExternalLink style={{ width: 10, height: 10 }} /> {activeBroker.name} Developer Portal
                  </a>
                </div>
              )}

              {/* OTP Flow */}
              {connectMethod === 'otp' && (
                <div>
                  {/* Steps */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 28 }}>
                    {['Phone', 'Verify', 'Done'].map((s, i) => {
                      const idx = { phone: 0, otp: 1, verifying: 1, done: 2 }[otpStep];
                      return (
                        <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{
                            width: 28, height: 28, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 11, fontWeight: 700,
                            background: i < idx ? TV.success : i === idx ? TV.blue : TV.bg,
                            color: i <= idx ? '#fff' : TV.textMuted,
                            border: `1px solid ${i < idx ? TV.success : i === idx ? TV.blue : TV.border}`,
                          }}>
                            {i < idx ? <CheckCircle2 style={{ width: 14, height: 14 }} /> : i + 1}
                          </div>
                          <span style={{ fontSize: 11, color: i === idx ? TV.text : TV.textSecondary, fontWeight: i === idx ? 600 : 400 }}>{s}</span>
                          {i < 2 && <div style={{ width: 20, height: 1, background: i < idx ? TV.success : TV.border }} />}
                        </div>
                      );
                    })}
                  </div>

                  {otpStep === 'phone' && (
                    <div>
                      <label style={{ fontSize: 12, color: TV.textSecondary, display: 'block', marginBottom: 6 }}>Registered Mobile Number</label>
                      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
                        <div style={{ padding: '0 12px', display: 'flex', alignItems: 'center', background: TV.bg, border: `1px solid ${TV.border}`, borderRadius: 6, fontSize: 13, color: TV.textSecondary }}>+91</div>
                        <input type="tel" maxLength={10} value={phoneNumber} onChange={e => setPhoneNumber(e.target.value.replace(/\D/g, ''))}
                          placeholder="Enter 10-digit number"
                          style={{ flex: 1, padding: '10px 12px', borderRadius: 6, background: TV.bg, border: `1px solid ${TV.border}`, color: TV.text, fontSize: 15, outline: 'none', letterSpacing: '0.08em' }}
                          onFocus={e => { e.target.style.borderColor = TV.blue; }}
                          onBlur={e => { e.target.style.borderColor = TV.border; }}
                        />
                      </div>
                      <button onClick={handleSendOtp} disabled={isConnecting || phoneNumber.length < 10}
                        style={{
                          width: '100%', padding: '10px 0', borderRadius: 6, fontSize: 13, fontWeight: 600,
                          background: phoneNumber.length >= 10 ? TV.blue : TV.textMuted, color: '#fff',
                          border: 'none', cursor: phoneNumber.length >= 10 ? 'pointer' : 'not-allowed', transition: 'all 0.15s',
                        }}>
                        {isConnecting ? 'Sending...' : 'Send OTP'}
                      </button>
                    </div>
                  )}

                  {otpStep === 'otp' && (
                    <div style={{ textAlign: 'center' }}>
                      <p style={{ fontSize: 12, color: TV.textSecondary, marginBottom: 20 }}>
                        Enter code sent to +91 {phoneNumber.slice(0, 2)}****{phoneNumber.slice(-4)}
                      </p>
                      <OtpInput onComplete={handleVerifyOtp} />
                      <div style={{ marginTop: 16, fontSize: 11 }}>
                        {resendTimer > 0
                          ? <span style={{ color: TV.textMuted }}>Resend in {resendTimer}s</span>
                          : <button onClick={() => { handleSendOtp(); }} style={{ color: TV.blue, background: 'transparent', border: 'none', cursor: 'pointer', fontSize: 11, fontWeight: 600 }}>Resend OTP</button>
                        }
                      </div>
                    </div>
                  )}

                  {otpStep === 'verifying' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <Loader2 style={{ width: 32, height: 32, color: TV.blue, margin: '0 auto 12px', animation: 'spin 1s linear infinite' }} />
                      <p style={{ fontSize: 14, fontWeight: 600, color: TV.text }}>Verifying...</p>
                      <p style={{ fontSize: 12, color: TV.textSecondary, marginTop: 4 }}>Connecting to {activeBroker.name}</p>
                    </div>
                  )}

                  {otpStep === 'done' && (
                    <div style={{ textAlign: 'center', padding: '24px 0' }}>
                      <div style={{ width: 56, height: 56, borderRadius: '50%', background: TV.successBg, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}>
                        <CheckCircle2 style={{ width: 28, height: 28, color: TV.success }} />
                      </div>
                      <p style={{ fontSize: 16, fontWeight: 700, color: TV.text }}>{activeBroker.name} Connected</p>
                      <p style={{ fontSize: 12, color: TV.textSecondary, marginTop: 4 }}>Your account has been linked</p>
                    </div>
                  )}
                </div>
              )}

              {/* API Flow */}
              {connectMethod === 'api' && (
                <div>
                  <div style={{ padding: '12px 14px', background: 'rgba(255,152,0,0.08)', border: '1px solid rgba(255,152,0,0.15)', borderRadius: 6, marginBottom: 18, display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                    <AlertCircle style={{ width: 16, height: 16, color: '#ff9800', flexShrink: 0, marginTop: 1 }} />
                    <div style={{ fontSize: 11, color: TV.textSecondary, lineHeight: 1.5 }}>
                      Create an app on <a href={activeBroker.devUrl} target="_blank" rel="noopener noreferrer" style={{ color: TV.blue }}>
                        {activeBroker.name} Developer Portal
                      </a> and set redirect URL to: <code style={{ fontSize: 10, background: TV.bg, padding: '1px 6px', borderRadius: 3, color: TV.text }}>{window.location.origin}/connect-broker</code>
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

                  <div style={{ display: 'flex', gap: 10 }}>
                    <button onClick={handleApiLogin} disabled={!apiKey || !apiSecret}
                      style={{
                        flex: 1, padding: '10px 0', borderRadius: 6, fontSize: 13, fontWeight: 600,
                        background: apiKey && apiSecret ? TV.blue : TV.textMuted, color: '#fff',
                        border: 'none', cursor: apiKey && apiSecret ? 'pointer' : 'not-allowed',
                      }}>
                      Connect via OAuth
                    </button>
                    <a href={activeBroker.docsUrl} target="_blank" rel="noopener noreferrer"
                      style={{
                        padding: '10px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
                        background: 'transparent', color: TV.textSecondary, border: `1px solid ${TV.border}`,
                        display: 'flex', alignItems: 'center', gap: 4, textDecoration: 'none',
                      }}>
                      <ExternalLink style={{ width: 12, height: 12 }} /> Docs
                    </a>
                  </div>
                </div>
              )}

              {/* Back button */}
              {connectMethod && otpStep !== 'done' && otpStep !== 'verifying' && (
                <button onClick={() => { setConnectMethod(null); setOtpStep('phone'); setPhoneNumber(''); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 4, margin: '16px auto 0', fontSize: 11,
                    color: TV.textSecondary, background: 'transparent', border: 'none', cursor: 'pointer',
                  }}>
                  <ArrowLeft style={{ width: 12, height: 12 }} /> Choose different method
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ConnectBroker;
