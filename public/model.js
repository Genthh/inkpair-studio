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

  function namedPair(name, ink, paper) {
    const label = typeof name === "string" ? name.trim() : "";
    if (!label || label.length > 60)
      throw new Error("Enter a pair name between 1 and 60 characters.");
    const values = [ink, paper].map((value) =>
      typeof value === "string" ? normalizeHex(value) : null,
    );
    if (values.includes(null))
      throw new Error("Enter valid ink and paper colors.");
    return { name: label, ink: values[0], paper: values[1] };
  }

  function addPair(items, pair) {
    const entry = namedPair(pair.name, pair.ink, pair.paper);
    if (
      items.some((item) => item.name.toLowerCase() === entry.name.toLowerCase())
    ) {
      throw new Error("That name is in your collection. Choose another name.");
    }
    return [...items, entry];
  }

  function readLibrary(raw) {
    if (raw === null) return [];
    const data = JSON.parse(raw);
    if (data?.version !== 1 || !Array.isArray(data.pairs))
      throw new Error("Unrecognized collection.");
    const names = new Set();
    return data.pairs.map((item) => {
      const pair = namedPair(item?.name, item?.ink, item?.paper);
      const key = pair.name.toLowerCase();
      if (names.has(key)) throw new Error("Unrecognized collection.");
      names.add(key);
      return pair;
    });
  }

  function cssTokens(ink, paper) {
    const pair = namedPair("Current pair", ink, paper);
    return [
      ":root {",
      "  --ink: " + pair.ink + ";",
      "  --paper: " + pair.paper + ";",
      "}",
      "",
    ].join("\n");
  }

  function repairContrast(ink, paper, target, locked) {
    if (!["ink", "paper"].includes(locked) || ![3, 4.5, 7].includes(target)) {
      throw new RangeError("Select a valid target and locked color.");
    }
    const fixed = locked === "ink" ? ink : paper;
    const editable = normalizeHex(locked === "ink" ? paper : ink);
    const before = ratio(ink, paper);
    if (before >= target) return { state: "met", before };

    const channels = editable
      .slice(1)
      .match(/../g)
      .map((part) => parseInt(part, 16));
    let best;
    for (const endpoint of [0, 255]) {
      const extreme = endpoint === 0 ? "#000000" : "#FFFFFF";
      if (ratio(extreme, fixed) < target) continue;
      const mix = (amount) =>
        channels.map((channel) =>
          Math.round(channel + ((endpoint - channel) * amount) / 255),
        );
      const asHex = (values) =>
        "#" +
        values
          .map((channel) => channel.toString(16).padStart(2, "0"))
          .join("")
          .toUpperCase();
      let first = 1;
      let last = 255;
      while (first < last) {
        const middle = Math.floor((first + last) / 2);
        if (ratio(asHex(mix(middle)), fixed) >= target) last = middle;
        else first = middle + 1;
      }
      const result = mix(first);
      const distance = result.reduce(
        (sum, channel, index) => sum + (channel - channels[index]) ** 2,
        0,
      );
      if (!best || distance < best.distance)
        best = { color: asHex(result), distance };
    }
    if (!best) return { state: "impossible", before };
    return {
      state: "suggested",
      before,
      after: ratio(best.color, fixed),
      color: best.color,
    };
  }

  return {
    normalizeHex,
    luminance,
    ratio,
    checks,
    namedPair,
    addPair,
    readLibrary,
    cssTokens,
    repairContrast,
  };
})();

if (typeof module !== "undefined") module.exports = InkPair;
else globalThis.InkPairModel = InkPair;
