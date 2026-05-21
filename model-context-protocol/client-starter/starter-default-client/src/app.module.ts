/*
 * Copyright 2026 The NestJS AI Authors.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *      https://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { Module } from "@nestjs/common";
import { ChatClientModule } from "@nestjs-ai/client-chat";
import { CHAT_CLIENT_BUILDER_TOKEN, TOOL_CALLBACK_PROVIDER_TOKEN } from "@nestjs-ai/commons";
import { McpClientModule } from "@nestjs-ai/mcp-client";
import { AnthropicChatModelModule } from "@nestjs-ai/model-anthropic";
import { NestAiModule } from "@nestjs-ai/platform";
import { StarterDefaultClientRunner } from "./starter-default-client.runner.js";

function requireAnthropicApiKey(): string {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    throw new Error("ANTHROPIC_API_KEY is required to run the sample");
  }

  return apiKey;
}

function requireBraveApiKey(): string {
  const apiKey = process.env.BRAVE_API_KEY;

  if (!apiKey) {
    throw new Error("BRAVE_API_KEY is required to run the sample");
  }

  return apiKey;
}

function userInput(): string {
  return process.env.AI_USER_INPUT ?? "What tools are available?";
}

@Module({
  imports: [
    NestAiModule.forRoot(),
    McpClientModule.forRoot({
      name: "mcp-starter-default-client",
      version: "0.0.1",
      stdio: {
        connections: {
          "brave-search": {
            command: "npx",
            args: ["-y", "@modelcontextprotocol/server-brave-search"],
            env: {
              BRAVE_API_KEY: requireBraveApiKey(),
            },
          },
        },
      },
    }),
    ChatClientModule.forFeature({
      imports: [
        AnthropicChatModelModule.forFeatureAsync({
          useFactory: async () => ({
            apiKey: requireAnthropicApiKey(),
            options: {
              model: process.env.ANTHROPIC_MODEL ?? "claude-4-sonnet-20250514",
              temperature: 0,
              maxTokens: 1200,
            },
          }),
        }),
      ],
    }),
  ],
  providers: [
    StarterDefaultClientRunner,
    {
      provide: "AI_USER_INPUT",
      useValue: userInput(),
    },
  ],
})
export class AppModule {}
