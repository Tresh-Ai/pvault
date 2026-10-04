import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates whether a URL uses a safe protocol (http: or https:) to prevent
 * Cross-Site Scripting (XSS) via javascript:, data:, or other pseudo-protocols.
 */
export function isSafeUrl(url: string): boolean {
  if (!url || typeof url !== "string") return false;
  try {
    const base = typeof window !== "undefined" ? window.location.origin : "http://localhost";
    const parsed = new URL(url, base);
    return parsed.protocol === "http:" || parsed.protocol === "https:";
  } catch {
    return false;
  }
}

/**
 * Opens a URL in a new window/tab safely, enforcing http/https protocols
 * and noopener,noreferrer to prevent tabnabbing and XSS.
 */
export function openSafeUrl(url: string, target = "_blank"): Window | null {
  if (!isSafeUrl(url)) {
    console.warn("Blocked attempt to open unsafe URL:", url);
    return null;
  }
  if (typeof window === "undefined") return null;
  return window.open(url, target, "noopener,noreferrer");
}
