# NestJS AI MCP Starter Default Client

This sample ports the Spring AI MCP starter default client to NestJS AI. It connects to a Brave Search MCP server over stdio, asks a predefined question, and prints the response before exiting.

## Overview

The sample demonstrates:

- `@nestjs-ai/client-chat` for prompt execution
- `@nestjs-ai/mcp-client` for stdio MCP client setup from code
- `@nestjs-ai/model` for `ToolCallbackProvider`
- `@nestjs-ai/commons` for the standard chat and tool callback tokens
- Anthropic chat model integration through `@nestjs-ai/model-anthropic`
- A predefined question flow controlled by `AI_USER_INPUT`

## How It Works

1. `McpClientModule` starts the Brave Search MCP client through `npx`
2. `McpClientModule` discovers the available Brave Search tools
3. The resulting `ToolCallbackProvider` is attached to a `ChatClient`
4. The app asks a question from `AI_USER_INPUT` or a default prompt
5. The response is printed to the console and the app exits

## Configuration

Set the API key used by the chat model:

```bash
export ANTHROPIC_API_KEY=your-anthropic-key
```

Set the Brave API key used by the MCP server:

```bash
export BRAVE_API_KEY=your-brave-api-key
```

Optional model override:

```bash
export ANTHROPIC_MODEL=claude-4-sonnet-20250514
```

Optional question override:

```bash
export AI_USER_INPUT="Does Spring AI support MCP?"
```

The sample uses the Brave Search MCP server through stdio. If you want to mirror the Spring JSON config layout, use `mcp-servers-config.json` as the source of truth for the server definition.

## Running the Sample

```bash
pnpm install
pnpm start
```
