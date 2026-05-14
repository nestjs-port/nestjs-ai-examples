# NestJS AI MCP Sampling Server

This sample project demonstrates how to create an MCP server using NestJS AI. It implements a weather service that exposes a tool for retrieving weather information from the Open-Meteo API and showcases MCP Sampling capabilities.

For more information, see the [Model Context Protocol specification](https://modelcontextprotocol.github.io/specification/).

## Overview

The sample showcases:

- Integration with `@nestjs-ai/mcp-server`
- STDIO transport for MCP clients
- Automatic tool registration using NestJS AI's `@Tool` annotation
- MCP Sampling implementation that demonstrates LLM provider routing
- Weather tool that retrieves temperature data and generates creative responses using multiple LLMs

## MCP Sampling Implementation

This project demonstrates MCP Sampling, which allows an MCP server to delegate certain requests to LLM providers. The implementation includes:

1. Server-side sampling: the `WeatherService` class implements a `callMcpSampling` method that:
   - Extracts the `McpServerExchange` from the tool context
   - Creates two separate message requests with different model preferences:
     - One targeting OpenAI models with the `openai` hint
     - One targeting Anthropic models with the `anthropic` hint
   - Sends both requests to generate creative poems about the weather data
   - Combines the responses into a single result

2. Client-side sampling: the connected MCP client is responsible for handling the sampling requests and routing them to the appropriate chat model.

This approach demonstrates how MCP can be used to leverage multiple LLM providers within a single application, allowing for creative content generation and model comparison.

## Dependencies

The project requires the NestJS AI MCP server package:

```json
"@nestjs-ai/mcp-server": "^0.1.2"
```

This package provides:

- MCP server integration for NestJS
- STDIO transport
- Tool registration support

## Building the Project

Build the project using the Nest CLI:

```bash
npm run build
```

## Running the Server

The server uses STDIO transport:

```bash
npm run start
```

The process waits for an MCP client to connect over STDIO.

## Configuration

Configure the server in `src/app.module.ts`:

```ts
McpServerModule.forRoot({
  transport: "stdio",
  serverInfo: {
    name: "mcp-sampling-server",
    version: "0.0.1",
  },
});
```

## Available Tools

### Weather Temperature Tool

- Name: `getTemperature`
- Description: Get the temperature (in celsius) for a specific location
- Parameters:
  - `latitude`: number - The location latitude
  - `longitude`: number - The location longitude

This tool retrieves the current temperature from the Open-Meteo API and uses MCP Sampling to generate creative poems about the weather from both OpenAI and Anthropic models.

## Server Implementation

The server uses NestJS AI tool annotations for automatic tool registration:

```ts
@Injectable()
export class WeatherService {
  @Tool({
    description: "Get the temperature (in celsius) for a specific location",
    parameters: WEATHER_TOOL_INPUT_SCHEMA,
    returns: z.string(),
  })
  async getTemperature(input: WeatherToolArguments, toolContext?: ToolContext): Promise<string> {
    const { latitude, longitude } = input;
    const weatherResponse = await this.fetchWeather(latitude, longitude);
    return this.callMcpSampling(toolContext, weatherResponse);
  }

  public async callMcpSampling(
    toolContext: ToolContext | undefined,
    weatherResponse: WeatherResponse,
  ): Promise<string> {
    // Uses McpToolUtils.getMcpExchange() to access the MCP exchange
    // Sends sampling requests with model preferences for OpenAI and Anthropic
    // Returns combined poems from both models along with weather data
  }
}
```

The application bootstrap lives in `src/main.ts`, and the MCP server module is configured in `src/app.module.ts`.

## MCP Clients

You can connect to the weather server using any MCP client that supports STDIO transport and sampling.

### Sampling Client

The client must handle MCP Sampling requests and route them to the appropriate LLM based on model hints.

To run a compatible client:

1. Start the MCP server
2. Provide the required model credentials to the client
3. Connect the client to the server over STDIO

## Additional Resources

- [NestJS AI Documentation](https://docs.nestjs.ai/)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
