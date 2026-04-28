import { Inject, Injectable } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import { CHAT_MODEL_TOKEN } from "@nestjs-ai/commons";
import type { ChatModel } from "@nestjs-ai/model";

/**
 * Implements the Parallelization Workflow pattern for efficient concurrent
 * processing of multiple LLM operations. This pattern enables parallel
 * execution of LLM calls with automated output aggregation, significantly
 * improving throughput for batch processing scenarios.
 *
 * <p>The pattern manifests in two key variations:</p>
 *
 * <ul>
 * <li><b>Sectioning</b>: Decomposes a complex task into independent subtasks
 * that can be processed concurrently. For example, analyzing different
 * sections of a document simultaneously.</li>
 * <li><b>Voting</b>: Executes identical prompts multiple times in parallel to
 * gather diverse perspectives or implement majority voting mechanisms. This is
 * particularly useful for validation or consensus-building tasks.</li>
 * </ul>
 *
 * <p><b>Key Benefits:</b></p>
 * <ul>
 * <li>Improved throughput through concurrent processing</li>
 * <li>Better resource utilization of LLM API capacity</li>
 * <li>Reduced overall processing time for batch operations</li>
 * <li>Enhanced result quality through multiple perspectives (in voting scenarios)</li>
 * </ul>
 *
 * <p><b>When to Use:</b></p>
 * <ul>
 * <li>Processing large volumes of similar but independent items</li>
 * <li>Tasks requiring multiple independent perspectives or validations</li>
 * <li>Scenarios where processing time is critical and tasks are parallelizable</li>
 * <li>Complex operations that can be decomposed into independent subtasks</li>
 * </ul>
 *
 * <p><b>Implementation Considerations:</b></p>
 * <ul>
 * <li>Ensure tasks are truly independent to avoid consistency issues</li>
 * <li>Consider API rate limits when determining parallel execution capacity</li>
 * <li>Monitor resource usage (memory, CPU) when scaling parallel operations</li>
 * <li>Implement appropriate error handling for parallel task failures</li>
 * </ul>
 *
 * @see ChatClient
 */
@Injectable()
export class ParallelizationWorkflow {
  private readonly chatClient: ChatClient;

  /**
   * Constructs a new parallelization workflow with the specified chat model.
   *
   * @param chatModel the NestJS AI chat model used to make LLM calls
   */
  constructor(
    @Inject(CHAT_MODEL_TOKEN)
    chatModel: ChatModel,
  ) {
    this.chatClient = ChatClient.create(chatModel);
  }

  /**
   * Processes multiple inputs concurrently using a fixed worker pool and the
   * same prompt template. This method maintains the order of results
   * corresponding to the input order.
   *
   * @param prompt The prompt template to use for each input. The input will be
   * appended to this prompt.
   * @param inputs List of input strings to process. Each input will be
   * processed independently in parallel.
   * @param nWorkers The number of concurrent worker threads to use. This
   * controls the maximum number of simultaneous LLM API calls.
   * @return List of processed results in the same order as the inputs.
   * @throws Error if prompt is null, inputs is empty, or nWorkers <= 0
   */
  async parallel(
    prompt: string,
    inputs: readonly string[],
    nWorkers: number,
  ): Promise<string[]> {
    if (!prompt) {
      throw new Error("Prompt cannot be null");
    }
    if (!inputs.length) {
      throw new Error("Inputs list cannot be empty");
    }
    if (nWorkers <= 0) {
      throw new Error("Number of workers must be greater than 0");
    }

    const results: string[] = new Array(inputs.length);
    let nextIndex = 0;
    const workerCount = Math.min(nWorkers, inputs.length);

    const workers = Array.from({ length: workerCount }, async () => {
      while (true) {
        const index = nextIndex;
        nextIndex += 1;

        if (index >= inputs.length) {
          break;
        }

        const input = inputs[index];

        try {
          const response = await this.chatClient
            .prompt(`${prompt}\nInput: ${input}`)
            .call()
            .content();

          if (response == null) {
            throw new Error("Empty response returned from chat client");
          }

          results[index] = response;
        } catch (error) {
          throw new Error(`Failed to process input: ${input}`, { cause: error });
        }
      }
    });

    await Promise.all(workers);

    return results;
  }
}
