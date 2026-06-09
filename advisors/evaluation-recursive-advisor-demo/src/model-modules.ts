import { Module } from "@nestjs/common";
import { CHAT_MODEL_TOKEN } from "@nestjs-ai/commons";
import { ChatClient } from "@nestjs-ai/client-chat";
import { AnthropicChatModelModule } from "@nestjs-ai/model-anthropic";
import type { ChatModel } from "@nestjs-ai/model";
import { OllamaChatModelModule } from "@nestjs-ai/model-ollama";
import { OllamaChatOptions } from "@nestjs-ai/model-ollama";

export const GENERATION_CHAT_CLIENT_BUILDER_TOKEN = Symbol.for(
  "EVALUATION_RECURSIVE_ADVISOR_GENERATION_CHAT_CLIENT_BUILDER_TOKEN",
);

export const JUDGE_CHAT_CLIENT_BUILDER_TOKEN = Symbol.for(
  "EVALUATION_RECURSIVE_ADVISOR_JUDGE_CHAT_CLIENT_BUILDER_TOKEN",
);

function requireAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required to run the sample");
  }

  return apiKey;
}

@Module({
  imports: [
    AnthropicChatModelModule.forFeatureAsync({
      useFactory: async () => ({
        apiKey: requireAnthropicApiKey(),
        options: {
          model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
          temperature: 0,
          maxTokens: 1200,
        },
      }),
    }),
  ],
  providers: [
    {
      provide: GENERATION_CHAT_CLIENT_BUILDER_TOKEN,
      useFactory: (chatModel: ChatModel) => ChatClient.builder(chatModel),
      inject: [CHAT_MODEL_TOKEN],
    },
  ],
  exports: [GENERATION_CHAT_CLIENT_BUILDER_TOKEN],
})
export class GenerationModelModule {}

@Module({
  imports: [
    OllamaChatModelModule.forFeatureAsync({
      useFactory: async () => ({
        properties: {
          baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
          options: OllamaChatOptions.builder()
            .model(process.env.OLLAMA_MODEL ?? "avcodes/flowaicom-flow-judge:q4")
            .temperature(0)
            .build(),
        },
      }),
    }),
  ],
  providers: [
    {
      provide: JUDGE_CHAT_CLIENT_BUILDER_TOKEN,
      useFactory: (chatModel: ChatModel) => ChatClient.builder(chatModel),
      inject: [CHAT_MODEL_TOKEN],
    },
  ],
  exports: [JUDGE_CHAT_CLIENT_BUILDER_TOKEN],
})
export class JudgeModelModule {}
