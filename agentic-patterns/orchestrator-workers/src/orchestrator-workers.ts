import { Injectable } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import type { ChatModel } from "@nestjs-ai/model";
import { InjectChatModel } from "@nestjs-ai/platform";

/**
 * Pattern: <b>Orchestrator-workers</b>
 *
 * <p>
 * In this pattern, a central LLM (the orchestrator) dynamically breaks down
 * complex tasks into subtasks, delegates them to worker LLMs, and uses a
 * synthesizer to combine their results. The orchestrator analyzes the input to
 * determine what subtasks are needed and how they should be executed, while
 * the workers focus on their specific assigned tasks. Finally, the
 * synthesizer integrates the workers' outputs into a cohesive result.
 *
 * <p/>
 * Key components:
 * <ul>
 * <li>Orchestrator: Central LLM that analyzes tasks and determines required
 * subtasks</li>
 * <li>Workers: Specialized LLMs that execute specific subtasks</li>
 * <li>Synthesizer: Component that combines worker outputs into final
 * result</li>
 * </ul>
 *
 * <p/>
 * When to use: This pattern is well-suited for complex tasks where you can't
 * predict the subtasks needed upfront.
 * For example:
 * <ul>
 * <li>Coding tasks where the number of files to change and nature of changes
 * depend on the specific request</li>
 * <li>Search tasks that involve gathering and analyzing information from
 * multiple sources</li>
 * </ul>
 *
 * <p/>
 * While topographically similar to parallelization, the key difference is its
 * flexibility - subtasks aren't pre-defined, but dynamically determined by the
 * orchestrator based on the specific input. This makes it particularly
 * effective for tasks that require adaptive problem-solving and coordination
 * between multiple specialized components.
 *
 * @see ChatClient
 */
export interface Task {
  /**
   * The type or category of the task (e.g., "formal", "conversational").
   */
  type: string;

  /**
   * Detailed description of what the worker should accomplish.
   */
  description: string;
}

export interface OrchestratorResponse {
  /**
   * Detailed explanation of the task and how different approaches serve its
   * aspects.
   */
  analysis: string;

  /**
   * List of subtasks identified by the orchestrator to be executed by workers.
   */
  tasks: Task[];
}

export interface FinalResponse {
  /**
   * The orchestrator's understanding and breakdown of the original task.
   */
  analysis: string;

  /**
   * Responses from workers, each handling a specific subtask.
   */
  workerResponses: string[];
}

const ORCHESTRATOR_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    analysis: { type: "string" },
    tasks: {
      type: "array",
      items: {
        type: "object",
        properties: {
          type: { type: "string" },
          description: { type: "string" },
        },
        required: ["type", "description"],
        additionalProperties: false,
      },
    },
  },
  required: ["analysis", "tasks"],
  additionalProperties: false,
} as const;

@Injectable()
export class OrchestratorWorkers {
  private readonly chatClient: ChatClient;
  private readonly orchestratorPrompt: string;
  private readonly workerPrompt: string;

  static readonly DEFAULT_ORCHESTRATOR_PROMPT = `Analyze this task and break it down into 2-3 distinct approaches:

Task: {task}

Return your response in this JSON format:
\\{
"analysis": "Explain your understanding of the task and which variations would be valuable.
             Focus on how each approach serves different aspects of the task.",
"tasks": [
	\\{
	"type": "formal",
	"description": "Write a precise, technical version that emphasizes specifications"
	\\},
	\\{
	"type": "conversational",
	"description": "Write an engaging, friendly version that connects with readers"
	\\}
]
\\}`;

  static readonly DEFAULT_WORKER_PROMPT = `Generate content based on:
Task: {original_task}
Style: {task_type}
Guidelines: {task_description}`;

  /**
   * Creates a new OrchestratorWorkers with default prompts.
   *
   * @param chatClient The ChatClient to use for LLM interactions
   */
  constructor(
    @InjectChatModel()
    chatModel: ChatModel,
    orchestratorPrompt = OrchestratorWorkers.DEFAULT_ORCHESTRATOR_PROMPT,
    workerPrompt = OrchestratorWorkers.DEFAULT_WORKER_PROMPT,
  ) {
    if (orchestratorPrompt.trim() === "") {
      throw new Error("Orchestrator prompt must not be empty");
    }
    if (workerPrompt.trim() === "") {
      throw new Error("Worker prompt must not be empty");
    }

    this.chatClient = ChatClient.create(chatModel);
    this.orchestratorPrompt = orchestratorPrompt;
    this.workerPrompt = workerPrompt;
  }

  /**
   * Processes a task using the orchestrator-workers pattern. First, the
   * orchestrator analyzes the task and breaks it down into subtasks. Then,
   * workers execute each subtask in parallel. Finally, the results are combined
   * into a single response.
   *
   * @param taskDescription Description of the task to be processed
   * @return FinalResponse containing the orchestrator's analysis and combined
   * worker outputs
   * @throws Error if taskDescription is null or empty
   */
  async process(taskDescription: string): Promise<FinalResponse> {
    if (taskDescription.trim() === "") {
      throw new Error("Task description must not be empty");
    }

    const orchestratorPrompt = this.renderPrompt(this.orchestratorPrompt, {
      task: taskDescription,
    });

    const orchestratorResponse = await this.chatClient
      .prompt(orchestratorPrompt)
      .call()
      .entity(ORCHESTRATOR_RESPONSE_SCHEMA);

    if (orchestratorResponse == null) {
      throw new Error("Failed to parse orchestrator response");
    }

    console.log(
      `\n=== ORCHESTRATOR OUTPUT ===\nANALYSIS: ${orchestratorResponse.analysis}\n\nTASKS: ${JSON.stringify(orchestratorResponse.tasks, null, 2)}\n`,
    );

    const workerResponses = await Promise.all(
      orchestratorResponse.tasks.map(async (task) => {
        const workerPrompt = this.renderPrompt(this.workerPrompt, {
          original_task: taskDescription,
          task_type: task.type,
          task_description: task.description,
        });

        const response = await this.chatClient.prompt(workerPrompt).call().content();

        if (response == null) {
          throw new Error(`Failed to generate worker response for task: ${task.type}`);
        }

        return response;
      }),
    );

    console.log("\n=== WORKER OUTPUT ===\n" + JSON.stringify(workerResponses, null, 2));

    return {
      analysis: orchestratorResponse.analysis,
      workerResponses,
    };
  }

  private renderPrompt(template: string, values: Record<string, string>): string {
    let rendered = template;

    for (const [key, value] of Object.entries(values)) {
      rendered = rendered.replaceAll(`{${key}}`, value);
    }

    return rendered;
  }
}
