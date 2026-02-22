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
  X,
} from 'lucide-react';
import { Button } from '@/components/ui/button';

const navItems = [
  { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard, section: 'main' },
  { name: 'Economic', path: '/economic', icon: TrendingUp, section: 'main' },
  { name: 'Research', path: '/research', icon: FileText, section: 'main' },
  { name: 'News', path: '/news', icon: Newspaper, section: 'main' },
  { name: 'Sentimental', path: '/sentimental', icon: BarChart3, section: 'main' },
  { name: 'Events', path: '/events', icon: Calendar, section: 'tools' },
  { name: 'Market Trace', path: '/market-trace', icon: Map, section: 'tools' },
  { name: 'Journaling', path: '/journaling', icon: BookOpen, section: 'tools' },
  { name: 'Reports', path: '/reports', icon: FileBarChart, section: 'tools' },
  { name: 'Connect Broker', path: '/connect-broker', icon: LinkIcon, section: 'tools' },
  { name: 'About', path: '/about', icon: Info, section: 'other' },
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
    return (
      <li key={item.path}>
        <NavLink
          to={item.path}
          onClick={onClose}
          className={cn(
            "relative flex items-center gap-3 px-3 py-2.5 mx-2 rounded-lg text-sm font-medium transition-all duration-200",
            isActive
              ? "bg-primary/10 text-primary"
              : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
          )}
        >
          {isActive && (
            <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-primary rounded-r-full" />
          )}
          <Icon className={cn("w-4 h-4 flex-shrink-0", isActive && "text-primary")} />
          <span>{item.name}</span>
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
          "w-[220px] min-h-screen flex flex-col z-50 transition-transform duration-200 border-r border-sidebar-border",
          "hidden lg:flex",
          isOpen && "!flex fixed inset-y-0 left-0"
        )}
        style={{ background: 'hsl(222 18% 9%)' }}
      >
        {/* Logo area */}
        <div className="flex items-center justify-between px-4 h-14 border-b border-sidebar-border">
          <NavLink to="/" className="flex items-center gap-2.5" onClick={onClose}>
            <img src="/nextbull-logo.jpg" alt="NextBull" className="w-7 h-7 rounded-lg object-cover" />
            <span className="text-[15px] font-bold text-foreground tracking-tight">NextBull</span>
            <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-primary/15 text-primary uppercase tracking-wider">GPT</span>
          </NavLink>
          <Button variant="ghost" size="icon" onClick={onClose} className="lg:hidden text-sidebar-foreground hover:bg-sidebar-accent w-8 h-8">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Nav sections */}
        <nav className="flex-1 py-3 overflow-y-auto">
          {/* Analytics */}
          <div className="px-4 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Analytics</span>
          </div>
          <ul className="space-y-0.5 mb-4">
            {mainItems.map(renderItem)}
          </ul>

          {/* Tools */}
          <div className="px-4 mb-1">
            <span className="text-[10px] font-semibold uppercase tracking-[0.1em] text-muted-foreground/60">Tools</span>
          </div>
          <ul className="space-y-0.5 mb-4">
            {toolItems.map(renderItem)}
          </ul>

          {/* Other */}
          <ul className="space-y-0.5">
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
