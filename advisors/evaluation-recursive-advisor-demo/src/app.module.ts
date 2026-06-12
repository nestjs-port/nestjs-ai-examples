import { Module } from "@nestjs/common";
import { NestAiModule } from "@nestjs-ai/platform";
import { GenerationModelModule, JudgeModelModule } from "./model-modules.js";

@Module({
  imports: [NestAiModule.forRoot(), GenerationModelModule, JudgeModelModule],
})
export class AppModule {}
