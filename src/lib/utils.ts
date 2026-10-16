import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely opens external URLs in a new tab, enforcing http/https schemes
 * and preventing reverse tabnabbing by specifying `noopener,noreferrer`.
 */
export function safeOpenExternalUrl(url: string | undefined | null): boolean {
  if (!url) return false;
  try {
    const parsed = new URL(url, window.location.origin);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      console.warn("Blocked attempt to open non-http/https URL:", url);
      return false;
    }
    window.open(parsed.href, "_blank", "noopener,noreferrer");
    return true;
  } catch {
    return false;
  }
}
