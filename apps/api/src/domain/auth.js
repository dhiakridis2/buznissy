import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 8;

function base64Url(value) {
  return Buffer.from(value).toString("base64url");
}

export function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

export function validateRegisterInput(input) {
  const errors = {};
  const fullName = typeof input?.fullName === "string" ? input.fullName.trim() : "";
  const email = normalizeEmail(input?.email);
  const password = typeof input?.password === "string" ? input.password : "";

  if (fullName.length < 2) {
    errors.fullName = "Full name must be at least 2 characters.";
  }

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email must be valid.";
  }

  if (password.length < PASSWORD_MIN_LENGTH) {
    errors.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
  }

  return {
    data: {
      fullName,
      email,
      password,
    },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function validateLoginInput(input) {
  const errors = {};
  const email = normalizeEmail(input?.email);
  const password = typeof input?.password === "string" ? input.password : "";

  if (!EMAIL_PATTERN.test(email)) {
    errors.email = "Email must be valid.";
  }

  if (!password) {
    errors.password = "Password is required.";
  }

  return {
    data: {
      email,
      password,
    },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function hashPassword(password, salt = randomBytes(16).toString("hex")) {
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt:${salt}:${hash}`;
}

export function verifyPassword(password, storedPassword) {
  const [scheme, salt, storedHash] = String(storedPassword).split(":");

  if (scheme !== "scrypt" || !salt || !storedHash) {
    return false;
  }

  const candidate = scryptSync(password, salt, 64);
  const expected = Buffer.from(storedHash, "hex");

  return candidate.length === expected.length && timingSafeEqual(candidate, expected);
}

export function signAccessToken(payload, secret = "development-secret") {
  const header = {
    alg: "HS256",
    typ: "JWT",
  };
  const issuedAt = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: issuedAt,
  };
  const encodedHeader = base64Url(JSON.stringify(header));
  const encodedPayload = base64Url(JSON.stringify(body));
  const signature = createHmac("sha256", secret)
    .update(`${encodedHeader}.${encodedPayload}`)
    .digest("base64url");

  return `${encodedHeader}.${encodedPayload}.${signature}`;
}

export function createAuthService({ tokenSecret = "development-secret" } = {}) {
  const ownersByEmail = new Map();

  function publicOwner(owner) {
    return {
      id: owner.id,
      fullName: owner.fullName,
      email: owner.email,
      role: owner.role,
      createdAt: owner.createdAt,
      updatedAt: owner.updatedAt,
    };
  }

  function authResponse(owner, status = 200) {
    return {
      ok: true,
      status,
      data: {
        owner: publicOwner(owner),
        accessToken: signAccessToken(
          {
            sub: owner.id,
            email: owner.email,
            role: owner.role,
          },
          tokenSecret,
        ),
        tokenType: "Bearer",
      },
    };
  }

  return {
    register(input) {
      const result = validateRegisterInput(input);

      if (!result.valid) {
        return {
          ok: false,
          status: 400,
          error: {
            code: "AUTH_VALIDATION_FAILED",
            message: "Registration input is invalid.",
            fields: result.errors,
          },
        };
      }

      if (ownersByEmail.has(result.data.email)) {
        return {
          ok: false,
          status: 409,
          error: {
            code: "OWNER_EMAIL_TAKEN",
            message: "An owner with this email already exists.",
          },
        };
      }

      const now = new Date().toISOString();
      const owner = {
        id: crypto.randomUUID(),
        fullName: result.data.fullName,
        email: result.data.email,
        passwordHash: hashPassword(result.data.password),
        role: "owner",
        createdAt: now,
        updatedAt: now,
      };

      ownersByEmail.set(owner.email, owner);

      return authResponse(owner, 201);
    },

    login(input) {
      const result = validateLoginInput(input);

      if (!result.valid) {
        return {
          ok: false,
          status: 400,
          error: {
            code: "AUTH_VALIDATION_FAILED",
            message: "Login input is invalid.",
            fields: result.errors,
          },
        };
      }

      const owner = ownersByEmail.get(result.data.email);

      if (!owner || !verifyPassword(result.data.password, owner.passwordHash)) {
        return {
          ok: false,
          status: 401,
          error: {
            code: "INVALID_CREDENTIALS",
            message: "Email or password is incorrect.",
          },
        };
      }

      return authResponse(owner);
    },
  };
}
