"use strict";

globalThis.setupContrastRepair = function (applyPair) {
  const { normalizeHex, repairContrast } = globalThis.InkPairModel;
  const byId = (id) => document.getElementById(id);
  const lock = byId("repair-lock");
  const target = byId("repair-target");
  const note = byId("repair-note");
  const button = byId("repair-apply");
  const chip = byId("repair-chip");
  let proposal;

  function format(value) {
    return (Math.floor(value * 100) / 100).toFixed(2) + ":1";
  }

  function refresh() {
    const ink = normalizeHex(byId("ink-hex").value);
    const paper = normalizeHex(byId("paper-hex").value);
    proposal = null;
    button.disabled = true;
    chip.hidden = true;
    if (!ink || !paper) {
      note.textContent = "Enter two valid colors to preview a repair.";
      return;
    }
    const result = repairContrast(ink, paper, Number(target.value), lock.value);
    if (result.state === "met") {
      note.textContent =
        "This pair meets your target at " + format(result.before) + ".";
    } else if (result.state === "impossible") {
      note.textContent =
        "The locked " +
        lock.value +
        " cannot reach " +
        target.value +
        ":1. Try locking the other color or lowering the target.";
    } else {
      proposal =
        lock.value === "ink" ? [ink, result.color] : [result.color, paper];
      chip.style.backgroundColor = result.color;
      chip.hidden = false;
      const editable = lock.value === "ink" ? "paper" : "ink";
      note.textContent =
        "Set " +
        editable +
        " to " +
        result.color +
        " to move from " +
        format(result.before) +
        " to " +
        format(result.after) +
        ".";
      button.disabled = false;
    }
  }

  lock.addEventListener("change", refresh);
  target.addEventListener("change", refresh);
  button.addEventListener("click", () => {
    if (proposal) applyPair(...proposal);
  });
  return refresh;
};
