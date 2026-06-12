import { FunctionToolCallback } from "@nestjs-ai/model";
import { z } from "zod";

export function createWeatherTool(): FunctionToolCallback<{ location: string }, string> {
  return FunctionToolCallback.builder("weather", async ({ location }) => {
    return `The current weather in ${location} is sunny with a temperature of 25°C.`;
  })
    .description("Get the current weather for a given location")
    .inputType(
      z.object({
        location: z.string().min(1),
      }),
    )
    .build();
}
