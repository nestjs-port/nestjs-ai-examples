import { Module } from "@nestjs/common";
import { ChatClientModule } from "@nestjs-ai/client-chat";
import { NestAiModule } from "@nestjs-ai/platform";
// import { OllamaChatModelModule } from "@nestjs-ai/model-ollama";
import { OpenAiChatModelModule } from "@nestjs-ai/model-openai";
// import { AnthropicChatModelModule } from "@nestjs-ai/model-anthropic";

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
    // AnthropicChatModelModule.forFeatureAsync({
    //   useFactory: async () => ({
    //     apiKey: process.env.ANTHROPIC_API_KEY,
    //     options: {
    //       model: process.env.ANTHROPIC_MODEL ?? "claude-haiku-4-5",
    //       temperature: 0,
    //       maxTokens: 1200,
    //     },
    //   }),
    // }),
    // OllamaChatModelModule.forFeatureAsync({
    //   useFactory: async () => ({
    //     baseUrl: process.env.OLLAMA_BASE_URL ?? "http://localhost:11434",
    //     options: {
    //       model: process.env.OLLAMA_MODEL ?? "llama3.2:latest",
    //       temperature: 0,
    //       numPredict: 1200,
    //     },
    //   }),
    // }),
  ],
})
export class AppModule {}
