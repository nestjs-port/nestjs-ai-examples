import { mkdirSync, createWriteStream } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { spawn, spawnSync } from "node:child_process";
import type { ChildProcess } from "node:child_process";
import { setTimeout as delay } from "node:timers/promises";

const CLIENT_DIR = dirname(fileURLToPath(import.meta.url));
const SERVER_DIR = resolve(CLIENT_DIR, "..", "..", "mcp-sampling-server");
const LOG_DIR = resolve(CLIENT_DIR, "logs");
const PORT = 3000;
const SERVER_URL = `http://127.0.0.1:${PORT}/mcp`;
const npmCommand = process.platform === "win32" ? "npm.cmd" : "npm";

async function main(): Promise<void> {
  requireApiKeys();
  mkdirSync(LOG_DIR, { recursive: true });

  console.log(`Client directory: ${resolve(CLIENT_DIR, "..")}`);
  console.log(`Server directory: ${SERVER_DIR}`);
  console.log(`Log directory: ${LOG_DIR}`);

  runCommand(npmCommand, ["run", "build"], SERVER_DIR);

  const serverLogPath = resolve(LOG_DIR, `server-${Date.now()}.log`);
  const server = startServer(serverLogPath);

  try {
    await waitForServer();

    runCommand(npmCommand, ["run", "build"], resolve(CLIENT_DIR, ".."));

    const clientLogPath = resolve(LOG_DIR, `client-${Date.now()}.log`);
    const output = await runClient(clientLogPath);

    assertContains(output, "OpenAI poem about the weather:");
    assertContains(output, "Anthropic poem about the weather:");
    assertContains(output, "Handling sampling request for hint \"openai\"");
    assertContains(output, "Handling sampling request for hint \"anthropic\"");

    console.log("Integration test completed successfully.");
    console.log(`Server log: ${serverLogPath}`);
    console.log(`Client log: ${clientLogPath}`);
  } finally {
    await stopProcess(server);
  }
}

function requireApiKeys(): void {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is required to run the integration test");
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    throw new Error("ANTHROPIC_API_KEY is required to run the integration test");
  }
}

function runCommand(command: string, args: string[], cwd: string): void {
  const result = spawnSync(command, args, {
    cwd,
    encoding: "utf8",
    stdio: "inherit",
  });

  if (result.error != null || result.status !== 0) {
    throw new Error(`Command failed: ${command} ${args.join(" ")}`);
  }
}

function startServer(logPath: string): ChildProcess {
  const logStream = createWriteStream(logPath, { flags: "a" });
  const child = spawn(npmCommand, ["run", "start:prod"], {
    cwd: SERVER_DIR,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  child.stdout?.on("data", (chunk: Buffer) => {
    process.stdout.write(chunk);
    logStream.write(chunk);
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    process.stderr.write(chunk);
    logStream.write(chunk);
  });

  child.on("exit", () => {
    logStream.end();
  });

  return child;
}

async function waitForServer(): Promise<void> {
  const deadline = Date.now() + 60_000;

  while (Date.now() < deadline) {
    try {
      const response = await fetch(SERVER_URL);

      if (response != null) {
        return;
      }
    } catch {
      // keep waiting
    }

    await delay(500);
  }

  throw new Error(`Timed out waiting for the server at ${SERVER_URL}`);
}

async function runClient(logPath: string): Promise<string> {
  const logStream = createWriteStream(logPath, { flags: "a" });
  const child = spawn(npmCommand, ["run", "start:prod"], {
    cwd: CLIENT_DIR,
    env: process.env,
    stdio: ["ignore", "pipe", "pipe"],
  });

  let output = "";

  child.stdout?.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf8");
    output += text;
    process.stdout.write(chunk);
    logStream.write(chunk);
  });

  child.stderr?.on("data", (chunk: Buffer) => {
    const text = chunk.toString("utf8");
    output += text;
    process.stderr.write(chunk);
    logStream.write(chunk);
  });

  const exitCode = await new Promise<number>((resolve, reject) => {
    child.once("error", reject);
    child.once("exit", (code: number | null, signal: NodeJS.Signals | null) => {
      if (signal != null) {
        reject(new Error(`Client exited with signal ${signal}`));
        return;
      }

      resolve(code ?? 0);
    });
  });

  logStream.end();

  if (exitCode !== 0) {
    throw new Error(`Client exited with code ${exitCode}`);
  }

  return output;
}

async function stopProcess(child: ChildProcess): Promise<void> {
  if (child.killed || child.exitCode != null || child.signalCode != null) {
    return;
  }

  child.kill("SIGTERM");

  await Promise.race([
    new Promise<void>((resolve) => child.once("exit", () => resolve())),
    delay(5_000).then(() => {
      if (child.exitCode == null) {
        child.kill("SIGKILL");
      }
    }),
  ]);
}

function assertContains(haystack: string, needle: string): void {
  if (!haystack.includes(needle)) {
    throw new Error(`Expected output to include: ${needle}`);
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
