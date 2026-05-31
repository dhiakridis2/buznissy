import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { describe, it } from "node:test";

describe("web frontend shell", () => {
  it("contains owner and customer MVP surfaces", async () => {
    const html = await readFile(new URL("../src/index.html", import.meta.url), "utf8");

    assert.match(html, /Owner Access/);
    assert.match(html, /Owner Workspace/);
    assert.match(html, /Customer Storefront/);
    assert.match(html, /Mock checkout/);
  });

  it("connects to the local API", async () => {
    const script = await readFile(new URL("../src/app.js", import.meta.url), "utf8");

    assert.match(script, /http:\/\/127\.0\.0\.1:4000/);
    assert.match(script, /auth\/register/);
    assert.match(script, /auth\/login/);
    assert.match(script, /payment-intents/);
  });
});
