import { defineConfig } from "astro/config";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  site: "https://konti.dev",
  trailingSlash: "always",
  integrations: [react(), sitemap()],
  prefetch: true,
  vite: {
    plugins: [tailwindcss()],
    server: {
      // Cloudflare quick tunnels use *.trycloudflare.com (hostname changes each run)
      allowedHosts: [".trycloudflare.com"],
    },
  },
});
