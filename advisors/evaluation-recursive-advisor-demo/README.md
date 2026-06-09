# Evaluation Recursive Advisor Demo

This sample ports Spring AI's `evaluation-recursive-advisor-demo` to NestJS AI.

## What it shows

- A recursive advisor that evaluates model output with a separate judge model
- Anthropic as the generation model
- Ollama as the judge model
- A weather tool that can intentionally return bad values so the evaluator can retry

## Prerequisites

- Node.js 22 or newer
- `ANTHROPIC_API_KEY`
- Ollama running locally at `http://localhost:11434`

## Run

From `advisors/evaluation-recursive-advisor-demo`:

```bash
pnpm install
pnpm start
```

## Configuration

Environment variables:

- `ANTHROPIC_API_KEY`
- `ANTHROPIC_MODEL` defaults to `claude-haiku-4-5`
- `OLLAMA_BASE_URL` defaults to `http://localhost:11434`
- `OLLAMA_MODEL` defaults to `avcodes/flowaicom-flow-judge:q4`
