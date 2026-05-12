import { Injectable, Logger } from "@nestjs/common";
import {
  type McpServerExchange,
  McpTool,
  type McpToolMethodArguments,
} from "@nestjs-ai/mcp-annotations";
import {
  type CreateMessageRequest,
  type CreateMessageResult,
  type LoggingMessageNotification,
} from "@modelcontextprotocol/server";
import { z } from "zod";

const WEATHER_TOOL_INPUT_SCHEMA = z.object({
  latitude: z.number().describe("The location latitude"),
  longitude: z.number().describe("The location longitude"),
});

type WeatherToolArguments = z.infer<typeof WEATHER_TOOL_INPUT_SCHEMA>;

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
  })
  async getTemperature(args: McpToolMethodArguments<WeatherToolArguments>): Promise<string> {
    const { latitude, longitude } = args.toolArguments;

    const weatherResponse = await this.fetchWeather(latitude, longitude);
    return this.callMcpSampling(args.exchange, weatherResponse);
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

  private async callMcpSampling(
    exchange: McpServerExchange | undefined,
    weatherResponse: WeatherResponse,
  ): Promise<string> {
    if (exchange?.getClientCapabilities()?.sampling == null) {
      return this.formatWeatherOnly(weatherResponse);
    }

    const startNotification: LoggingMessageNotification = {
      method: "notifications/message",
      params: {
        level: "info",
        data: "Start sampling",
      },
    } as LoggingMessageNotification;

    await exchange.loggingNotification(startNotification);

    const prompt = this.buildPoemPrompt(weatherResponse);
    const openAiWeatherPoem = await this.requestPoem(exchange, "openai", prompt);
    const anthropicWeatherPoem = await this.requestPoem(exchange, "anthropic", prompt);

    const finishNotification: LoggingMessageNotification = {
      method: "notifications/message",
      params: {
        level: "info",
        data: "Finish sampling",
      },
    } as LoggingMessageNotification;

    await exchange.loggingNotification(finishNotification);

    const responseWithPoems = [
      `OpenAI poem about the weather: ${openAiWeatherPoem}`,
      "",
      `Anthropic poem about the weather: ${anthropicWeatherPoem}`,
      "",
      JSON.stringify(weatherResponse, null, 2),
    ].join("\n");

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
    } as CreateMessageRequest;

    const result = await exchange.createMessage(request);
    return this.extractTextContent(result);
  }

  private buildPoemPrompt(weatherResponse: WeatherResponse): string {
    return [
      "Please write a poem about this weather forecast (temperature is in Celsius). Use markdown format:",
      JSON.stringify(weatherResponse, null, 2),
    ].join("\n");
  }

  private formatWeatherOnly(weatherResponse: WeatherResponse): string {
    return JSON.stringify(weatherResponse, null, 2);
  }

  private extractTextContent(result: CreateMessageResult): string {
    const contentBlocks = Array.isArray(result.content) ? result.content : [result.content];
    const textContent = contentBlocks.find((content) => {
      return typeof content === "object" && content != null && "type" in content && content.type === "text";
    });

    if (textContent && typeof textContent === "object" && "text" in textContent) {
      return textContent.text;
    }

    return JSON.stringify(result.content, null, 2);
  }
}
