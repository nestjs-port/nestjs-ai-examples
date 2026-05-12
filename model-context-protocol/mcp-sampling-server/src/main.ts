import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule, {
    logger: ["error", "warn", "log"],
  });

  app.enableShutdownHooks();

  const shutdown = async () => {
    await app.close();
  };

  process.once("SIGINT", shutdown);
  process.once("SIGTERM", shutdown);

  process.stdin.resume();
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
