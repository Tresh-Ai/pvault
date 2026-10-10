import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Safely opens an external URL in a new window/tab, ensuring only http: or https:
 * protocols are executed to prevent XSS (e.g. javascript: or data: URIs) and reverse tabnabbing.
 */
export function safeOpenUrl(url: string | undefined | null, target = "_blank"): void {
  if (!url) return;
  const trimmed = url.trim();
  try {
    const parsed = new URL(trimmed, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      window.open(parsed.href, target, "noopener,noreferrer");
    } else {
      console.warn("Blocked potentially unsafe URL protocol:", parsed.protocol);
    }
  } catch (err) {
    console.warn("Failed to parse URL:", err);
  }
}
