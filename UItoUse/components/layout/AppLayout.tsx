import { SidebarProvider, SidebarInset } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { AppHeader } from "./AppHeader";
import { MarketTicker } from "./MarketTicker";
import { Outlet } from "react-router-dom";
import { ChatBubble } from "@/components/chat/ChatBubble";
import { FeedbackBubble } from "@/components/feedback/FeedbackBubble";

export function AppLayout() {
  return (
    <SidebarProvider>
      <div className="flex min-h-screen w-full bg-background">
        <AppSidebar />
        <SidebarInset className="flex flex-col min-w-0">
          <AppHeader />
          <MarketTicker />
          <main className="flex-1 p-6 animate-fade-in">
            <Outlet />
          </main>
        </SidebarInset>
        <ChatBubble />
        <FeedbackBubble />
      </div>
    </SidebarProvider>
  );
}
