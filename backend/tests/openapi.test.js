const test = require("node:test");
const assert = require("node:assert/strict");
const { openapiSpec } = require("../src/docs/openapi");

test("OpenAPI spec asosiy endpointlarni beradi", () => {
  assert.equal(openapiSpec.openapi, "3.0.3");
  assert.ok(openapiSpec.paths["/api/chat"]);
  assert.ok(openapiSpec.paths["/api/openapi.json"]);
  assert.ok(openapiSpec.components.schemas.ChatResponse.properties.confidenceScore);
});
