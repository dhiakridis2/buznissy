import { createServer as createHttpServer } from "node:http";
import { createStoreService } from "./domain/stores.js";
import { readJsonBody, sendCors, sendJson } from "./http/json.js";

export function createApiServer({ storeService = createStoreService() } = {}) {
  return createHttpServer(async (request, response) => {
    const url = new URL(request.url, "http://localhost");

    try {
      if (request.method === "OPTIONS") {
        sendCors(response);
        response.writeHead(204);
        response.end();
        return;
      }

      if (request.method === "GET" && url.pathname === "/health") {
        return sendJson(response, 200, {
          status: "ok",
          service: "buznissy-api",
        });
      }

      if (request.method === "POST" && url.pathname === "/stores") {
        const payload = await readJsonBody(request);
        const result = storeService.create(payload);
        return sendJson(response, result.status, result.ok ? result.data : result.error);
      }

      const pathParts = url.pathname.split("/").filter(Boolean);

      if (request.method === "GET" && pathParts[0] === "stores" && pathParts.length === 2) {
        const slug = decodeURIComponent(pathParts[1] || "");
        const result = storeService.findBySlug(slug);
        return sendJson(response, result.status, result.ok ? result.data : result.error);
      }

      const storeResourceMatch = url.pathname.match(
        /^\/stores\/([^/]+)\/(products|services|orders|bookings|payment-intents)$/,
      );

      if (storeResourceMatch) {
        const slug = decodeURIComponent(storeResourceMatch[1]);
        const resource = storeResourceMatch[2];

        if (request.method === "GET" && resource === "products") {
          const result = storeService.listProducts(slug);
          return sendJson(response, result.status, result.ok ? result.data : result.error);
        }

        if (request.method === "GET" && resource === "services") {
          const result = storeService.listServices(slug);
          return sendJson(response, result.status, result.ok ? result.data : result.error);
        }

        if (request.method === "POST") {
          const payload = await readJsonBody(request);
          const action = {
            products: () => storeService.addProduct(slug, payload),
            services: () => storeService.addService(slug, payload),
            orders: () => storeService.createOrder(slug, payload),
            bookings: () => storeService.createBooking(slug, payload),
            "payment-intents": () => storeService.createPaymentIntent(slug, payload),
          }[resource];
          const result = action();
          return sendJson(response, result.status, result.ok ? result.data : result.error);
        }
      }

      return sendJson(response, 404, {
        code: "ROUTE_NOT_FOUND",
        message: "Route was not found.",
      });
    } catch (error) {
      return sendJson(response, error.status || 500, {
        code: error.code || "INTERNAL_SERVER_ERROR",
        message: error.message || "Something went wrong.",
      });
    }
  });
}
