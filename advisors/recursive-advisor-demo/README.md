# NestJS AI Recursive Advisors Demo

This project demonstrates the **Recursive Advisors** pattern in NestJS AI using the built-in `ToolCallAdvisor` — a recursive advisor that handles the tool calling loop inside the advisor chain instead of inside the model.

## Overview

The demo wires a `ChatClient` with two advisors:

- `ToolCallAdvisor` — built-in recursive advisor that loops until all tool calls are completed. Tools execute within the advisor chain, so the rest of the chain can intercept each iteration.
- `MyLogAdvisor` — a custom, non-recursive logging advisor that prints the request and response on every pass through the chain, giving visibility into the recursive process.

A single weather tool is exposed to the model so the loop has a tool to call.

## Project Structure

```text
src/
├── app.module.ts      # Nest application module
├── main.ts            # Application bootstrap and ChatClient assembly
├── model-modules.ts   # Anthropic chat model wiring
├── my-log-advisor.ts  # Request/response logging advisor
└── weather-tool.ts    # Weather tool callback
```

## Key Components

### ChatClient assembly

```ts
const chatClient = chatClientBuilder
  .defaultToolCallbacks(weatherTool)
  .defaultAdvisors(new ToolCallAdvisor(), new MyLogAdvisor(0))
  .build();
```

- **ToolCallAdvisor**: built-in recursive advisor that loops until all tool calls are completed.
- **MyLogAdvisor**: custom advisor (order `0`) that logs each iteration as the `ToolCallAdvisor` loops through tool executions.

### Weather tool

```ts
FunctionToolCallback.builder("weather", async ({ location }) => {
  return `The current weather in ${location} is sunny with a temperature of 25°C.`;
})
  .description("Get the current weather for a given location")
  .inputType(z.object({ location: z.string().min(1) }))
  .build();
```

## Prerequisites

- Node.js 22+
- pnpm
- API access to Anthropic Claude

## Setup

### 1. Configure API Keys and Model Settings

Set your Anthropic API key as an environment variable:

```bash
export ANTHROPIC_API_KEY=your_anthropic_api_key
```

Optional environment variables:

```bash
export ANTHROPIC_MODEL=claude-haiku-4-5
```

### 2. Install Dependencies

```bash
pnpm install
```

### 3. Run the Application

```bash
pnpm start
```

Or in development mode:

```bash
pnpm start:dev
```

## Expected Behavior

The application will:

1. **Generate Response**: Ask Claude about the weather in Paris.
2. **Tool Call**: The model requests the weather tool; the `ToolCallAdvisor` executes it within the chain and loops back.
3. **Log Each Pass**: `MyLogAdvisor` prints the request and response on every iteration.
4. **Return Final**: The final answer is printed once the tool calling loop completes.

### Sample Output

```text
REQUEST:[{"messageType":"USER","metadata":{"messageType":"USER"},"media":[],"text":"What is current weather in Paris?"}]

RESPONSE:[{"output":{"messageType":"ASSISTANT","toolCalls":[{"id":"toolu_...","type":"function","name":"weather","arguments":"{\"location\":\"Paris\"}"}],"text":""}}]

REQUEST:[ ... user message, assistant tool call, and TOOL response ... ]

RESPONSE:[{"output":{"messageType":"ASSISTANT","toolCalls":[],"text":"The current weather in Paris is sunny with a temperature of 25°C."}}]

The current weather in Paris is sunny with a temperature of 25°C.
```

## Related Examples

- [Spring AI source example](/Users/int/personal/spring-ai-examples/advisors/recursive-advisor-demo/README.md)
- [NestJS AI LLM-as-a-Judge recursive advisor demo](../evaluation-recursive-advisor-demo/README.md)
- [NestJS AI examples root](../../README.md)

## License

This project is licensed under the Apache License 2.0. See the [LICENSE](../../LICENSE) file for details.
