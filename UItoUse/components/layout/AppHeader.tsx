import { SidebarTrigger } from "@/components/ui/sidebar";
import { Input } from "@/components/ui/input";
import { Bell, ChevronDown, LogOut, Moon, Search, Settings, Shield, ShieldOff, Sun, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import { setIsAdmin, useIsAdmin } from "@/lib/admin-store";
import { signOut, useAuthUser } from "@/lib/auth-store";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

export function AppHeader() {
  const [dark, setDark] = useState(false);
  const isAdmin = useIsAdmin();
  const user = useAuthUser();
  const navigate = useNavigate();

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  const handleSignOut = () => {
    signOut();
    setIsAdmin(false);
    toast.success("Signed out");
    navigate("/login", { replace: true });
  };

  const initials = user?.initials ?? "AV";
  const displayName = user?.name ?? "Guest";
  const planLabel = user?.plan ?? "Not signed in";

  return (
    <header className="sticky top-0 z-30 h-16 border-b backdrop-blur-xl"
      style={{
        background: "linear-gradient(90deg, hsl(var(--card) / 0.9) 0%, hsl(var(--muted) / 0.7) 100%)",
        boxShadow: "0 1px 0 0 hsl(var(--border)), 0 4px 16px -8px hsl(200 50% 8% / 0.08)",
      }}
    >
      <div className="flex h-full items-center gap-3 px-5">
        <SidebarTrigger className="text-muted-foreground hover:text-foreground" />

        <div className="h-6 w-px bg-border" />

        <div className="relative flex-1 max-w-xl">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search stocks, symbols, sectors…"
            className="pl-9 h-10 bg-background/60 border-border/60 focus-visible:bg-card focus-visible:border-accent focus-visible:ring-2 focus-visible:ring-accent/20 rounded-lg"
          />
          <kbd className="absolute right-3 top-1/2 -translate-y-1/2 hidden md:inline-flex items-center gap-1 rounded border bg-card px-1.5 py-0.5 text-[10px] font-mono text-muted-foreground shadow-sm">
            ⌘K
          </kbd>
        </div>

        <div className="flex items-center gap-1.5">
          <div className="hidden lg:flex items-center gap-1.5 rounded-full bg-success/10 border border-success/20 px-2.5 py-1 text-[11px] font-bold text-success">
            <span className="pulse-dot" />
            LIVE
          </div>

          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 text-muted-foreground hover:text-foreground hover:bg-muted/60"
            onClick={() => setDark(!dark)}
            aria-label="Toggle theme"
          >
            {dark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>

          <Button variant="ghost" size="icon" className="h-9 w-9 relative text-muted-foreground hover:text-foreground hover:bg-muted/60" aria-label="Notifications">
            <Bell className="h-4 w-4" />
            <span className="absolute top-2 right-2 h-2 w-2 rounded-full bg-danger ring-2 ring-card" />
          </Button>

          <div className="ml-2 h-9 w-px bg-border" />

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="ml-2 flex items-center gap-2.5 cursor-pointer rounded-lg hover:bg-muted/60 pl-1 pr-2 py-1 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-accent/40">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-emerald text-xs font-bold text-white shadow-glow-emerald">
                  {initials}
                </div>
                <div className="hidden md:flex flex-col leading-tight text-left">
                  <span className="text-xs font-semibold">{displayName}</span>
                  <span className="text-[10px] text-muted-foreground">{planLabel}</span>
                </div>
                <ChevronDown className="hidden md:block h-3.5 w-3.5 text-muted-foreground" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-64">
              <DropdownMenuLabel>
                <div className="flex items-center gap-3 py-1">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-emerald text-sm font-bold text-white shadow-glow-emerald">
                    {initials}
                  </div>
                  <div className="flex flex-col leading-tight min-w-0">
                    <span className="text-sm font-semibold truncate">{displayName}</span>
                    <span className="text-[11px] text-muted-foreground truncate">{user?.email ?? "—"}</span>
                  </div>
                </div>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <User className="h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/settings")}>
                <Settings className="h-4 w-4" /> Settings
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => {
                  const next = !isAdmin;
                  setIsAdmin(next);
                  toast.success(next ? "Admin mode enabled" : "Admin mode disabled");
                }}
              >
                {isAdmin ? <Shield className="h-4 w-4 text-accent" /> : <ShieldOff className="h-4 w-4" />}
                <span className="flex-1">Admin mode</span>
                <span className={`text-[10px] font-bold uppercase ${isAdmin ? "text-accent" : "text-muted-foreground"}`}>
                  {isAdmin ? "On" : "Off"}
                </span>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              {user ? (
                <DropdownMenuItem onClick={handleSignOut} className="text-danger focus:text-danger">
                  <LogOut className="h-4 w-4" /> Sign out
                </DropdownMenuItem>
              ) : (
                <DropdownMenuItem onClick={() => navigate("/login")}>
                  <LogOut className="h-4 w-4" /> Sign in
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
