import { describe, expect, it } from "vitest";

import { parseCliOptions, resolveGeneratorCommand } from "./cli-options";

describe("scenario CLI options", () => {
  it("keeps a direct multiword generator command together", () => {
    const options = parseCliOptions([
      "--scenario",
      "sketchi-onboarding-decision-flow",
      "--generator-command",
      "opencode",
      "run",
      "--model",
      "gpt-5",
    ]);

    expect(options.generatorCommand).toBe("opencode run --model gpt-5");
  });

  it("parses all-scenario regression output options", () => {
    const options = parseCliOptions([
      "--all",
      "--fixture",
      "--out-dir",
      ".memory/scenarios",
    ]);

    expect(options).toEqual(
      expect.objectContaining({
        all: true,
        outDir: ".memory/scenarios",
        useFixture: true,
      }),
    );
  });

  it("resolves the default generator command environment variable", () => {
    const options = parseCliOptions([
      "--scenario",
      "sketchi-onboarding-decision-flow",
    ]);

    expect(
      resolveGeneratorCommand(options, {
        SKETCHI_GENERATOR_COMMAND: "opencode run",
      }),
    ).toBe("opencode run");
  });

  it("requires explicitly named generator command environment variables", () => {
    const options = parseCliOptions([
      "--scenario",
      "sketchi-onboarding-decision-flow",
      "--generator-command-env",
      "CUSTOM_PROVIDER_COMMAND",
    ]);

    expect(() => resolveGeneratorCommand(options, {})).toThrow(
      'Environment variable "CUSTOM_PROVIDER_COMMAND" is empty or unset.',
    );
  });
});
