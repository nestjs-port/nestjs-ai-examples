import { Module } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import {
  GenerationModelModule,
  JUDGE_CHAT_CLIENT_BUILDER_TOKEN,
  JudgeModelModule,
} from "./model-modules.js";
import { SelfRefineEvaluationAdvisor } from "./self-refine-evaluation-advisor.js";

@Module({
  imports: [GenerationModelModule, JudgeModelModule],
  providers: [
    {
      provide: SelfRefineEvaluationAdvisor,
      useFactory: (judgeChatClientBuilder: ChatClient.Builder) =>
        SelfRefineEvaluationAdvisor.builder()
          .chatClientBuilder(judgeChatClientBuilder)
          .maxRepeatAttempts(15)
          .successRating(4)
          .order(0)
          .build(),
      inject: [JUDGE_CHAT_CLIENT_BUILDER_TOKEN],
    },
  ],
  exports: [SelfRefineEvaluationAdvisor, JUDGE_CHAT_CLIENT_BUILDER_TOKEN],
})
export class AppModule {}
