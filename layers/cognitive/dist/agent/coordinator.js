"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.coordinate = coordinate;
const clusters_1 = require("../tools/clusters");
const engram_1 = require("../memory/engram");
const acqsal_1 = require("./specialists/acqsal");
const lifecycle_1 = require("./specialists/lifecycle");
const escalation_1 = require("./specialists/escalation");
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
    // 1. Validate stage and determine cluster
    const cluster = clusters_1.STAGE_TO_CLUSTER[event.stage];
    if (!cluster) {
        throw new Error(`[coordinator] Unknown stage: ${event.stage}`);
    }
    console.log(`[coordinator] stage=${event.stage} cluster=${cluster} contact=${event.contact_id}`);
    // 2. Fetch cross-stage history (gives specialist context about other stages)
    const crossStageHistory = await buildCrossStageHistory(db, event.contact_id);
    // 3. Attach routing metadata to event
    event.meta = {
        ...event.meta,
        cross_stage_history: crossStageHistory,
        routed_by: 'coordinator',
        cluster,
    };
    // 4. Route to specialist
    await CLUSTER_RUNNERS[cluster](db, event);
}
