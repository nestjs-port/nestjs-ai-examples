import { Module } from "@nestjs/common";
import { McpServerBootstrap } from "./mcp-server.bootstrap.js";

@Module({
  providers: [McpServerBootstrap],
})
export class AppModule {}
