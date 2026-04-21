// Lightweight client-side feedback store (mock; localStorage-backed)
import { useEffect, useState } from "react";

const KEY = "av_feedback_entries";

export type FeedbackType = "bug" | "idea" | "praise" | "other";

export interface FeedbackEntry {
  id: string;
  type: FeedbackType;
  rating: number; // 1..5
  page: string;
  message: string;
  email?: string;
  ts: number;
}

function read(): FeedbackEntry[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as FeedbackEntry[]) : [];
  } catch {
    return [];
  }
}

function write(list: FeedbackEntry[]) {
  localStorage.setItem(KEY, JSON.stringify(list));
  window.dispatchEvent(new Event("av-feedback-change"));
}

export function submitFeedback(entry: Omit<FeedbackEntry, "id" | "ts">) {
  const next: FeedbackEntry = {
    ...entry,
    id: `f${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
    ts: Date.now(),
  };
  write([next, ...read()]);
  return next;
}

export function clearFeedback() { write([]); }

export function useFeedback() {
  const [list, setList] = useState<FeedbackEntry[]>(read);
  useEffect(() => {
    const sync = () => setList(read());
    window.addEventListener("av-feedback-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("av-feedback-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return list;
}
