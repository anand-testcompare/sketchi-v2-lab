import { cloudflare } from "@cloudflare/vite-plugin";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  publicDir: new URL("./public", import.meta.url).pathname,
  plugins: [
    cloudflare({
      configPath: new URL("./wrangler.jsonc", import.meta.url).pathname,
      viteEnvironment: {
        name: "ssr",
      },
    }),
    tanstackStart({
      srcDirectory: "apps/icons/src",
    }),
    react(),
  ],
});
