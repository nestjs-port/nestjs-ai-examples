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
import { NestAiModule } from "@nestjs-ai/platform";
import { OpenAiChatModelModule } from "@nestjs-ai/model-openai";
import { SqliteSimpleRunner } from "./sqlite-simple.runner.js";

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
  providers: [SqliteSimpleRunner],
  exports: [SqliteSimpleRunner],
})
export class AppModule {}
