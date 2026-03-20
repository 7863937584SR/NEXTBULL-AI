import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  FileText,
  Newspaper,
  BarChart3,
  BookOpen,
  Calendar,
  Shield,
  Map,
  FileBarChart,
  Info,
  User,
  Link as LinkIcon,
  Globe,
  X,
  DollarSign,
  Terminal,
  Activity,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { NextBullLogo } from '@/components/NextBullLogo';
import { useAuth } from '@/contexts/AuthContext';

const navItems = [
  { name: 'MARKETS', path: '/markets', icon: Globe, section: 'MARKET DATA', shortcut: 'MKTV' },
  { name: 'CURRENCY', path: '/currency', icon: DollarSign, section: 'MARKET DATA', shortcut: 'CRNC' },
  { name: 'ECONOMIC', path: '/economic', icon: TrendingUp, section: 'MARKET DATA', shortcut: 'ECO' },
  { name: 'RESEARCH', path: '/research', icon: FileText, section: 'ANALYTICS', shortcut: 'RSCH' },
  { name: 'RESEARCH ADMIN', path: '/research-admin', icon: Shield, section: 'ANALYTICS', shortcut: 'RADM', adminOnly: true },
  { name: 'NEWS', path: '/news', icon: Newspaper, section: 'ANALYTICS', shortcut: 'NEWS' },
  { name: 'SENTIMENT', path: '/sentimental', icon: BarChart3, section: 'ANALYTICS', shortcut: 'SENT' },
  { name: 'EVENTS', path: '/events', icon: Calendar, section: 'TOOLS', shortcut: 'EVNT' },
  { name: 'TRACE', path: '/market-trace', icon: Map, section: 'TOOLS', shortcut: 'TRAC' },
  { name: 'JOURNAL', path: '/journaling', icon: BookOpen, section: 'TOOLS', shortcut: 'JRNL' },
  { name: 'REPORTS', path: '/reports', icon: FileBarChart, section: 'TOOLS', shortcut: 'RPRT' },
  { name: 'BROKER', path: '/connect-broker', icon: LinkIcon, section: 'TOOLS', shortcut: 'BRKR' },
  { name: 'ABOUT', path: '/about', icon: Info, section: 'SYSTEM', shortcut: 'ABUT' },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const { isAdmin } = useAuth();
  const location = useLocation();
  const sections = ['MARKET DATA', 'ANALYTICS', 'TOOLS', 'SYSTEM'];

  const renderItem = (item: typeof navItems[0]) => {
    if (item.adminOnly && !isAdmin) {
      return null;
    }
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          onClick={onClose}
          className={cn(
            "group relative flex items-center gap-3 px-3 py-2.5 mx-2 mb-0.5 text-xs font-mono transition-all duration-200 rounded-lg",
            isActive
              ? "bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-400 shadow-[inset_0_1px_0_rgba(16,185,129,0.15),0_0_12px_rgba(16,185,129,0.08)]"
              : "hover:bg-emerald-500/5 text-gray-400 hover:text-emerald-400"
          )}
        >
          {/* Active indicator bar */}
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-gradient-to-b from-emerald-400 to-cyan-400 rounded-r-full shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          )}

          {/* Icon */}
          <div className={cn(
            "flex items-center justify-center w-7 h-7 rounded-md transition-all",
            isActive 
              ? "bg-emerald-500/15 text-emerald-400" 
              : "text-gray-500 group-hover:text-emerald-400 group-hover:bg-emerald-500/10"
          )}>
            <Icon className="w-3.5 h-3.5 flex-shrink-0" />
          </div>

          {/* Label & shortcut */}
          <div className="flex-1 flex items-center justify-between">
            <span className="tracking-wider text-[11px]">{item.name}</span>
            <span className={cn(
              "text-[10px] opacity-50 font-mono px-1.5 py-0.5 rounded",
              isActive ? "text-amber-400 bg-amber-400/10" : "text-gray-600"
            )}>{item.shortcut}</span>
          </div>
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/80 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-[270px] min-h-screen flex flex-col z-50 transition-transform duration-300 border-r border-emerald-500/15 bg-[#0a0a0a] font-mono",
          "hidden lg:flex",
          isOpen && "!flex fixed inset-y-0 left-0"
        )}
      >
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={onClose} 
          className="absolute top-4 right-4 lg:hidden z-20 text-green-400 hover:bg-green-500/20 w-8 h-8"
        >
          <X className="w-4 h-4" />
        </Button>

        {/* Terminal Header — Glowing NextBull Logo (clickable → chat) */}
        <NavLink
          to="/"
          onClick={onClose}
          className="flex items-center justify-center py-6 px-4 border-b border-blue-500/20 bg-gradient-to-b from-blue-500/5 to-transparent hover:from-blue-500/10 transition-all cursor-pointer"
        >
          <NextBullLogo size="sm" glow animated />
        </NavLink>

        {/* Command Line Interface */}
        <div className="px-4 py-2 border-b border-emerald-500/15 bg-black/50">
          <div className="text-emerald-400/80 text-[10px] font-mono flex items-center gap-1">
            <span className="text-amber-400/80">nextbull</span>
            <span className="text-gray-600">@</span>
            <span className="text-cyan-400/80">terminal</span>
            <span className="text-gray-600">:</span>
            <span className="text-emerald-400/70">~$</span>
            <span className="w-1.5 h-3.5 bg-emerald-400/50 ml-1 inline-block" />
          </div>
        </div>

        {/* Navigation Sections */}
        <nav className="flex-1 py-3 overflow-y-auto terminal-scroll">
          {sections.map((section) => {
            const sectionItems = navItems.filter(item => item.section === section);
            return (
              <div key={section} className="mb-3">
                <div className="px-5 py-1.5 mb-1">
                  <div className="text-[10px] font-bold uppercase tracking-[0.2em] text-gray-500 flex items-center gap-2">
                    <div className="h-px flex-1 bg-gradient-to-r from-emerald-500/20 to-transparent" />
                    {section}
                    <div className="h-px flex-1 bg-gradient-to-l from-emerald-500/20 to-transparent" />
                  </div>
                </div>
                <ul className="py-0.5">
                  {sectionItems.map(renderItem)}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* System Status Footer */}
        <div className="border-t border-emerald-500/15 p-4 bg-gradient-to-t from-emerald-500/5 to-transparent">
          <div className="grid grid-cols-2 gap-2 text-[10px] mb-3">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
              <span className="text-gray-500">STATUS</span>
              <span className="text-emerald-400 ml-auto font-bold">ONLINE</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-cyan-400" />
              <span className="text-gray-500">UPTIME</span>
              <span className="text-cyan-400 ml-auto">24:07:15</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              <span className="text-gray-500">CPU</span>
              <span className="text-amber-400 ml-auto">45%</span>
            </div>
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-purple-400" />
              <span className="text-gray-500">MEM</span>
              <span className="text-purple-400 ml-auto">2.1GB</span>
            </div>
          </div>
          
          {/* Profile Access */}
          <NavLink
            to="/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 text-xs font-mono transition-all rounded-lg",
              location.pathname === '/profile'
                ? "bg-gradient-to-r from-emerald-500/15 to-cyan-500/10 text-emerald-400 shadow-[inset_0_1px_0_rgba(16,185,129,0.15)]"
                : "hover:bg-emerald-500/5 text-gray-400 hover:text-emerald-400"
            )}
          >
            <div className={cn(
              "w-7 h-7 rounded-lg flex items-center justify-center",
              location.pathname === '/profile' ? "bg-emerald-500/15" : "bg-gray-800"
            )}>
              <User className="w-3.5 h-3.5" />
            </div>
            <span className="tracking-wider text-[11px]">PROFILE</span>
            <span className="text-[10px] text-gray-600 ml-auto">PROF</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
