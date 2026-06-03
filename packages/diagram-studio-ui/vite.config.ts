import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: "packages/diagram-studio-ui/src/index.ts",
      formats: ["es"],
      fileName: "index"
    },
    rollupOptions: {
      external: [
        "react",
        "react-dom",
        "@sketchi/diagram-core",
        "@sketchi/diagram-excalidraw",
        "@sketchi/diagram-renderer"
      ]
    }
  },
  resolve: {
    alias: {
      "@sketchi/diagram-core": new URL(
        "../diagram-core/src/index.ts",
        import.meta.url
      ).pathname,
      "@sketchi/diagram-excalidraw": new URL(
        "../diagram-excalidraw/src/index.ts",
        import.meta.url
      ).pathname,
      "@sketchi/diagram-renderer": new URL(
        "../diagram-renderer/src/index.ts",
        import.meta.url
      ).pathname
    }
  }
});
