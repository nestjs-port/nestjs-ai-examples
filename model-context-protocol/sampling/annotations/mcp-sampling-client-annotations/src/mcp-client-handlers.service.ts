import { Injectable, Logger } from "@nestjs/common";
import {
  McpLogging,
  McpProgress,
  McpSampling,
} from "@nestjs-ai/mcp-annotations";
import type {
  CreateMessageRequest,
  CreateMessageResult,
  LoggingLevel,
  LoggingMessageNotification,
  ProgressNotification,
} from "@modelcontextprotocol/client";
import { AnthropicPoemService } from "./anthropic-poem.service.js";
import { OpenAiPoemService } from "./openai-poem.service.js";

@Injectable()
export class McpClientHandlers {
  private readonly logger = new Logger(McpClientHandlers.name);

  constructor(
    private readonly openAiPoemService: OpenAiPoemService,
    private readonly anthropicPoemService: AnthropicPoemService,
  ) {}

  @McpProgress({ clients: ["mcp-sampling-server-annotations"] })
  progressHandler(notification: ProgressNotification): void {
    this.logger.log(
      `MCP PROGRESS: [${notification.params.progressToken}] progress: ${notification.params.progress} total: ${notification.params.total ?? "n/a"} message: ${notification.params.message ?? ""}`,
    );
  }

  @McpLogging({ clients: ["mcp-sampling-server-annotations"] })
  loggingHandler(notification: LoggingMessageNotification): void {
    this.logger.log(`MCP LOGGING: [${notification.params.level}] ${String(notification.params.data)}`);
  }

  @McpSampling({ clients: ["mcp-sampling-server-annotations"] })
  async samplingHandler(llmRequest: CreateMessageRequest): Promise<CreateMessageResult> {
    this.logger.log(`MCP SAMPLING: ${JSON.stringify(llmRequest)}`);

    const userPrompt = this.extractPrompt(llmRequest);
    const modelHint = this.extractModelHint(llmRequest);

    const response = modelHint.includes("anthropic")
      ? await this.anthropicPoemService.generatePoem(userPrompt)
      : await this.openAiPoemService.generatePoem(userPrompt);

    return {
      role: "assistant",
      content: {
        type: "text",
        text: response,
      },
      model: modelHint || "openai",
    };
  }

  private extractPrompt(request: CreateMessageRequest): string {
    const message = request.params.messages[0];

    if (message == null) {
      throw new Error("Sampling request did not include a user message");
    }

    const content = message.content;

    if (typeof content === "string") {
      return content;
    }

    if (Array.isArray(content)) {
      const textBlock = content.find((block) => block.type === "text");

      if (textBlock != null) {
        return textBlock.text;
      }
    }

    if ("type" in content && content.type === "text") {
      return content.text;
    }

    throw new Error("Sampling request did not contain a text prompt");
  }

  private extractModelHint(request: CreateMessageRequest): string {
    return request.params.modelPreferences?.hints?.[0]?.name ?? "";
  }
}
