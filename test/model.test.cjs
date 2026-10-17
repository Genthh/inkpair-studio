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
