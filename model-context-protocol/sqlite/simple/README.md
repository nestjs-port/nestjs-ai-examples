# NestJS AI MCP SQLite Simple

This sample ports the Spring AI SQLite `simple` example to NestJS AI. It connects to the SQLite MCP server over stdio, discovers the server tools, and runs a predefined set of database questions against the model.

## Overview

The sample demonstrates:

- `@nestjs-ai/client-chat` for prompt execution
- `@nestjs-ai/mcp-common` for `McpToolCallbackProvider`
- Direct MCP stdio transport through `@modelcontextprotocol/client`
- OpenAI chat model integration through `@nestjs-ai/model-openai`
- A predefined question flow that prints each answer to the console

## How It Works

1. The app starts an MCP client that launches `uvx mcp-server-sqlite --db-path test.db`
2. `McpToolCallbackProvider` discovers the available SQLite tools from the MCP server
3. The tool callbacks are attached to a `ChatClient`
4. The app asks four predefined questions in sequence
5. The process exits after the last answer is printed

## Configuration

Set the OpenAI API key used by the chat model:

```bash
export OPENAI_API_KEY=your-openai-key
```

Optional model override:

```bash
export OPENAI_MODEL=gpt-4o
```

## Sample Database

The sample expects a local `test.db` file in this directory.

Create it with:

```bash
./create-database.sh
```

The script creates a `products` table with sample rows so you can try questions about product listings, average price, price distribution, and order-table design.

## Running the Sample

```bash
pnpm install
pnpm start
```

## Additional Resources

- [NestJS AI Documentation](https://nestjs-port.github.io/nestjs-ai)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
