import "reflect-metadata";

import { ChatClient } from "@nestjs-ai/client-chat";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { MyLoggingAdvisor } from "./my-logging-advisor.js";
import { SelfRefineEvaluationAdvisor } from "./self-refine-evaluation-advisor.js";
import {
  GENERATION_CHAT_CLIENT_BUILDER_TOKEN,
  JUDGE_CHAT_CLIENT_BUILDER_TOKEN,
} from "./model-modules.js";
import { createWeatherTool } from "./weather-tool.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const generationBuilder = await app.resolve<ChatClient.Builder>(
    GENERATION_CHAT_CLIENT_BUILDER_TOKEN,
  );
  const judgeChatClientBuilder = await app.resolve<ChatClient.Builder>(
    JUDGE_CHAT_CLIENT_BUILDER_TOKEN,
  );
  const weatherTool = createWeatherTool();

  const evaluationAdvisor = SelfRefineEvaluationAdvisor.builder()
    .chatClientBuilder(judgeChatClientBuilder)
    .maxRepeatAttempts(15)
    .successRating(4)
    .order(0)
    .build();

  const chatClient = generationBuilder
    .defaultToolCallbacks(weatherTool)
    .defaultAdvisors(evaluationAdvisor, new MyLoggingAdvisor(2))
    .build();

  const response = await chatClient.prompt("What is current weather in Paris?").call().content();

  console.log(response ?? "");

  await app.close();
}

bootstrap();
