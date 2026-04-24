import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { submitUpstoxCallback } from "@/services/api";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";
import { Card } from "@/components/ui/card";

export default function UpstoxCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    const code = searchParams.get("code");
    if (!code) {
      setStatus("error");
      setErrorMsg("No authorization code found in URL");
      return;
    }

    const exchangeCode = async () => {
      try {
        const res = await submitUpstoxCallback(code);
        if (res.success) {
          setStatus("success");
          toast.success("Upstox connected successfully!");
          setTimeout(() => navigate("/dashboard"), 2000);
        } else {
          throw new Error(res.message || "Failed to connect Upstox");
        }
      } catch (err: any) {
        console.error("Upstox exchange error:", err);
        setStatus("error");
        setErrorMsg(err.response?.data?.detail || err.message || "Exchange failed");
        toast.error("Failed to connect Upstox");
      }
    };

    exchangeCode();
  }, [searchParams, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-6">
      <Card className="w-full max-w-md p-8 text-center premium-card">
        {status === "loading" && (
          <div className="space-y-4">
            <Loader2 className="h-12 w-12 text-accent animate-spin mx-auto" />
            <h2 className="text-xl font-bold">Connecting Upstox...</h2>
            <p className="text-sm text-muted-foreground">Exchanging authorization code for secure access.</p>
          </div>
        )}

        {status === "success" && (
          <div className="space-y-4">
            <CheckCircle2 className="h-12 w-12 text-success mx-auto" />
            <h2 className="text-xl font-bold">Authenticated!</h2>
            <p className="text-sm text-muted-foreground">Broker account linked. Redirecting to dashboard...</p>
          </div>
        )}

        {status === "error" && (
          <div className="space-y-4">
            <XCircle className="h-12 w-12 text-danger mx-auto" />
            <h2 className="text-xl font-bold text-danger">Connection Failed</h2>
            <p className="text-sm text-muted-foreground">{errorMsg}</p>
            <button 
              onClick={() => navigate("/dashboard")}
              className="mt-4 text-sm font-bold text-accent hover:underline"
            >
              Back to Dashboard
            </button>
          </div>
        )}
      </Card>
    </div>
  );
}
