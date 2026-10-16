import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { isSafeUrl, openSafeUrl } from "./utils";

describe("isSafeUrl", () => {
  it("allows standard http and https URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://localhost:3000/path?query=1")).toBe(true);
    expect(isSafeUrl("https://chatgpt.com/?q=hello")).toBe(true);
  });

  it("blocks dangerous pseudo-protocols", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("JAVASCRIPT:alert('xss')")).toBe(false);
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  it("handles empty or invalid input safely", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl(null as unknown as string)).toBe(false);
    expect(isSafeUrl(undefined as unknown as string)).toBe(false);
  });
});

describe("openSafeUrl", () => {
  const originalWindow = globalThis.window;

  beforeEach(() => {
    globalThis.window = {
      location: { origin: "http://localhost" },
      open: vi.fn(),
    } as unknown as Window & typeof globalThis;
  });

  afterEach(() => {
    globalThis.window = originalWindow;
  });

  it("opens safe URLs with window.open with noopener,noreferrer", () => {
    openSafeUrl("https://example.com");

    expect(window.open).toHaveBeenCalledWith(
      "https://example.com",
      "_blank",
      "noopener,noreferrer",
    );
  });

  it("does not open unsafe URLs and logs a warning", () => {
    const warnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

    const result = openSafeUrl("javascript:alert(1)");

    expect(result).toBeNull();
    expect(window.open).not.toHaveBeenCalled();
    expect(warnSpy).toHaveBeenCalled();

    warnSpy.mockRestore();
  });
});
