"use strict";

globalThis.setupInkLibrary = function ({ current, apply }) {
  const { addPair, readLibrary, cssTokens } = globalThis.InkPairModel;
  const byId = (id) => document.getElementById(id);
  const status = byId("library-status");
  const nameField = byId("pair-name");
  const list = byId("collection");
  const key = "inkpair.library.v1";
  let pairs = [];
  let memoryOnly = false;

  function read() {
    if (memoryOnly) return;
    try {
      pairs = readLibrary(localStorage.getItem(key));
    } catch {
      memoryOnly = true;
      status.textContent =
        "Your collection could not be opened. New pairs will stay in this tab.";
    }
  }

  function write(next, message) {
    if (!memoryOnly) {
      try {
        localStorage.setItem(key, JSON.stringify({ version: 1, pairs: next }));
      } catch {
        memoryOnly = true;
      }
    }
    pairs = next;
    status.textContent = memoryOnly
      ? message + " Changes last only in this tab."
      : message;
    render();
  }

  function render() {
    if (!pairs.length) {
      list.textContent = "Your saved pairs will appear here.";
      return;
    }
    const entries = pairs.map((pair) => {
      const row = document.createElement("div");
      row.className = "saved-pair";
      const chip = document.createElement("span");
      chip.className = "pair-chip";
      chip.style.background =
        "linear-gradient(135deg," + pair.ink + " 50%," + pair.paper + " 50%)";
      chip.setAttribute("aria-hidden", "true");
      const title = document.createElement("strong");
      title.textContent = pair.name;
      const values = document.createElement("small");
      values.textContent = pair.ink + " / " + pair.paper;
      const info = document.createElement("div");
      info.append(title, values);
      const commands = document.createElement("div");
      commands.className = "pair-actions";
      for (const action of ["Apply", "Remove"]) {
        const button = document.createElement("button");
        button.type = "button";
        button.dataset.action = action;
        button.dataset.name = pair.name;
        button.textContent = action;
        button.setAttribute("aria-label", action + " " + pair.name);
        commands.append(button);
      }
      row.append(chip, info, commands);
      return row;
    });
    list.replaceChildren(...entries);
  }

  list.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button) return;
    read();
    const pair = pairs.find((entry) => entry.name === button.dataset.name);
    if (!pair) {
      render();
      status.textContent = "This pair was removed in another tab.";
    } else if (button.dataset.action === "Apply") {
      apply(pair.ink, pair.paper);
      status.textContent = "Applied " + pair.name + " to the specimen.";
    } else {
      write(
        pairs.filter((entry) => entry !== pair),
        "Removed " + pair.name + ".",
      );
      nameField.focus();
    }
  });

  byId("save-form").addEventListener("submit", (event) => {
    event.preventDefault();
    read();
    try {
      const next = addPair(pairs, { name: nameField.value, ...current() });
      write(next, "Saved " + next[next.length - 1].name + ".");
      nameField.value = "";
    } catch (error) {
      status.textContent = error.message;
    }
  });

  byId("export-css").addEventListener("click", () => {
    try {
      const { ink, paper } = current();
      const data = new Blob([cssTokens(ink, paper)], { type: "text/css" });
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.download = "inkpair.css";
      link.href = url;
      document.body.append(link);
      link.click();
      link.remove();
      setTimeout(() => URL.revokeObjectURL(url), 1000);
      status.textContent =
        "Prepared inkpair.css with the current ink and paper.";
    } catch (error) {
      status.textContent = error.message;
    }
  });

  window.addEventListener("storage", (event) => {
    if (event.key === key || event.key === null) {
      read();
      render();
    }
  });
  read();
  render();
};
