# Architecture

## Product Model

Buznissy is a multi-tenant commerce platform. The platform owns the infrastructure, while each store owner manages their own storefront, products, services, orders, and bookings.

The core entities are:

- User
- Store
- Product
- Service
- Customer
- Cart
- Order
- Booking
- Payment
- File asset

## Recommended Production Stack

- Backend: Node.js with NestJS.
- Database: PostgreSQL.
- Customer storefront: Next.js.
- Owner/admin client: web dashboard first, React Native app later.
- File storage: S3-compatible bucket.
- Auth: JWT access tokens, refresh sessions, bcrypt password hashing.
- Payments: Thawani or other Oman-compatible payment provider.

Payment is intentionally mocked during the first MVP stage. The backend should expose payment-ready boundaries now, then connect the real provider after the storefront, orders, and bookings are stable.

## Repository Direction

The first baseline intentionally uses dependency-free Node.js so tests can run immediately on any machine. As soon as package management is working, the API can be migrated module by module into NestJS while preserving the same behavior and tests.

## Tenant Strategy

Every store should have a stable slug:

```text
https://buznissy.com/stores/al-noor
https://al-noor.buznissy.com
```

The database should enforce unique slugs. Frontend routing can support path-based stores first, then subdomains when production DNS is ready.
