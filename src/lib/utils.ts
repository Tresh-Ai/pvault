import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Opens a URL in a new tab securely.
 * Validates the scheme to allow only http/https protocols (preventing javascript: XSS)
 * and enforces noopener,noreferrer to mitigate reverse tabnabbing.
 */
export function openSafeUrl(url: string | undefined | null) {
  if (!url) return;
  const trimmed = url.trim();
  if (!trimmed) return;

  let safeUrl: string | null = null;
  if (/^https?:\/\//i.test(trimmed)) {
    safeUrl = trimmed;
  } else if (/^[a-zA-Z[0-9+.-]+:/i.test(trimmed)) {
    // Disallow non-http(s) schemes (e.g. javascript:, data:, vbscript:)
    safeUrl = null;
  } else {
    // Default relative or host-only strings to https://
    safeUrl = `https://${trimmed}`;
  }

  if (safeUrl) {
    window.open(safeUrl, "_blank", "noopener,noreferrer");
  }
}
