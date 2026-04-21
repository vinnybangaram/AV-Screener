import { useState } from "react";
import { z } from "zod";
import { useLocation } from "react-router-dom";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { MessageCircleHeart, Bug, Lightbulb, Heart, MoreHorizontal, Star, X, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { submitFeedback, FeedbackType, useFeedback } from "@/lib/feedback-store";
import { useAuthUser } from "@/lib/auth-store";
import { toast } from "sonner";

const feedbackSchema = z.object({
  message: z.string().trim().min(5, "Please share at least a few words").max(1000, "Keep it under 1000 characters"),
  email: z.string().trim().email("Invalid email").max(255).optional().or(z.literal("")),
});

const TYPES: { id: FeedbackType; label: string; icon: typeof Bug; tone: string }[] = [
  { id: "bug", label: "Bug", icon: Bug, tone: "bg-danger/10 text-danger border-danger/30" },
  { id: "idea", label: "Idea", icon: Lightbulb, tone: "bg-warning/10 text-warning border-warning/30" },
  { id: "praise", label: "Praise", icon: Heart, tone: "bg-success/10 text-success border-success/30" },
  { id: "other", label: "Other", icon: MoreHorizontal, tone: "bg-muted text-foreground" },
];

export function FeedbackBubble() {
  const [open, setOpen] = useState(false);
  const [type, setType] = useState<FeedbackType>("idea");
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [message, setMessage] = useState("");
  const user = useAuthUser();
  const [email, setEmail] = useState(user?.email || "");
  const location = useLocation();
  const all = useFeedback();

  const submit = () => {
    const parsed = feedbackSchema.safeParse({ message, email });
    if (!parsed.success) {
      toast.error(parsed.error.errors[0].message);
      return;
    }
    if (rating === 0) { toast.error("Please rate your experience"); return; }

    submitFeedback({
      type,
      rating,
      page: location.pathname,
      message: parsed.data.message,
      email: parsed.data.email || undefined,
    });
    toast.success("Thanks for the feedback! 🙌", { description: "We read every note." });
    setMessage(""); setRating(0); setType("idea");
    setOpen(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Send feedback"
        className={cn(
          "fixed bottom-6 left-6 z-40 group",
          "h-14 w-14 rounded-full bg-card border-2 border-accent/30 shadow-elevated",
          "flex items-center justify-center text-accent",
          "transition-transform hover:scale-110 active:scale-95 hover:border-accent",
          open && "opacity-0 pointer-events-none"
        )}
      >
        <MessageCircleHeart className="h-6 w-6" />
        <span className="absolute left-full ml-3 whitespace-nowrap text-xs font-semibold bg-secondary text-secondary-foreground px-2.5 py-1.5 rounded-md opacity-0 group-hover:opacity-100 transition shadow-card">
          Send feedback
        </span>
      </button>

      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent side="left" className="w-full sm:max-w-md p-0 flex flex-col">
          <SheetHeader className="px-5 py-4 border-b bg-gradient-to-br from-accent/5 to-primary/5">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-gradient-emerald shadow-glow-emerald flex items-center justify-center">
                <MessageCircleHeart className="h-5 w-5 text-white" />
              </div>
              <div className="flex-1 min-w-0 text-left">
                <SheetTitle className="text-base">Share Feedback</SheetTitle>
                <p className="text-[11px] text-muted-foreground">Help us shape AV Screener — {all.length} submitted so far</p>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setOpen(false)}><X className="h-4 w-4" /></Button>
            </div>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">
            <div>
              <Label className="text-xs uppercase tracking-wider">Type</Label>
              <div className="grid grid-cols-4 gap-2 mt-2">
                {TYPES.map((t) => {
                  const Icon = t.icon;
                  const active = type === t.id;
                  return (
                    <button
                      key={t.id}
                      onClick={() => setType(t.id)}
                      className={cn(
                        "flex flex-col items-center gap-1 p-2.5 rounded-lg border transition",
                        active ? `${t.tone} border-current shadow-card` : "bg-card hover:bg-muted"
                      )}
                    >
                      <Icon className="h-4 w-4" />
                      <span className="text-[11px] font-semibold">{t.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider">How would you rate this experience?</Label>
              <div className="flex items-center gap-1.5 mt-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onMouseEnter={() => setHover(n)}
                    onMouseLeave={() => setHover(0)}
                    onClick={() => setRating(n)}
                    className="p-1 transition hover:scale-110"
                    aria-label={`Rate ${n} stars`}
                  >
                    <Star className={cn(
                      "h-7 w-7 transition",
                      (hover || rating) >= n ? "fill-warning text-warning" : "text-muted-foreground"
                    )} />
                  </button>
                ))}
                {rating > 0 && (
                  <Badge variant="secondary" className="ml-2 text-[10px]">
                    {["", "Poor", "Meh", "Okay", "Good", "Excellent"][rating]}
                  </Badge>
                )}
              </div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider">Your message</Label>
              <Textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                placeholder="What's working? What could be better? Be as specific as you like."
                rows={5}
                maxLength={1000}
                className="mt-2 resize-none"
              />
              <div className="text-[10px] text-muted-foreground text-right mt-1">{message.length}/1000</div>
            </div>

            <div>
              <Label className="text-xs uppercase tracking-wider">Email (optional)</Label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="So we can follow up"
                maxLength={255}
                className="mt-2"
              />
            </div>

            <div className="rounded-lg border bg-muted/40 p-3 text-[11px] text-muted-foreground">
              Sending from <code className="font-mono text-foreground">{location.pathname}</code>
            </div>
          </div>

          <div className="p-4 border-t bg-card flex items-center justify-between gap-2">
            <p className="text-[11px] text-muted-foreground">We never share your feedback.</p>
            <Button onClick={submit} className="gap-1.5 bg-gradient-emerald text-white border-0 shadow-glow-emerald">
              <Send className="h-4 w-4" /> Submit
            </Button>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
