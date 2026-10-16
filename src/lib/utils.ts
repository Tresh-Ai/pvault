import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely opens an external URL in a new window/tab.
 * Protects against XSS/protocol injection (blocking javascript:, data:, etc.)
 * and reverse tabnabbing by specifying 'noopener,noreferrer'.
 */
export function safeOpenUrl(url?: string) {
  if (!url) return;
  const trimmed = url.trim();
  let validUrl = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    if (/^[a-zA-Z0-9-]+:/i.test(trimmed)) {
      // Reject non-http(s) explicit schemes (e.g. javascript:, data:, file:)
      return;
    }
    validUrl = `https://${trimmed}`;
  }
  try {
    const parsed = new URL(validUrl);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      window.open(parsed.href, "_blank", "noopener,noreferrer");
    }
  } catch {
    // Invalid URL
  }
}
