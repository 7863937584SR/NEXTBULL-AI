import { useEffect, useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useNavigate } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import {
  User,
  Mail,
  Calendar,
  LogOut,
  Loader2,
  Shield,
  Activity,
  Clock,
  Globe,
  Smartphone,
  Key,
  ChevronRight,
  Pencil,
  Check,
  X,
  TrendingUp,
  BarChart3,
  Zap,
  Terminal,
  Eye,
  EyeOff,
  Copy,
  RefreshCw,
} from 'lucide-react';

/* ═══════════════════════════════════════════════════════
   PROFILE PAGE — Bloomberg Terminal Style
   ═══════════════════════════════════════════════════════ */

const Profile = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [editingName, setEditingName] = useState(false);
  const [newName, setNewName] = useState('');
  const [savingName, setSavingName] = useState(false);
  const [showUserId, setShowUserId] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());

  useEffect(() => {
    if (!loading && !user) navigate('/auth');
  }, [user, loading, navigate]);

  useEffect(() => {
    const t = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);

  const displayName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Trader';
  const initials = useMemo(() => {
    const parts = displayName.split(' ');
    return parts.length > 1
      ? (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
      : displayName.slice(0, 2).toUpperCase();
  }, [displayName]);

  const memberSince = user ? new Date(user.created_at) : new Date();
  const daysSinceJoin = Math.floor((Date.now() - memberSince.getTime()) / (1000 * 60 * 60 * 24));
  const lastSignIn = user?.last_sign_in_at ? new Date(user.last_sign_in_at) : null;
  const provider = user?.app_metadata?.provider || 'email';

  const handleSaveName = async () => {
    if (!newName.trim()) return;
    setSavingName(true);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: newName.trim() },
      });
      if (error) throw error;
      toast({ title: 'Profile updated', description: 'Display name saved.' });
      setEditingName(false);
    } catch (err: any) {
      toast({ title: 'Error', description: err.message || 'Failed to update', variant: 'destructive' });
    } finally {
      setSavingName(false);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/auth');
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: 'Copied', description: 'Copied to clipboard.' });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full bg-[#050505]">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-cyan-400" />
          <span className="text-gray-500 text-xs font-mono tracking-wider">LOADING PROFILE...</span>
        </div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="h-full overflow-auto bg-[#050505] font-mono">
      {/* ── Top Status Bar ─────────────────────────────── */}
      <div className="border-b border-cyan-500/10 px-5 py-2 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Terminal className="w-4 h-4 text-cyan-400" />
            <span className="text-cyan-400 font-bold text-xs tracking-[0.2em]">USER PROFILE</span>
          </div>
          <span className="text-gray-600 text-[10px]">│</span>
          <span className="text-gray-500 text-[10px]">
            {currentTime.toLocaleString('en-US', {
              weekday: 'short', month: 'short', day: '2-digit',
              hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
            })}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 text-[10px] flex items-center gap-1">
            <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full shadow-[0_0_4px_rgba(16,185,129,0.5)]" />
            AUTHENTICATED
          </span>
        </div>
      </div>

      <div className="p-5 max-w-5xl mx-auto space-y-4">
        {/* ── HERO: Avatar + Identity Card ─────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Avatar & Name */}
          <div className="lg:col-span-1 border border-cyan-500/15 rounded-lg bg-[#0a0a0a] p-5 flex flex-col items-center justify-center relative overflow-hidden">
            {/* Glow background */}
            <div className="absolute inset-0 bg-gradient-to-b from-cyan-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="relative z-10 flex flex-col items-center">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center text-3xl font-bold text-white shadow-[0_0_30px_rgba(34,211,238,0.2)] mb-4 ring-2 ring-cyan-500/20 ring-offset-2 ring-offset-[#0a0a0a]">
                {initials}
              </div>

              {editingName ? (
                <div className="flex items-center gap-2 mt-1">
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    className="h-8 bg-[#111] border-cyan-500/20 text-cyan-400 text-sm w-44 font-mono"
                    placeholder="Enter display name"
                    autoFocus
                    onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                  />
                  <button onClick={handleSaveName} disabled={savingName} className="text-emerald-400 hover:text-emerald-300">
                    {savingName ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  </button>
                  <button onClick={() => setEditingName(false)} className="text-red-400 hover:text-red-300">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2 mt-1">
                  <h2 className="text-lg font-bold text-white tracking-wide">{displayName}</h2>
                  <button
                    onClick={() => { setNewName(displayName); setEditingName(true); }}
                    className="text-gray-600 hover:text-cyan-400 transition-colors"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center gap-2 mt-2">
                <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-[10px] tracking-wider">
                  PRO TRADER
                </span>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-[10px] tracking-wider">
                  ACTIVE
                </span>
              </div>
            </div>
          </div>

          {/* Stats Panel */}
          <div className="lg:col-span-2 border border-amber-500/15 rounded-lg bg-[#0a0a0a] p-5">
            <div className="text-amber-400 font-bold text-xs tracking-[0.15em] mb-4 pb-2 border-b border-amber-500/15 flex items-center gap-2">
              <Activity className="w-3.5 h-3.5" />
              ACCOUNT METRICS
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <StatCard label="DAYS ACTIVE" value={daysSinceJoin.toString()} icon={<Clock className="w-4 h-4" />} color="cyan" />
              <StatCard label="AUTH METHOD" value={provider.toUpperCase()} icon={<Shield className="w-4 h-4" />} color="emerald" />
              <StatCard label="SESSION" value="LIVE" icon={<Zap className="w-4 h-4" />} color="amber" />
              <StatCard label="TIER" value="PRO" icon={<TrendingUp className="w-4 h-4" />} color="purple" />
            </div>
          </div>
        </div>

        {/* ── DETAILS GRID ─────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Account Information */}
          <div className="border border-cyan-500/15 rounded-lg bg-[#0a0a0a] p-4">
            <div className="text-cyan-400 font-bold text-xs tracking-[0.15em] mb-3 pb-2 border-b border-cyan-500/15 flex items-center gap-2">
              <User className="w-3.5 h-3.5" />
              ACCOUNT INFORMATION
            </div>
            <div className="space-y-1">
              <InfoRow icon={<Mail className="w-3.5 h-3.5" />} label="EMAIL" value={user.email || '—'} onCopy={() => copyToClipboard(user.email || '')} />
              <InfoRow
                icon={<Calendar className="w-3.5 h-3.5" />}
                label="MEMBER SINCE"
                value={memberSince.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}
              />
              <InfoRow
                icon={<Clock className="w-3.5 h-3.5" />}
                label="LAST SIGN IN"
                value={
                  lastSignIn
                    ? lastSignIn.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: false })
                    : '—'
                }
              />
              <InfoRow icon={<Globe className="w-3.5 h-3.5" />} label="PROVIDER" value={provider.toUpperCase()} />
              <InfoRow icon={<Smartphone className="w-3.5 h-3.5" />} label="PHONE" value={user.phone || 'Not set'} />
            </div>
          </div>

          {/* Security & Identity */}
          <div className="border border-emerald-500/15 rounded-lg bg-[#0a0a0a] p-4">
            <div className="text-emerald-400 font-bold text-xs tracking-[0.15em] mb-3 pb-2 border-b border-emerald-500/15 flex items-center gap-2">
              <Shield className="w-3.5 h-3.5" />
              SECURITY &amp; IDENTITY
            </div>
            <div className="space-y-1">
              <div className="flex items-center justify-between py-2 px-2.5 rounded hover:bg-white/[0.02] transition-colors group">
                <div className="flex items-center gap-2.5">
                  <Key className="w-3.5 h-3.5 text-emerald-500/60" />
                  <span className="text-gray-500 text-[11px] tracking-wider">USER ID</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400 text-[11px] font-mono">
                    {showUserId ? user.id : user.id.slice(0, 8) + '••••••••'}
                  </span>
                  <button onClick={() => setShowUserId(!showUserId)} className="text-gray-600 hover:text-emerald-400 transition-colors">
                    {showUserId ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                  <button onClick={() => copyToClipboard(user.id)} className="text-gray-600 hover:text-emerald-400 transition-colors">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
              </div>
              <InfoRow
                icon={<Shield className="w-3.5 h-3.5" />}
                label="EMAIL VERIFIED"
                value={user.email_confirmed_at ? '✓ VERIFIED' : '✗ UNVERIFIED'}
                valueColor={user.email_confirmed_at ? 'text-emerald-400' : 'text-red-400'}
              />
              <InfoRow
                icon={<Shield className="w-3.5 h-3.5" />}
                label="MFA"
                value={user.factors && user.factors.length > 0 ? 'ENABLED' : 'NOT SET'}
                valueColor={user.factors && user.factors.length > 0 ? 'text-emerald-400' : 'text-yellow-400'}
              />
              <InfoRow icon={<RefreshCw className="w-3.5 h-3.5" />} label="AUTH ROLE" value={(user.role || 'authenticated').toUpperCase()} />
            </div>
          </div>
        </div>

        {/* ── Quick Actions ────────────────────────────── */}
        <div className="border border-purple-500/15 rounded-lg bg-[#0a0a0a] p-4">
          <div className="text-purple-400 font-bold text-xs tracking-[0.15em] mb-3 pb-2 border-b border-purple-500/15 flex items-center gap-2">
            <Zap className="w-3.5 h-3.5" />
            QUICK ACTIONS
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <ActionCard
              icon={<BarChart3 className="w-4 h-4" />}
              label="Connect Broker"
              desc="Link your trading account"
              color="cyan"
              onClick={() => navigate('/connect-broker')}
            />
            <ActionCard
              icon={<TrendingUp className="w-4 h-4" />}
              label="View Markets"
              desc="Live market data & charts"
              color="emerald"
              onClick={() => navigate('/markets')}
            />
            <ActionCard
              icon={<Activity className="w-4 h-4" />}
              label="Trade Journal"
              desc="Log and analyze trades"
              color="amber"
              onClick={() => navigate('/journaling')}
            />
            <ActionCard
              icon={<BarChart3 className="w-4 h-4" />}
              label="Reports"
              desc="Performance analytics"
              color="purple"
              onClick={() => navigate('/reports')}
            />
          </div>
        </div>

        {/* ── Sign Out ─────────────────────────────────── */}
        <div className="flex justify-end pt-1 pb-4">
          <Button
            variant="outline"
            onClick={handleSignOut}
            className="gap-2 bg-transparent border-red-500/20 text-red-400 hover:bg-red-500/10 hover:border-red-500/40 hover:text-red-300 text-xs tracking-wider font-mono"
          >
            <LogOut className="w-3.5 h-3.5" />
            SIGN OUT
          </Button>
        </div>
      </div>
    </div>
  );
};

/* ─── Sub-components ──────────────────────────────── */

function StatCard({ label, value, icon, color }: { label: string; value: string; icon: React.ReactNode; color: string }) {
  const colors: Record<string, string> = {
    cyan: 'text-cyan-400 border-cyan-500/15 bg-cyan-500/5',
    emerald: 'text-emerald-400 border-emerald-500/15 bg-emerald-500/5',
    amber: 'text-amber-400 border-amber-500/15 bg-amber-500/5',
    purple: 'text-purple-400 border-purple-500/15 bg-purple-500/5',
  };
  return (
    <div className={`rounded-lg border p-3 text-center ${colors[color] || colors.cyan}`}>
      <div className="flex items-center justify-center mb-2 opacity-60">{icon}</div>
      <div className="text-lg font-bold">{value}</div>
      <div className="text-[9px] tracking-[0.15em] opacity-50 mt-0.5">{label}</div>
    </div>
  );
}

function InfoRow({
  icon, label, value, onCopy, valueColor,
}: {
  icon: React.ReactNode; label: string; value: string; onCopy?: () => void; valueColor?: string;
}) {
  return (
    <div className="flex items-center justify-between py-2 px-2.5 rounded hover:bg-white/[0.02] transition-colors group">
      <div className="flex items-center gap-2.5">
        <span className="text-gray-600">{icon}</span>
        <span className="text-gray-500 text-[11px] tracking-wider">{label}</span>
      </div>
      <div className="flex items-center gap-2">
        <span className={`text-[11px] font-mono ${valueColor || 'text-gray-300'}`}>{value}</span>
        {onCopy && (
          <button onClick={onCopy} className="text-gray-600 hover:text-cyan-400 transition-colors opacity-0 group-hover:opacity-100">
            <Copy className="w-3 h-3" />
          </button>
        )}
      </div>
    </div>
  );
}

function ActionCard({
  icon, label, desc, color, onClick,
}: {
  icon: React.ReactNode; label: string; desc: string; color: string; onClick: () => void;
}) {
  const accents: Record<string, string> = {
    cyan: 'border-cyan-500/15 hover:border-cyan-500/30 text-cyan-400',
    emerald: 'border-emerald-500/15 hover:border-emerald-500/30 text-emerald-400',
    amber: 'border-amber-500/15 hover:border-amber-500/30 text-amber-400',
    purple: 'border-purple-500/15 hover:border-purple-500/30 text-purple-400',
  };
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-3 rounded-lg border bg-[#0d0d0d] hover:bg-[#111] p-3 text-left transition-all group ${accents[color] || accents.cyan}`}
    >
      <div className="opacity-70 group-hover:opacity-100 transition-opacity">{icon}</div>
      <div className="flex-1 min-w-0">
        <div className="text-xs font-bold tracking-wide">{label}</div>
        <div className="text-[10px] text-gray-500 mt-0.5 truncate">{desc}</div>
      </div>
      <ChevronRight className="w-3.5 h-3.5 text-gray-600 group-hover:translate-x-0.5 transition-transform" />
    </button>
  );
}

export default Profile;
