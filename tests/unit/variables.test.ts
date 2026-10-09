import { describe, it, expect } from "vitest";
import { extractVariables, fillVariables, hasVariables, humanizeVariable } from "@/lib/variables";

describe("variables.ts performance & functional tests", () => {
  describe("extractVariables", () => {
    it("returns empty array for empty or plain text without {{", () => {
      expect(extractVariables("")).toEqual([]);
      expect(extractVariables("Hello world without placeholders")).toEqual([]);
    });

    it("extracts unique variable names in order of appearance", () => {
      const content = "Hello {{ name }}, your role is {{role}}. Also hi {{name}}!";
      expect(extractVariables(content)).toEqual(["name", "role"]);
    });

    it("handles variable names with dots, dashes, and underscores", () => {
      const content = "Data: {{ user.first_name }} and {{ item-id }}";
      expect(extractVariables(content)).toEqual(["user.first_name", "item-id"]);
    });
  });

  describe("fillVariables", () => {
    it("returns original content unchanged when no {{ is present", () => {
      const plain = "This is simple plain text.";
      expect(fillVariables(plain, { name: "Alice" })).toBe(plain);
    });

    it("replaces variables with provided non-empty values", () => {
      const template = "Hello {{name}}, welcome to {{ app_name }}!";
      const values = { name: "Alice", app_name: "PVault" };
      expect(fillVariables(template, values)).toBe("Hello Alice, welcome to PVault!");
    });

    it("leaves unfilled variables as placeholders", () => {
      const template = "Hello {{name}}, your balance is {{ balance }}.";
      expect(fillVariables(template, { name: "Bob" })).toBe("Hello Bob, your balance is {{ balance }}.");
    });
  });

  describe("hasVariables", () => {
    it("returns false for plain text or empty text", () => {
      expect(hasVariables("")).toBe(false);
      expect(hasVariables("Just normal text")).toBe(false);
    });

    it("returns true when valid {{ variable }} is present", () => {
      expect(hasVariables("Hello {{ name }}")).toBe(true);
    });
  });

  describe("humanizeVariable", () => {
    it("capitalizes and replaces underscores, dots, and dashes with spaces", () => {
      expect(humanizeVariable("campaign_name")).toBe("Campaign name");
      expect(humanizeVariable("user.first_name")).toBe("User first name");
      expect(humanizeVariable("target-audience")).toBe("Target audience");
    });
  });
});
