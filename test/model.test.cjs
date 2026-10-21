const test = require("node:test");
const assert = require("node:assert/strict");
const {
  normalizeHex,
  luminance,
  ratio,
  checks,
} = require("../public/model.js");

test("normalizes both CSS hex lengths and rejects unsupported colors", () => {
  assert.equal(normalizeHex("  #aB0 "), "#AABB00");
  assert.equal(normalizeHex("ba51c0"), "#BA51C0");
  for (const invalid of ["", "blue", "#abcd", "000000FF", "#G00000"]) {
    assert.equal(normalizeHex(invalid), null);
  }
  assert.throws(() => luminance("invalid"), RangeError);
});

test("matches the reference extremes, symmetry and identical colors", () => {
  assert.equal(ratio("#000", "#fff"), 21);
  assert.equal(ratio("#123456", "#123456"), 1);
  assert.equal(ratio("#322722", "#F8D8CF"), ratio("#F8D8CF", "#322722"));
  assert.ok(Math.abs(ratio("#777", "#fff") - 4.47808945) < 1e-7);
});

test("tests full precision at each text threshold", () => {
  assert.deepEqual(
    checks(4.4999).map((item) => item.passes),
    [false, true, false, false],
  );
  assert.deepEqual(
    checks(4.5).map((item) => item.passes),
    [true, true, false, true],
  );
  assert.ok(checks(7).every((item) => item.passes));
  assert.ok(checks(2.9999).every((item) => !item.passes));
});

const { addPair, cssTokens, readLibrary } = require("../public/model.js");

test("named swatches normalize hex values and preserve collection order", () => {
  const first = addPair([], {
    name: "  Type & paper  ",
    ink: "fff",
    paper: "#abc",
  });
  assert.deepEqual(first, [
    { name: "Type & paper", ink: "#FFFFFF", paper: "#AABBCC" },
  ]);
  const second = addPair(first, { name: "Night", ink: "#112", paper: "#eee" });
  assert.equal(first.length, 1);
  assert.deepEqual(
    readLibrary(JSON.stringify({ version: 1, pairs: second })),
    second,
  );
  assert.throws(() =>
    addPair(second, { name: "NIGHT", ink: "#123", paper: "#fff" }),
  );
});

test("invalid stored data and invalid authoring input are rejected", () => {
  assert.deepEqual(readLibrary(null), []);
  for (const item of [
    null,
    { name: "", ink: "fff", paper: "000" },
    { name: "Dark", ink: "fff", paper: "no" },
    { name: "x".repeat(61), ink: "fff", paper: "000" },
  ]) {
    assert.throws(() =>
      readLibrary(JSON.stringify({ version: 1, pairs: [item] })),
    );
  }
  assert.throws(() => readLibrary('{"version":2,"pairs":[]}'));
  assert.throws(() => readLibrary("x"));
});

test("CSS handoff uses only normalized color tokens", () => {
  assert.equal(
    cssTokens("abc", "#Fff"),
    ":root {\n  --ink: #AABBCC;\n  --paper: #FFFFFF;\n}\n",
  );
  assert.throws(() => cssTokens(null, "#345"));
});
