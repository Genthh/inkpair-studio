"use strict";

(() => {
  const { normalizeHex, ratio, checks } = globalThis.InkPairModel;
  const presets = {
    clay: ["#302521", "#F4CCBB"],
    tide: ["#103831", "#BFE9D3"],
    night: ["#EBDDBB", "#242C48"],
    mist: ["#8F939B", "#CDD1D4"],
  };
  const colors = {};
  const fields = ["ink", "paper"];
  const byId = (id) => document.getElementById(id);
  const preset = byId("preset");
  const sample = byId("sample");

  function render() {
    sample.style.color = colors.ink;
    sample.style.backgroundColor = colors.paper;
    const value = ratio(colors.ink, colors.paper);
    const lowerHundredth = Math.floor(value * 100) / 100;
    byId("ratio").textContent = lowerHundredth.toFixed(2) + "∶1";
    const items = checks(value).map((check) => {
      const item = document.createElement("li");
      const result = document.createElement("strong");
      result.textContent = check.passes ? "Pass" : "Fail";
      result.className = check.passes ? "pass" : "fail";
      item.append(check.size + " · " + check.level, result);
      return item;
    });
    byId("checks").replaceChildren(...items);
    preset.value =
      Object.keys(presets).find((key) => {
        const [ink, paper] = presets[key];
        return ink === colors.ink && paper === colors.paper;
      }) || "custom";
  }

  function showErrors() {
    const invalid = fields.filter(
      (field) => byId(field + "-hex").getAttribute("aria-invalid") === "true",
    );
    byId("guidance").textContent = invalid.length
      ? "Enter 3 or 6 hex digits for " + invalid.join(" and ") + "."
      : "";
  }

  function syncField(field, value) {
    colors[field] = value;
    byId(field + "-hex").value = value;
    byId(field + "-hex").removeAttribute("aria-invalid");
    byId(field + "-picker").value = value;
  }

  function setPair(ink, paper) {
    syncField("ink", ink);
    syncField("paper", paper);
    showErrors();
    render();
  }

  for (const field of fields) {
    const hex = byId(field + "-hex");
    const picker = byId(field + "-picker");
    hex.addEventListener("input", () => {
      const value = normalizeHex(hex.value);
      hex.setAttribute("aria-invalid", String(!value));
      showErrors();
      if (value) {
        colors[field] = value;
        picker.value = value;
        render();
      }
    });
    hex.addEventListener("blur", () => {
      const value = normalizeHex(hex.value);
      if (value) hex.value = value;
    });
    picker.addEventListener("input", () => {
      syncField(field, normalizeHex(picker.value));
      showErrors();
      render();
    });
  }
  preset.addEventListener("change", () => {
    if (presets[preset.value]) setPair(...presets[preset.value]);
  });
  byId("swap").addEventListener("click", () =>
    setPair(colors.paper, colors.ink),
  );
  globalThis.setupInkLibrary({
    current: () => ({
      ink: normalizeHex(byId("ink-hex").value),
      paper: normalizeHex(byId("paper-hex").value),
    }),
    apply: setPair,
  });
  setPair(...presets.clay);
})();
