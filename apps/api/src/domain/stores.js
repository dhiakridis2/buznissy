const VALID_STORE_CATEGORIES = new Set(["products", "services", "both"]);

export function slugifyStoreName(name) {
  return String(name)
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function validateStoreInput(input) {
  const errors = {};
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const category = typeof input?.category === "string" ? input.category.trim() : "";
  const description =
    typeof input?.description === "string" ? input.description.trim() : "";

  if (name.length < 2) {
    errors.name = "Store name must be at least 2 characters.";
  }

  if (!VALID_STORE_CATEGORIES.has(category)) {
    errors.category = "Category must be one of: products, services, both.";
  }

  if (description.length > 500) {
    errors.description = "Description must be 500 characters or fewer.";
  }

  return {
    data: {
      name,
      category,
      description,
      slug: slugifyStoreName(name),
    },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function createStoreService() {
  const storesBySlug = new Map();
  const productsByStoreSlug = new Map();
  const servicesByStoreSlug = new Map();
  const ordersByStoreSlug = new Map();
  const bookingsByStoreSlug = new Map();

  function requireStore(slug) {
    const storeSlug = String(slug).trim().toLowerCase();
    const store = storesBySlug.get(storeSlug);

    if (!store) {
      return {
        ok: false,
        status: 404,
        error: {
          code: "STORE_NOT_FOUND",
          message: "Store was not found.",
        },
      };
    }

    return {
      ok: true,
      store,
      slug: storeSlug,
    };
  }

  function createCollectionItem(collection, slug, input, validator, itemDefaults = {}) {
    const storeResult = requireStore(slug);

    if (!storeResult.ok) {
      return storeResult;
    }

    const validation = validator(input);

    if (!validation.valid) {
      return {
        ok: false,
        status: 400,
        error: {
          code: "VALIDATION_FAILED",
          message: "Input is invalid.",
          fields: validation.errors,
        },
      };
    }

    const now = new Date().toISOString();
    const item = {
      id: crypto.randomUUID(),
      storeSlug: storeResult.slug,
      ...itemDefaults,
      ...validation.data,
      createdAt: now,
      updatedAt: now,
    };

    const items = collection.get(storeResult.slug) || [];
    items.push(item);
    collection.set(storeResult.slug, items);

    return {
      ok: true,
      status: 201,
      data: item,
    };
  }

  return {
    create(input) {
      const result = validateStoreInput(input);

      if (!result.valid) {
        return {
          ok: false,
          status: 400,
          error: {
            code: "STORE_VALIDATION_FAILED",
            message: "Store input is invalid.",
            fields: result.errors,
          },
        };
      }

      if (storesBySlug.has(result.data.slug)) {
        return {
          ok: false,
          status: 409,
          error: {
            code: "STORE_SLUG_TAKEN",
            message: "A store with this slug already exists.",
          },
        };
      }

      const now = new Date().toISOString();
      const store = {
        id: crypto.randomUUID(),
        ...result.data,
        status: "active",
        createdAt: now,
        updatedAt: now,
      };

      storesBySlug.set(store.slug, store);

      return {
        ok: true,
        status: 201,
        data: store,
      };
    },

    findBySlug(slug) {
      const storeResult = requireStore(slug);

      if (!storeResult.ok) {
        return storeResult;
      }

      return {
        ok: true,
        status: 200,
        data: storeResult.store,
      };
    },

    list() {
      return Array.from(storesBySlug.values());
    },

    addProduct(slug, input) {
      return createCollectionItem(productsByStoreSlug, slug, input, validateProductInput, {
        status: "active",
      });
    },

    listProducts(slug) {
      const storeResult = requireStore(slug);

      if (!storeResult.ok) {
        return storeResult;
      }

      return {
        ok: true,
        status: 200,
        data: productsByStoreSlug.get(storeResult.slug) || [],
      };
    },

    addService(slug, input) {
      return createCollectionItem(servicesByStoreSlug, slug, input, validateServiceInput, {
        status: "active",
      });
    },

    listServices(slug) {
      const storeResult = requireStore(slug);

      if (!storeResult.ok) {
        return storeResult;
      }

      return {
        ok: true,
        status: 200,
        data: servicesByStoreSlug.get(storeResult.slug) || [],
      };
    },

    createOrder(slug, input) {
      return createCollectionItem(ordersByStoreSlug, slug, input, validateOrderInput, {
        status: "pending",
        paymentStatus: "not_required_for_mvp",
      });
    },

    createBooking(slug, input) {
      return createCollectionItem(bookingsByStoreSlug, slug, input, validateBookingInput, {
        status: "pending",
      });
    },

    createPaymentIntent(slug, input = {}) {
      const storeResult = requireStore(slug);

      if (!storeResult.ok) {
        return storeResult;
      }

      return {
        ok: true,
        status: 202,
        data: {
          id: crypto.randomUUID(),
          storeSlug: storeResult.slug,
          provider: input.provider || "placeholder",
          status: "payment_integration_pending",
          amount: Number(input.amount || 0),
          currency: input.currency || "OMR",
          message: "Payment is intentionally mocked for the MVP foundation.",
        },
      };
    },
  };
}

export function validateProductInput(input) {
  const errors = {};
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const description =
    typeof input?.description === "string" ? input.description.trim() : "";
  const price = Number(input?.price);
  const stock = Number.parseInt(input?.stock ?? "0", 10);

  if (name.length < 2) {
    errors.name = "Product name must be at least 2 characters.";
  }

  if (!Number.isFinite(price) || price < 0) {
    errors.price = "Price must be a positive number or zero.";
  }

  if (!Number.isInteger(stock) || stock < 0) {
    errors.stock = "Stock must be a positive integer or zero.";
  }

  return {
    data: {
      name,
      description,
      price,
      stock,
    },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function validateServiceInput(input) {
  const errors = {};
  const name = typeof input?.name === "string" ? input.name.trim() : "";
  const description =
    typeof input?.description === "string" ? input.description.trim() : "";
  const durationMinutes = Number.parseInt(input?.durationMinutes ?? "0", 10);
  const price = Number(input?.price);

  if (name.length < 2) {
    errors.name = "Service name must be at least 2 characters.";
  }

  if (![30, 60, 120].includes(durationMinutes)) {
    errors.durationMinutes = "Duration must be 30, 60, or 120 minutes.";
  }

  if (!Number.isFinite(price) || price < 0) {
    errors.price = "Price must be a positive number or zero.";
  }

  return {
    data: {
      name,
      description,
      durationMinutes,
      price,
    },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function validateOrderInput(input) {
  const errors = {};
  const customerName =
    typeof input?.customerName === "string" ? input.customerName.trim() : "";
  const customerEmail =
    typeof input?.customerEmail === "string" ? input.customerEmail.trim() : "";
  const items = Array.isArray(input?.items) ? input.items : [];

  if (customerName.length < 2) {
    errors.customerName = "Customer name must be at least 2 characters.";
  }

  if (!customerEmail.includes("@")) {
    errors.customerEmail = "Customer email must be valid.";
  }

  if (items.length === 0) {
    errors.items = "Order must include at least one item.";
  }

  return {
    data: {
      customerName,
      customerEmail,
      items,
      total: Number(input?.total || 0),
    },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}

export function validateBookingInput(input) {
  const errors = {};
  const customerName =
    typeof input?.customerName === "string" ? input.customerName.trim() : "";
  const phone = typeof input?.phone === "string" ? input.phone.trim() : "";
  const serviceId = typeof input?.serviceId === "string" ? input.serviceId.trim() : "";
  const date = typeof input?.date === "string" ? input.date.trim() : "";
  const time = typeof input?.time === "string" ? input.time.trim() : "";

  if (customerName.length < 2) {
    errors.customerName = "Customer name must be at least 2 characters.";
  }

  if (phone.length < 6) {
    errors.phone = "Phone must be at least 6 characters.";
  }

  if (!serviceId) {
    errors.serviceId = "Service is required.";
  }

  if (!date) {
    errors.date = "Date is required.";
  }

  if (!time) {
    errors.time = "Time is required.";
  }

  return {
    data: {
      customerName,
      phone,
      serviceId,
      date,
      time,
      notes: typeof input?.notes === "string" ? input.notes.trim() : "",
    },
    errors,
    valid: Object.keys(errors).length === 0,
  };
}
