import { Injectable } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import type { ChatModel } from "@nestjs-ai/model";
import { InjectChatModel } from "@nestjs-ai/platform";

@Injectable()
export class OpenAiPoemService {
  private readonly chatClient: ChatClient;

  constructor(@InjectChatModel() chatModel: ChatModel) {
    this.chatClient = ChatClient.create(chatModel);
  }

  async generatePoem(prompt: string): Promise<string> {
    const response = await this.chatClient
      .prompt()
      .system("You are a poet!")
      .user(prompt)
      .call()
      .content();

    if (response == null) {
      throw new Error("OpenAI chat client returned an empty response");
    }

    return response;
  }
}
