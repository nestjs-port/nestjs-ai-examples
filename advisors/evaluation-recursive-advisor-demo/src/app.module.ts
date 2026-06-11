import { Module } from "@nestjs/common";
import { GenerationModelModule, JudgeModelModule } from "./model-modules.js";

@Module({
  imports: [GenerationModelModule, JudgeModelModule],
})
export class AppModule {}
