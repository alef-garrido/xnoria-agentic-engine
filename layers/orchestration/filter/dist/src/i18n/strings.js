"use strict";
// ==============================================================================
// Exnoria · Filter · Localization
// One deployment = one language. APP_LOCALE (en | es) selects the dictionary.
// Machine-readable codes (rejection codes, statuses) are NOT localized.
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
exports.strings = void 0;
exports.getLocale = getLocale;
exports.t = t;
function getLocale() {
    const raw = process.env.APP_LOCALE ?? 'en';
    return raw === 'es' ? 'es' : 'en';
}
const en = {
    rejectionReasons: {
        notInAllowlist: (actionId) => `action_id '${actionId}' is not registered in the allowlist`,
        stageMismatch: (actionId, actionStage, requestedStage) => `action_id '${actionId}' belongs to stage '${actionStage}', not '${requestedStage}'`,
        disabled: (actionId) => `action_id '${actionId}' is currently disabled`
    },
    api: {
        payloadInvalid: 'Missing required fields: action_id, stage, session_id, payload',
        actionQueuedForHitl: 'Action queued for human approval',
        pendingFetchFailed: 'Failed to fetch pending actions'
    },
    hitl: {
        manualTitle: '🔧 *Manual Action Required*',
        reviewTitle: '⚠️ *HITL Review Required*',
        action: 'Action',
        stage: 'Stage',
        contact: 'Contact',
        session: 'Session',
        reason: 'Reason',
        whatToDo: 'This action cannot be automated on your current HubSpot plan.',
        completeManually: 'Please complete it manually in HubSpot, then mark as done.',
        markAsDone: 'Mark as Done',
        reviewApprove: 'Review & Approve',
        hubspotLink: 'Open in HubSpot',
        triggeredBy: 'Triggered'
    }
};
const es = {
    rejectionReasons: {
        notInAllowlist: (actionId) => `el action_id '${actionId}' no está registrado en la allowlist`,
        stageMismatch: (actionId, actionStage, requestedStage) => `el action_id '${actionId}' pertenece a la etapa '${actionStage}', no a '${requestedStage}'`,
        disabled: (actionId) => `el action_id '${actionId}' está deshabilitado`
    },
    api: {
        payloadInvalid: 'Faltan campos requeridos: action_id, stage, session_id, payload',
        actionQueuedForHitl: 'Acción en cola para aprobación humana',
        pendingFetchFailed: 'Error al obtener las acciones pendientes'
    },
    hitl: {
        manualTitle: '🔧 *Acción Manual Requerida*',
        reviewTitle: '⚠️ *Acción Requiere Revisión (HITL)*',
        action: 'Acción',
        stage: 'Etapa',
        contact: 'Contacto',
        session: 'Sesión',
        reason: 'Motivo',
        whatToDo: 'Esta acción no se puede automatizar con tu plan actual de HubSpot.',
        completeManually: 'Completala manualmente en HubSpot y luego marcá como hecha.',
        markAsDone: 'Marcar como Hecha',
        reviewApprove: 'Revisar y Aprobar',
        hubspotLink: 'Abrir en HubSpot',
        triggeredBy: 'Disparada por'
    }
};
exports.strings = { en, es };
function t() {
    return exports.strings[getLocale()];
}
