# API (`@repo/api`)

NestJS API. From the repository root, run `pnpm --filter @repo/api <script>`.

## Scripts

- `build` — `nest build`
- `deploy` — `nest deploy`
- `start` — `nest start`
- `dev` — `nest start --watch`
- `start:debug` — `nest start --debug --watch`
- `start:prod` — `node dist/main`
- `typecheck` — `tsc --noEmit`
- `test` — `vitest run`
- `test:watch` — `vitest`
- `test:e2e` — `vitest run --config ./vitest.config.e2e.ts`
- `test:cov` — `vitest run --coverage`
- `test:debug` — `vitest --inspect-brk --no-file-parallelism`
- `db:generate` — `drizzle-kit generate`
- `db:migrate` — `drizzle-kit migrate`
- `db:push` — `drizzle-kit push`
- `db:studio` — `drizzle-kit studio`

## Drizzle

PostgreSQL via `drizzle-orm` and `drizzle-kit`. `apps/api/drizzle.config.ts` sets dialect `postgresql`, schema `./src/database/schema/index.ts`, and output `./drizzle`. It reads `DATABASE_DIRECT_URL`, or `DATABASE_URL` when that is unset, from the monorepo root `.env`.

## Better Auth

Dependencies: `better-auth`, `@better-auth/drizzle-adapter`, and `@better-auth/expo`.

## Environment

`apps/api/.env.example` has sample values for `OCR_MONTHLY_LIMIT`, `TYPESAFE_API_KEY`, `OCR_TIMEOUT_MS`, `R2_DOWNLOAD_TTL_SECONDS`, `GOOGLE_ANDROID_CLIENT_ID`, and `GOOGLE_IOS_CLIENT_ID`.

On startup the API loads `.env` from the current working directory when that file exists.
