import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates and sanitizes URLs to prevent XSS via dangerous schemes (e.g., javascript:, data:).
 * Only allows http: and https: protocols (or relative path URLs).
 */
export function sanitizeUrl(url: string | undefined | null): string {
  if (!url) return "";
  const trimmed = url.trim();
  if (!trimmed) return "";

  // Relative paths (starting with / or .) are allowed
  if (trimmed.startsWith("/") || trimmed.startsWith(".")) {
    return trimmed;
  }

  try {
    const parsed = new URL(trimmed);
    const protocol = parsed.protocol.toLowerCase();
    if (protocol === "http:" || protocol === "https:") {
      return trimmed;
    }
    return "";
  } catch {
    return "";
  }
}
