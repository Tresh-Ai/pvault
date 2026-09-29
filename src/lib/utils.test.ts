import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { sanitizeUrl, safeOpenUrl } from "./utils";

describe("sanitizeUrl", () => {
  it("allows valid https and http URLs", () => {
    expect(sanitizeUrl("https://example.com")).toBe("https://example.com/");
    expect(sanitizeUrl("http://example.com/path?q=1")).toBe("http://example.com/path?q=1");
  });

  it("prepends https:// to scheme-less URLs", () => {
    expect(sanitizeUrl("example.com")).toBe("https://example.com");
    expect(sanitizeUrl("sub.example.com/tool")).toBe("https://sub.example.com/tool");
  });

  it("blocks dangerous schemes like javascript:, data:, vbscript:", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeNull();
    expect(sanitizeUrl("JAVASCRIPT:alert(document.cookie)")).toBeNull();
    expect(sanitizeUrl("  javascript:void(0)")).toBeNull();
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeNull();
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBeNull();
  });

  it("handles empty or invalid inputs safely", () => {
    expect(sanitizeUrl("")).toBeNull();
    expect(sanitizeUrl("   ")).toBeNull();
    // @ts-expect-error testing invalid runtime input
    expect(sanitizeUrl(null)).toBeNull();
    // @ts-expect-error testing invalid runtime input
    expect(sanitizeUrl(123)).toBeNull();
  });
});

describe("safeOpenUrl", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    globalThis.window = {
      open: vi.fn(),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("opens valid URLs with window.open and noopener,noreferrer", () => {
    const result = safeOpenUrl("https://example.com");

    expect(result).toBe(true);
    expect(window.open).toHaveBeenCalledWith(
      "https://example.com/",
      "_blank",
      "noopener,noreferrer"
    );
  });

  it("does not call window.open for blocked URLs", () => {
    const result = safeOpenUrl("javascript:alert(1)");

    expect(result).toBe(false);
    expect(window.open).not.toHaveBeenCalled();
  });
});
