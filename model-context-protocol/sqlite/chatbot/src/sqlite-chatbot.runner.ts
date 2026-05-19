import { Injectable } from "@nestjs/common";
import { ChatClient, MessageChatMemoryAdvisor } from "@nestjs-ai/client-chat";
import {
  InMemoryChatMemoryRepository,
  MessageWindowChatMemory,
  type ChatModel,
} from "@nestjs-ai/model";
import { McpToolCallbackProvider } from "@nestjs-ai/mcp-common";
import { InjectChatModel } from "@nestjs-ai/platform";
import { Client as McpClient, StdioClientTransport } from "@modelcontextprotocol/client";
import path from "node:path";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

@Injectable()
export class SqliteChatbotRunner {
  constructor(@InjectChatModel() private readonly chatModel: ChatModel) {}

  async run(): Promise<void> {
    const mcpClient = await this.createMcpClient();

    try {
      const toolCallbacks = await McpToolCallbackProvider.builder()
        .addMcpClient(mcpClient)
        .build()
        .getToolCallbacks();

      const chatMemory = new MessageWindowChatMemory({
        chatMemoryRepository: new InMemoryChatMemoryRepository(),
      });

      const chatClient = ChatClient.create(this.chatModel)
        .mutate()
        .defaultToolCallbacks(toolCallbacks)
        .defaultAdvisors(new MessageChatMemoryAdvisor({ chatMemory }))
        .build();

      const rl = readline.createInterface({ input, output });

      try {
        console.log("\nStarting interactive chat session. Type 'exit' to quit.");

        while (true) {
          const userInput = await rl.question("\nUSER: ");

          if (userInput.trim().toLowerCase() === "exit") {
            console.log("Ending chat session.");
            break;
          }

          const response = await chatClient.prompt(userInput).call().content();
          console.log(`ASSISTANT: ${response ?? ""}`);
        }
      } finally {
        rl.close();
      }
    } finally {
      await mcpClient.close();
    }
  }

  private async createMcpClient(): Promise<McpClient> {
    const dbPath = path.join(process.cwd(), "test.db");
    const mcpClient = new McpClient({
      name: "sqlite-chatbot",
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
