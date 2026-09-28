import { describe, it, expect } from "vitest";
import { extractVariables, fillVariables, hasVariables, humanizeVariable } from "./variables";

describe("variables.ts", () => {
  it("extracts unique variables in order", () => {
    const text = "Hello {{ name }}, welcome to {{ company }}! Your code is {{ code }}. Repeat {{ name }}.";
    expect(extractVariables(text)).toEqual(["name", "company", "code"]);
  });

  it("handles empty or falsy content safely", () => {
    expect(extractVariables("")).toEqual([]);
    expect(fillVariables("", { name: "Test" })).toBe("");
    expect(hasVariables("")).toBe(false);
    expect(humanizeVariable("")).toBe("");
  });

  it("fills variables correctly", () => {
    const text = "Hello {{ name }}, welcome to {{ company }}!";
    const filled = fillVariables(text, { name: "Alice", company: "Acme" });
    expect(filled).toBe("Hello Alice, welcome to Acme!");
  });

  it("keeps placeholder if variable value is missing or whitespace", () => {
    const text = "Hello {{ name }}, {{ role }}!";
    const filled = fillVariables(text, { name: "", role: "  " });
    expect(filled).toBe("Hello {{ name }}, {{ role }}!");
  });

  it("checks for variable existence without stateful regex issues", () => {
    const textWithVar = "Prompt for {{ topic }}";
    const textNoVar = "Plain prompt without variables";

    expect(hasVariables(textWithVar)).toBe(true);
    expect(hasVariables(textNoVar)).toBe(false);
    // Call multiple times to verify regex lastIndex isn't stateful across calls
    expect(hasVariables(textWithVar)).toBe(true);
    expect(extractVariables(textWithVar)).toEqual(["topic"]);
  });

  it("humanizes variable names", () => {
    expect(humanizeVariable("campaign_name")).toBe("Campaign name");
    expect(humanizeVariable("user.first_name")).toBe("User first name");
  });
});
