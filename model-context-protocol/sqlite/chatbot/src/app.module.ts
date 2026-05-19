import { Module } from "@nestjs/common";
import { ChatClientModule } from "@nestjs-ai/client-chat";
import { NestAiModule } from "@nestjs-ai/platform";
import { OpenAiChatModelModule } from "@nestjs-ai/model-openai";
import { SqliteChatbotRunner } from "./sqlite-chatbot.runner.js";

function requireOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to run the sample");
  }

  return apiKey;
}

@Module({
  imports: [
    NestAiModule.forRoot(),
    ChatClientModule.forFeature({
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
    }),
  ],
  providers: [SqliteChatbotRunner],
  exports: [SqliteChatbotRunner],
})
export class AppModule {}
