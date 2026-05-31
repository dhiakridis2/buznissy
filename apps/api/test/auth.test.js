import assert from "node:assert/strict";
import { describe, it } from "node:test";
import {
  createAuthService,
  hashPassword,
  normalizeEmail,
  validateRegisterInput,
  verifyPassword,
} from "../src/domain/auth.js";

describe("owner auth domain", () => {
  it("normalizes owner emails", () => {
    assert.equal(normalizeEmail(" Owner@Example.COM "), "owner@example.com");
  });

  it("validates registration input", () => {
    const result = validateRegisterInput({
      fullName: "",
      email: "bad-email",
      password: "short",
    });

    assert.equal(result.valid, false);
    assert.equal(result.errors.fullName, "Full name must be at least 2 characters.");
    assert.equal(result.errors.email, "Email must be valid.");
    assert.equal(result.errors.password, "Password must be at least 8 characters.");
  });

  it("hashes and verifies passwords", () => {
    const stored = hashPassword("super-secret", "test-salt");

    assert.equal(verifyPassword("super-secret", stored), true);
    assert.equal(verifyPassword("wrong-password", stored), false);
  });

  it("registers and logs in an owner", () => {
    const auth = createAuthService({ tokenSecret: "test-secret" });
    const registered = auth.register({
      fullName: "Dhia Kridis",
      email: "dhia@example.com",
      password: "password123",
    });
    const loggedIn = auth.login({
      email: "dhia@example.com",
      password: "password123",
    });

    assert.equal(registered.status, 201);
    assert.equal(registered.data.owner.email, "dhia@example.com");
    assert.equal(registered.data.owner.passwordHash, undefined);
    assert.equal(typeof registered.data.accessToken, "string");
    assert.equal(loggedIn.status, 200);
    assert.equal(loggedIn.data.owner.id, registered.data.owner.id);
  });

  it("rejects duplicate emails and bad passwords", () => {
    const auth = createAuthService();
    auth.register({
      fullName: "Dhia Kridis",
      email: "dhia@example.com",
      password: "password123",
    });

    const duplicate = auth.register({
      fullName: "Dhia Kridis",
      email: "DHIA@example.com",
      password: "password123",
    });
    const badLogin = auth.login({
      email: "dhia@example.com",
      password: "wrong-password",
    });

    assert.equal(duplicate.status, 409);
    assert.equal(duplicate.error.code, "OWNER_EMAIL_TAKEN");
    assert.equal(badLogin.status, 401);
    assert.equal(badLogin.error.code, "INVALID_CREDENTIALS");
  });
});
