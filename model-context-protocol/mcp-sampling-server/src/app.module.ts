import { Module } from "@nestjs/common";
import { McpServerModule } from "@nestjs-ai/mcp-server";
import { WeatherService } from "./weather.service.js";

@Module({
  imports: [
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
