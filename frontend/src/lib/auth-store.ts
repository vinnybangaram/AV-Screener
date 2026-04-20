// Live auth store — Persisted in localStorage, synced with backend auth.
import { useEffect, useState } from "react";

const USER_KEY = "user";
const TOKEN_KEY = "token";

export interface AuthUser {
  name: string;
  email: string;
  initials: string;
  plan: string;
  role: string;
  id?: string;
}

export function getAuthUser(): AuthUser | null {
  try {
    const raw = localStorage.getItem(USER_KEY);
    if (!raw) return null;
    const user = JSON.parse(raw);
    
    // Ensure initials exist
    if (user && !user.initials && user.name) {
      user.initials = user.name
        .split(/[ .]/)
        .filter(Boolean)
        .slice(0, 2)
        .map((p: string) => p[0]?.toUpperCase())
        .join("") || "AV";
    }
    
    return {
      ...user,
      plan: user.plan || "Pro Trial"
    };
  } catch {
    return null;
  }
}

export function signIn(user: any, token: string) {
  if (user && !user.initials && user.name) {
    user.initials = user.name
      .split(/[ .]/)
      .filter(Boolean)
      .slice(0, 2)
      .map((p: string) => p[0]?.toUpperCase())
      .join("") || "AV";
  }
  
  localStorage.setItem(USER_KEY, JSON.stringify(user));
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem("user_role", user.role || "user");
  
  window.dispatchEvent(new Event("av-auth-change"));
}

export function signOut() {
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("user_role");
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
