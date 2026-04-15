"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.STAGE_TO_CLUSTER = void 0;
exports.getClusterTools = getClusterTools;
exports.getClusterStages = getClusterStages;
var definitions_1 = require("./definitions");
/**
 * Maps journey stages to agent clusters
 */
exports.STAGE_TO_CLUSTER = {
    ACQ: 'acqsal',
    SAL: 'acqsal',
    ONB: 'lifecycle',
    PRD: 'lifecycle',
    COM: 'lifecycle',
    RET: 'lifecycle',
    SUP: 'escalation',
    EXP: 'escalation',
};
/**
 * Context retrieval tools — always available to all clusters
 * These map to null in TOOL_TO_ACTION (routed to MCP, not filter)
 */
var CONTEXT_TOOL_NAMES = new Set([
    'compass_get_signal',
    'compass_get_interventions',
    'posthog_get_contact_events',
    'posthog_get_feature_adoption',
    'reply',
]);
/**
 * Get tool subset for a given cluster
 *
 * - Context tools (compass, posthog, reply) are always included
 * - Filter action tools are filtered by the cluster's stages
 */
function getClusterTools(cluster) {
    var clusterStages = Object.entries(exports.STAGE_TO_CLUSTER)
        .filter(function (_a) {
        var c = _a[1];
        return c === cluster;
    })
        .map(function (_a) {
        var stage = _a[0];
        return stage;
    });
    return definitions_1.TOOLS.filter(function (tool) {
        var name = tool.function.name;
        var mapping = definitions_1.TOOL_TO_ACTION[name];
        // Always include context retrieval tools and reply
        if (mapping === null)
            return true;
        // Include filter action tools whose stage belongs to this cluster
        return clusterStages.includes(mapping.stage);
    });
}
/**
 * Get stages for a given cluster
 * Useful for logging and debugging
 */
function getClusterStages(cluster) {
    return Object.entries(exports.STAGE_TO_CLUSTER)
        .filter(function (_a) {
        var c = _a[1];
        return c === cluster;
    })
        .map(function (_a) {
        var stage = _a[0];
        return stage;
    });
}
