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
import { MCP_CLIENT_REGISTRATIONS_TOKEN, type McpClientRegistration } from "@nestjs-ai/mcp-client";
import { McpToolCallbackProvider } from "@nestjs-ai/mcp-common";
import { ToolCallbackProvider } from "@nestjs-ai/model";
import { McpClientModule } from "@nestjs-ai/mcp-client";
import { NestAiModule } from "@nestjs-ai/platform";
import { OpenAiChatModelModule } from "@nestjs-ai/model-openai";
import { BraveStarterRunner } from "./brave-starter.runner.js";

export const BRAVE_TOOL_CALLBACK_PROVIDER = Symbol.for("BRAVE_TOOL_CALLBACK_PROVIDER");

function requireOpenAiApiKey(): string {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is required to run the sample");
  }

  return apiKey;
}

@Module({
  imports: [
    NestAiModule.forRoot(),
    McpClientModule.forRoot({
      name: "mcp-brave-starter",
      version: "0.0.1",
      stdio: {
        serversConfiguration: "./mcp-servers-config.json",
      },
    }),
    ChatClientModule.forFeature({
      imports: [
        OpenAiChatModelModule.forFeatureAsync({
          useFactory: async () => ({
            apiKey: requireOpenAiApiKey(),
            options: {
              model: process.env.OPENAI_MODEL ?? "gpt-4o",
              temperature: 0,
              maxTokens: 1200,
            },
          }),
        }),
      ],
    }),
  ],
  providers: [
    BraveStarterRunner,
    {
      provide: BRAVE_TOOL_CALLBACK_PROVIDER,
      useFactory: async (registrations: McpClientRegistration[]): Promise<ToolCallbackProvider> => {
        const mcpClients = registrations.map((entry) => entry.mcpClient);
        const toolCallbacks = await McpToolCallbackProvider.toolCallbacks(mcpClients);
        return ToolCallbackProvider.from(toolCallbacks);
      },
      inject: [MCP_CLIENT_REGISTRATIONS_TOKEN],
    },
  ],
  exports: [BraveStarterRunner],
})
export class AppModule {}
