import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { OpenAiChatModelModule } from "@nestjs-ai/model-openai";
// import { AnthropicChatModelModule } from "@nestjs-ai/model-anthropic";
import { EvaluatorOptimizer } from "./evaluator-optimizer";

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
  ],
  providers: [EvaluatorOptimizer],
  exports: [EvaluatorOptimizer],
})
export class AppModule {}
