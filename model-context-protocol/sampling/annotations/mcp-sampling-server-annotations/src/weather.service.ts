import { Injectable, Logger } from "@nestjs/common";
import {
  type CreateMessageRequest,
  type CreateMessageResult,
  type LoggingMessageNotification,
} from "@modelcontextprotocol/server";
import { McpTool, type McpToolMethodArgumentsFor, ReturnMode } from "@nestjs-ai/mcp-annotations";
import { type McpServerExchange } from "@nestjs-ai/mcp-common";
import { z } from "zod";

const WEATHER_TOOL_INPUT_SCHEMA = z.object({
  latitude: z.number().describe("The location latitude"),
  longitude: z.number().describe("The location longitude"),
});

interface WeatherResponse {
  current: {
    time: string;
    interval: number;
    temperature_2m: number;
  };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);

  @McpTool({
    description: "Get the temperature (in celsius) for a specific location",
    inputSchema: WEATHER_TOOL_INPUT_SCHEMA,
    returnMode: ReturnMode.TEXT,
  })
  async getTemperature({
    toolArguments,
    exchange,
  }: McpToolMethodArgumentsFor<typeof WEATHER_TOOL_INPUT_SCHEMA>): Promise<string> {
    const { latitude, longitude } = toolArguments;
    const weatherResponse = await this.fetchWeather(latitude, longitude);

    return this.callMcpSampling(exchange, weatherResponse);
  }

  private async fetchWeather(latitude: number, longitude: number): Promise<WeatherResponse> {
    const response = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=temperature_2m`,
    );

    if (!response.ok) {
      throw new Error(`Open-Meteo request failed with status ${response.status}`);
    }

    return (await response.json()) as WeatherResponse;
  }

  public async callMcpSampling(
    exchange: McpServerExchange | undefined,
    weatherResponse: WeatherResponse,
  ): Promise<string> {
    const openAiWeatherPoem = "";
    const anthropicWeatherPoem = "";

    if (exchange != null) {
      await exchange.loggingNotification({
        method: "notifications/message",
        params: {
          level: "info",
          data: "Start sampling",
        },
      } satisfies LoggingMessageNotification);
    }

    let responseWithPoems = [
      `OpenAI poem about the weather: ${openAiWeatherPoem}`,
      "",
      `Anthropic poem about the weather: ${anthropicWeatherPoem}`,
      "",
      JSON.stringify(weatherResponse, null, 2),
    ].join("\n");

    if (exchange != null && exchange.getClientCapabilities()?.sampling != null) {
      const prompt = this.buildPoemPrompt(weatherResponse);
      const openAiWeatherPoemResponse = await this.requestPoem(exchange, "openai", prompt);
      const anthropicWeatherPoemResponse = await this.requestPoem(exchange, "anthropic", prompt);

      responseWithPoems = [
        `OpenAI poem about the weather: ${openAiWeatherPoemResponse}`,
        "",
        `Anthropic poem about the weather: ${anthropicWeatherPoemResponse}`,
        "",
        JSON.stringify(weatherResponse, null, 2),
      ].join("\n");
    }

    if (exchange != null) {
      await exchange.loggingNotification({
        method: "notifications/message",
        params: {
          level: "info",
          data: "Finish Sampling",
        },
      } satisfies LoggingMessageNotification);
    }

    this.logger.log(responseWithPoems);
    return responseWithPoems;
  }

  private async requestPoem(
    exchange: McpServerExchange,
    modelHint: string,
    prompt: string,
  ): Promise<string> {
    const request: CreateMessageRequest = {
      method: "sampling/createMessage",
      params: {
        maxTokens: 256,
        systemPrompt: "You are a poet!",
        messages: [
          {
            role: "user",
            content: {
              type: "text",
              text: prompt,
            },
          },
        ],
        modelPreferences: {
          hints: [{ name: modelHint }],
        },
      },
    };

    const result = (await exchange.createMessage(request)) as CreateMessageResult;
    return this.extractTextContent(result);
  }

  private buildPoemPrompt(weatherResponse: WeatherResponse): string {
    return `Please write a poem about this weather forecast (temperature is in Celsius). Use markdown format :\n ${JSON.stringify(weatherResponse, null, 2)}`;
  }

  private extractTextContent(result: CreateMessageResult): string {
    if (result.content.type !== "text") {
      throw new Error("Expected text content in sampling response");
    }

    return result.content.text;
  }
}
