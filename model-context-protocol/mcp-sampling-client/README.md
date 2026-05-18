# NestJS AI MCP Sampling Client

This sample shows how to implement the MCP sampling client side with NestJS AI. It connects to the existing `mcp-sampling-server` sample over Streamable HTTP, receives sampling requests from the server, and routes them to different chat models based on the model hint.

For the matching server example, see [mcp-sampling-server](../mcp-sampling-server/README.md).

## Overview

The sample demonstrates:

- `@nestjs-ai/mcp-client` for Streamable HTTP MCP connections
- `@nestjs-ai/mcp-common` for the `McpClientCustomizer` that registers the sampling handler
- Separate OpenAI and Anthropic chat model modules
- Model routing by the MCP `modelPreferences.hints[0].name` value
- A bootstrap that triggers the weather tool so the sampling path runs end to end

## How It Works

1. The client connects to the MCP server at `http://localhost:3000/mcp`
2. The bootstrap invokes the server's `getTemperature` tool
3. The server requests sampling for OpenAI and Anthropic model hints
4. The client handles each sampling request with the matching chat model through a client customizer
5. The server combines the returned poems and sends the final result back

## Configuration

Set the API keys used by the chat models:

```bash
export OPENAI_API_KEY=your-openai-key
export ANTHROPIC_API_KEY=your-anthropic-key
```

Optional model overrides:

```bash
export OPENAI_MODEL=gpt-4o
export ANTHROPIC_MODEL=claude-haiku-4-5
```

## Running the Sample

1. Start the server first:

   ```bash
   cd ../mcp-sampling-server
   npm run start
   ```

2. Run the client:

   ```bash
   cd ../mcp-sampling-client
   npm run start
   ```

The client prints the server response after the sampling exchange completes.

## Additional Resources

- [NestJS AI Documentation](https://docs.nestjs.ai/)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
