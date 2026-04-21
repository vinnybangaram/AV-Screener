// Lightweight client-side chat store (mock; localStorage-backed)
import { useEffect, useState } from "react";

const KEY = "av_chat_messages";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  ts: number;
}

const WELCOME: ChatMessage = {
  id: "welcome",
  role: "assistant",
  content:
    "Hi, I'm **AV Analyst** — your stock-market AI co-pilot. Ask me about setups, fundamentals, sectors or any symbol on your watchlist.\n\nTry:\n- *What's the outlook on RELIANCE?*\n- *Compare TCS vs INFY*\n- *Suggest a swing setup in Banking*",
  ts: Date.now(),
};

function read(): ChatMessage[] {
  try {
    const raw = localStorage.getItem(KEY);
    const parsed = raw ? (JSON.parse(raw) as ChatMessage[]) : [];
    return parsed.length ? parsed : [WELCOME];
  } catch {
    return [WELCOME];
  }
}

function write(list: ChatMessage[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("av-chat-change"));
}

export function appendMessage(msg: Omit<ChatMessage, "id" | "ts">) {
  const list = read();
  const next: ChatMessage = { ...msg, id: `m${Date.now()}-${Math.random().toString(36).slice(2, 6)}`, ts: Date.now() };
  write([...list, next]);
  return next;
}

export function clearChat() {
  write([WELCOME]);
}

export function useChatMessages() {
  const [list, setList] = useState<ChatMessage[]>(read);
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("av-chat-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("av-chat-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}

// ---------- Mock AI analyst replies ----------
const SYMBOL_RX = /\b([A-Z]{3,12})\b/g;

const playbook: Array<{ match: RegExp; reply: (m: string) => string }> = [
  {
    match: /compare|vs\b|versus/i,
    reply: (m) => {
      const syms = Array.from(new Set(m.match(SYMBOL_RX) || [])).slice(0, 2);
      const a = syms[0] || "TCS";
      const b = syms[1] || "INFY";
      return `### ${a} vs ${b} — Quick comparison\n\n| Metric | ${a} | ${b} |\n|---|---|---|\n| Trend (50/200 DMA) | Bullish | Bullish |\n| Momentum (RSI 14) | 62 | 58 |\n| Valuation (PE) | Premium | In-line |\n| Risk profile | Low | Low–Medium |\n\n**Verdict:** ${a} screens stronger on momentum; ${b} offers better risk/reward at current levels. Both are quality compounders — split allocation 60/40 if accumulating.`;
    },
  },
  {
    match: /setup|swing|breakout|entry/i,
    reply: () =>
      `### Swing setup framework\n\n1. **Universe** — filter NIFTY 500, AI score ≥ 80\n2. **Trigger** — close above 20 DMA + volume > 1.5× 20D avg\n3. **Risk** — initial SL = 7-day swing low; size = 1% account risk\n4. **Targets** — T1: 1R, T2: 2R, trail balance with 10 EMA\n\n**Watchlist candidates:** RELIANCE (consolidation breakout), HDFCBANK (pullback to 50 DMA), INFY (cup & handle).`,
  },
  {
    match: /risk|stop\s?loss|position\s?siz/i,
    reply: () =>
      `### Risk management essentials\n\n- Risk **≤ 1%** of capital per trade\n- Max **3 open positions** in same sector\n- Hard stop at **−7%** for swing, **−2%** intraday\n- Move SL to breakeven once price moves **+1.5R**\n\nDiscipline > prediction. Survival is the alpha.`,
  },
  {
    match: /penny|small\s?cap|micro/i,
    reply: () =>
      `### Penny / micro-cap caution\n\nHigh asymmetric reward, but liquidity and disclosure risk dominate.\n\n- Allocate **≤ 5%** of total portfolio\n- Demand **rising volumes + earnings momentum** before entry\n- Avoid names with promoter pledge > 20%\n\nSee the **Penny Storm** module — current top scores: HFCL (65), MMTC (63), NIVABUPA (58).`,
  },
  {
    match: /banking|bank\s?nifty|hdfc|icici|sbi|axis/i,
    reply: () =>
      `### Banking sector pulse\n\n- **Macro:** RBI dovish tilt → NIM tailwind for private banks\n- **Leaders:** HDFCBANK (pullback buy), ICICIBANK (trend continuation)\n- **Laggards:** AXISBANK (below 50 DMA)\n- **Trigger:** Bank Nifty close > 52,500 with volume confirms next leg\n\n**Risk:** Watch deposit growth & credit cost commentary in Q4 results.`,
  },
  {
    match: /\b(it|infy|tcs|hcl|wipro|tech)\b/i,
    reply: () =>
      `### IT sector view\n\nBFSI demand is the swing factor. Current read:\n\n- **TCS** — guidance cautious near-term; long-term compounder intact\n- **INFY** — strongest deal pipeline; preferred buy on dips\n- **HCLTECH** — defensive engineering services exposure\n\nWait for INR weakness + USFed pause confirmation as next catalyst.`,
  },
  {
    match: /reliance|ril/i,
    reply: () =>
      `### RELIANCE — Snapshot\n\n- **Trend:** Strong uptrend, above all key DMAs\n- **AI score:** 92/100\n- **Setup:** Breakout from ₹2,850 base; next resistance ₹3,000\n- **Risk:** Crude oil weakness affects O2C margins\n- **Stance:** **Accumulate** on dips to ₹2,840–2,870 with SL ₹2,750. Targets: ₹3,050 / ₹3,180.`,
  },
];

function fallback(prompt: string): string {
  const sym = (prompt.match(SYMBOL_RX) || [])[0];
  if (sym) {
    return `### ${sym} — Analyst note\n\nI don't have live tape, but here's a structural read:\n\n- **Bias:** Wait for confirmation above last swing high before adding\n- **Risk:** Define SL at last 7-day low; never average down\n- **Catalysts:** Upcoming earnings, sector rotation, FII flows\n\nWant a deeper breakdown — fundamentals, technicals, or peer comparison?`;
  }
  return `Good question. Here's how I'd think about it as a market analyst:\n\n1. **Define the thesis** — what edge are you trading? (momentum, mean-reversion, fundamentals)\n2. **Quantify risk** — entry, stop, position size before clicking buy\n3. **Confirmation** — wait for price + volume to agree\n4. **Patience** — let winners run, cut losers fast\n\nGive me a **symbol** or a **scenario** and I'll go deeper.`;
}

export async function generateAssistantReply(prompt: string): Promise<string> {
  // Simulated thinking latency
  await new Promise((r) => setTimeout(r, 600 + Math.random() * 700));
  for (const rule of playbook) {
    if (rule.match.test(prompt)) return rule.reply(prompt);
  }
  return fallback(prompt);
}
