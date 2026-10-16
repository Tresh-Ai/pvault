import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Validates and sanitizes external URLs to prevent XSS via dangerous schemes (e.g., javascript:, data:).
 * Only http: and https: protocols are permitted.
 */
export function sanitizeExternalUrl(url: string | undefined | null): string | undefined {
  if (!url) return undefined;
  const trimmed = url.trim();
  if (!trimmed) return undefined;

  const lower = trimmed.toLowerCase();
  if (
    lower.startsWith("javascript:") ||
    lower.startsWith("data:") ||
    lower.startsWith("vbscript:")
  ) {
    return undefined;
  }

  let formatted = trimmed;
  if (!/^https?:\/\//i.test(trimmed)) {
    if (trimmed.startsWith("//") || trimmed.startsWith("/")) {
      return undefined;
    }
    formatted = `https://${trimmed}`;
  }

  try {
    const parsed = new URL(formatted);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch {
    return undefined;
  }

  return undefined;
}
