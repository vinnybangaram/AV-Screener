import { NavLink } from "@/components/NavLink";
import { cn } from "@/lib/utils";
import { Sparkles, LifeBuoy, Crown, TrendingUp, LogOut, ShieldCheck } from "lucide-react";
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent,
  SidebarHeader, SidebarMenu, SidebarMenuButton, SidebarMenuItem, useSidebar,
  SidebarGroupLabel
} from "@/components/ui/sidebar";
import { navGroups, secondaryNavItems } from "@/lib/nav";
import { useAuthUser, signOut } from "@/lib/auth-store";
import { useIsAdmin } from "@/lib/admin-store";
import { useNavigate } from "react-router-dom";

export function AppSidebar() {
  const { state, setOpenMobile, isMobile } = useSidebar();
  const collapsed = state === "collapsed";
  const user = useAuthUser();
  const navigate = useNavigate();

  const closeSidebar = () => {
    if (isMobile) setOpenMobile(false);
  };

  const isUserAdmin = user?.role === "admin";
  const mockAdmin = useIsAdmin();
  const isAdmin = isUserAdmin || mockAdmin;

  const handleSignOut = () => {
    signOut();
    closeSidebar();
    navigate("/login");
  };

  return (
    <Sidebar collapsible="icon" className="border-sidebar-border [&>div]:!bg-transparent">
      <div className="absolute inset-0 bg-gradient-sidebar pointer-events-none" />
      <div className="absolute inset-0 pointer-events-none opacity-40"
        style={{
          background: "radial-gradient(circle at 50% 0%, hsl(158 75% 45% / 0.15), transparent 60%)",
        }}
      />

      <SidebarHeader className="relative border-b border-sidebar-border/60 z-10">
        <div className="flex items-center gap-2.5 px-2 py-3">
          <div className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-gradient-emerald shadow-glow-emerald">
            <TrendingUp className="h-5 w-5 text-white" strokeWidth={2.5} />
            <div className="absolute -top-0.5 -right-0.5 h-2.5 w-2.5 rounded-full bg-warning ring-2 ring-sidebar" />
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight">
              <span className="text-sm font-bold text-sidebar-primary-foreground tracking-tight">AV Screener</span>
              <span className="text-[10px] uppercase tracking-[0.12em] text-sidebar-foreground/60 font-medium">AI Market Intel</span>
            </div>
          )}
        </div>
      </SidebarHeader>

      <SidebarContent className="relative px-2 py-2 z-10 flex flex-col min-h-0 gap-4 overflow-y-auto">
        {navGroups.map((group) => {
          if (group.adminOnly && !isAdmin) return null;

          return (
            <SidebarGroup key={group.label} className="p-0">
              {!collapsed && (
                <SidebarGroupLabel className="px-3 mb-2 text-[10px] font-black uppercase tracking-[0.15em] text-sidebar-foreground/40">
                  {group.label}
                </SidebarGroupLabel>
              )}
              <SidebarGroupContent>
                <SidebarMenu className="gap-0.5">
                  {group.items.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        tooltip={item.title}
                        className="h-9 rounded-lg text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground transition-all duration-200"
                      >
                        <NavLink
                          to={item.url}
                          end={item.url === "/"}
                          onClick={closeSidebar}
                          activeClassName="!bg-gradient-to-r !from-sidebar-accent !to-sidebar-accent/40 !text-sidebar-accent-foreground font-semibold relative before:absolute before:left-0 before:top-1/2 before:-translate-y-1/2 before:h-5 before:w-[2.5px] before:rounded-r before:bg-gradient-emerald before:shadow-glow-emerald [&>svg]:!text-sidebar-primary"
                        >
                          <item.icon className={cn("h-4 w-4", collapsed ? "mx-auto" : "")} />
                          {!collapsed && <span>{item.title}</span>}
                          {!collapsed && (item.title === "Option Signals" || item.title === "AI Screener") && (
                            <span className="ml-auto inline-flex items-center px-1.5 py-0.5 rounded-[4px] text-[7px] font-black bg-warning/20 text-warning border border-warning/30 animate-blink-pro tracking-widest leading-none">
                              PRO
                            </span>
                          )}
                        </NavLink>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>
          );
        })}
      </SidebarContent>

      <SidebarFooter className="relative border-t border-sidebar-border/60 p-3 gap-2 z-10">
        {/* Admin Terminal Button - Removed as it's now in the main list */}

        {/* PROMO CARD - Disabled for now but preserved as requested */}
        {false && (
          !collapsed ? (
            <div className="relative overflow-hidden rounded-xl bg-gradient-emerald p-3.5 text-white shadow-glow-emerald">
              <div className="absolute -top-8 -right-8 h-20 w-20 rounded-full bg-white/10 blur-2xl" />
              <div className="relative">
                <div className="flex items-center gap-1.5 mb-1">
                  <Crown className="h-3.5 w-3.5" />
                  <span className="text-xs font-bold tracking-tight">Upgrade to Pro</span>
                </div>
                <p className="text-[11px] opacity-90 mb-2.5 leading-relaxed">Unlimited screens, AI signals & backtests.</p>
                <button className="w-full rounded-md bg-white/20 hover:bg-white/30 transition-colors px-2.5 py-1.5 text-[11px] font-semibold backdrop-blur">
                  View Plans →
                </button>
              </div>
            </div>
          ) : (
            <button className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-emerald text-white mx-auto shadow-glow-emerald">
              <Crown className="h-4 w-4" />
            </button>
          )
        )}

        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton onClick={handleSignOut} tooltip="Sign Out" className="h-9 text-sidebar-foreground hover:bg-danger/10 hover:text-danger">
              <LogOut className="h-4 w-4" />
              <span>Sign Out</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>

        <div className="flex items-center gap-2.5 rounded-lg bg-sidebar-accent/40 p-2 border border-sidebar-border/60">
          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-gradient-emerald text-xs font-bold text-white shadow-glow-emerald">
            {user?.initials || "AV"}
          </div>
          {!collapsed && (
            <div className="flex flex-col leading-tight min-w-0">
              <span className="text-xs font-semibold text-sidebar-primary-foreground truncate">{user?.name || "Investor"}</span>
              <span className="text-[10px] text-sidebar-foreground/70 truncate">{user?.plan || "Standard"}</span>
            </div>
          )}
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
