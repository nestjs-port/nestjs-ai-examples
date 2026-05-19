# nestjs-ai-examples

A collection of NestJS AI examples.

## Projects

### Observation

- `observation` - OpenTelemetry observation sample

### Agentic Patterns

- `agentic-patterns/chain-workflow` - A chain workflow that processes steps sequentially
- `agentic-patterns/parallelization-workflow` - A workflow that runs independent work in parallel
- `agentic-patterns/routing-workflow` - A workflow that classifies input and routes it to the right path
- `agentic-patterns/orchestrator-workers` - A workflow where an orchestrator breaks work apart and workers run in parallel
- `agentic-patterns/evaluator-optimizer` - A workflow that repeats generation and evaluation

### Model Context Protocol

- `model-context-protocol/sampling/mcp-sampling-server` - An MCP server that fetches weather data and delegates poem generation through sampling
- `model-context-protocol/sampling/mcp-sampling-client` - An MCP sampling client that routes server sampling requests to OpenAI and Anthropic
- `model-context-protocol/sampling/annotations` - Decorator-based MCP sampling examples with runnable server and client variants
- `model-context-protocol/sampling/annotations/mcp-sampling-server-annotations` - A decorator-based MCP sampling server that uses `@McpTool`
- `model-context-protocol/sampling/annotations/mcp-sampling-client-annotations` - A decorator-based MCP sampling client that routes requests by model hint
- `model-context-protocol/sqlite/simple` - A predefined-question SQLite sample that runs through the database analysis flow
- `model-context-protocol/sqlite/chatbot` - An interactive SQLite chatbot that discovers MCP tools from a local SQLite server

## Notes

- Each sample runs independently from its own directory.
- The examples in this repository were adapted from the original [spring-ai-examples](https://github.com/spring-projects/spring-ai-examples) repository.
