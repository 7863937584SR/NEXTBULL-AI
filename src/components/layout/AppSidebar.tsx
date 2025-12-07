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
  Link as LinkIcon
} from 'lucide-react';

const navItems = [
  { name: 'Economic', path: '/economic', icon: TrendingUp },
  { name: 'Research', path: '/research', icon: FileText },
  { name: 'News', path: '/news', icon: Newspaper },
  { name: 'Sentimental', path: '/sentimental', icon: BarChart3 },
  { name: 'Journaling', path: '/journaling', icon: BookOpen },
  { name: 'Events', path: '/events', icon: Calendar },
  { name: 'Market Trace', path: '/market-trace', icon: Map },
  { name: 'Reports', path: '/reports', icon: FileBarChart },
  { name: 'Connect Broker', path: '/connect-broker', icon: LinkIcon },
  { name: 'About', path: '/about', icon: Info },
];

export const AppSidebar = () => {
  const location = useLocation();

  return (
    <aside className="w-56 min-h-screen sidebar-gradient flex flex-col">
      <nav className="flex-1 py-4">
        <ul className="space-y-1">
          {navItems.map((item) => {
            const isActive = location.pathname === item.path;
            const Icon = item.icon;
            
            return (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={cn(
                    "flex items-center gap-3 px-4 py-3 text-sidebar-foreground font-medium transition-all duration-200",
                    isActive 
                      ? "bg-sidebar-accent/60" 
                      : "hover:bg-sidebar-accent/40"
                  )}
                >
                  <Icon className="w-4 h-4" />
                  {item.name}
                </NavLink>
              </li>
            );
          })}
        </ul>
      </nav>
      
      <div className="p-4 border-t border-sidebar-border">
        <NavLink
          to="/profile"
          className="flex items-center gap-3 px-2 py-2 text-sidebar-foreground font-medium hover:bg-sidebar-accent/40 rounded-lg transition-all duration-200"
        >
          <User className="w-4 h-4" />
          Profile
        </NavLink>
      </div>
    </aside>
  );
};
