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

import { Inject, Injectable } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import { CHAT_CLIENT_BUILDER_TOKEN } from "@nestjs-ai/commons";
import type { ToolCallbackProvider } from "@nestjs-ai/model";
import { BRAVE_TOOL_CALLBACK_PROVIDER } from "./app.module.js";

@Injectable()
export class BraveStarterRunner {
  constructor(
    @Inject(CHAT_CLIENT_BUILDER_TOKEN)
    private readonly chatClientBuilder: ChatClient.Builder,
    @Inject(BRAVE_TOOL_CALLBACK_PROVIDER)
    private readonly toolCallbackProvider: ToolCallbackProvider,
  ) {}

  async run(): Promise<void> {
    const chatClient = this.chatClientBuilder
      .defaultToolCallbackProviders(this.toolCallbackProvider)
      .build();

    const question =
      "Does Spring AI support the Model Context Protocol? Please provide some references.";

    console.log(`QUESTION: ${question}`);
    console.log(`ASSISTANT: ${(await chatClient.prompt(question).call().content()) ?? ""}`);
  }
}
