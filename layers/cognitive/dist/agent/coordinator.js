"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coordinate = coordinate;
const uuid_1 = require("uuid");
const clusters_1 = require("../tools/clusters");
const engram_1 = require("../memory/engram");
const acqsal_1 = require("./specialists/acqsal");
const lifecycle_1 = require("./specialists/lifecycle");
const escalation_1 = require("./specialists/escalation");
const telegram_1 = require("../channels/telegram");
const session_1 = require("../memory/session");
const CLUSTER_RUNNERS = {
    acqsal: acqsal_1.runAcqSalSpecialist,
    lifecycle: lifecycle_1.runLifecycleSpecialist,
    escalation: escalation_1.runEscalationSpecialist,
};
/**
 * Build cross-stage history for a contact
 * Fetches all stages for this contact (not just the current stage)
 */
async function buildCrossStageHistory(db, contactId) {
    try {
        // Fetch history from all stages
        return await (0, engram_1.getContactHistory)(contactId, 'ALL', 'general', 5);
    }
    catch (err) {
        console.warn('[coordinator] Cross-stage history fetch failed:', err);
        return '';
    }
}
/**
 * Route a CXEvent to the correct specialist based on stage
 *
 * This is the ONLY entry point from the reason() wrapper.
 * The coordinator never calls dispatchToFilter — only specialists do.
 */
async function coordinate(db, event) {
    // 1. Generate a session_id for this reasoning cycle
    const session_id = (0, uuid_1.v4)();
    // 2. Validate stage and determine cluster
    const cluster = event.stage ? clusters_1.STAGE_TO_CLUSTER[event.stage] : undefined;
    if (!cluster) {
        // Unrecognised or missing stage — reply gracefully so the user knows what to send
        const hint = event.stage
            ? `Stage "${event.stage}" is not recognised.`
            : 'No journey stage detected in your message.';
        const replyText = `${hint} Please include a stage keyword: ACQ, SAL, ONB, PRD, SUP, COM, RET or EXP.`;
        console.warn(`[coordinator] ${hint} contact=${event.contact_id}`);
        await (0, telegram_1.sendReply)(event.contact_id, replyText);
        // Log this conversation turn to Postgres so the dashboard reflects it
        await (0, session_1.logSessionToDb)(db, session_id, event, 'coordinator', [], replyText);
        return;
    }
    console.log(`[coordinator] stage=${event.stage} cluster=${cluster} contact=${event.contact_id}`);
    // 3. Fetch cross-stage history (gives specialist context about other stages)
    const crossStageHistory = await buildCrossStageHistory(db, event.contact_id);
    // 4. Attach routing metadata to event (including session_id so specialists reuse it)
    event.meta = {
        ...event.meta,
        cross_stage_history: crossStageHistory,
        routed_by: 'coordinator',
        cluster,
        session_id, // Specialists read this to avoid creating a duplicate session row
    };
    // 5. Route to specialist
    await CLUSTER_RUNNERS[cluster](db, event);
}
