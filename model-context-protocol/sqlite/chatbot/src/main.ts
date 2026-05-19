import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { SqliteChatbotRunner } from "./sqlite-chatbot.runner.js";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const runner = app.get(SqliteChatbotRunner);
    await runner.run();
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
