import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module.js";
import { SamplingRunner } from "./sampling-runner.service.js";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);

  try {
    const runner = app.get(SamplingRunner);
    await runner.run();
  } finally {
    await app.close();
  }
}

bootstrap().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});
