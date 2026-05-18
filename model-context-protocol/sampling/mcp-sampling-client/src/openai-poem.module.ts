import { Module } from "@nestjs/common";
import { OpenAiChatModelModule } from "@nestjs-ai/model-openai";
import { OpenAiPoemService } from "./openai-poem.service.js";

function requireOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to run the sample");
  }

  return apiKey;
}

@Module({
  imports: [
    OpenAiChatModelModule.forFeatureAsync({
      useFactory: async () => ({
        apiKey: requireOpenAiApiKey(),
        options: {
          model: process.env.OPENAI_MODEL ?? "gpt-4o",
          temperature: 0,
          maxTokens: 1200,
        },
      }),
    }),
  ],
  providers: [OpenAiPoemService],
  exports: [OpenAiPoemService],
})
export class OpenAiPoemModule {}
