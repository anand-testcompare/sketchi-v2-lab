import { spawn } from "node:child_process";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

import {
  parseCliOptions,
  resolveGeneratorCommand,
  usage,
} from "./lib/cli-options.js";
import { buildScenarioPrompt } from "./lib/prompt.js";
import {
  evaluateScenarioDiagram,
  evaluateScenarioFixture,
  evaluateScenarioOutput,
} from "./lib/evaluate.js";
import {
  type DiagramScenario,
  flowchartScenarios,
  getScenario,
} from "./lib/scenarios.js";

function runCommand(command: string, stdin: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, {
      shell: true,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const stdout: Buffer[] = [];
    const stderr: Buffer[] = [];

    child.stdout.on("data", (chunk: Buffer) => stdout.push(chunk));
    child.stderr.on("data", (chunk: Buffer) => stderr.push(chunk));
    child.on("error", reject);
    child.on("close", (code) => {
      const output = Buffer.concat(stdout).toString("utf8");
      if (code === 0) {
        resolve(output);
        return;
      }

      reject(
        new Error(
          `Generator command exited with ${code}.\n${Buffer.concat(stderr).toString("utf8")}`,
        ),
      );
    });

    child.stdin.end(stdin);
  });
}

async function writeJson(filePath: string, value: unknown): Promise<void> {
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, `${JSON.stringify(value, null, 2)}\n`);
}

function outputPathForScenario(input: {
  out: string | undefined;
  outDir: string | undefined;
  scenarioId: string;
}): string | undefined {
  if (input.outDir) {
    return path.join(input.outDir, `${input.scenarioId}.excalidraw`);
  }

  return input.out;
}

async function evaluateScenario(
  scenario: DiagramScenario,
  input: {
    generatorCommand: string | undefined;
    input: string | undefined;
    useFixture: boolean;
  },
) {
  if (input.useFixture) {
    return evaluateScenarioFixture(scenario);
  }

  if (input.input) {
    return evaluateScenarioDiagram(
      scenario,
      JSON.parse(await readFile(input.input, "utf8")),
    );
  }

  if (input.generatorCommand) {
    return evaluateScenarioOutput(
      scenario,
      await runCommand(input.generatorCommand, buildScenarioPrompt(scenario)),
    );
  }

  return null;
}

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  if (options.list) {
    console.log(
      JSON.stringify(
        flowchartScenarios.map((scenario) => ({
          id: scenario.id,
          title: scenario.title,
          description: scenario.description,
          difficulty: scenario.difficulty,
          tags: scenario.tags,
        })),
        null,
        2,
      ),
    );
    return;
  }

  if (options.all && options.input) {
    throw new Error("--input can only be used with one --scenario.");
  }

  if (options.all && options.out) {
    throw new Error(
      "--out can only be used with one --scenario. Use --out-dir for --all.",
    );
  }

  if (!options.all && !options.scenarioId) {
    throw new Error(`Missing --scenario.\n\n${usage()}`);
  }

  const scenarios = options.all
    ? flowchartScenarios
    : [getScenario(options.scenarioId ?? "")];
  const generatorCommand = resolveGeneratorCommand(options);
  const results = [];

  if (!options.useFixture && !options.input && !generatorCommand) {
    throw new Error(
      `Choose --fixture, --input, or --generator-command.\n\n${usage()}`,
    );
  }

  for (const scenario of scenarios) {
    const result = await evaluateScenario(scenario, {
      generatorCommand,
      input: options.input,
      useFixture: options.useFixture,
    });

    if (!result) {
      throw new Error(
        `Choose --fixture, --input, or --generator-command.\n\n${usage()}`,
      );
    }

    const out = outputPathForScenario({
      out: options.out,
      outDir: options.outDir,
      scenarioId: scenario.id,
    });

    if (out) {
      await writeJson(out, result.excalidrawScene);
    }

    results.push({
      scenarioId: result.scenarioId,
      ok: result.ok,
      checks: result.checks,
      excalidrawIssues: result.excalidrawValidation.issues,
      out,
    });
  }

  const ok = results.every((result) => result.ok);
  const output = options.all
    ? {
        ok,
        scenarioCount: results.length,
        failedScenarioIds: results
          .filter((result) => !result.ok)
          .map((result) => result.scenarioId),
        results,
      }
    : results[0];

  console.log(JSON.stringify(output, null, 2));

  if (!ok) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
