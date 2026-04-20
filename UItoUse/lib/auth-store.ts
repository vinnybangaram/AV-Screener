// Mock auth store — UI only, persisted in localStorage.
import { useEffect, useState } from "react";

const KEY = "av_auth_user";

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
  plan: string;
}

const DEFAULT_USER: AuthUser = {
  name: "Arjun Verma",
  email: "arjun@avscreener.io",
  initials: "AV",
  plan: "Pro Trial",
};

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

export function signIn(email: string, name?: string) {
  const cleanName = name?.trim() || email.split("@")[0] || DEFAULT_USER.name;
  const initials = cleanName
    .split(/[ .]/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase())
    .join("") || "AV";
  const user: AuthUser = {
    name: cleanName,
    email,
    initials,
    plan: "Pro Trial",
  };
  localStorage.setItem(KEY, JSON.stringify(user));
  window.dispatchEvent(new Event("av-auth-change"));
}

export function signOut() {
  localStorage.removeItem(KEY);
  window.dispatchEvent(new Event("av-auth-change"));
}

export function useAuthUser() {
  const [user, setUser] = useState<AuthUser | null>(getAuthUser);
  useEffect(() => {
    const sync = () => setUser(getAuthUser());
    window.addEventListener("av-auth-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("av-auth-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return user;
}
