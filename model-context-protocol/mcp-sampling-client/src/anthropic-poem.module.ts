import { Module } from "@nestjs/common";
import { AnthropicChatModelModule } from "@nestjs-ai/model-anthropic";
import { AnthropicPoemService } from "./anthropic-poem.service.js";

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
  providers: [AnthropicPoemService],
  exports: [AnthropicPoemService],
})
export class AnthropicPoemModule {}
