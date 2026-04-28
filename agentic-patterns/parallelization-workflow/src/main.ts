import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ParallelizationWorkflow } from "./parallelization-workflow";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const workflow = app.get(ParallelizationWorkflow);

  const parallelResponse = await workflow.parallel(
    "Analyze how market changes will impact this stakeholder group. Provide specific impacts and recommended actions. Format with clear sections and priorities.",
    [
      `Customers:
- Price sensitive
- Want better tech
- Environmental concerns`,
      `Employees:
- Job security worries
- Need new skills
- Want clear direction`,
      `Investors:
- Expect growth
- Want cost control
- Risk concerns`,
      `Suppliers:
- Capacity constraints
- Price pressures
- Tech transitions`,
    ],
    4,
  );

  console.log(parallelResponse);

  await app.close();
}

bootstrap();
