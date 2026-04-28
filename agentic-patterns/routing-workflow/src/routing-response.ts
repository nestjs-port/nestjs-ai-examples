/**
 * Record representing the response from the routing classification process.
 *
 * <p>
 * This interface is used by the {@link RoutingWorkflow} to capture and
 * communicate routing decisions made by the LLM classifier.
 *
 * @param reasoning A detailed explanation of why a particular route was
 * chosen, considering factors like key terms, user intent, and urgency level
 * @param selection The name of the selected route that will handle the input
 *
 * @see RoutingWorkflow
 */
export interface RoutingResponse {
  /**
   * The reasoning behind the route selection, explaining why this particular
   * route was chosen based on the input analysis.
   */
  reasoning: string;

  /**
   * The selected route name that will handle the input based on the
   * classification analysis.
   */
  selection: string;
}
