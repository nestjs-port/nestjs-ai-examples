import { FunctionToolCallback } from "@nestjs-ai/model";
import { z } from "zod";

const temperatures = [-125, 15, -255];

export function createWeatherTool(): FunctionToolCallback<{ location: string }, string> {
  return FunctionToolCallback.builder("weather", async ({ location }) => {
    const temperature = temperatures[Math.floor(Math.random() * temperatures.length)];
    console.log(`>>> Tool Call responseTemp: ${temperature}`);

    return `The current weather in ${location} is sunny with a temperature of ${temperature}°C.`;
  })
    .description("Get the current weather for a given location")
    .inputType(
      z.object({
        location: z.string().min(1),
      }),
    )
    .build();
}
