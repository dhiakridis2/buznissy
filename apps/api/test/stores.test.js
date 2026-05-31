import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createStoreService,
  slugifyStoreName,
  validateStoreInput,
} from "../src/domain/stores.js";

describe("store domain", () => {
  it("creates clean URL slugs from store names", () => {
    assert.equal(slugifyStoreName(" Al Noor Gifts! "), "al-noor-gifts");
  });

  it("validates required store fields", () => {
    const result = validateStoreInput({
      name: "",
      category: "wrong",
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors.name, "Store name must be at least 2 characters.");
    assert.equal(
      result.errors.category,
      "Category must be one of: products, services, both.",
    );
  });

  it("creates a store and prevents duplicate slugs", () => {
    const service = createStoreService();
    const first = service.create({
      name: "Al Noor Gifts",
      category: "products",
      description: "Handmade gifts.",
    });
    const second = service.create({
      name: "Al Noor Gifts",
      category: "products",
    });

    assert.equal(first.ok, true);
    assert.equal(first.status, 201);
    assert.equal(first.data.slug, "al-noor-gifts");
    assert.equal(second.ok, false);
    assert.equal(second.status, 409);
  });

  it("adds products and services to an existing store", () => {
    const service = createStoreService();
    const store = service.create({
      name: "Muscat Studio",
      category: "both",
    });
    const product = service.addProduct(store.data.slug, {
      name: "Printed Mug",
      price: 4.5,
      stock: 12,
    });
    const storeService = service.addService(store.data.slug, {
      name: "Design Session",
      durationMinutes: 60,
      price: 15,
    });

    assert.equal(product.ok, true);
    assert.equal(storeService.ok, true);
    assert.equal(service.listProducts(store.data.slug).data.length, 1);
    assert.equal(service.listServices(store.data.slug).data.length, 1);
  });

  it("creates a placeholder payment intent without real payment integration", () => {
    const service = createStoreService();
    const store = service.create({
      name: "Payment Test Store",
      category: "products",
    });
    const intent = service.createPaymentIntent(store.data.slug, {
      amount: 10,
      currency: "OMR",
    });

    assert.equal(intent.status, 202);
    assert.equal(intent.data.status, "payment_integration_pending");
  });
});
