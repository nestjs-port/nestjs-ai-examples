/*
 * Copyright 2026 The NestJS AI Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Inject, Injectable } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import { CHAT_CLIENT_BUILDER_TOKEN } from "@nestjs-ai/commons";
import { McpToolCallbackProvider } from "@nestjs-ai/mcp-common";
import { Client as McpClient, StdioClientTransport } from "@modelcontextprotocol/client";
import path from "node:path";

@Injectable()
export class SqliteSimpleRunner {
  constructor(
    @Inject(CHAT_CLIENT_BUILDER_TOKEN)
    private readonly chatClientBuilder: ChatClient.Builder,
  ) {}

  async run(): Promise<void> {
    const mcpClient = await this.createMcpClient();

    try {
      const toolCallbacks = await McpToolCallbackProvider.builder()
        .addMcpClient(mcpClient)
        .build()
        .getToolCallbacks();

      const chatClient = this.chatClientBuilder.defaultToolCallbacks(toolCallbacks).build();

      const questions = [
        "Can you connect to my SQLite database and tell me what products are available, and their prices?",
        "What's the average price of all products in the database?",
        "Can you analyze the price distribution and suggest any pricing optimizations?",
        "Could you help me design and create a new table for storing customer orders?",
      ];

      console.log("Running predefined questions with AI model responses:\n");

      for (const [index, question] of questions.entries()) {
        if (index > 0) {
          console.log("");
        }

        console.log(`QUESTION: ${question}`);
        const response = await chatClient.prompt(question).call().content();
        console.log(`ASSISTANT: ${response ?? ""}`);
      }

      console.log("\nPredefined questions completed. Exiting application.");
    } finally {
      await mcpClient.close();
    }
  }

  private async createMcpClient(): Promise<McpClient> {
    const dbPath = path.join(process.cwd(), "test.db");
    const mcpClient = new McpClient({
      name: "sqlite-simple",
      version: "0.0.1",
    });

    await mcpClient.connect(
      new StdioClientTransport({
        command: "uvx",
        args: ["mcp-server-sqlite", "--db-path", dbPath],
      }),
    );

    console.log("MCP Initialized: connected to SQLite MCP server");
    return mcpClient;
  }
}
