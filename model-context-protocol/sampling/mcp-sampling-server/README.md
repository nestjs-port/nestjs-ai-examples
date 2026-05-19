# NestJS AI MCP Sampling Server

This sample project demonstrates how to create an MCP server using NestJS AI. It implements a weather service that exposes a tool for retrieving weather information from the Open-Meteo API and showcases MCP Sampling capabilities.

For more information, see the [Model Context Protocol specification](https://modelcontextprotocol.github.io/specification/).

## Overview

The sample showcases:

- Integration with `@nestjs-ai/mcp-server`
- Streamable HTTP transport for MCP clients
- Tool callback registration through `TOOL_CALLBACK_PROVIDER_TOKEN`
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
"@nestjs-ai/mcp-server": "^0.1.3"
```

This package provides:

- MCP server integration for NestJS
- Streamable HTTP transport
- Tool registration support

## Building the Project

Build the project using the Nest CLI:

```bash
pnpm run build
```

## Running the Server

The server uses Streamable HTTP transport:

```bash
pnpm start
```

The server listens on `http://localhost:3000` and exposes the MCP endpoint at `/mcp`.

## Configuration

Configure the server in `src/app.module.ts`:

```ts
McpServerModule.forRoot({
  transport: "streamable-http",
  serverInfo: {
    name: "mcp-sampling-server",
    version: "0.0.1",
  },
  toolCallbacks: {
    enabled: true,
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

The server registers tool callbacks through a dedicated provider module:

```ts
@Global()
@Module({
  providers: [
    WeatherService,
    {
      provide: TOOL_CALLBACK_PROVIDER_TOKEN,
      useFactory: (weatherService: WeatherService) => [
        new MethodToolCallbackProvider([weatherService]),
      ],
      inject: [WeatherService],
    },
  ],
  exports: [TOOL_CALLBACK_PROVIDER_TOKEN],
})
export class WeatherToolsModule {}

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

The application bootstrap lives in `src/main.ts`, the MCP server module is configured in `src/app.module.ts`, and tool callbacks are exposed from `src/weather-tools.module.ts`.

## MCP Clients

You can connect to the weather server using any MCP client that supports Streamable HTTP transport and sampling.

### Sampling Client

The client must handle MCP Sampling requests and route them to the appropriate LLM based on model hints.

To run a compatible client:

1. Start the MCP server
2. Provide the required model credentials to the client
3. Connect the client to the server over Streamable HTTP at `http://localhost:3000/mcp`

## Additional Resources

- [NestJS AI Documentation](https://nestjs-port.github.io/nestjs-ai)
- [Model Context Protocol Specification](https://modelcontextprotocol.github.io/specification/)
