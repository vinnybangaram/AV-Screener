// localStorage persistence for the option signals engine.
import type { DailyStats, IgniteSettings, PaperTrade } from "./types";
import { DEFAULT_SETTINGS } from "./types";

const K_SETTINGS = "av_opt_settings";
const K_ACTIVE = "av_opt_active_trades";
const K_HISTORY = "av_opt_trade_history";
const K_DAILY = "av_opt_daily_stats";

function read<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* quota exceeded — ignore */
  }
}

export const storageService = {
  loadSettings(): IgniteSettings {
    return { ...DEFAULT_SETTINGS, ...read<Partial<IgniteSettings>>(K_SETTINGS, {}) };
  },
  saveSettings(s: IgniteSettings) {
    write(K_SETTINGS, s);
  },
  loadActive(): PaperTrade[] {
    return read<PaperTrade[]>(K_ACTIVE, []);
  },
  saveActive(t: PaperTrade[]) {
    write(K_ACTIVE, t);
  },
  loadHistory(): PaperTrade[] {
    return read<PaperTrade[]>(K_HISTORY, []);
  },
  saveHistory(t: PaperTrade[]) {
    write(K_HISTORY, t);
  },
  loadDaily(): Record<string, DailyStats> {
    return read<Record<string, DailyStats>>(K_DAILY, {});
  },
  saveDaily(d: Record<string, DailyStats>) {
    write(K_DAILY, d);
  },
  clearAll() {
    [K_ACTIVE, K_HISTORY, K_DAILY].forEach((k) => localStorage.removeItem(k));
  },
};