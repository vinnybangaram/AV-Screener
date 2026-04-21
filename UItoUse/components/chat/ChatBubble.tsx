import { useEffect, useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Bot, MessageSquare, Send, Sparkles, Trash2, X } from "lucide-react";
import { appendMessage, clearChat, generateAssistantReply, useChatMessages } from "@/lib/chat-store";
import { cn } from "@/lib/utils";

const SUGGESTIONS = [
  "What's the outlook on RELIANCE?",
  "Compare TCS vs INFY",
  "Suggest a swing setup in Banking",
  "How should I size positions?",
];

export function ChatBubble() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [thinking, setThinking] = useState(false);
  const messages = useChatMessages();
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
    }, 50);
    return () => clearTimeout(t);
  }, [messages, open, thinking]);

  const send = async (text?: string) => {
    const value = (text ?? input).trim();
    if (!value || thinking) return;
    appendMessage({ role: "user", content: value });
    setInput("");
    setThinking(true);
    try {
      const reply = await generateAssistantReply(value);
      appendMessage({ role: "assistant", content: reply });
    } finally {
      setThinking(false);
    }
  };

  return (
    <>
      {/* Floating launcher (right side) */}
      <button
        onClick={() => setOpen(true)}
        aria-label="Open AI Analyst"
        className={cn(
          "fixed bottom-6 right-6 z-40 group",
          "h-14 w-14 rounded-full bg-gradient-emerald shadow-glow-emerald",
          "flex items-center justify-center text-white",
          "transition-transform hover:scale-110 active:scale-95",
          open && "opacity-0 pointer-events-none"
        )}
      >
        <Bot className="h-6 w-6" />
        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-warning ring-2 ring-background animate-pulse" />
        <span className="absolute right-full mr-3 whitespace-nowrap text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition shadow-card">
          Ask AV Analyst
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col gap-0">
          <SheetHeader className="px-5 py-4 border-b bg-gradient-to-br from-primary/5 to-accent/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-emerald shadow-glow-emerald flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <SheetTitle className="text-base flex items-center gap-2">
                  AV Analyst
                  <Badge variant="secondary" className="text-[10px] uppercase">Beta</Badge>
                </SheetTitle>
                <p className="text-[11px] text-muted-foreground">AI co-pilot for Indian markets</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => clearChat()} title="Clear chat">
                <Trash2 className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </SheetHeader>

          <ScrollArea className="flex-1 px-5 py-4" ref={scrollRef as any}>
            <div className="space-y-4">
              {messages.map((m) => (
                <div key={m.id} className={cn("flex gap-2.5", m.role === "user" && "flex-row-reverse")}>
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className={cn(
                      "text-[10px] font-bold",
                      m.role === "assistant" ? "bg-gradient-emerald text-white" : "bg-secondary text-secondary-foreground"
                    )}>
                      {m.role === "assistant" ? "AV" : "You"}
                    </AvatarFallback>
                  </Avatar>
                  <div className={cn(
                    "rounded-2xl px-3.5 py-2.5 text-sm max-w-[85%] shadow-card",
                    m.role === "assistant"
                      ? "bg-card border rounded-tl-sm"
                      : "bg-gradient-emerald text-white rounded-tr-sm"
                  )}>
                    {m.role === "assistant" ? (
                      <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-li:text-foreground prose-table:text-xs prose-th:text-foreground prose-td:text-foreground prose-th:px-2 prose-td:px-2 prose-headings:mt-1 prose-headings:mb-2 prose-p:my-1.5 prose-ul:my-1.5 prose-ol:my-1.5 prose-table:my-2">
                        <ReactMarkdown>{m.content}</ReactMarkdown>
                      </div>
                    ) : (
                      <p className="whitespace-pre-wrap leading-relaxed">{m.content}</p>
                    )}
                  </div>
                </div>
              ))}
              {thinking && (
                <div className="flex gap-2.5">
                  <Avatar className="h-7 w-7 shrink-0">
                    <AvatarFallback className="bg-gradient-emerald text-white text-[10px] font-bold">AV</AvatarFallback>
                  </Avatar>
                  <div className="bg-card border rounded-2xl rounded-tl-sm px-3.5 py-2.5 shadow-card">
                    <div className="flex gap-1">
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce" />
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:120ms]" />
                      <span className="h-1.5 w-1.5 rounded-full bg-accent animate-bounce [animation-delay:240ms]" />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </ScrollArea>

          {messages.length <= 1 && (
            <div className="px-5 pb-2 flex flex-wrap gap-1.5">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => send(s)}
                  className="text-[11px] px-2.5 py-1.5 rounded-full border bg-card hover:bg-muted hover:border-accent/50 transition"
                >
                  {s}
                </button>
              ))}
            </div>
          )}

          <form
            onSubmit={(e) => { e.preventDefault(); send(); }}
            className="p-3 border-t bg-card flex items-center gap-2"
          >
            <MessageSquare className="h-4 w-4 text-muted-foreground ml-1.5" />
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about a stock, sector or setup…"
              maxLength={500}
              disabled={thinking}
              className="border-0 shadow-none focus-visible:ring-0 px-0"
            />
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() || thinking}
              className="bg-gradient-emerald text-white border-0 shadow-glow-emerald shrink-0"
            >
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </SheetContent>
      </Sheet>
    </>
  );
}
