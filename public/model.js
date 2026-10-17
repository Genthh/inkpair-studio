"use strict";

const InkPair = (() => {
  function normalizeHex(value) {
    const match = /^#?([a-f0-9]{3}|[a-f0-9]{6})$/i.exec(String(value).trim());
    if (!match) return null;
    let digits = match[1];
    if (digits.length === 3)
      digits = [...digits].map((digit) => digit + digit).join("");
    return "#" + digits.toUpperCase();
  }

  function luminance(hex) {
    const normalized = normalizeHex(hex);
    if (!normalized)
      throw new RangeError("Enter a three- or six-digit hex color.");
    const channels = normalized
      .slice(1)
      .match(/../g)
      .map((pair) => {
        const value = parseInt(pair, 16) / 255;
        return value <= 0.04045
          ? value / 12.92
          : ((value + 0.055) / 1.055) ** 2.4;
      });
    return channels[0] * 0.2126 + channels[1] * 0.7152 + channels[2] * 0.0722;
  }

  function ratio(ink, paper) {
    const a = luminance(ink);
    const b = luminance(paper);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  }

  function checks(value) {
    return [
      { size: "Body text", level: "AA", minimum: 4.5 },
      { size: "Large text", level: "AA", minimum: 3 },
      { size: "Body text", level: "AAA", minimum: 7 },
      { size: "Large text", level: "AAA", minimum: 4.5 },
    ].map((check) => ({ ...check, passes: value >= check.minimum }));
  }

  return { normalizeHex, luminance, ratio, checks };
})();

if (typeof module !== "undefined") module.exports = InkPair;
else globalThis.InkPairModel = InkPair;
