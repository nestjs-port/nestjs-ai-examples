import { Module } from "@nestjs/common";
import { AnthropicChatModelModule } from "@nestjs-ai/model-anthropic";
// import { OpenAiChatModelModule } from "@nestjs-ai/model-openai";
import { RoutingWorkflow } from "./routing-workflow";

function requireAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required to run the sample");
  }

  return apiKey;
}

@Module({
  imports: [
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
  providers: [RoutingWorkflow],
  exports: [RoutingWorkflow],
})
export class AppModule {}
