import { Link } from 'react-router-dom';
import { MessageSquare, User, LogOut, Copy } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

export const AppHeader = () => {
  const { user, signOut } = useAuth();

  return (
    <header className="h-14 bg-background border-b border-border flex items-center justify-between px-6">
      <div className="flex items-center gap-2">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold text-primary">NextBull GPT</span>
          <Copy className="w-4 h-4 text-muted-foreground" />
        </Link>
      </div>

      <div className="flex items-center gap-4">
        <Link to="/" className="flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
          <MessageSquare className="w-4 h-4" />
          <span className="text-sm">NextBull Chat</span>
        </Link>

        {user ? (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="gap-2">
                <User className="w-4 h-4" />
                <span className="text-sm">{user.email?.split('@')[0]}</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem asChild>
                <Link to="/profile" className="flex items-center gap-2">
                  <User className="w-4 h-4" />
                  Profile
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem onClick={signOut} className="text-destructive">
                <LogOut className="w-4 h-4 mr-2" />
                Log out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Link to="/auth">
            <Button variant="ghost" size="sm" className="gap-2">
              <User className="w-4 h-4" />
              Log in
            </Button>
          </Link>
        )}
      </div>
    </header>
  );
};
