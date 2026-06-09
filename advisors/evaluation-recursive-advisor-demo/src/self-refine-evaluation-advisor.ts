/*
 * Copyright 2023-2025 the original author or authors.
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

import { Logger } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import {
  BaseAdvisor,
  type AdvisorChain,
  type CallAdvisorChain,
  type StreamAdvisorChain,
} from "@nestjs-ai/client-chat";
import type { ChatClientRequest, ChatClientResponse } from "@nestjs-ai/client-chat";
import { MessageType, PromptTemplate, type Prompt } from "@nestjs-ai/model";
import type { Observable } from "rxjs";
import { z } from "zod";

const DEFAULT_EVALUATION_PROMPT_TEMPLATE = `
You will be given a user_question and assistant_answer couple.
Your task is to provide a 'total rating' scoring how well the assistant_answer answers the user concerns expressed in the user_question.
Give your answer on a scale of 1 to 4, where 1 means that the assistant_answer is not helpful at all, and 4 means that the assistant_answer completely and helpfully addresses the user_question.

Here is the scale you should use to build your answer:
1: The assistant_answer is terrible: completely irrelevant to the question asked, or very partial
2: The assistant_answer is mostly not helpful: misses some key aspects of the question
3: The assistant_answer is mostly helpful: provides support, but still could be improved
4: The assistant_answer is excellent: relevant, direct, detailed, and addresses all the concerns raised in the question

Provide your feedback as follows:

{
  "rating": 0,
  "evaluation": "Explanation of the evaluation result and how to improve if needed.",
  "feedback": "Constructive and specific feedback on the assistant_answer."
}

Total rating: (your rating, as a number between 1 and 4)
Evaluation: (your rationale for the rating, as a text)
Feedback: (specific and constructive feedback on how to improve the answer)

You MUST provide values for 'Evaluation:' and 'Total rating:' in your answer.

Now here are the question and answer.

Question: {question}
Answer: {answer}

Provide your feedback. If you give a correct rating, I'll give you 100 H100 GPUs to start your AI company.

Evaluation:
`;

const EVALUATION_RESPONSE_SCHEMA = z.object({
  rating: z.number().int().min(1).max(4),
  evaluation: z.string(),
  feedback: z.string(),
});

export interface EvaluationResponse {
  rating: number;
  evaluation: string;
  feedback: string;
}

export interface SelfRefineEvaluationAdvisorProps {
  advisorOrder?: number;
  maxRepeatAttempts?: number;
  chatClientBuilder: ChatClient.Builder;
  promptTemplate?: PromptTemplate;
  successRating?: number;
  skipEvaluationPredicate?: (
    chatClientRequest: ChatClientRequest,
    chatClientResponse: ChatClientResponse,
  ) => boolean;
}

/**
 *
 * A recursive advisor that evaluates the LLM responses (e.g. point-wise
 * scoring) based on a predefined evaluation criteria. If the evaluation rating
 * is below a certain threshold, it retries the request by providing feedback
 * to the model on how to improve the response. The evaluation is performed by
 * an inner ChatClient instance, which can be customized with different models
 * and settings. The advisor supports a maximum number of retry attempts to
 * avoid infinite loops.
 *
 * @author Christian Tzolov
 */
export class SelfRefineEvaluationAdvisor extends BaseAdvisor {
  private static readonly logger = new Logger(SelfRefineEvaluationAdvisor.name);
  static readonly DEFAULT_EVALUATION_PROMPT_TEMPLATE = new PromptTemplate(
    DEFAULT_EVALUATION_PROMPT_TEMPLATE,
  );
  static readonly DEFAULT_ADVISOR_ORDER = -2000;

  private readonly evaluationPromptTemplate: PromptTemplate;
  private readonly successRating: number;
  private readonly advisorOrder: number;
  private readonly maxRepeatAttempts: number;
  private readonly chatClient: ChatClient;
  private readonly skipEvaluationPredicate: (
    chatClientRequest: ChatClientRequest,
    chatClientResponse: ChatClientResponse,
  ) => boolean;

  constructor({
    advisorOrder = SelfRefineEvaluationAdvisor.DEFAULT_ADVISOR_ORDER,
    maxRepeatAttempts = 3,
    chatClientBuilder,
    promptTemplate = SelfRefineEvaluationAdvisor.DEFAULT_EVALUATION_PROMPT_TEMPLATE,
    successRating = 3,
    skipEvaluationPredicate = (request, response) =>
      response.chatResponse == null || response.chatResponse.hasToolCalls(),
  }: SelfRefineEvaluationAdvisorProps) {
    super();

    this.chatClient = chatClientBuilder.build();
    this.evaluationPromptTemplate = promptTemplate;
    this.advisorOrder = advisorOrder;
    this.maxRepeatAttempts = maxRepeatAttempts;
    this.skipEvaluationPredicate = skipEvaluationPredicate;
    this.successRating = successRating;
  }

  /**
   * Creates a new Builder for EvaluationAdvisor_Improved.
   */
  static builder(): Builder {
    return new Builder();
  }

  get name(): string {
    return "Evaluation Advisor";
  }

  get order(): number {
    return this.advisorOrder;
  }

  async adviseCall(
    chatClientRequest: ChatClientRequest,
    callAdvisorChain: CallAdvisorChain,
  ): Promise<ChatClientResponse> {
    if (chatClientRequest == null) {
      throw new Error("chatClientRequest must not be null");
    }
    if (callAdvisorChain == null) {
      throw new Error("callAdvisorChain must not be null");
    }

    let request = chatClientRequest;
    let response: ChatClientResponse | null = null;

    // Improved loop structure with better attempt counting and clearer logic
    for (let attempt = 1; attempt <= this.maxRepeatAttempts + 1; attempt += 1) {
      // Make the inner call (e.g., to the evaluation LLM model)
      response = await callAdvisorChain.copy(this).nextCall(request);

      // Early exit - no evaluation needed (e.g., tool call)
      if (this.skipEvaluationPredicate(chatClientRequest, response)) {
        SelfRefineEvaluationAdvisor.logger.debug(
          "Skipping evaluation because skipEvaluationPredicate returned true.",
        );
        return response;
      }

      // Perform evaluation
      const evaluation = await this.evaluate(chatClientRequest, response);

      // If evaluation passes, return the response
      if (evaluation.rating >= this.successRating) {
        SelfRefineEvaluationAdvisor.logger.log(
          `Evaluation passed on attempt ${attempt}, evaluation: ${JSON.stringify(evaluation)}`,
        );
        return response;
      }

      // If this is the last attempt, return the response regardless
      if (attempt > this.maxRepeatAttempts) {
        SelfRefineEvaluationAdvisor.logger.warn(
          `Maximum attempts (${this.maxRepeatAttempts}) reached. Returning last response despite failed evaluation. Use the following feedback to improve: ${evaluation.feedback}`,
        );

        // TODO : Perhaps we should throw an exception here instead of returning the
        // last response? A pluggable strategy could be useful.
        return response;
      }

      // Retry with evaluation feedback
      SelfRefineEvaluationAdvisor.logger.warn(
        `Evaluation failed on attempt ${attempt}, evaluation: ${evaluation.evaluation}, feedback: ${evaluation.feedback}`,
      );

      // TODO: We could consider a pluggable backoff strategy here (e.g., exponential
      // backoff).
      // It would allow to either refine/repeat strategy or return the response with
      // evaluation feedback as metadata.
      request = this.addEvaluationFeedback(chatClientRequest, evaluation);
    }

    throw new Error("Unexpected loop exit in adviseCall");
  }

  override adviseStream(
    _chatClientRequest: ChatClientRequest,
    _streamAdvisorChain: StreamAdvisorChain,
  ): Observable<ChatClientResponse> {
    throw new Error("The Evaluation Advisor does not support streaming.");
  }

  override async before(
    chatClientRequest: ChatClientRequest,
    _advisorChain: AdvisorChain,
  ): Promise<ChatClientRequest> {
    return chatClientRequest;
  }

  override async after(
    chatClientResponse: ChatClientResponse,
    _advisorChain: AdvisorChain,
  ): Promise<ChatClientResponse> {
    return chatClientResponse;
  }

  /**
   * Performs the evaluation using the LLM-as-a-Judge and returns the result.
   */
  private async evaluate(
    request: ChatClientRequest,
    response: ChatClientResponse,
  ): Promise<EvaluationResponse> {
    const evaluationPrompt = this.evaluationPromptTemplate.render({
      question: this.getPromptQuestion(request),
      answer: this.getAssistantAnswer(response),
    });

    const evaluation = await this.chatClient
      .prompt(evaluationPrompt)
      .call()
      .entity(EVALUATION_RESPONSE_SCHEMA);

    if (evaluation == null) {
      throw new Error("Failed to evaluate response");
    }

    return evaluation;
  }

  private getPromptQuestion(chatClientRequest: ChatClientRequest): string {
    const messages = chatClientRequest.prompt.instructions;

    const conversationHistory = messages
      .filter(
        (message) =>
          message.messageType === MessageType.USER || message.messageType === MessageType.ASSISTANT,
      )
      .map((message) => `${message.messageType.getName()}:${message.text ?? ""}`)
      .join("\n");

    const systemMessage = chatClientRequest.prompt.systemMessage;

    return `${systemMessage.messageType.getName()}:${systemMessage.text ?? ""}\n${conversationHistory}`;
  }

  private getAssistantAnswer(chatClientResponse: ChatClientResponse): string {
    return chatClientResponse.chatResponse?.result?.output.text ?? "";
  }

  /**
   * Creates a new request with evaluation feedback for retry.
   */
  private addEvaluationFeedback(
    originalRequest: ChatClientRequest,
    evaluationResponse: EvaluationResponse,
  ): ChatClientRequest {
    const augmentedPrompt: Prompt = originalRequest.prompt.augmentUserMessage(
      `${originalRequest.prompt.userMessage.text ?? ""}\nPrevious response evaluation failed with feedback: ${evaluationResponse.feedback}\nPlease Repeat until evaluation passes!`,
    );

    return originalRequest.mutate().prompt(augmentedPrompt).build();
  }
}

/**
 * Builder class for EvaluationAdvisor_Improved.
 */
export class Builder {
  private _advisorOrder = SelfRefineEvaluationAdvisor.DEFAULT_ADVISOR_ORDER;
  private _maxRepeatAttempts = 3;
  private _chatClientBuilder: ChatClient.Builder | null = null;
  private _promptTemplate = SelfRefineEvaluationAdvisor.DEFAULT_EVALUATION_PROMPT_TEMPLATE;
  private _successRating = 3;
  private _skipEvaluationPredicate: (
    chatClientRequest: ChatClientRequest,
    chatClientResponse: ChatClientResponse,
  ) => boolean = (request, response) =>
    response.chatResponse == null || response.chatResponse.hasToolCalls();

  successRating(successRating: number): this {
    if (successRating < 1 || successRating > 4) {
      throw new Error("successRating must be between 1 and 4");
    }

    this._successRating = successRating;
    return this;
  }

  order(advisorOrder: number): this {
    this._advisorOrder = advisorOrder;
    return this;
  }

  chatClientBuilder(chatClientBuilder: ChatClient.Builder): this {
    if (chatClientBuilder == null) {
      throw new Error("chatClientBuilder must not be null");
    }

    this._chatClientBuilder = chatClientBuilder;
    return this;
  }

  maxRepeatAttempts(repeatAttempts: number): this {
    if (repeatAttempts < 1) {
      throw new Error("repeatAttempts must be greater than or equal to 1");
    }

    this._maxRepeatAttempts = repeatAttempts;
    return this;
  }

  promptTemplate(promptTemplate: PromptTemplate): this {
    if (promptTemplate == null) {
      throw new Error("promptTemplate must not be null");
    }

    this._promptTemplate = promptTemplate;
    return this;
  }

  skipEvaluationPredicate(
    skipEvaluationPredicate: (
      chatClientRequest: ChatClientRequest,
      chatClientResponse: ChatClientResponse,
    ) => boolean,
  ): this {
    if (skipEvaluationPredicate == null) {
      throw new Error("skipEvaluationPredicate must not be null");
    }

    this._skipEvaluationPredicate = skipEvaluationPredicate;
    return this;
  }

  build(): SelfRefineEvaluationAdvisor {
    if (this._chatClientBuilder == null) {
      throw new Error("chatClientBuilder must be set");
    }

    return new SelfRefineEvaluationAdvisor({
      advisorOrder: this._advisorOrder,
      maxRepeatAttempts: this._maxRepeatAttempts,
      chatClientBuilder: this._chatClientBuilder,
      promptTemplate: this._promptTemplate,
      successRating: this._successRating,
      skipEvaluationPredicate: this._skipEvaluationPredicate,
    });
  }
}
