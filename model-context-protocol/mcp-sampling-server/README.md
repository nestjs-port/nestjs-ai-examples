# MCP Sampling Server

This sample ports the Spring AI `model-context-protocol/sampling/mcp-sampling-server` example to NestJS AI.
It keeps the server-side behavior: a weather tool fetches Open-Meteo data and, when the connected MCP client supports sampling, delegates poem generation back to that client.

## What It Shows

- `@McpTool`-based tool registration through `@nestjs-ai/mcp-annotations`
- MCP server bootstrap using the official `@modelcontextprotocol/server` SDK
- Server-side sampling delegation with `McpServerExchange.createMessage()`
- Model-hint routing for OpenAI and Anthropic sampling requests

## Prerequisites

- Node.js 22 or newer
- An MCP client that supports sampling
- Network access to `https://api.open-meteo.com`

## Install

Run this from `model-context-protocol/mcp-sampling-server`:

```bash
npm install
```

## Run

```bash
npm run start
```

The server runs over STDIO and waits for an MCP client to connect.

## Tool

The server exposes one tool:

- `getTemperature(latitude, longitude)` - fetches the current temperature for a location and, when sampling is available, combines OpenAI and Anthropic poem responses with the weather payload.

## Sampling Flow

1. The tool fetches the current weather from Open-Meteo.
2. The server checks whether the connected client advertises MCP sampling support.
3. If sampling is available, the server sends two `sampling/createMessage` requests:
   - one with the `openai` model hint
   - one with the `anthropic` model hint
4. The client routes each request to the matching chat model and returns a poem.
5. The server combines both poems with the weather response and returns the final text.

## Implementation Notes

- The tool implementation lives in `src/weather.service.ts`.
- The Nest bootstrap lives in `src/mcp-server.bootstrap.ts`.
- The server registers tools by scanning `@McpTool` metadata and wiring them into the MCP SDK server instance.
