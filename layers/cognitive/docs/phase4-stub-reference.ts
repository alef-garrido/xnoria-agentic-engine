import OpenAI from "openai";
import { v4 as uuidv4 } from "uuid";

// ==============================================================================
// Exnoria · Cognitive Stub (OpenClaw MVP)
//
// Proves the full chain: Signal → LLM → Filter → n8n → Audit Log
//
// Provider-agnostic: works with any OpenAI-compatible endpoint.
// Default: Google Gemini via its OpenAI-compatible API.
// ==============================================================================

// ------------------------------------------------------------------------------
// Config
// ------------------------------------------------------------------------------
const FILTER_URL = process.env.FILTER_URL ?? "http://filter:3000";
const LLM_BASE_URL =
  process.env.LLM_BASE_URL ?? "https://generativelanguage.googleapis.com/v1beta/openai";
const LLM_API_KEY = process.env.LLM_API_KEY;
const LLM_MODEL = process.env.LLM_MODEL ?? "gemini-2.0-flash";

if (!LLM_API_KEY) {
  console.error("[cognitive] LLM_API_KEY is required. Set it in .env");
  process.exit(1);
}

// ------------------------------------------------------------------------------
// OpenAI-compatible client
// ------------------------------------------------------------------------------
const llm = new OpenAI({
  baseURL: LLM_BASE_URL,
  apiKey: LLM_API_KEY,
});

// ------------------------------------------------------------------------------
// Hardcoded lead signal — the event that triggers the cognitive chain
// ------------------------------------------------------------------------------
const signal = {
  event: "new_lead",
  contact_id: "206132950666",
  email: "test.alef@gmail.com",
  source: "organic",
  company: "Acme Corp",
  lifecycle_stage: "subscriber",
};

// ------------------------------------------------------------------------------
// Tool → Filter action mapping
// ------------------------------------------------------------------------------
const TOOL_MAP: Record<string, { action_id: string; stage: string }> = {
  acq_lead_score: { action_id: "acq.lead.score", stage: "ACQ" },
  sal_sequence_enroll: { action_id: "sal.sequence.enroll", stage: "SAL" },
  sal_contact_prioritize: { action_id: "sal.contact.prioritize", stage: "SAL" },
};

// ------------------------------------------------------------------------------
// Tool definitions (OpenAI function-calling format)
// ------------------------------------------------------------------------------
const tools: OpenAI.ChatCompletionTool[] = [
  {
    type: "function",
    function: {
      name: "acq_lead_score",
      description:
        "Score an incoming lead using rule-based logic and apply CRM tags in HubSpot. " +
        "Use this when a new lead arrives and needs to be evaluated and tagged.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "HubSpot contact ID" },
          email: { type: "string", description: "Contact email address" },
          source: {
            type: "string",
            description: "Lead acquisition source (e.g. organic, paid, referral)",
          },
        },
        required: ["contact_id", "email", "source"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sal_sequence_enroll",
      description:
        "Enroll a contact in a sales outreach sequence and update lifecycle stage in HubSpot. " +
        "Use this when a scored lead should enter a structured sales cadence.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "HubSpot contact ID" },
          email: { type: "string", description: "Contact email address" },
          sequence: {
            type: "string",
            description: "Name or ID of the outreach sequence to enroll in",
          },
        },
        required: ["contact_id", "email"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "sal_contact_prioritize",
      description:
        "Flag a contact for immediate SDR follow-up and send a WhatsApp notification. " +
        "Use this when a lead shows high intent and needs urgent human attention.",
      parameters: {
        type: "object",
        properties: {
          contact_id: { type: "string", description: "HubSpot contact ID" },
          email: { type: "string", description: "Contact email address" },
          reason: { type: "string", description: "Why this contact should be prioritized" },
        },
        required: ["contact_id", "email"],
      },
    },
  },
];

// ------------------------------------------------------------------------------
// System prompt
// ------------------------------------------------------------------------------
const SYSTEM_PROMPT = `You are the Exnoria CX cognitive layer. Your job is to analyze incoming customer signals and decide which CX actions to execute.

You have access to three tools that map to real workflow actions:
- acq_lead_score: Score and tag new leads
- sal_sequence_enroll: Enroll leads in sales outreach sequences
- sal_contact_prioritize: Flag high-intent contacts for immediate SDR follow-up

Given the incoming signal, decide which actions are appropriate and call the corresponding tools. You may call multiple tools if the situation warrants it. Always include the contact_id and email from the signal in your tool calls.`;

// ------------------------------------------------------------------------------
// Dispatch a single action to the filter
// ------------------------------------------------------------------------------
async function dispatchToFilter(
  actionId: string,
  stage: string,
  sessionId: string,
  payload: Record<string, unknown>
): Promise<{ status: string; log_id?: string; message?: string }> {
  const body = {
    action_id: actionId,
    stage,
    session_id: sessionId,
    payload,
    meta: { triggered_by: "cognitive-stub", confidence: 1.0 },
  };

  const res = await fetch(`${FILTER_URL}/filter/execute`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  return (await res.json()) as { status: string; log_id?: string; message?: string };
}

// ------------------------------------------------------------------------------
// Main
// ------------------------------------------------------------------------------
async function main(): Promise<void> {
  const sessionId = uuidv4();

  console.log("=".repeat(72));
  console.log("[cognitive] Exnoria Cognitive Stub — Phase 4 MVP");
  console.log("=".repeat(72));
  console.log(`[cognitive] Session ID : ${sessionId}`);
  console.log(`[cognitive] LLM        : ${LLM_MODEL} @ ${LLM_BASE_URL}`);
  console.log(`[cognitive] Filter     : ${FILTER_URL}`);
  console.log(`[cognitive] Signal     : ${JSON.stringify(signal)}`);
  console.log("-".repeat(72));

  // 1. Call the LLM with the signal and tools
  console.log("[cognitive] Calling LLM for action decisions...");

  const completion = await llm.chat.completions.create({
    model: LLM_MODEL,
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      {
        role: "user",
        content: `New signal received:\n\n${JSON.stringify(signal, null, 2)}\n\nAnalyze this signal and decide which actions to execute.`,
      },
    ],
    tools,
    tool_choice: "auto",
  });

  const choice = completion.choices[0];

  if (!choice.message.tool_calls || choice.message.tool_calls.length === 0) {
    console.log("[cognitive] LLM returned no tool calls.");
    console.log("[cognitive] Response:", choice.message.content);
    return;
  }

  console.log(`[cognitive] LLM selected ${choice.message.tool_calls.length} action(s):`);

  // 2. Dispatch each tool call to the filter sequentially
  const results: Array<{
    tool: string;
    action_id: string;
    status: string;
    log_id?: string;
  }> = [];

  for (const toolCall of choice.message.tool_calls) {
    const fnName = toolCall.function.name;
    const fnArgs = JSON.parse(toolCall.function.arguments);
    const mapping = TOOL_MAP[fnName];

    if (!mapping) {
      console.warn(`[cognitive] Unknown tool: ${fnName}, skipping.`);
      continue;
    }

    console.log(`\n[cognitive] → Dispatching: ${mapping.action_id} (stage: ${mapping.stage})`);
    console.log(`[cognitive]   Payload: ${JSON.stringify(fnArgs)}`);

    const filterResult = await dispatchToFilter(
      mapping.action_id,
      mapping.stage,
      sessionId,
      fnArgs
    );

    console.log(
      `[cognitive]   Result: status=${filterResult.status}, log_id=${filterResult.log_id}`
    );

    results.push({
      tool: fnName,
      action_id: mapping.action_id,
      status: filterResult.status,
      log_id: filterResult.log_id,
    });
  }

  // 3. Session summary
  console.log("\n" + "=".repeat(72));
  console.log("[cognitive] SESSION SUMMARY");
  console.log("=".repeat(72));
  console.log(`[cognitive] Session ID : ${sessionId}`);
  console.log(`[cognitive] Actions    : ${results.length}`);
  for (const r of results) {
    console.log(`[cognitive]   ${r.action_id} → ${r.status} (log: ${r.log_id})`);
  }
  console.log("=".repeat(72));
  console.log("[cognitive] Chain complete. Audit trail written to filter_log.");
}

main().catch((err) => {
  console.error("[cognitive] Fatal error:", err);
  process.exit(1);
});
