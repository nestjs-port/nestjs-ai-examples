import { Injectable } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import type { ChatModel } from "@nestjs-ai/model";
import { InjectChatModel } from "@nestjs-ai/platform";

/**
 * Workflow: <b>Evaluator-optimizer</b>
 *
 * <p/>
 * Implements the Evaluator-Optimizer workflow pattern for Large Language Model
 * (LLM) interactions. This workflow orchestrates a dual-LLM process where one
 * model generates responses while another provides evaluation and feedback in
 * an iterative loop, similar to a human writer's iterative refinement process.
 *
 * <p>
 * The workflow consists of two main components:
 * <ul>
 * <li>A generator LLM that produces initial responses and refines them based
 * on feedback</li>
 * <li>An evaluator LLM that analyzes responses and provides detailed feedback
 * for improvement</li>
 * </ul>
 *
 * <b>Usage Criteria</b>
 * This workflow is particularly effective in scenarios that meet the following
 * conditions:
 * <ul>
 * <li>Clear evaluation criteria exist for assessing response quality</li>
 * <li>Iterative refinement provides measurable value to the output</li>
 * <li>The task benefits from multiple rounds of critique and improvement</li>
 * </ul>
 *
 * <b>Fitness Indicators</b>
 * Two key indicators suggest this workflow is appropriate:
 * <ul>
 * <li>LLM responses can be demonstrably improved when feedback is articulated</li>
 * <li>The evaluator LLM can provide substantive and actionable feedback</li>
 * </ul>
 *
 * <b>Example Applications</b>
 * <ul>
 * <li>Literary translation requiring capture of subtle nuances through iterative refinement</li>
 * <li>Complex search tasks needing multiple rounds of searching and analysis</li>
 * <li>Code generation where quality can be improved through systematic review</li>
 * <li>Content creation requiring multiple drafts and specific improvements</li>
 * </ul>
 *
 * @see ChatClient
 */
export interface Generation {
  /**
   * The model's understanding of the task and feedback.
   */
  thoughts: string;

  /**
   * The model's proposed solution.
   */
  response: string;
}

export enum Evaluation {
  PASS = "PASS",
  NEEDS_IMPROVEMENT = "NEEDS_IMPROVEMENT",
  FAIL = "FAIL",
}

export interface EvaluationResponse {
  /**
   * The evaluation result.
   */
  evaluation: Evaluation;

  /**
   * Detailed feedback for improvement.
   */
  feedback: string;
}

export interface RefinedResponse {
  /**
   * The final solution.
   */
  solution: string;

  /**
   * The chain of thought showing the evolution of the solution.
   */
  chainOfThought: Generation[];
}

const GENERATION_SCHEMA = {
  type: "object",
  properties: {
    thoughts: { type: "string" },
    response: { type: "string" },
  },
  required: ["thoughts", "response"],
  additionalProperties: false,
} as const;

const EVALUATION_SCHEMA = {
  type: "object",
  properties: {
    evaluation: {
      type: "string",
      enum: ["PASS", "NEEDS_IMPROVEMENT", "FAIL"],
    },
    feedback: { type: "string" },
  },
  required: ["evaluation", "feedback"],
  additionalProperties: false,
} as const;

@Injectable()
export class EvaluatorOptimizer {
  static readonly DEFAULT_GENERATOR_PROMPT = `Your goal is to complete the task based on the input. If there are feedback
from your previous generations, you should reflect on them to improve your solution.

CRITICAL: Your response must be a SINGLE LINE of valid JSON with NO LINE BREAKS except those explicitly escaped with \\n.
Here is the exact format to follow, including all quotes and braces:

{"thoughts":"Brief description here","response":"public class Example {\\n    // Code here\\n}"}

Rules for the response field:
1. ALL line breaks must use \\n
2. ALL quotes must use \\\"
3. ALL backslashes must be doubled: \\\\
4. NO actual line breaks or formatting - everything on one line
5. NO tabs or special characters
6. Java code must be complete and properly escaped

Example of properly formatted response:
{"thoughts":"Implementing counter","response":"public class Counter {\\n    private int count;\\n    public Counter() {\\n        count = 0;\\n    }\\n    public void increment() {\\n        count++;\\n    }\\n}"}

Follow this format EXACTLY - your response must be valid JSON on a single line.`;

  static readonly DEFAULT_EVALUATOR_PROMPT = `Evaluate this code implementation for correctness, time complexity, and best practices.
Ensure the code have proper javadoc documentation.
Respond with EXACTLY this JSON format on a single line:

{"evaluation":"PASS, NEEDS_IMPROVEMENT, or FAIL", "feedback":"Your feedback here"}

The evaluation field must be one of: "PASS", "NEEDS_IMPROVEMENT", "FAIL"
Use "PASS" only if all criteria are met with no improvements needed.`;

  private readonly chatClient: ChatClient;
  private readonly generatorPrompt: string;
  private readonly evaluatorPrompt: string;

  constructor(
    @InjectChatModel()
    chatModel: ChatModel,
    generatorPrompt = EvaluatorOptimizer.DEFAULT_GENERATOR_PROMPT,
    evaluatorPrompt = EvaluatorOptimizer.DEFAULT_EVALUATOR_PROMPT,
  ) {
    if (generatorPrompt.trim() === "") {
      throw new Error("Generator prompt must not be empty");
    }
    if (evaluatorPrompt.trim() === "") {
      throw new Error("Evaluator prompt must not be empty");
    }

    this.chatClient = ChatClient.create(chatModel);
    this.generatorPrompt = generatorPrompt;
    this.evaluatorPrompt = evaluatorPrompt;
  }

  /**
   * Initiates the evaluator-optimizer workflow for a given task. This method
   * orchestrates the iterative process of generation and evaluation until a
   * satisfactory solution is reached.
   *
   * <p>
   * The workflow follows these steps:
   * </p>
   * <ol>
   * <li>Generate an initial solution</li>
   * <li>Evaluate the solution against quality criteria</li>
   * <li>If evaluation passes, return the solution</li>
   * <li>If evaluation indicates need for improvement, incorporate feedback and
   * generate new solution</li>
   * <li>Repeat steps 2-4 until a satisfactory solution is achieved</li>
   * </ol>
   *
   * @param task The task or problem to be solved through iterative refinement
   * @return A RefinedResponse containing the final solution and the chain of
   * thought showing the evolution of the solution
   */
  async loop(task: string): Promise<RefinedResponse> {
    const memory: string[] = [];
    const chainOfThought: Generation[] = [];

    return this.loopInternal(task, "", memory, chainOfThought);
  }

  private async loopInternal(
    task: string,
    context: string,
    memory: string[],
    chainOfThought: Generation[],
  ): Promise<RefinedResponse> {
    const generation = await this.generate(task, context);
    memory.push(generation.response);
    chainOfThought.push(generation);

    const evaluationResponse = await this.evaluate(generation.response, task);

    if (evaluationResponse.evaluation === Evaluation.PASS) {
      return {
        solution: generation.response,
        chainOfThought,
      };
    }

    let newContext = "Previous attempts:";
    for (const attempt of memory) {
      newContext += `\n- ${attempt}`;
    }
    newContext += `\nFeedback: ${evaluationResponse.feedback}`;

    return this.loopInternal(task, newContext, memory, chainOfThought);
  }

  /**
   * Generates or refines a solution based on the given task and feedback
   * context.
   *
   * @param task The primary task or problem to be solved
   * @param context Previous attempts and feedback for iterative improvement
   * @return A Generation containing the model's thoughts and proposed solution
   */
  private async generate(task: string, context: string): Promise<Generation> {
    const prompt = `${this.generatorPrompt}\n${context}\nTask: ${task}`;
    const generationResponse = await this.chatClient
      .prompt(prompt)
      .call()
      .entity(GENERATION_SCHEMA);

    if (generationResponse == null) {
      throw new Error("Failed to generate solution");
    }

    console.log(
      `\n=== GENERATOR OUTPUT ===\nTHOUGHTS: ${generationResponse.thoughts}\n\nRESPONSE:\n ${generationResponse.response}\n`,
    );

    return generationResponse;
  }

  /**
   * Evaluates if a solution meets the specified requirements and quality
   * criteria.
   *
   * @param content The solution content to be evaluated
   * @param task The original task against which to evaluate the solution
   * @return An EvaluationResponse containing the evaluation result
   * and detailed feedback for improvement
   */
  private async evaluate(content: string, task: string): Promise<EvaluationResponse> {
    const prompt = `${this.evaluatorPrompt}\nOriginal task: ${task}\nContent to evaluate: ${content}`;
    const evaluationResponse = await this.chatClient
      .prompt(prompt)
      .call()
      .entity(EVALUATION_SCHEMA);

    if (evaluationResponse == null) {
      throw new Error("Failed to evaluate solution");
    }

    const typedResponse: EvaluationResponse = {
      evaluation: evaluationResponse.evaluation as Evaluation,
      feedback: evaluationResponse.feedback,
    };

    console.log(
      `\n=== EVALUATOR OUTPUT ===\nEVALUATION: ${typedResponse.evaluation}\n\nFEEDBACK: ${typedResponse.feedback}\n`,
    );

    return typedResponse;
  }
}
