import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { McpServerModule } from "@nestjs-ai/mcp-server";
import { WeatherService } from "./weather.service.js";

@Module({
  imports: [
    NestAiModule.forRoot(),
    McpServerModule.forRoot({
      transport: "streamable-http",
      serverInfo: {
        name: "mcp-sampling-server-annotations",
        version: "0.0.1",
      },
      annotations: {
        enabled: true,
      },
      toolCallbacks: {
        enabled: false,
      },
    }),
  ],
  providers: [WeatherService],
})
export class AppModule {}
