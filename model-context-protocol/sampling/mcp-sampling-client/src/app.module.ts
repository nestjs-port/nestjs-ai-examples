import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { McpClientModule } from "@nestjs-ai/mcp-client";
import { McpClientCustomizer } from "@nestjs-ai/mcp-common";
import { AnthropicPoemModule } from "./anthropic-poem.module.js";
import { OpenAiPoemModule } from "./openai-poem.module.js";
import { SamplingRunner } from "./sampling-runner.service.js";
import { WeatherSamplingCustomizer } from "./weather-sampling.customizer.js";

export const MCP_SERVER_CONNECTION_NAME = "mcp-sampling-server";

@Module({
  imports: [
    NestAiModule.forRoot(),
    McpClientModule.forRoot(
      {
        name: "mcp-sampling-client",
        version: "0.0.1",
        streamableHttp: {
          connections: {
            [MCP_SERVER_CONNECTION_NAME]: {
              url: "http://localhost:3000",
              endpoint: "/mcp",
            },
          },
        },
      },
      {
        customizerProvider: {
          provide: McpClientCustomizer,
          useClass: WeatherSamplingCustomizer,
        },
      },
    ),
    OpenAiPoemModule,
    AnthropicPoemModule,
  ],
  providers: [SamplingRunner],
  exports: [SamplingRunner],
})
export class AppModule {}
