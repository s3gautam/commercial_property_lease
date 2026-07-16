export interface AgentUsage {
  promptTokens: number;
  completionTokens: number;
  totalTokens: number;
}

export interface AgentResponse<TResult> {
  response: TResult;
  confidence: number;
  latencyMs: number;
  usage: AgentUsage;
  reasoningMetadata: Record<string, unknown>;
  validationStatus: "valid" | "invalid" | "unchecked";
}
