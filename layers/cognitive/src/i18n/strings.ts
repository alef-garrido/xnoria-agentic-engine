// ==============================================================================
// Exnoria · Cognitive · Localization
// One deployment = one language. APP_LOCALE (en | es) selects the dictionary.
// Only deterministic/user-facing strings live here. LLM-facing content
// (tool definitions, Compass data) stays English by design.
// ==============================================================================

export type Locale = 'en' | 'es';

export function getLocale(): Locale {
  const raw = process.env.APP_LOCALE ?? 'en';
  return raw === 'es' ? 'es' : 'en';
}

/**
 * Prompt language instruction — prepended to system prompts.
 * es deployment: respond in Spanish unconditionally.
 * en deployment: mirror the operator's language.
 */
export function languageInstruction(): string {
  return getLocale() === 'es'
    ? 'Always respond in Spanish. All messages to the operator and to the contact must be written in Spanish.'
    : 'Always respond in the same language the operator is writing in. If the operator writes in Spanish, respond in Spanish. If in English, respond in English.';
}

interface Strings {
  telegramErrorReply:   string;
  stageNotRecognized:   (stage: string) => string;
  noStageDetected:      string;
  stageKeywordHint:     string;
  contextFallback:      string;
  jsonRetryHint:        string;
  confirmExecuted:      (actionId: string) => string;
  confirmPendingHitl:   (actionId: string) => string;
  confirmRejected:      (actionId: string, code: string | undefined) => string;
  confirmError:         (actionId: string, message: string | undefined) => string;
  confirmDefault:       (actionId: string, status: string) => string;
}

const en: Strings = {
  telegramErrorReply: 'Sorry, something went wrong. Please try again.',
  stageNotRecognized: (stage) => `Stage "${stage}" is not recognised.`,
  noStageDetected:    'No journey stage detected in your message.',
  stageKeywordHint:   'Please include a stage keyword: ACQ, SAL, ONB, PRD, SUP, COM, RET or EXP.',
  contextFallback:    'I couldn\'t retrieve enough context to process this request. Please provide more details or include a stage keyword (ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP).',
  jsonRetryHint:      'Your previous function call had a JSON syntax error. Ensure you pass valid JSON (curly braces {}, double quotes on keys/strings, no brackets). Call the function again with correct syntax.',
  confirmExecuted:    (actionId) => `✅ Action \`${actionId}\` executed successfully.`,
  confirmPendingHitl: (actionId) => `⏳ Action \`${actionId}\` is pending human approval (HITL). Check the dashboard to approve or reject.`,
  confirmRejected:    (actionId, code) => `🚫 Action \`${actionId}\` was rejected by the filter. Reason: ${code ?? 'unknown'}.`,
  confirmError:       (actionId, message) => `⚠️ Action \`${actionId}\` failed to execute. ${message ?? 'Workflow unreachable.'}`,
  confirmDefault:     (actionId, status) => `ℹ️ Action \`${actionId}\` — status: ${status}.`,
};

const es: Strings = {
  telegramErrorReply: 'Lo sentimos, algo salió mal. Por favor intentá de nuevo.',
  stageNotRecognized: (stage) => `La etapa "${stage}" no es reconocida.`,
  noStageDetected:    'No se detectó una etapa del journey en tu mensaje.',
  stageKeywordHint:   'Incluí una palabra clave de etapa: ACQ, SAL, ONB, PRD, SUP, COM, RET o EXP.',
  contextFallback:    'No pude recuperar suficiente contexto para procesar la solicitud. Proporcioná más detalles o incluí una palabra clave de etapa (ACQ, SAL, ONB, PRD, SUP, COM, RET, EXP).',
  jsonRetryHint:      'Tu llamada de función anterior tuvo un error de sintaxis JSON. Asegurate de pasar JSON válido (llaves {}, comillas dobles en claves y strings, sin corchetes). Llamá a la función nuevamente con la sintaxis correcta.',
  confirmExecuted:    (actionId) => `✅ Acción \`${actionId}\` ejecutada correctamente.`,
  confirmPendingHitl: (actionId) => `⏳ La acción \`${actionId}\` está pendiente de aprobación humana (HITL). Revisá el dashboard para aprobar o rechazar.`,
  confirmRejected:    (actionId, code) => `🚫 La acción \`${actionId}\` fue rechazada por el filtro. Motivo: ${code ?? 'desconocido'}.`,
  confirmError:       (actionId, message) => `⚠️ La acción \`${actionId}\` falló al ejecutarse. ${message ?? 'Workflow inalcanzable.'}`,
  confirmDefault:     (actionId, status) => `ℹ️ Acción \`${actionId}\` — estado: ${status}.`,
};

export const strings: Record<Locale, Strings> = { en, es };

export function t(): Strings {
  return strings[getLocale()];
}
