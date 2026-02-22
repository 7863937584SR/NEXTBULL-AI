import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, User, LogOut, Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

export const AppHeader = ({ onToggleSidebar }: AppHeaderProps) => {
  const { user, signOut } = useAuth();
  const location = useLocation();
  const isChat = location.pathname === '/';

  return (
    <header
      className="h-14 flex items-center justify-between px-4 sm:px-5 border-b"
      style={{
        background: 'hsl(222 18% 9%)',
        borderColor: 'hsl(222 13% 16%)',
      }}
    >
      {/* Left */}
      <div className="flex items-center gap-3">
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden w-8 h-8"
          onClick={onToggleSidebar}
          aria-label="Toggle sidebar"
        >
          <Menu className="w-5 h-5" />
        </Button>

        {/* Live indicator */}
        <div className="hidden sm:flex items-center gap-2 px-2.5 py-1 rounded-md"
          style={{ background: 'hsl(169 59% 40% / 0.08)' }}>
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-75" style={{ background: 'hsl(169 59% 40%)' }} />
            <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: 'hsl(169 59% 40%)' }} />
          </span>
          <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'hsl(169 59% 40%)' }}>
            Markets Live
          </span>
        </div>
      </div>

      {/* Center — page title on mobile */}
      <div className="lg:hidden absolute left-1/2 -translate-x-1/2">
        <span className="text-sm font-bold text-foreground flex items-center gap-1.5">
          <img src="/nextbull-logo.jpg" alt="NextBull" className="w-5 h-5 rounded object-cover" />
          NextBull
        </span>
      </div>

      {/* Right */}
      <div className="flex items-center gap-2">
        <Link
          to="/"
          className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all"
          style={{
            background: isChat ? 'hsl(222 100% 56% / 0.1)' : 'transparent',
            color: isChat ? 'hsl(222 100% 56%)' : 'hsl(220 14% 60%)',
          }}
        >
          <MessageSquare className="w-3.5 h-3.5" />
          AI Chat
        </Link>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="gap-2 px-2"
              >
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                  style={{ background: 'hsl(222 100% 56% / 0.15)', color: 'hsl(222 100% 56%)' }}>
                  {user.email?.charAt(0).toUpperCase() || 'U'}
                </div>
                <span className="text-xs hidden sm:inline text-muted-foreground font-medium">
                  {user.email?.split('@')[0]}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              <div className="px-2 py-1.5">
                <p className="text-xs font-medium text-foreground">{user.email?.split('@')[0]}</p>
                <p className="text-[10px] text-muted-foreground truncate">{user.email}</p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="w-3.5 h-3.5" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="w-3.5 h-3.5 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button size="sm" className="gap-2 text-xs h-8 px-3">
              <User className="w-3.5 h-3.5" />
              Log in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
