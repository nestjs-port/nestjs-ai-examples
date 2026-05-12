import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import { McpToolProvider } from "@nestjs-ai/mcp-annotations";
import { McpServer, StdioServerTransport } from "@modelcontextprotocol/server";
import { WeatherService } from "./weather.service.js";

@Injectable()
export class McpServerBootstrap implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(McpServerBootstrap.name);
  private readonly weatherService = new WeatherService();
  private readonly server = new McpServer({
    name: "mcp-sampling-server",
    version: "0.0.1",
  });

  private readonly transport = new StdioServerTransport();

  async onModuleInit(): Promise<void> {
    const toolProvider = new McpToolProvider({
      toolObjects: [this.weatherService],
      mcpServer: this.server,
    });

    for (const registration of toolProvider.getToolRegistrations()) {
      const [name, config, callback] = registration;
      this.server.registerTool(name, config, callback as never);
    }

    await this.server.connect(this.transport);
    this.logger.log("MCP sampling server is listening on stdio");
  }

  async onModuleDestroy(): Promise<void> {
    await this.server.close();
  }
}
