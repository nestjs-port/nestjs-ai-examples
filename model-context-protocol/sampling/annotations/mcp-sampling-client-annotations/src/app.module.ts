import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { McpClientModule } from "@nestjs-ai/mcp-client";
import { AnthropicPoemModule } from "./anthropic-poem.module.js";
import { McpClientHandlers } from "./mcp-client-handlers.service.js";
import { OpenAiPoemModule } from "./openai-poem.module.js";
import { SamplingRunner } from "./sampling-runner.service.js";

export const MCP_SERVER_CONNECTION_NAME = "mcp-sampling-server-annotations";

@Module({
  imports: [
    NestAiModule.forRoot(),
    McpClientModule.forRoot({
      name: "mcp-sampling-client-annotations",
      version: "0.0.1",
      streamableHttp: {
        connections: {
          [MCP_SERVER_CONNECTION_NAME]: {
            url: "http://localhost:3000",
            endpoint: "/mcp",
          },
        },
      },
    }),
    OpenAiPoemModule,
    AnthropicPoemModule,
  ],
  providers: [McpClientHandlers, SamplingRunner],
  exports: [SamplingRunner],
})
export class AppModule {}
