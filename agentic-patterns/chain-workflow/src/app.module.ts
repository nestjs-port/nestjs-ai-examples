import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { AnthropicChatModelModule } from "@nestjs-ai/model-anthropic";
// import { OpenAiChatModelModule } from "@nestjs-ai/model-openai";
import { ChainWorkflow } from "./chain-workflow";

function requireAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required to run the chain-workflow sample");
  }

  return apiKey;
}

@Module({
  imports: [
    NestAiModule.forRoot(),
    // OpenAiChatModelModule.forFeatureAsync({
    //   useFactory: async () => ({
    //     apiKey: process.env.OPENAI_API_KEY,
    //     options: {
    //       model: process.env.OPENAI_MODEL ?? "gpt-4o-mini",
    //       temperature: 0,
    //       maxTokens: 1200,
    //     },
    //   }),
    // }),
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
  providers: [ChainWorkflow],
})
export class AppModule {}
