import {
  type CallAdvisor,
  type CallAdvisorChain,
  type ChatClientRequest,
  type ChatClientResponse,
} from "@nestjs-ai/client-chat";

export class MyLogAdvisor implements CallAdvisor {
  constructor(private readonly advisorOrder: number = 0) {}

  get name(): string {
    return "My Log Advisor";
  }

  get order(): number {
    return this.advisorOrder;
  }

  async adviseCall(
    chatClientRequest: ChatClientRequest,
    callAdvisorChain: CallAdvisorChain,
  ): Promise<ChatClientResponse> {
    this.print("REQUEST", chatClientRequest.prompt.instructions);

    const response = await callAdvisorChain.nextCall(chatClientRequest);

    this.print("RESPONSE", response.chatResponse?.results ?? response.chatResponse?.result ?? null);

    return response;
  }

  private print(label: string, value: unknown): void {
    console.log(`${label}:${this.toJsonString(value)}\n`);
  }

  private toJsonString(value: unknown): string {
    try {
      return JSON.stringify(value);
    } catch {
      return String(value);
    }
  }
}
