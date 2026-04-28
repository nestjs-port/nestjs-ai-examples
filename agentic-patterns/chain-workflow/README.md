# Chain Workflow Sample

This project ports the Spring AI `agentic-patterns/chain-workflow` example to NestJS AI.
It keeps the same prompt-chaining structure from the original Spring sample.

## Overview

The prompt chaining pattern is useful when:

- complex tasks can be broken into simpler sequential steps
- each step's output needs to be validated or transformed
- the process benefits from a clear chain of transformations

## What it shows

- Anthropic chat model integration through `@nestjs-ai/model-anthropic`
- OpenAI support is available by uncommenting the OpenAI model dependency and module block
- A four-step prompt chain that transforms a numeric report into a markdown table

## Prerequisites

- Node.js 22 or newer
- An `ANTHROPIC_API_KEY`

## Install

Run this from `agentic-patterns/chain-workflow`:

```bash
npm install
```

## Run the app

Set the Anthropic key first:

```bash
export ANTHROPIC_API_KEY=...
export ANTHROPIC_MODEL=claude-haiku-4-5
```

Then run the sample:

```bash
npm run start
```

The workflow runs as a CLI-style Nest application and prints each step to stdout.

The default report used by the sample is:

```text
Q3 Performance Summary:
Our customer satisfaction score rose to 92 points this quarter.
Revenue grew by 45% compared to last year.
Market share is now at 23% in our primary market.
Customer churn decreased to 5% from 8%.
New user acquisition cost is $43 per user.
Product adoption rate increased to 78%.
Employee satisfaction is at 87 points.
Operating margin improved to 34%.
```

## Workflow

The chain performs these steps:

1. Extract numbers and their metrics
2. Normalize values into percentages where applicable
3. Sort the values in descending order
4. Render the result as a markdown table

## Implementation Details

The workflow is implemented in two main classes:

1. `chain-workflow.ts`: contains the prompt chaining logic and system prompts
2. `main.ts`: provides the NestJS bootstrap and sample input for the CLI run

Each step in the chain acts as a gate that validates and transforms the output before proceeding to the next step.

## References

This implementation is based on the prompt chaining pattern described in Anthropic's research paper [Building Effective Agents](https://www.anthropic.com/research/building-effective-agents).
