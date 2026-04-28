import "reflect-metadata";
import { ChatClient } from "@nestjs-ai/client-chat";
import { CHAT_CLIENT_BUILDER_TOKEN } from "@nestjs-ai/commons";
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";
import { EvaluatorOptimizer } from "./evaluator-optimizer";

async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const builder = await app.resolve<ChatClient.Builder>(CHAT_CLIENT_BUILDER_TOKEN);
  const chatClient = builder.build();
  const agent = new EvaluatorOptimizer(chatClient);

  const refinedResponse = await agent.loop(`
<user input>
Implement a Stack in Java with:
1. push(x)
2. pop()
3. getMin()
All operations should be O(1).
All inner fields should be private and when used should be prefixed with 'this.'.
</user input>
`);

  console.log("FINAL OUTPUT:\n : ", refinedResponse);

  await app.close();
}

bootstrap();
