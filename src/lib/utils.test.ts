import { describe, it, expect } from "vitest";
import { sanitizeUrl } from "./utils";

describe("sanitizeUrl", () => {
  it("returns undefined for empty, whitespace, or undefined input", () => {
    expect(sanitizeUrl()).toBeUndefined();
    expect(sanitizeUrl("")).toBeUndefined();
    expect(sanitizeUrl("   ")).toBeUndefined();
  });

  it("preserves valid http and https URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com/");
    expect(sanitizeUrl("https://example.com/path?query=1")).toBe("https://example.com/path?query=1");
  });

  it("prepends https:// to scheme-less inputs", () => {
    expect(sanitizeUrl("example.com")).toBe("https://example.com/");
    expect(sanitizeUrl("sub.domain.com/path")).toBe("https://sub.domain.com/path");
  });

  it("rejects dangerous or disallowed URI schemes", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeUrl("javascript:alert('XSS')")).toBeUndefined();
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(sanitizeUrl("file:///etc/passwd")).toBeUndefined();
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBeUndefined();
  });

  it("handles malformed inputs safely", () => {
    expect(sanitizeUrl("http://")).toBeUndefined();
    expect(sanitizeUrl("https://")).toBeUndefined();
  });
});
