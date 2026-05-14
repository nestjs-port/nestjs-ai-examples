import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { McpServerModule } from "@nestjs-ai/mcp-server";
import { WeatherService } from "./weather.service.js";
import { ToolCallingModule } from "@nestjs-ai/model";

@Module({
  imports: [
    NestAiModule.forRoot(),
    ToolCallingModule,
    McpServerModule.forRoot({
      transport: "stdio",
      serverInfo: {
        name: "mcp-sampling-server",
        version: "0.0.1",
      },
      toolCallbacks: {
        enabled: true,
      },
    }),
  ],
  providers: [WeatherService],
})
export class AppModule {}
