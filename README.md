# konti-app

pnpm workspace (`pnpm@12.4.1`). Node `>=24`.

## Apps

- `apps/api` (`@repo/api`) — NestJS, Drizzle, and Better Auth
- `apps/mobile` (`@repo/mobile`) — Expo
- `apps/landing` (`@repo/landing`) — Astro

`packages/typescript-config` (`@repo/typescript-config`) is a shared TypeScript config.

## Scripts

From the repository root:

- `pnpm build` — `turbo run build`
- `pnpm dev` — `turbo run dev`
- `pnpm lint` — `biome lint .`
- `pnpm format` — `biome format --write .`
- `pnpm typecheck` — `turbo run typecheck`
- `pnpm test` — `turbo run test`
- `pnpm check` — `biome check . && turbo run typecheck`
- `pnpm check:write` — `biome check --write .`
- `pnpm build:api` — `turbo run build --filter=@repo/api`
- `pnpm start:api` — `pnpm --filter=@repo/api run start:prod`

Lint and format use Biome (`@biomejs/biome`).
