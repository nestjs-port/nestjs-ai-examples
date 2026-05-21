# CLAUDE.md

This file provides guidance to Claude Code when working in this repository.

## Repository Overview

This repository contains NestJS AI example projects. Each sample is self-contained and lives in its own directory under `observation/`, `agentic-patterns/`, or `model-context-protocol/`.

The repository also contains `spring-ai-examples/` as a source reference tree. Treat it as read-only unless the task explicitly asks to port or compare against it.

## Build System and Commands

This repository uses `pnpm`. Most example projects have their own `package.json`, `pnpm-lock.yaml`, and `pnpm-workspace.yaml` files.

### Common Commands

Build the active project:

```bash
pnpm install
pnpm build
```

Run a sample:

```bash
pnpm start
```

Format the repository:

```bash
pnpm format
pnpm format:check
```

### Version Management

Check that `@nestjs-ai/*` and `@nestjs-port/*` versions are consistent across the repository:

```bash
pnpm check:versions
```

Update `@nestjs-ai/*` and `@nestjs-port/*` dependency versions and refresh affected lockfiles:

```bash
pnpm update:versions @nestjs-ai/client-chat=0.1.3 @nestjs-ai/model=0.1.4
```

The version management scripts live in `scripts/` and skip `spring-ai-examples/`.

## Architecture

### Module Structure

- Each example is a standalone NestJS application.
- Example projects generally follow `src/main.ts`, `src/app.module.ts`, and one or more runner/service files.
- MCP examples often include `mcp-servers-config.json` or `compose.yml` for external tool servers.

### Project Categories

**Observation (`observation/`):**

- OpenTelemetry and tracing samples.

**Agentic Patterns (`agentic-patterns/`):**

- Chain, parallelization, routing, orchestrator-workers, and evaluator-optimizer workflows.

**Model Context Protocol (`model-context-protocol/`):**

- MCP server and client examples, including sampling, annotations, SQLite, Brave Search, and gateway-based setups.

## Testing and Verification

Use the project-local build and install flow to verify changes:

```bash
pnpm install
pnpm build
```

For repository-wide checks, run:

```bash
pnpm check:versions
pnpm format:check
```

If a change touches multiple examples, verify each affected example directory independently.

## Development Notes

- Prefer the existing NestJS AI patterns already used in nearby examples.
- Keep edits scoped to the example or utility being changed.
- When porting from `spring-ai-examples/`, preserve behavior and adapt it to the local NestJS AI structure.
- Do not modify `spring-ai-examples/` unless the task explicitly asks for it.

## Commit Guidance

- Use concise conventional commit messages.
- Group related NestJS AI changes together.
- Exclude `spring-ai-examples/` unless the task explicitly includes it.
