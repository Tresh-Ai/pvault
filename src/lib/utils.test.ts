import { describe, it, expect } from "vitest";
import { sanitizeUrl } from "./utils";

describe("sanitizeUrl", () => {
  it("allows valid http and https URLs", () => {
    expect(sanitizeUrl("http://example.com")).toBe("http://example.com");
    expect(sanitizeUrl("https://example.com/path?query=1")).toBe("https://example.com/path?query=1");
    expect(sanitizeUrl("https://sub.domain.org/foo#bar")).toBe("https://sub.domain.org/foo#bar");
  });

  it("allows relative path URLs", () => {
    expect(sanitizeUrl("/relative/path")).toBe("/relative/path");
    expect(sanitizeUrl("./relative/path")).toBe("./relative/path");
    expect(sanitizeUrl("../relative/path")).toBe("../relative/path");
  });

  it("rejects javascript: URLs and dangerous protocols", () => {
    expect(sanitizeUrl("javascript:alert(1)")).toBe("");
    expect(sanitizeUrl("JAVASCRIPT:alert(document.cookie)")).toBe("");
    expect(sanitizeUrl("javascript:/*--></title></style></textarea></script><svg/onload='+/\"/+/onmouseover=1/+/[*/[]/alert(1)//'>")).toBe("");
    expect(sanitizeUrl("data:text/html,<script>alert(1)</script>")).toBe("");
    expect(sanitizeUrl("vbscript:msgbox(1)")).toBe("");
    expect(sanitizeUrl("file:///etc/passwd")).toBe("");
  });

  it("handles empty, null, undefined, and whitespace values gracefully", () => {
    expect(sanitizeUrl(null)).toBe("");
    expect(sanitizeUrl(undefined)).toBe("");
    expect(sanitizeUrl("")).toBe("");
    expect(sanitizeUrl("   ")).toBe("");
  });

  it("handles malformed URLs safely", () => {
    expect(sanitizeUrl("http://")).toBe("");
    expect(sanitizeUrl("not a valid url")).toBe("");
  });
});
