# NestJS AI Model Context Protocol - SQLite Chatbot

This sample ports the Spring AI SQLite chatbot example to NestJS AI. It connects to the SQLite MCP server over stdio, discovers the server tools with `@nestjs-ai/mcp-common`, and runs an interactive CLI chat session against the database.

## Overview

The sample demonstrates:

- `@nestjs-ai/mcp-common` for `McpToolCallbackProvider`
- Direct MCP stdio transport through `@modelcontextprotocol/client`
- OpenAI chat model integration through `@nestjs-ai/model-openai`
- Chat memory using `MessageWindowChatMemory`
- An interactive command-line chatbot that can query and modify SQLite data

## How It Works

1. The app starts an MCP client that launches `uvx mcp-server-sqlite --db-path test.db`
2. `McpToolCallbackProvider` discovers the available SQLite tools from the MCP server
3. The tool callbacks are attached to a `ChatClient`
4. A `MessageChatMemoryAdvisor` keeps the conversation context across turns
5. The user can ask database questions until typing `exit`

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

The chatbot expects a local `test.db` file in this directory.

Create it with:

```bash
./create-database.sh
```

The script creates a `PRODUCTS` table with sample rows so you can try questions like:

- "What products are available?"
- "What is the average price?"
- "Can you create a new orders table?"

## Running the Sample

```bash
pnpm install
pnpm start
```

## Additional Resources

- [NestJS AI Documentation](https://nestjs-port.github.io/nestjs-ai)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
