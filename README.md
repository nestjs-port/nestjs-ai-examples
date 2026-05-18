# nestjs-ai-examples

A collection of NestJS AI examples.

## Projects

- `observation` - OpenTelemetry observation sample
- `agentic-patterns/chain-workflow` - A chain workflow that processes steps sequentially
- `agentic-patterns/parallelization-workflow` - A workflow that runs independent work in parallel
- `agentic-patterns/routing-workflow` - A workflow that classifies input and routes it to the right path
- `agentic-patterns/orchestrator-workers` - A workflow where an orchestrator breaks work apart and workers run in parallel
- `agentic-patterns/evaluator-optimizer` - A workflow that repeats generation and evaluation
- `model-context-protocol/mcp-sampling-server` - An MCP server that fetches weather data and delegates poem generation through sampling
- `model-context-protocol/mcp-sampling-client` - An MCP sampling client that routes server sampling requests to OpenAI and Anthropic

## Notes

- Each sample runs independently from its own directory.
- The examples in this repository were adapted from the original [spring-ai-examples](https://github.com/spring-projects/spring-ai-examples) repository.
