import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { MessageSquare, User, LogOut, Menu, Search, Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuth } from '@/contexts/AuthContext';
import { StockSearchModal } from '@/components/dashboard/StockSearchModal';
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

  // Stock Search Modal State
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeSymbol, setActiveSymbol] = useState<string | null>(null);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setActiveSymbol(searchQuery.trim().toUpperCase());
      setIsModalOpen(true);
      setSearchQuery(''); // Optional: clear after search
    }
  };

  return (
    <>
      <header
        className="h-14 flex items-center justify-between px-4 sm:px-5 border-b sticky top-0 z-40"
        style={{
          background: 'hsl(222 18% 9% / 0.8)',
          backdropFilter: 'blur(12px)',
          borderColor: 'hsl(222 13% 16%)',
        }}
      >
        {/* Left */}
        <div className="flex items-center gap-3 w-1/4">
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden w-8 h-8"
            onClick={onToggleSidebar}
            aria-label="Toggle sidebar"
          >
            <Menu className="w-5 h-5" />
          </Button>

          {/* Live indicator (Hidden on very small screens to make room for search) */}
          <div className="hidden md:flex items-center gap-2 px-2.5 py-1 rounded-md"
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

        {/* Center — Global Search Bar & Mobile Title */}
        <div className="flex-1 flex justify-center max-w-md mx-4">
          {/* Mobile Title (Shows when search isn't focused/used, or always next to it if space permits) */}
          <div className="lg:hidden absolute left-1/2 -translate-x-1/2 sm:static sm:translate-x-0 hidden sm:flex items-center gap-2 mr-4">
            <div className="relative group">
              <div className="absolute -inset-1 bg-gradient-to-tr from-blue-600 to-indigo-500 rounded-full blur opacity-60 animate-pulse" />
              <img src="/nextbull-logo.jpg" alt="NextBull" className="relative w-6 h-6 rounded-full object-cover ring-1 ring-white/10" />
            </div>
          </div>

          <form onSubmit={handleSearchSubmit} className="w-full relative group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground group-focus-within:text-emerald-500 transition-colors" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search stocks, crypto, indices... (e.g., RELIANCE, AAPL)"
              className="w-full pl-9 bg-secondary/30 border-border/50 focus-visible:ring-emerald-500/30 focus-visible:border-emerald-500/50 rounded-full h-9 text-xs sm:text-sm placeholder:text-muted-foreground/70 transition-all duration-300 hover:bg-secondary/50 focus-visible:bg-secondary/50 shadow-sm hover:shadow-[0_0_15px_rgba(16,185,129,0.15)] focus-visible:shadow-[0_0_20px_rgba(16,185,129,0.25)]"
            />
            {/* Subtle keyboard shortcut hint */}
            <div className="absolute right-3 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 opacity-50 pointer-events-none">
              <kbd className="bg-background border border-border rounded px-1.5 py-0.5 text-[9px] font-mono font-bold text-foreground">↵</kbd>
            </div>
          </form>
        </div>

        {/* Right */}
        <div className="flex items-center justify-end gap-2 w-1/4">
          <Link
            to="/"
            className={`hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-md text-sm transition-all relative overflow-hidden group ${isChat ? 'font-semibold border-emerald-500/30' : 'font-medium border-transparent'
              }`}
            style={{
              background: isChat ? 'hsl(169 59% 40% / 0.12)' : 'transparent',
              color: isChat ? 'hsl(169 70% 45%)' : 'hsl(220 14% 60%)',
              borderWidth: '1px'
            }}
          >
            {isChat && <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10" />}
            <MessageSquare className={`w-3.5 h-3.5 relative z-10 ${isChat ? 'text-emerald-400' : ''}`} />
            <span className="relative z-10">
              NextBull <span className={isChat ? 'text-emerald-400 font-bold tracking-wide' : ''}>AI</span>
            </span>
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

      {/* Global Stock Search Overlay */}
      <StockSearchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        symbol={activeSymbol}
      />
    </>
  );
};
