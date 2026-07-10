const test = require("node:test");
const assert = require("node:assert/strict");
const { distanceKm, findNearest, getAgencyRoute } = require("../src/agencies");

test("masofa bir xil nuqtada nol", () => {
  assert.equal(distanceKm(41.3, 69.2, 41.3, 69.2), 0);
});

test("eng yaqin organ saralanadi", () => {
  const found = findNearest([
    { name: "Uzoq", latitude: 42, longitude: 70 },
    { name: "Yaqin", latitude: 41.31, longitude: 69.21 }
  ], 41.3, 69.2, 1);
  assert.equal(found[0].name, "Yaqin");
});

test("huquq sohasi organ va hujjatlarga bog'lanadi", () => {
  const route = getAgencyRoute("Oila huquqi");
  assert.match(route.primary, /FHDY/);
  assert.ok(route.documents.length >= 4);
});
