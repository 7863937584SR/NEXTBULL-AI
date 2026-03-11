import { Bell, Settings, User, Wifi, Database, Zap, Menu, Activity } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";
import { NextBullLogo } from "@/components/NextBullLogo";
import { TerminalClock } from "@/components/ui/TerminalClock";

interface AppHeaderProps {
  onToggleSidebar: () => void;
}

const AppHeader = ({ onToggleSidebar }: AppHeaderProps) => {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = useCallback(async () => {
    try {
      await signOut();
      navigate("/auth");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  }, [signOut, navigate]);

  return (
    <div className="h-11 bg-[#0a0a0a] border-b border-emerald-500/15 flex items-center justify-between px-4 font-mono text-xs">
      {/* Left section - Logo & controls */}
      <div className="flex items-center space-x-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggleSidebar}
          className="lg:hidden h-7 w-7 p-0 hover:bg-emerald-500/20 text-emerald-400"
        >
          <Menu className="h-4 w-4" />
        </Button>
        
        <a href="/" onClick={(e) => { e.preventDefault(); navigate('/'); }} className="flex items-center gap-2 cursor-pointer hover:opacity-80 transition-opacity">
          <NextBullLogo size="xs" glow animated showText={false} />
          <span className="text-[12px] font-black tracking-wider">
            <span className="bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_10px_rgba(59,130,246,0.5)]">NEXTBULL</span>
            <span className="ml-1.5 bg-gradient-to-r from-blue-300 to-indigo-400 bg-clip-text text-transparent drop-shadow-[0_0_8px_rgba(99,102,241,0.4)]">GPT</span>
          </span>
        </a>
        
        <div className="hidden md:flex items-center space-x-3 text-emerald-400/70 ml-2">
          <div className="flex items-center space-x-1 px-2 py-0.5 rounded-full bg-emerald-500/10">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(16,185,129,0.4)]" />
            <span className="text-[10px]">LIVE</span>
          </div>
          <div className="flex items-center space-x-1 text-cyan-400/60">
            <Database className="h-3 w-3" />
            <span className="text-[10px]">RT</span>
          </div>
          <div className="flex items-center space-x-1 text-amber-400/60">
            <Zap className="h-3 w-3" />
            <span className="text-[10px]">FEED</span>
          </div>
        </div>
      </div>
      
      {/* Center section - Market status */}
      <div className="hidden lg:flex flex-1 justify-center">
        <div className="flex items-center gap-3 text-[10px]">
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20">
            <Activity className="w-3 h-3 text-emerald-400" />
            <span className="text-emerald-400 font-bold">MARKETS OPEN</span>
          </div>
          <div className="text-gray-600">│</div>
          <span className="text-cyan-400/70">NSE: <span className="text-emerald-400">●</span> ACTIVE</span>
          <div className="text-gray-600">│</div>
          <span className="text-cyan-400/70">BSE: <span className="text-emerald-400">●</span> ONLINE</span>
        </div>
      </div>
      
      {/* Right section - Time and user controls */}
      <div className="flex items-center space-x-3">
        <div className="hidden md:block text-white text-right">
          <TerminalClock
            className="text-cyan-400 text-[11px] font-bold tracking-wider drop-shadow-[0_0_6px_rgba(34,211,238,0.3)]"
            showDate
            dateClassName="text-emerald-400/60 text-[10px] block"
          />
        </div>
        
        <div className="flex items-center space-x-1.5">
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 hover:bg-emerald-500/15 text-emerald-400/70 hover:text-emerald-400 rounded-lg transition-all"
          >
            <Bell className="h-3.5 w-3.5" />
          </Button>
          
          <Button 
            variant="ghost" 
            size="sm" 
            className="h-7 w-7 p-0 hover:bg-emerald-500/15 text-emerald-400/70 hover:text-emerald-400 rounded-lg transition-all"
          >
            <Settings className="h-3.5 w-3.5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                className="h-7 w-7 rounded-full p-0 hover:bg-emerald-500/15"
              >
                <Avatar className="h-6 w-6 ring-1 ring-emerald-500/30">
                  <AvatarImage src={user?.user_metadata?.avatar_url} />
                  <AvatarFallback className="bg-emerald-500/15 text-emerald-400 text-[10px]">
                    <User className="h-3 w-3" />
                  </AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent 
              className="w-52 bg-[#0a0a0a] border-emerald-500/20 text-emerald-400 shadow-lg shadow-emerald-500/5" 
              align="end"
            >
              <DropdownMenuItem 
                onClick={() => navigate("/profile")}
                className="hover:bg-emerald-500/15 focus:bg-emerald-500/15 text-xs"
              >
                <User className="h-3.5 w-3.5 mr-2" /> Profile Settings
              </DropdownMenuItem>
              <DropdownMenuItem 
                onClick={handleSignOut}
                className="hover:bg-red-500/15 focus:bg-red-500/15 text-red-400 text-xs"
              >
                <Zap className="h-3.5 w-3.5 mr-2" /> Logout Terminal
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </div>
  );
};

export { AppHeader };
export default AppHeader;
