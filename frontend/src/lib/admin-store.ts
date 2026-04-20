// Mock admin role flag — UI-only.
import { useEffect, useState } from "react";

const KEY = "av_is_admin";

export function getIsAdmin(): boolean {
  try {
    return localStorage.getItem(KEY) === "1";
  } catch {
    return false;
  }
}

export function setIsAdmin(value: boolean) {
  localStorage.setItem(KEY, value ? "1" : "0");
  window.dispatchEvent(new Event("av-admin-change"));
}

export function useIsAdmin() {
  const [admin, setAdmin] = useState<boolean>(getIsAdmin);
  useEffect(() => {
    const sync = () => setAdmin(getIsAdmin());
    window.addEventListener("av-admin-change", sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener("av-admin-change", sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  return admin;
}
