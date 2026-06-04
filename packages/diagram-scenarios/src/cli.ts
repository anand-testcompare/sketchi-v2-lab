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
import { flowchartScenarios, getScenario } from "./lib/scenarios.js";

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

async function main() {
  const options = parseCliOptions(process.argv.slice(2));

  if (options.list) {
    console.log(
      JSON.stringify(
        flowchartScenarios.map((scenario) => ({
          id: scenario.id,
          title: scenario.title,
          description: scenario.description,
        })),
        null,
        2,
      ),
    );
    return;
  }

  if (!options.scenarioId) {
    throw new Error(`Missing --scenario.\n\n${usage()}`);
  }

  const scenario = getScenario(options.scenarioId);
  const generatorCommand = resolveGeneratorCommand(options);
  const result = options.useFixture
    ? evaluateScenarioFixture(scenario)
    : options.input
      ? evaluateScenarioDiagram(
          scenario,
          JSON.parse(await readFile(options.input, "utf8")),
        )
      : generatorCommand
        ? evaluateScenarioOutput(
            scenario,
            await runCommand(
              generatorCommand,
              buildScenarioPrompt(scenario),
            ),
          )
        : null;

  if (!result) {
    throw new Error(`Choose --fixture, --input, or --generator-command.\n\n${usage()}`);
  }

  if (options.out) {
    await writeJson(options.out, result.excalidrawScene);
  }

  console.log(
    JSON.stringify(
      {
        scenarioId: result.scenarioId,
        ok: result.ok,
        checks: result.checks,
        excalidrawIssues: result.excalidrawValidation.issues,
        out: options.out,
      },
      null,
      2,
    ),
  );

  if (!result.ok) {
    process.exitCode = 1;
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
