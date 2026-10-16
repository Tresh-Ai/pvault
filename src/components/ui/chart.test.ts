import { describe, expect, it } from "vitest";
import { sanitizeCssValue, sanitizeIdentifier } from "./chart";

describe("Chart CSS Sanitization", () => {
  it("sanitizes CSS identifiers to contain only alphanumeric, underscore, and hyphen", () => {
    expect(sanitizeIdentifier("valid_key-123")).toBe("valid_key-123");
    expect(sanitizeIdentifier("bad key;color:red")).toBe("badkeycolorred");
    expect(sanitizeIdentifier("</style><script>alert(1)</script>")).toBe("stylescriptalert1script");
  });

  it("sanitizes CSS values by stripping </style> tags and syntax delimiters ; { }", () => {
    expect(sanitizeCssValue("hsl(var(--primary))")).toBe("hsl(var(--primary))");
    expect(sanitizeCssValue("#ff0000")).toBe("#ff0000");
    expect(sanitizeCssValue("red; background: url('http://evil.com')")).toBe("red background: url('http://evil.com')");
    expect(sanitizeCssValue("red; }</style><script>alert('xss')</script>")).toBe("red scriptalert('xss')/script");
  });
});
