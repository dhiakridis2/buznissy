import assert from "node:assert/strict";
import { after, before, describe, it } from "node:test";
import { createApiServer } from "../src/server.js";

async function requestJson(baseUrl, path, options = {}) {
  const response = await fetch(`${baseUrl}${path}`, {
    ...options,
    headers: {
      "content-type": "application/json",
      ...(options.headers || {}),
    },
  });

  return {
    status: response.status,
    body: await response.json(),
  };
}

describe("api server", () => {
  let server;
  let baseUrl;

  before(async () => {
    server = createApiServer();
    await new Promise((resolve) => server.listen(0, "127.0.0.1", resolve));
    const address = server.address();
    baseUrl = `http://${address.address}:${address.port}`;
  });

  after(async () => {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  });

  it("returns health status", async () => {
    const response = await requestJson(baseUrl, "/health");

    assert.equal(response.status, 200);
    assert.equal(response.body.status, "ok");
  });

  it("registers and logs in an owner", async () => {
    const registered = await requestJson(baseUrl, "/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Dhia Kridis",
        email: "dhia@example.com",
        password: "password123",
      }),
    });
    const loggedIn = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "dhia@example.com",
        password: "password123",
      }),
    });

    assert.equal(registered.status, 201);
    assert.equal(registered.body.owner.email, "dhia@example.com");
    assert.equal(registered.body.owner.passwordHash, undefined);
    assert.equal(typeof registered.body.accessToken, "string");
    assert.equal(loggedIn.status, 200);
    assert.equal(loggedIn.body.owner.id, registered.body.owner.id);
  });

  it("rejects invalid owner credentials", async () => {
    const response = await requestJson(baseUrl, "/auth/login", {
      method: "POST",
      body: JSON.stringify({
        email: "nobody@example.com",
        password: "password123",
      }),
    });

    assert.equal(response.status, 401);
    assert.equal(response.body.code, "INVALID_CREDENTIALS");
  });

  it("creates and reads a store", async () => {
    const created = await requestJson(baseUrl, "/stores", {
      method: "POST",
      body: JSON.stringify({
        name: "Muscat Flowers",
        category: "both",
        description: "Flowers, gifts, and booking services.",
      }),
    });

    const found = await requestJson(baseUrl, "/stores/muscat-flowers");

    assert.equal(created.status, 201);
    assert.equal(created.body.slug, "muscat-flowers");
    assert.equal(found.status, 200);
    assert.equal(found.body.name, "Muscat Flowers");
  });

  it("supports MVP product, service, and payment placeholder flows", async () => {
    const created = await requestJson(baseUrl, "/stores", {
      method: "POST",
      body: JSON.stringify({
        name: "MVP Store",
        category: "both",
      }),
    });

    const product = await requestJson(baseUrl, "/stores/mvp-store/products", {
      method: "POST",
      body: JSON.stringify({
        name: "Notebook",
        price: 2.5,
        stock: 30,
      }),
    });

    const service = await requestJson(baseUrl, "/stores/mvp-store/services", {
      method: "POST",
      body: JSON.stringify({
        name: "Consultation",
        durationMinutes: 30,
        price: 5,
      }),
    });

    const payment = await requestJson(baseUrl, "/stores/mvp-store/payment-intents", {
      method: "POST",
      body: JSON.stringify({
        amount: 2.5,
        currency: "OMR",
      }),
    });

    assert.equal(created.status, 201);
    assert.equal(product.status, 201);
    assert.equal(service.status, 201);
    assert.equal(payment.status, 202);
    assert.equal(payment.body.status, "payment_integration_pending");
  });

  it("rejects invalid JSON", async () => {
    const response = await requestJson(baseUrl, "/stores", {
      method: "POST",
      body: "{bad-json",
    });

    assert.equal(response.status, 400);
    assert.equal(response.body.code, "INVALID_JSON");
  });
});
