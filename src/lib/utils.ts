import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely opens an external URL in a new tab with noopener,noreferrer
 * and validates that the URL scheme is safe (http/https).
 */
export function openExternalUrl(url: string): boolean {
  if (!url) return false;
  const trimmed = url.trim();
  if (/^(javascript|data|vbscript|file):/i.test(trimmed)) {
    return false;
  }
  const safeUrl = /^[a-z]+:\/\//i.test(trimmed) ? trimmed : `https://${trimmed}`;
  window.open(safeUrl, "_blank", "noopener,noreferrer");
  return true;
}
