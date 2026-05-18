import { Global, Module } from "@nestjs/common";
import { MethodToolCallbackProvider, TOOL_CALLBACK_PROVIDER_TOKEN } from "@nestjs-ai/model";
import { WeatherService } from "./weather.service.js";

@Global()
@Module({
  providers: [
    WeatherService,
    {
      provide: TOOL_CALLBACK_PROVIDER_TOKEN,
      useFactory: (weatherService: WeatherService) => [
        new MethodToolCallbackProvider([weatherService]),
      ],
      inject: [WeatherService],
    },
  ],
  exports: [TOOL_CALLBACK_PROVIDER_TOKEN],
})
export class WeatherToolsModule {}
