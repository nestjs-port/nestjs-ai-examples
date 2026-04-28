import "reflect-metadata";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { ChainWorkflowService } from "./chain-workflow";

const report = `Q3 Performance Summary:
Our customer satisfaction score rose to 92 points this quarter.
Revenue grew by 45% compared to last year.
Market share is now at 23% in our primary market.
Customer churn decreased to 5% from 8%.
New user acquisition cost is $43 per user.
Product adoption rate increased to 78%.
Employee satisfaction is at 87 points.
Operating margin improved to 34%.`;

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const chainWorkflowService = app.get(ChainWorkflowService);

  const result = await chainWorkflowService.run(report);

  console.log(`\nSTEP 0:\n ${result.input}`);
  for (const step of result.steps) {
    console.log(`\nSTEP ${step.index}:\n ${step.output}`);
  }

  await app.close();
}

bootstrap();
