import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Sanitizes and validates external URLs to prevent XSS (e.g. javascript: URIs)
 * and reverse tabnabbing.
 */
export function sanitizeUrl(url: string): string | null {
  if (!url || typeof url !== "string") return null;
  const trimmed = url.trim();
  if (!trimmed) return null;

  // Prevent javascript:, data:, vbscript: schemes
  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return null;
  }

  // If URL has no scheme, prepend https://
  if (!/^[a-zA-Z][a-zA-Z0-9+.-]*:/.test(trimmed)) {
    return `https://${trimmed}`;
  }

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Safely opens a URL in a new tab with noopener,noreferrer and scheme sanitization.
 */
export function safeOpenUrl(url: string): boolean {
  const safe = sanitizeUrl(url);
  if (!safe) return false;
  if (typeof window !== "undefined" && window.open) {
    window.open(safe, "_blank", "noopener,noreferrer");
    return true;
  }
  return false;
}
