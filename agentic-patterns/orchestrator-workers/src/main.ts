import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { OrchestratorWorkers } from "./orchestrator-workers";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const agent = app.get(OrchestratorWorkers);

  await agent.process("Write a product description for a new eco-friendly water bottle");

  await app.close();
}

bootstrap();
