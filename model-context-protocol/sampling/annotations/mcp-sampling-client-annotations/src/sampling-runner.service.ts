import { Inject, Injectable } from "@nestjs/common";
import { MCP_CLIENT_REGISTRATIONS_TOKEN } from "@nestjs-ai/mcp-client";
import type { Client as McpClient } from "@modelcontextprotocol/client";
import type { McpClientRegistration } from "@nestjs-ai/mcp-client";

interface WeatherToolResult {
  content: Array<
    | {
        type: "text";
        text: string;
      }
    | {
        type: string;
        [key: string]: unknown;
      }
  >;
}

@Injectable()
export class SamplingRunner {
  constructor(
    @Inject(MCP_CLIENT_REGISTRATIONS_TOKEN)
    private readonly clientRegistrations: McpClientRegistration[],
  ) {}

  async run(): Promise<void> {
    const client = this.getConnectedClient("mcp-sampling-server-annotations");
    const result = (await client.callTool({
      name: "getTemperature",
      arguments: {
        latitude: 52.3676,
        longitude: 4.9041,
      },
    })) as WeatherToolResult;

    const output = result.content
      .map((block) => ("text" in block ? block.text : JSON.stringify(block)))
      .join("\n");

    console.log(output);
  }

  private getConnectedClient(clientName: string): McpClient {
    const registration = this.clientRegistrations.find((entry) => entry.clientName === clientName);

    if (registration == null) {
      throw new Error(`MCP client "${clientName}" is not connected`);
    }

    return registration.mcpClient;
  }
}
