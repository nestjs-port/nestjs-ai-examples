import { Injectable, Logger } from "@nestjs/common";
import assert from "node:assert/strict";
import { type ToolContext, Tool } from "@nestjs-ai/model";
import {
  type CreateMessageRequest,
  type CreateMessageResult,
  type LoggingMessageNotification,
} from "@modelcontextprotocol/server";
import { McpToolUtils, type McpServerExchange } from "@nestjs-ai/mcp-common";
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

  @Tool({
    description: "Get the temperature (in celsius) for a specific location",
    parameters: WEATHER_TOOL_INPUT_SCHEMA,
    returns: z.string(),
  })
  async getTemperature(input: WeatherToolArguments, toolContext?: ToolContext): Promise<string> {
    const { latitude, longitude } = input;
    const weatherResponse = await this.fetchWeather(latitude, longitude);
    const responseWithPoems = await this.callMcpSampling(toolContext, weatherResponse);

    return responseWithPoems;
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
    toolContext: ToolContext | undefined,
    weatherResponse: WeatherResponse,
  ): Promise<string> {
    const exchange = McpToolUtils.getMcpExchange(toolContext);
    const openAiWeatherPoem = "";
    const anthropicWeatherPoem = "";

    if (exchange != null) {
      const startNotification: LoggingMessageNotification = {
        method: "notifications/message",
        params: {
          level: "info",
          data: "Start sampling",
        },
      } as LoggingMessageNotification;

      await exchange.loggingNotification(startNotification);
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
      const finishNotification: LoggingMessageNotification = {
        method: "notifications/message",
        params: {
          level: "info",
          data: "Finish Sampling",
        },
      } as LoggingMessageNotification;

      await exchange.loggingNotification(finishNotification);
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
    return `Please write a poem about this weather forecast (temperature is in Celsius). Use markdown format :\n ${JSON.stringify(weatherResponse, null, 2)}`;
  }

  private extractTextContent(result: CreateMessageResult): string {
    assert(result.content.type === "text");
    return result.content.text;
  }
}
