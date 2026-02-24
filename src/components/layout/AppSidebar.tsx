import { NavLink, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';
import {
  TrendingUp,
  FileText,
  Newspaper,
  BarChart3,
  BookOpen,
  Calendar,
  Map,
  FileBarChart,
  Info,
  User,
  Link as LinkIcon,
  LayoutDashboard,
  Globe,
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Markets', path: '/markets', icon: Globe, section: 'main', color: 'text-blue-400', bg: 'bg-blue-400/10' },
  { name: 'Economic', path: '/economic', icon: TrendingUp, section: 'main', color: 'text-emerald-400', bg: 'bg-emerald-400/10' },
  { name: 'Research', path: '/research', icon: FileText, section: 'main', color: 'text-purple-400', bg: 'bg-purple-400/10' },
  { name: 'News', path: '/news', icon: Newspaper, section: 'main', color: 'text-orange-400', bg: 'bg-orange-400/10' },
  { name: 'Sentimental', path: '/sentimental', icon: BarChart3, section: 'main', color: 'text-rose-400', bg: 'bg-rose-400/10' },
  { name: 'Events', path: '/events', icon: Calendar, section: 'tools', color: 'text-cyan-400', bg: 'bg-cyan-400/10' },
  { name: 'Market Trace', path: '/market-trace', icon: Map, section: 'tools', color: 'text-indigo-400', bg: 'bg-indigo-400/10' },
  { name: 'Journaling', path: '/journaling', icon: BookOpen, section: 'tools', color: 'text-teal-400', bg: 'bg-teal-400/10' },
  { name: 'Reports', path: '/reports', icon: FileBarChart, section: 'tools', color: 'text-yellow-400', bg: 'bg-yellow-400/10' },
  { name: 'Connect Broker', path: '/connect-broker', icon: LinkIcon, section: 'tools', color: 'text-sky-400', bg: 'bg-sky-400/10' },
  { name: 'About', path: '/about', icon: Info, section: 'other', color: 'text-slate-400', bg: 'bg-slate-400/10' },
];

interface AppSidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AppSidebar = ({ isOpen, onClose }: AppSidebarProps) => {
  const location = useLocation();

  const mainItems = navItems.filter(i => i.section === 'main');
  const toolItems = navItems.filter(i => i.section === 'tools');
  const otherItems = navItems.filter(i => i.section === 'other');

  const renderItem = (item: typeof navItems[0]) => {
    const isActive = location.pathname === item.path;
    const Icon = item.icon;

    // Extract base color class for glowing effects (e.g. 'bg-emerald-400' from 'bg-emerald-400/10')
    const baseColorClass = item.bg.split('/')[0];

    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          onClick={onClose}
          className={cn(
            "group relative flex items-center gap-3 px-3 py-2.5 mx-3 mb-1.5 rounded-xl text-sm font-medium transition-all duration-300 border border-transparent overflow-hidden",
            isActive
              ? `bg-secondary/40 border-border/50 shadow-sm text-foreground backdrop-blur-md`
              : "text-sidebar-foreground hover:bg-secondary/20 hover:border-border/30 hover:text-foreground hover:shadow-sm hover:backdrop-blur-sm"
          )}
        >
          {/* Subtle glowing background overlay inside the pill */}
          <div className={cn(
            "absolute inset-0 transition-opacity duration-300 opacity-0 mix-blend-screen pointer-events-none",
            isActive ? "opacity-10" : "group-hover:opacity-[0.05]",
            baseColorClass
          )} />

          {/* Active indicator bar */}
          {isActive && (
            <div className={cn(
              "absolute left-0 top-1/2 -translate-y-1/2 w-[4px] h-[60%] rounded-r-full drop-shadow-md",
              baseColorClass
            )} />
          )}

          {/* Icon Container */}
          <div className={cn(
            "p-1.5 rounded-lg flex items-center justify-center transition-all duration-300 relative z-10",
            isActive ? item.bg : "bg-transparent group-hover:bg-background/50",
            isActive ? "ring-1 ring-inset ring-white/10 shadow-sm" : "group-hover:ring-1 group-hover:ring-inset group-hover:ring-white/5"
          )}>
            <Icon className={cn(
              "w-[18px] h-[18px] flex-shrink-0 transition-all",
              isActive ? item.color : "text-muted-foreground group-hover:text-foreground/90",
              isActive && "drop-shadow-md scale-110"
            )} />
          </div>

          <span className="tracking-wide relative z-10">{item.name}</span>
        </NavLink>
      </li>
    );
  };

  return (
    <>
      {/* Mobile backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 lg:hidden"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          "w-[240px] min-h-screen flex flex-col z-50 transition-transform duration-200 border-r border-sidebar-border",
          "hidden lg:flex",
          isOpen && "!flex fixed inset-y-0 left-0"
        )}
        style={{ background: 'hsl(222 18% 9%)' }}
      >
        <Button variant="ghost" size="icon" onClick={onClose} className="absolute top-4 right-4 lg:hidden z-20 text-sidebar-foreground hover:bg-sidebar-accent w-8 h-8">
          <X className="w-5 h-5" />
        </Button>

        {/* Logo area */}
        <div className="flex flex-col items-center justify-center py-8 px-4 border-b border-sidebar-border relative overflow-hidden">
          {/* Subtle glow background for the logo area */}
          <div className="absolute inset-0 bg-gradient-to-b from-emerald-500/10 to-transparent pointer-events-none" />

          <NavLink to="/" className="flex flex-col items-center gap-4 relative z-10 hover:opacity-90 transition-opacity" onClick={onClose}>
            <div className="relative group">
              <div className="absolute -inset-2 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full blur-md opacity-40 group-hover:opacity-70 transition-opacity animate-pulse" />
              <img src="/nextbull-logo.jpg" alt="NextBull" className="relative w-16 h-16 rounded-full object-cover ring-2 ring-white/10 shadow-[0_0_20px_theme(colors.blue.600/30)]" />
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xl font-black tracking-tight bg-gradient-to-r from-white to-white/90 bg-clip-text text-transparent leading-none">
                NextBull
              </span>
              <span className="text-[10px] font-bold px-1.5 py-[2px] rounded bg-gradient-to-r from-emerald-500/20 to-teal-500/20 text-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)] uppercase tracking-widest border border-emerald-500/40 leading-none">
                AI
              </span>
            </div>
          </NavLink>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-4 overflow-y-auto custom-scrollbar">
          {/* Analytics */}
          <div className="px-5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Analytics</span>
          </div>
          <ul className="space-y-1 mb-6">
            {mainItems.map(renderItem)}
          </ul>

          {/* Tools */}
          <div className="px-5 mb-2">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Tools</span>
          </div>
          <ul className="space-y-1 mb-6">
            {toolItems.map(renderItem)}
          </ul>

          {/* Other */}
          <div className="px-5 mb-2 mt-auto">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">Other</span>
          </div>
          <ul className="space-y-1">
            {otherItems.map(renderItem)}
          </ul>
        </nav>

        {/* Profile footer */}
        <div className="border-t border-sidebar-border p-2">
          <NavLink
            to="/profile"
            onClick={onClose}
            className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
              location.pathname === '/profile'
                ? "bg-primary/10 text-primary"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
            )}
          >
            <div className="w-6 h-6 rounded-full bg-primary/15 flex items-center justify-center">
              <User className="w-3.5 h-3.5 text-primary" />
            </div>
            <span>Profile</span>
          </NavLink>
        </div>
      </aside>
    </>
  );
};
