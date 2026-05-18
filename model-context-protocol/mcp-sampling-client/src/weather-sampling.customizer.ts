import { Injectable, Logger } from "@nestjs/common";
import { McpClientCustomizer } from "@nestjs-ai/mcp-common";
import type {
  Client as McpClient,
  CreateMessageRequest,
  CreateMessageResult,
} from "@modelcontextprotocol/client";
import { AnthropicPoemService } from "./anthropic-poem.service.js";
import { OpenAiPoemService } from "./openai-poem.service.js";

@Injectable()
export class WeatherSamplingCustomizer extends McpClientCustomizer {
  private readonly logger = new Logger(WeatherSamplingCustomizer.name);

  constructor(
    private readonly openAiPoemService: OpenAiPoemService,
    private readonly anthropicPoemService: AnthropicPoemService,
  ) {
    super();
  }

  override customize(name: string, client: McpClient): void {
    if (name !== "mcp-sampling-server") {
      return;
    }

    client.registerCapabilities({
      sampling: {},
    });

    client.setRequestHandler(
      "sampling/createMessage",
      async (request: CreateMessageRequest): Promise<CreateMessageResult> => {
        const prompt = this.extractPrompt(request);
        const modelHint = this.extractModelHint(request);

        this.logger.log(`Handling sampling request for hint "${modelHint}"`);

        const poem = modelHint.includes("anthropic")
          ? await this.anthropicPoemService.generatePoem(prompt)
          : await this.openAiPoemService.generatePoem(prompt);

        return {
          role: "assistant",
          content: {
            type: "text",
            text: poem,
          },
          model: modelHint || "openai",
        };
      },
    );
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
