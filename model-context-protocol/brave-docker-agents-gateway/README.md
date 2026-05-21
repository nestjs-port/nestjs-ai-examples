# NestJS AI MCP Brave Docker Agents Gateway Example

This sample ports the Spring AI Brave Search MCP gateway example to NestJS AI. It uses Docker MCP Gateway to expose Brave Search tools over SSE, and the NestJS application connects to that gateway before asking one predefined question and exiting.

<img src="nestjs-ai-mcp-brave-gateway.jpg" width="600"/>

## Overview

The sample demonstrates:

- `@nestjs-ai/client-chat` for prompt execution
- `@nestjs-ai/mcp-client` for streamable HTTP MCP client setup
- `@nestjs-ai/model` for `ToolCallbackProvider`
- `@nestjs-ai/commons` for the standard chat and tool callback tokens
- OpenAI chat model integration through `@nestjs-ai/model-openai`
- A predefined question flow that prints the answer to the console

## How It Works

1. Docker MCP Gateway starts the Brave Search MCP server from `compose.yml`
2. The gateway exposes the MCP server on `http://localhost:8811`
3. `McpClientModule` connects to that gateway with `streamableHttp`
4. The resulting `ToolCallbackProvider` is attached to a `ChatClient`
5. The app asks a single question and exits after printing the answer

## Configuration

Set the API key used by the chat model:

```bash
export OPENAI_API_KEY=your-openai-key
```

Optional model override:

```bash
export OPENAI_MODEL=gpt-4o
```

Set the Brave API key before starting Docker Compose:

```bash
export BRAVE_API_KEY=your-brave-api-key
docker compose up
```

## Running the Sample

Start the gateway first, then run the NestJS app from this directory:

```bash
pnpm install
pnpm start
```

## Additional Resources

- [NestJS AI Documentation](https://nestjs-port.github.io/nestjs-ai)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
