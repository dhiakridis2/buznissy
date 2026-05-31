# Buznissy

Buznissy is a Shopify-style multi-tenant commerce platform for store owners and customers.

The platform will let owners create stores, manage products/services, receive orders and bookings, and track basic analytics. Customers will visit each storefront, browse products/services, purchase items, and book services.

## Current Status

This repository is at the foundation stage. The first baseline contains:

- Project documentation.
- A small dependency-free API skeleton.
- Store creation domain logic.
- Automated tests using Node's built-in test runner.
- GitHub Actions CI.

## Project Shape

```text
apps/
  api/        Backend API foundation
  web/        Frontend MVP shell
docs/         Planning, architecture, workflow
.github/      CI workflow
```

## Local Commands

Run the API:

```bash
node apps/api/src/index.js
```

Run the frontend:

```bash
node apps/web/server.js
```

Run tests:

```bash
node --test
```

The API defaults to `http://localhost:4000`.
The frontend defaults to `http://localhost:3000`.

## First API Endpoints

- `GET /health`
- `POST /stores`
- `GET /stores/:slug`
- `POST /stores/:slug/products`
- `GET /stores/:slug/products`
- `POST /stores/:slug/services`
- `GET /stores/:slug/services`
- `POST /stores/:slug/orders`
- `POST /stores/:slug/bookings`
- `POST /stores/:slug/payment-intents`

Example store creation payload:

```json
{
  "name": "Al Noor Gifts",
  "category": "products",
  "description": "Gifts and handmade items from Oman"
}
```

## Team Workflow

- Keep `main` stable.
- Create a branch for each feature.
- Open a pull request for review.
- Add or update tests for every feature.
- Do not merge unless tests pass.

More detail is in [docs/development-workflow.md](docs/development-workflow.md).
