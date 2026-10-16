import { describe, expect, it } from "vitest";
import { isSafeUrl } from "./markdown-preview";

describe("isSafeUrl", () => {
  it("allows safe HTTP and HTTPS URLs", () => {
    expect(isSafeUrl("https://example.com")).toBe(true);
    expect(isSafeUrl("http://example.com/path?query=1")).toBe(true);
  });

  it("allows mailto and tel links", () => {
    expect(isSafeUrl("mailto:test@example.com")).toBe(true);
    expect(isSafeUrl("tel:+1234567890")).toBe(true);
  });

  it("allows relative paths and fragment anchors", () => {
    expect(isSafeUrl("/dashboard")).toBe(true);
    expect(isSafeUrl("#section-1")).toBe(true);
  });

  it("blocks javascript: URIs", () => {
    expect(isSafeUrl("javascript:alert(1)")).toBe(false);
    expect(isSafeUrl("JAVASCRIPT:alert(document.cookie)")).toBe(false);
    expect(isSafeUrl(" javascript:void(0)")).toBe(false);
  });

  it("blocks data: URIs", () => {
    expect(isSafeUrl("data:text/html,<script>alert(1)</script>")).toBe(false);
  });

  it("blocks vbscript: and file: URIs", () => {
    expect(isSafeUrl("vbscript:msgbox(1)")).toBe(false);
    expect(isSafeUrl("file:///etc/passwd")).toBe(false);
  });

  it("handles empty or undefined URLs gracefully", () => {
    expect(isSafeUrl("")).toBe(false);
    expect(isSafeUrl(undefined)).toBe(false);
  });
});
