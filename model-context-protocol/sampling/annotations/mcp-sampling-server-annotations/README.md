# NestJS AI MCP Sampling Server Annotations

This package is the annotation-based NestJS AI translation of the Spring AI MCP sampling server example.

It exposes a weather tool via `@McpTool` and uses `@nestjs-ai/mcp-annotations` for annotation-driven registration.

## Run

```bash
pnpm install
pnpm start
```

The server listens on `http://localhost:3000` and exposes the MCP endpoint at `/mcp`.
