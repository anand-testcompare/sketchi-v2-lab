import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-vitest"],
  framework: {
    name: "@storybook/react-vite",
    options: {}
  },
  viteFinal: async (config) => {
    config.resolve ??= {};
    config.resolve.alias = {
      ...(config.resolve.alias ?? {}),
      "@sketchi/diagram-core": new URL(
        "../../diagram-core/src/index.ts",
        import.meta.url
      ).pathname,
      "@sketchi/diagram-renderer": new URL(
        "../../diagram-renderer/src/index.ts",
        import.meta.url
      ).pathname
    };

    return config;
  }
};

export default config;
