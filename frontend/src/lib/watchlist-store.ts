// Lightweight client-side watchlist store (mock; localStorage-backed)
import { useEffect, useState } from "react";

const KEY = "av_watchlist_symbols";

function read(): string[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function write(list: string[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("av-watchlist-change"));
}

export function addToWatchlist(symbol: string): boolean {
  const list = read();
  if (list.includes(symbol)) return false;
  write([...list, symbol]);
  return true;
}

export function removeFromWatchlist(symbol: string) {
  write(read().filter((s) => s !== symbol));
}

export function useWatchlist() {
  const [list, setList] = useState<string[]>(read);
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("av-watchlist-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("av-watchlist-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}
