import { describe, expect, it } from "vitest";
import { sanitizeExternalUrl } from "../../src/lib/utils";

describe("sanitizeExternalUrl", () => {
  it("returns valid http and https URLs", () => {
    expect(sanitizeExternalUrl("https://example.com")).toBe("https://example.com/");
    expect(sanitizeExternalUrl("http://example.com/path?query=1")).toBe("http://example.com/path?query=1");
  });

  it("prepends https:// if scheme is missing", () => {
    expect(sanitizeExternalUrl("example.com")).toBe("https://example.com/");
    expect(sanitizeExternalUrl("sub.domain.org/page")).toBe("https://sub.domain.org/page");
  });

  it("rejects javascript: URLs", () => {
    expect(sanitizeExternalUrl("javascript:alert(1)")).toBeUndefined();
    expect(sanitizeExternalUrl("JAVASCRIPT:alert(1)")).toBeUndefined();
    expect(sanitizeExternalUrl("javascript: void(0)")).toBeUndefined();
  });

  it("rejects data: and vbscript: URLs", () => {
    expect(sanitizeExternalUrl("data:text/html,<script>alert(1)</script>")).toBeUndefined();
    expect(sanitizeExternalUrl("vbscript:msgbox(1)")).toBeUndefined();
  });

  it("rejects invalid or empty inputs", () => {
    expect(sanitizeExternalUrl("")).toBeUndefined();
    expect(sanitizeExternalUrl("   ")).toBeUndefined();
    expect(sanitizeExternalUrl(null)).toBeUndefined();
    expect(sanitizeExternalUrl(undefined)).toBeUndefined();
    expect(sanitizeExternalUrl("//relative")).toBeUndefined();
    expect(sanitizeExternalUrl("/relative")).toBeUndefined();
  });
});
