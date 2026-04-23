import { PageHeader } from "@/components/layout/PageHeader";
import { Mail, MessageSquare, Headphones, Business, Lightbulb, Send, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const ContactUs = () => {
  const categories = [
    { title: "General Queries", icon: MessageSquare, desc: "Anything on your mind about the platform." },
    { title: "Technical Support", icon: Headphones, desc: "Issues with scans, data, or account access." },
    { title: "Partnerships", icon: Send, desc: "Collaborations and business opportunities." },
    { title: "Feature Requests", icon: Lightbulb, desc: "Ideas to make AV Screener even better." },
    { title: "Feedback", icon: CheckCircle2, desc: "Tell us what you love or what we can improve." },
  ];

  return (
    <div className="max-w-[1200px] mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
      <PageHeader
        title="Contact Us"
        description="We'd love to hear from you. Get in touch with the team."
      />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Side: Contact Info */}
        <div className="lg:col-span-1 space-y-6">
          <div className="premium-card p-8 bg-gradient-to-br from-sidebar-accent/50 to-transparent border-emerald-500/10">
            <h3 className="text-xl font-bold text-foreground mb-4">Get in Touch</h3>
            <p className="text-muted-foreground mb-8">
              Whether you have feedback, feature suggestions, business inquiries, or need support, feel free to reach out.
            </p>

            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="h-10 w-10 rounded-lg bg-gradient-emerald shadow-glow-emerald flex items-center justify-center shrink-0">
                  <Mail className="h-5 w-5 text-white" />
                </div>
                <div>
                  <div className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-1">Email Us</div>
                  <a href="mailto:avscanner.ai@gmail.com" className="text-lg font-bold text-foreground hover:text-accent transition-colors">
                    avscanner.ai@gmail.com
                  </a>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-card border border-border/60">
                <p className="text-sm text-muted-foreground leading-relaxed">
                  <span className="font-bold text-foreground">Response Note:</span> We aim to respond to all inquiries as soon as possible.
                </p>
              </div>
            </div>
          </div>

          <div className="premium-card p-6 border-accent/20">
            <p className="text-sm text-muted-foreground text-center font-medium">
              Your support and feedback help AV Screener grow better every day.
            </p>
          </div>
        </div>

        {/* Right Side: Categories */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {categories.map((cat, i) => (
              <div key={i} className="premium-card p-6 hover:shadow-glow-emerald transition-all duration-300 group cursor-default">
                <div className="flex items-center gap-4 mb-3">
                  <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center group-hover:bg-accent/10 group-hover:text-accent transition-colors">
                    <cat.icon className="h-4 w-4" />
                  </div>
                  <h4 className="font-bold text-foreground">{cat.title}</h4>
                </div>
                <p className="text-sm text-muted-foreground">{cat.desc}</p>
              </div>
            ))}
          </div>

          <div className="premium-card p-8 relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
              <Send className="h-24 w-24 -rotate-12" />
            </div>
            <div className="relative">
              <h3 className="text-xl font-bold text-foreground mb-2">Social Connect</h3>
              <p className="text-muted-foreground mb-6 max-w-md">
                Follow us for the latest updates, market insights, and new scanner releases.
              </p>
              <div className="flex gap-3">
                <Button variant="outline" className="h-10 px-6 rounded-full font-bold">Twitter / X</Button>
                <Button variant="outline" className="h-10 px-6 rounded-full font-bold">LinkedIn</Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="text-center py-8">
        <p className="text-muted-foreground font-mono text-xs uppercase tracking-widest opacity-60">Ready to transform your trading? Join our community.</p>
      </div>
    </div>
  );
};

export default ContactUs;
