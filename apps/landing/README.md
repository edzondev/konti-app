# Konti Landing (`@repo/landing`)

Sitio estático de marketing de Konti, construido con [Astro](https://astro.build). Dominio de producción: **https://konti.dev**.

## Comandos

Desde la raíz del monorepo:

```bash
pnpm --filter @repo/landing dev
pnpm --filter @repo/landing build
pnpm --filter @repo/landing preview
```

- `dev` — servidor de desarrollo local
- `build` — genera el sitio en `apps/landing/dist`
- `preview` — sirve el build de producción en local

## Página de marketing

La home sigue el diseño de `konti-demo-landing-0595`. Las secciones estáticas son componentes Astro. La única isla de React es el teléfono interactivo (`ProductDemo`), hidratada con `client:visible`. El menú móvil, el acordeón de preguntas y la entrada suave usan un script pequeño, sin React.

Para comprobarlo en local:

```bash
pnpm --filter @repo/landing dev
pnpm --filter @repo/landing build
pnpm --filter @repo/landing preview
```

En el dev server, revisa la home, `/privacidad/` y `/terminos/`. En la home, cambia las pestañas del teléfono, abre la captura de ejemplo y el menú en un viewport estrecho.

## Despliegue

El sitio es 100 % estático (HTML/CSS/JS en `dist`). No necesita runtime de servidor.

### Netlify

En la raíz del monorepo hay un `netlify.toml` con:

- **Build command:** `pnpm --filter @repo/landing build`
- **Publish directory:** `apps/landing/dist`
- **Node:** 24

Conecta el repositorio en Netlify apuntando a la raíz del monorepo; la config se aplica sola.

### Vercel

Crea un proyecto con raíz del monorepo y:

| Setting | Valor |
| --- | --- |
| Build Command | `pnpm --filter @repo/landing build` |
| Output Directory | `apps/landing/dist` |
| Install Command | `pnpm install` |
| Node.js Version | 24 |

Asigna el dominio personalizado `konti.dev` (no `konti.pe`).
