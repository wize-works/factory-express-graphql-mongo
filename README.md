# graphql-factory-mongo

> **Model‑first, code‑generated GraphQL API layer on MongoDB**  
> Runtime: **Express 5** + **graphql‑yoga v5** ‑— part of the WizeWorks ecosystem.

A drop‑in sibling to `@wizeworks/graphql-factory` for Postgres/Supabase, rewritten to leverage the official MongoDB driver, automatic tenant scoping, and dynamic schema hot‑reloads.

---

## Installation

```bash
npm install graphql-factory-mongo
# or
pnpm add graphql-factory-mongo
```

---

## Quick start

```ts
import { createFactoryServer } from 'graphql-factory-mongo';

createFactoryServer({
  mongoUri: process.env.MONGO_URI!,
  models: [__dirname + '/models'], // .ts or .json model definitions
}).listen(process.env.PORT ?? 3000, () => {
  console.log('🚀 API ready');
});
```

---

## Authentication

Every request **must** include a `wize-api-key` HTTP header.  The library hashes the key, locates the tenant record, verifies scopes, and injects that context into every resolver.

```bash
curl -H "wize-api-key: <your-raw-key>" \
     -H "Content-Type: application/json" \
     -d '{"query":"{ todos { count data { id title } } }"}' \
     http://localhost:3000/graphql
```

During resolver execution you can rely on:

```ts
ctx.auth = {
  tenantId: 'xxxxxxxxxxxxxxxxxxxxxxxx',
  scopes:   ['content:read', 'content:write']
};
```

All generated CRUD resolvers transparently add `{ tenantId: ctx.auth.tenantId }` to their Mongo queries, so data is always isolated per tenant.

---

## Roadmap

* Dynamic Schema Registry (hot‑reload models per tenant)
* Change‑stream based Subscriptions (`onXCreated`, `onXUpdated`, …)
* CLI scaffolder `create-graphql-factory-mongo`
* Pluggable rate‑limit middleware
* Coverage + Codecov badge

---

## License

MIT © WizeWorks

