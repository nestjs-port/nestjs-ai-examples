import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { ChatModelModule } from "./model-modules.js";

@Module({
  imports: [NestAiModule.forRoot(), ChatModelModule],
})
export class AppModule {}
