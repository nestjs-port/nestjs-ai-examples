import { Inject, Injectable } from "@nestjs/common";
import { ChatClient } from "@nestjs-ai/client-chat";
import { CHAT_MODEL_TOKEN } from "@nestjs-ai/commons";
import type { ChatModel } from "@nestjs-ai/model";
import type { RoutingResponse } from "./routing-response";

const ROUTING_RESPONSE_SCHEMA = {
  type: "object",
  properties: {
    reasoning: { type: "string" },
    selection: { type: "string" },
  },
  required: ["reasoning", "selection"],
  additionalProperties: false,
} as const;

/**
 * Implements the Routing workflow pattern that classifies input and directs it
 * to specialized followup tasks. This workflow enables separation of concerns
 * by routing different types of inputs to specialized prompts and processes
 * optimized for specific categories.
 *
 * <p>
 * The routing workflow is particularly effective for complex tasks where:
 * <ul>
 * <li>There are distinct categories of input that are better handled separately</li>
 * <li>Classification can be handled accurately by an LLM or traditional
 * classification model</li>
 * <li>Different types of input require different specialized processing or
 * expertise</li>
 * </ul>
 *
 * <p>
 * Common use cases include:
 * <ul>
 * <li>Customer support systems routing different types of queries (billing,
 * technical, etc.)</li>
 * <li>Content moderation systems routing content to appropriate review
 * processes</li>
 * <li>Query optimization by routing simple/complex questions to different model
 * capabilities</li>
 * </ul>
 *
 * <p>
 * This implementation allows for dynamic routing based on content
 * classification, with each route having its own specialized prompt optimized
 * for specific types of input.
 *
 * <p />
 * Implementation uses structured output to convert the chat client response
 * into a structured {@link RoutingResponse} object.
 *
 * @see ChatClient
 */
@Injectable()
export class RoutingWorkflow {
  private readonly chatClient: ChatClient;

  constructor(
    @Inject(CHAT_MODEL_TOKEN)
    chatModel: ChatModel,
  ) {
    this.chatClient = ChatClient.create(chatModel);
  }

  /**
   * Routes input to a specialized prompt based on content classification. This
   * method first analyzes the input to determine the most appropriate route,
   * then processes the input using the specialized prompt for that route.
   *
   * <p>
   * The routing process involves:
   * <ol>
   * <li>Content analysis to determine the appropriate category</li>
   * <li>Selection of a specialized prompt optimized for that category</li>
   * <li>Processing the input with the selected prompt</li>
   * </ol>
   *
   * <p>
   * This approach allows for:
   * <ul>
   * <li>Better handling of diverse input types</li>
   * <li>Optimization of prompts for specific categories</li>
   * <li>Improved accuracy through specialized processing</li>
   * </ul>
   *
   * @param input The input text to be routed and processed
   * @param routes Map of route names to their corresponding specialized prompts
   * @return Processed response from the selected specialized route
   */
  async route(input: string, routes: ReadonlyMap<string, string>): Promise<string> {
    if (!input) {
      throw new Error("Input text cannot be null");
    }
    if (routes.size === 0) {
      throw new Error("Routes map cannot be null or empty");
    }

    const routeKey = await this.determineRoute(input, routes.keys());
    const selectedPrompt = routes.get(routeKey);

    if (selectedPrompt == null) {
      throw new Error(`Selected route '${routeKey}' not found in routes map`);
    }

    const response = await this.chatClient
      .prompt(`${selectedPrompt}\nInput: ${input}`)
      .call()
      .content();

    if (response == null) {
      throw new Error("Empty response returned from chat client");
    }

    return response;
  }

  /**
   * Analyzes the input content and determines the most appropriate route based
   * on content classification. The classification process considers key terms,
   * context, and patterns in the input to select the optimal route.
   *
   * <p>
   * The method uses an LLM to:
   * <ul>
   * <li>Analyze the input content and context</li>
   * <li>Consider the available routing options</li>
   * <li>Provide reasoning for the routing decision</li>
   * <li>Select the most appropriate route</li>
   * </ul>
   *
   * @param input The input text to analyze for routing
   * @param availableRoutes The set of available routing options
   * @return The selected route key based on content analysis
   */
  private async determineRoute(
    input: string,
    availableRoutes: IterableIterator<string>,
  ): Promise<string> {
    const routesList = Array.from(availableRoutes);
    console.log("\nAvailable routes: " + routesList);

    const selectorPrompt = `Analyze the input and select the most appropriate support team from these options: ${routesList}
First explain your reasoning, then provide your selection in this JSON format:

\\{
    "reasoning": "Brief explanation of why this ticket should be routed to a specific team.
                Consider key terms, user intent, and urgency level.",
    "selection": "The chosen team name"
\\}

Input: ${input}`;

    const routingResponse = await this.chatClient
      .prompt(selectorPrompt)
      .call()
      .entity(ROUTING_RESPONSE_SCHEMA as typeof ROUTING_RESPONSE_SCHEMA);

    if (routingResponse == null) {
      throw new Error("Failed to determine route");
    }

    const typedResponse = routingResponse as RoutingResponse;
    console.log(
      `Routing Analysis:${typedResponse.reasoning}\nSelected route: ${typedResponse.selection}`,
    );

    return typedResponse.selection;
  }
}
