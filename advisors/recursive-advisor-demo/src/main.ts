import "reflect-metadata";

import { ChatClient, ToolCallAdvisor } from "@nestjs-ai/client-chat";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { MyLogAdvisor } from "./my-log-advisor.js";
import { CHAT_CLIENT_BUILDER_TOKEN } from "./model-modules.js";
import { createWeatherTool } from "./weather-tool.js";

async function bootstrap(): Promise<void> {
  const app = await NestFactory.createApplicationContext(AppModule);
  const chatClientBuilder = await app.resolve<ChatClient.Builder>(CHAT_CLIENT_BUILDER_TOKEN);
  const weatherTool = createWeatherTool();

  const chatClient = chatClientBuilder
    .defaultToolCallbacks(weatherTool)
    .defaultAdvisors(new ToolCallAdvisor(), new MyLogAdvisor(0))
    .build();

  const response = await chatClient.prompt("What is current weather in Paris?").call().content();

  console.log(response ?? "");

  await app.close();
}

bootstrap();
