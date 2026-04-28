import { Inject, Injectable } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import { CHAT_MODEL_TOKEN } from "@nestjs-ai/commons";
import type { ChatModel } from "@nestjs-ai/model";

export interface ChainWorkflowStepResult {
  index: number;
  output: string;
}

export interface ChainWorkflowResult {
  input: string;
  steps: ChainWorkflowStepResult[];
  output: string;
}

/**
 * Implements the Prompt Chaining workflow pattern for decomposing complex tasks
 * into a sequence of LLM calls where each step processes the output of the
 * previous one.
 *
 * <p>
 * This implementation demonstrates a four-step workflow for processing
 * numerical data in text:
 * <ol>
 * <li>Extract numerical values and metrics</li>
 * <li>Standardize to percentage format</li>
 * <li>Sort in descending order</li>
 * <li>Format as markdown table</li>
 * </ol>
 *
 * <p />
 * When to use this workflow: This workflow is ideal for situations where the
 * task can be easily and cleanly decomposed into fixed subtasks. The main goal
 * is to trade off latency for higher accuracy, by making each LLM call an
 * easier task.
 *
 * @see ChatClient
 */
@Injectable()
export class ChainWorkflowService {
  private static readonly DEFAULT_SYSTEM_PROMPTS = [
    `Extract only the numerical values and their associated metrics from the text.
					Format each as'value: metric' on a new line.
					Example format:
					92: customer satisfaction
					45%: revenue growth`,
    `Convert all numerical values to percentages where possible.
					If not a percentage or points, convert to decimal (e.g., 92 points -> 92%).
					Keep one number per line.
					Example format:
					92%: customer satisfaction
					45%: revenue growth`,
    `Sort all lines in descending order by numerical value.
					Keep the format 'value: metric' on each line.
					Example:
					92%: customer satisfaction
					87%: employee satisfaction`,
    `Format the sorted data as a markdown table with columns:
					| Metric | Value |
					|:--|--:|
					| Customer Satisfaction | 92% | `,
  ] as const;

  private readonly chatClient: ChatClient;

  /**
   * Constructs a new instance of the Prompt Chaining workflow with the
   * specified chat client and default system prompts.
   *
   * @param chatClient the NestJS AI chat client used to make LLM calls
   */
  constructor(
    @Inject(CHAT_MODEL_TOKEN)
    chatModel: ChatModel,
  ) {
    this.chatClient = ChatClient.create(chatModel);
  }

  /**
   * Executes the prompt chaining workflow by processing the input text through
   * a series of LLM calls, where each call's output becomes the input for the
   * next step.
   *
   * <p>
   * The method collects the intermediate results after each step to show the
   * progression of transformations through the chain.
   *
   * @param input the input text containing numerical data to be processed
   * @return the final output after all steps have been executed
   */
  async run(input: string): Promise<ChainWorkflowResult> {
    const steps: ChainWorkflowStepResult[] = [];
    let response = input.trim();

    for (const [index, systemPrompt] of ChainWorkflowService.DEFAULT_SYSTEM_PROMPTS.entries()) {
      // 1. Compose the input using the response from the previous step.
      const output = await this.chatClient
        .prompt()
        .system(systemPrompt)
        .user(response)
        .call()
        .content();

      if (output == null || output.trim() === "") {
        throw new Error(`Chain step ${index + 1} returned an empty response`);
      }

      // 2. Call the chat client with the new input and get the new response.
      response = output.trim();
      steps.push({
        index: index + 1,
        output: response,
      });
    }

    return {
      input,
      steps,
      output: response,
    };
  }
}
