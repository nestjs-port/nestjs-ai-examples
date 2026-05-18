import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { McpServerModule } from "@nestjs-ai/mcp-server";
import { WeatherToolsModule } from "./weather-tools.module.js";

@Module({
  imports: [
    NestAiModule.forRoot(),
    WeatherToolsModule,
    McpServerModule.forRoot({
      transport: "streamable-http",
      serverInfo: {
        name: "mcp-sampling-server",
        version: "0.0.1",
      },
      toolCallbacks: {
        enabled: true,
      },
    }),
  ],
})
export class AppModule {}
