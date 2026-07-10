const test = require("node:test");
const assert = require("node:assert/strict");
const { parseMoney, detectDamage, readImageInfo, estimateInsurance } = require("../src/image-analysis");

test("sug'urta summasi matndan ajratiladi", () => {
  const values = parseMoney("Mashina bozor narxi 180 mln so'm, franshiza 1 mln.");
  assert.equal(values[0], 180_000_000);
});

test("shikast darajasi kalit so'zlar bilan aniqlanadi", () => {
  const damage = detectDamage("Kapot pachoq, far singan, radiator shikastlangan.");
  assert.equal(damage.level, "o'rta");
  assert.ok(damage.hits.includes("radiator"));
});

test("png rasm o'lchami o'qiladi", () => {
  const png1x1 = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=";
  const info = readImageInfo(png1x1);
  assert.equal(info.mime, "image/png");
  assert.equal(info.width, 1);
  assert.equal(info.height, 1);
});

test("sug'urta diapazoni hisoblanadi", () => {
  const imageInfo = readImageInfo("data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII=");
  const result = estimateInsurance({
    text: "Avtomobil 100 mln so'm. Eshik ezilgan, bamper tirnalgan.",
    imageInfo,
    clientStats: { brightness: 120, blur: 35 }
  });
  assert.equal(result.estimate.base, 100_000_000);
  assert.ok(result.estimate.low > 0);
  assert.ok(result.estimate.high > result.estimate.low);
});
