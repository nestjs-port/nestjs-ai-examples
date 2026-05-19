# NestJS AI MCP Sampling Examples - Decorator-Based Implementation

This directory contains the NestJS AI translation of the Spring AI annotation-based MCP Sampling examples. The runnable server port lives in [`./mcp-sampling-server-annotations`](./mcp-sampling-server-annotations/README.md), and the same end-to-end behavior is also available in the standard NestJS AI samples in [`../mcp-sampling-server`](../mcp-sampling-server/README.md) and [`../mcp-sampling-client`](../mcp-sampling-client/README.md).

## Project Structure

```text
annotations/
├── mcp-sampling-server-annotations/
├── mcp-sampling-client-annotations/
└── README.md
```

## Overview

The decorator-based NestJS AI flow demonstrates:

- Server-side tool registration with `@McpTool`
- Typed tool input validation with `zod`
- MCP Sampling on the server through `McpServerExchange`
- Client-side sampling handling through `McpClientCustomizer`
- Routing sampling requests to OpenAI and Anthropic based on model hints
- Combining weather data with creative responses from multiple LLMs

## What Maps To What

| Spring AI annotation example | NestJS AI equivalent                                                   |
| ---------------------------- | ---------------------------------------------------------------------- |
| `@McpTool`                   | `@McpTool` with `inputSchema` and typed `toolArguments`                |
| `@McpToolParam`              | `zod` schema fields on the tool input schema                           |
| `McpSyncServerExchange`      | `McpServerExchange` via the decorator callback `exchange` argument     |
| `@McpSampling`               | `McpClientCustomizer` with a `sampling/createMessage` request handler  |
| `@McpLogging`                | MCP client logging notifications can be handled inside the customizer  |
| `@McpProgress`               | MCP client progress notifications can be handled inside the customizer |
| `ToolCallbackProvider`       | `toolCallbacks.enabled: false` with annotation discovery enabled        |

## Server Side

The NestJS AI annotation-based server lives in [`./mcp-sampling-server-annotations`](./mcp-sampling-server-annotations/README.md). It exposes a weather tool and uses the MCP exchange when sampling is available.

```ts
@McpTool({
  description: "Get the temperature (in celsius) for a specific location",
  inputSchema: WEATHER_TOOL_INPUT_SCHEMA,
  returnMode: ReturnMode.TEXT,
})
async getTemperature({
  toolArguments,
  exchange,
}: McpToolMethodArgumentsFor<typeof WEATHER_TOOL_INPUT_SCHEMA>): Promise<string> {
  const { latitude, longitude } = toolArguments;
  const weatherResponse = await this.fetchWeather(latitude, longitude);
  return this.callMcpSampling(exchange, weatherResponse);
}
```

The sampling logic requests poems from OpenAI and Anthropic by setting model hints on `CreateMessageRequest`.

## Client Side

The NestJS AI annotation-based client lives in [`./mcp-sampling-client-annotations`](./mcp-sampling-client-annotations/README.md). It connects to the server, enables sampling support, and routes each request to the right chat model.

```ts
override customize(name: string, client: McpClient): void {
  if (name !== "mcp-sampling-server") {
    return;
  }

  client.registerCapabilities({
    sampling: {},
  });

  client.setRequestHandler("sampling/createMessage", async (request: CreateMessageRequest) => {
    const prompt = this.extractPrompt(request);
    const modelHint = this.extractModelHint(request);

    const poem = modelHint.includes("anthropic")
      ? await this.anthropicPoemService.generatePoem(prompt)
      : await this.openAiPoemService.generatePoem(prompt);

    return {
      role: "assistant",
      content: {
        type: "text",
        text: poem,
      },
      model: modelHint || "openai",
    };
  });
}
```

## Running The Example

1. Start the server:

   ```bash
   cd ./mcp-sampling-server-annotations
   npm run start
   ```

2. Set the required API keys:

   ```bash
   export OPENAI_API_KEY=your-openai-key
   export ANTHROPIC_API_KEY=your-anthropic-key
   ```

3. Run the client:

   ```bash
   cd ./mcp-sampling-client-annotations
   pnpm start
   ```

The client connects to `http://localhost:3000/mcp` and prints the combined weather and poem response.

## Configuration

The runnable NestJS AI samples use Streamable HTTP transport:

- Server name: `mcp-sampling-server-annotations`
- Server endpoint: `/mcp`
- Client connection URL: `http://localhost:3000/mcp`

## Additional Resources

- [NestJS AI MCP Sampling Server Annotations](./mcp-sampling-server-annotations/README.md)
- [NestJS AI MCP Sampling Client Annotations](./mcp-sampling-client-annotations/README.md)
- [NestJS AI MCP Sampling Server](../mcp-sampling-server/README.md)
- [NestJS AI MCP Sampling Client](../mcp-sampling-client/README.md)
- [NestJS AI Documentation](https://nestjs-port.github.io/nestjs-ai)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
