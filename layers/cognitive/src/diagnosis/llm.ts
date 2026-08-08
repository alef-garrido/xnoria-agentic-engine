// ==============================================================================
// Exnoria · Cognitive · Diagnosis LLM calls
// Structured LLM output via a single forced function tool — the same pattern
// the specialists use for actions, guaranteed to return JSON we can validate.
// ==============================================================================
import OpenAI from "openai";
import { createLLMClientWithFallback } from "../shared/llm-fallback";
import { languageInstruction } from "../i18n/strings";
import { createLogger } from "../../../shared/logging";
import { DiagnosisResult, PlanItem } from "./types";

const logger = createLogger("diagnosis-llm", "cognitive");

export interface LLMResult<T> {
  value: T;
  model: string;
  provider: string;
}

// ---------------------------------------------------------------------------
// Tool schemas (OpenAI function-call format)
// ---------------------------------------------------------------------------
const DIAGNOSIS_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "submit_diagnosis",
    description:
      "Submit the structured diagnosis for a single lead: per-stage health scores, matched Compass findings with evidence, and an operator-facing summary.",
    parameters: {
      type: "object",
      properties: {
        stage_health: {
          type: "array",
          items: {
            type: "object",
            properties: {
              stage: {
                type: "string",
                description: "Journey stage: ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP",
              },
              score: {
                type: "number",
                description: "Health score 0-1 (1 = healthy, 0 = critical)",
              },
            },
            required: ["stage", "score"],
          },
        },
        findings: {
          type: "array",
          items: {
            type: "object",
            properties: {
              signal_id: { type: "string", description: "Compass signal ID, e.g. ONB_FRC_01" },
              severity: { type: "number", description: "Effective severity 0-1" },
              confidence: { type: "number", description: "Confidence in this finding 0-1" },
              evidence: { type: "string", description: "Short operator-facing evidence note" },
              intervention_ids: {
                type: "array",
                items: { type: "string" },
                description: "Compass intervention IDs that fit this finding",
              },
            },
            required: ["signal_id", "severity", "confidence", "evidence"],
          },
        },
        summary: { type: "string", description: "Two-sentence operator-facing diagnosis summary" },
        low_data: { type: "boolean", description: "True when evidence about this contact is thin" },
      },
      required: ["stage_health", "findings", "summary", "low_data"],
    },
  },
};

const PLAN_TOOL: OpenAI.ChatCompletionTool = {
  type: "function",
  function: {
    name: "submit_action_plan",
    description:
      "Submit a prioritized action plan for a lead: ranked actionable items drawn from the allowlist provided, each mapped to a Compass finding.",
    parameters: {
      type: "object",
      properties: {
        items: {
          type: "array",
          items: {
            type: "object",
            properties: {
              action_id: {
                type: "string",
                description: "Allowlisted action ID, e.g. onb.contact.nudge",
              },
              signal_id: { type: "string", description: "Compass signal this action addresses" },
              priority: {
                type: "string",
                enum: ["P0", "P1", "P2"],
                description: "P0 = immediate, P1 = soon, P2 = consider",
              },
              rationale: { type: "string", description: "Why this action for this lead" },
              expected_outcome: { type: "string", description: "Expected outcome of the action" },
              payload: {
                type: "object",
                description: "Tool arguments for the action (message, document_type, etc.)",
              },
            },
            required: ["action_id", "signal_id", "priority", "rationale", "expected_outcome"],
          },
        },
      },
      required: ["items"],
    },
  },
};

// ---------------------------------------------------------------------------
// One-shot structured call helper
// ---------------------------------------------------------------------------
async function callStructured<T>(
  systemPrompt: string,
  userContext: string,
  tool: OpenAI.ChatCompletionTool,
  toolName: string
): Promise<LLMResult<T>> {
  const clientConfig = await createLLMClientWithFallback();
  const llm = clientConfig.client as OpenAI;
  logger.info(
    { model: clientConfig.model, provider: clientConfig.provider },
    "Diagnosis LLM ready"
  );

  const completion = await llm.chat.completions.create({
    model: clientConfig.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userContext },
    ],
    tools: [tool],
    tool_choice: { type: "function", function: { name: toolName } },
  });

  const message = completion.choices[0]?.message;
  const call = message?.tool_calls?.[0];

  if (!call?.function.arguments) {
    throw new Error("LLM returned no structured output");
  }

  const value = JSON.parse(call.function.arguments) as T;
  return { value, model: clientConfig.model, provider: clientConfig.provider };
}

// ---------------------------------------------------------------------------
// Diagnosis
// ---------------------------------------------------------------------------

export async function callDiagnosis(context: string): Promise<LLMResult<DiagnosisResult>> {
  const systemPrompt = `${languageInstruction()}

You are Xnoria's CX Diagnostic Specialist. You produce a structured, per-lead diagnosis grounded in the CX Diagnostic Compass framework.

Rules:
- Only cite signal IDs that exist in the signal catalog you are given. Never invent signal codes.
- A finding requires evidence: a matching live signal event, a prior intervention pattern, or clearly inferable context. Empty evidence = empty findings.
- severity and confidence are 0–1 decimals. Prefer the catalog severity unless the evidence justifies an override.
- stage_health covers ALL eight stages; a stage with no evidence defaults to a neutral score.
- If evidence is thin, set low_data to true and keep findings minimal — do not hallucinate.
- The summary is for a CX operator. Be specific and actionable.`;

  const res = await callStructured<DiagnosisResult>(
    systemPrompt,
    context,
    DIAGNOSIS_TOOL,
    "submit_diagnosis"
  );
  return res;
}

// ---------------------------------------------------------------------------
// Action plan
// ---------------------------------------------------------------------------

export async function callPlan(context: string): Promise<LLMResult<{ items: PlanItem[] }>> {
  const systemPrompt = `${languageInstruction()}

You are Xnoria's CX Planning Agent. Given a completed diagnosis and an allowlist of executable actions, build a prioritized action plan for this single lead.

Rules:
- Only use action IDs that appear in the ALLOWLIST section of the context. Never invent actions.
- Keep the plan focused: at most 3 items, sorted by priority (P0 first).
- Each item must reference the signal_id it addresses. P0 = urgent/risky, P1 = standard, P2 = nice-to-have.
- The payload carries the arguments the action needs (contact identification is added automatically — do not include contact_id or email in it).
- The plan is executed through a governance filter: HITL-flagged actions pause for operator approval. Prioritize automated actions where they solve the same problem.`;

  return callStructured<{ items: PlanItem[] }>(
    systemPrompt,
    context,
    PLAN_TOOL,
    "submit_action_plan"
  );
}
