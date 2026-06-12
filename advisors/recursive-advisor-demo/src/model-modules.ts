import { Module } from "@nestjs/common";
import { CHAT_MODEL_TOKEN } from "@nestjs-ai/commons";
import { ChatClient } from "@nestjs-ai/client-chat";
import { AnthropicChatModelModule } from "@nestjs-ai/model-anthropic";
import type { ChatModel } from "@nestjs-ai/model";

export const CHAT_CLIENT_BUILDER_TOKEN = Symbol.for("RECURSIVE_ADVISOR_CHAT_CLIENT_BUILDER_TOKEN");

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
      provide: CHAT_CLIENT_BUILDER_TOKEN,
      useFactory: (chatModel: ChatModel) => ChatClient.builder(chatModel),
      inject: [CHAT_MODEL_TOKEN],
    },
  ],
  exports: [CHAT_CLIENT_BUILDER_TOKEN],
})
export class ChatModelModule {}
