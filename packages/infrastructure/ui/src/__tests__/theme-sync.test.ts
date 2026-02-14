import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

/**
 * Extracts HSL values from CSS custom property declarations.
 * Matches patterns like `--color-background: hsl(0 0% 100%);`
 * and returns a map of property name → HSL value.
 */
function extractHslTokens(css: string): Map<string, string> {
  const tokens = new Map<string, string>();
  const regex = /--(color-[\w-]+|radius-[\w-]+):\s*(hsl\([^)]+\)|\d+px)/g;
  for (let match = regex.exec(css); match !== null; match = regex.exec(css)) {
    tokens.set(match[1], match[2]);
  }
  return tokens;
}

/**
 * Extracts raw HSL channel values from the shared globals.css `:root` or `.dark` block,
 * then resolves them to full `hsl(...)` strings for comparison with mobile tokens.
 */
function extractSharedTokens(css: string, selector: ":root" | ".dark"): Map<string, string> {
  const selectorPattern = selector === ":root" ? /:root\s*\{([^}]+)\}/ : /\.dark\s*\{([^}]+)\}/;

  const blockMatch = css.match(selectorPattern);
  if (!blockMatch) return new Map();

  const block = blockMatch[1];
  const rawTokens = new Map<string, string>();
  const regex = /--([\w-]+):\s*([^;]+);/g;
  for (let match = regex.exec(block); match !== null; match = regex.exec(block)) {
    rawTokens.set(match[1], match[2].trim());
  }

  // Map of theme mapping names used in @theme block: --color-X: hsl(var(--X))
  // We need to resolve the raw HSL channels to full hsl() values
  const resolved = new Map<string, string>();
  const colorNames = [
    "background",
    "foreground",
    "card",
    "card-foreground",
    "popover",
    "popover-foreground",
    "primary",
    "primary-foreground",
    "secondary",
    "secondary-foreground",
    "muted",
    "muted-foreground",
    "accent",
    "accent-foreground",
    "destructive",
    "destructive-foreground",
    "border",
    "input",
    "ring",
  ];

  for (const name of colorNames) {
    const rawValue = rawTokens.get(name);
    if (rawValue) {
      resolved.set(`color-${name}`, `hsl(${rawValue})`);
    }
  }

  return resolved;
}

/**
 * Extracts mobile tokens from a specific CSS block (light @theme or dark @variant).
 */
function extractMobileTokens(css: string, mode: "light" | "dark"): Map<string, string> {
  let block: string;
  if (mode === "light") {
    // Extract from @variant light { ... } block inside @layer theme
    const lightMatch = css.match(/@variant light\s*\{([\s\S]*?)\n\s*\}/);
    block = lightMatch ? lightMatch[1] : "";
  } else {
    // Extract from @variant dark { ... } block
    const darkMatch = css.match(/@variant dark\s*\{([\s\S]*?)\n\s*\}/);
    block = darkMatch ? darkMatch[1] : "";
  }
  return extractHslTokens(block);
}

const SHARED_CSS_PATH = resolve(__dirname, "../../src/globals.css");
const MOBILE_CSS_PATH = resolve(__dirname, "../../../../../apps/mobile/global.css");

const sharedCSS = readFileSync(SHARED_CSS_PATH, "utf-8");
const mobileCSS = readFileSync(MOBILE_CSS_PATH, "utf-8");

describe("theme token sync", () => {
  it("mobile light mode tokens match shared globals.css :root values", () => {
    const sharedLight = extractSharedTokens(sharedCSS, ":root");
    const mobileLight = extractMobileTokens(mobileCSS, "light");

    expect(sharedLight.size).toBeGreaterThan(0);
    expect(mobileLight.size).toBeGreaterThan(0);

    for (const [name, sharedValue] of sharedLight) {
      const mobileValue = mobileLight.get(name);
      expect(mobileValue, `Light token --${name} missing in mobile`).toBeDefined();
      expect(mobileValue, `Light token --${name} mismatch`).toBe(sharedValue);
    }
  });

  it("mobile dark mode tokens match shared globals.css .dark values", () => {
    const sharedDark = extractSharedTokens(sharedCSS, ".dark");
    const mobileDark = extractMobileTokens(mobileCSS, "dark");

    expect(sharedDark.size).toBeGreaterThan(0);
    expect(mobileDark.size).toBeGreaterThan(0);

    for (const [name, sharedValue] of sharedDark) {
      const mobileValue = mobileDark.get(name);
      expect(mobileValue, `Dark token --${name} missing in mobile`).toBeDefined();
      expect(mobileValue, `Dark token --${name} mismatch`).toBe(sharedValue);
    }
  });
});
