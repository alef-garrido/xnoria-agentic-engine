#!/usr/bin/env ts-node
"use strict";
// ==============================================================================
// Exnoria · Cognitive · Batch Lead Ingestion Script
// ==============================================================================
Object.defineProperty(exports, "__esModule", { value: true });
/*
RF-01: Ingestor de Leads (TypeScript)
Fuente: Debe leer archivos .csv (ej: leads_exnoria_50.csv).
Mapping: Debe mapear columnas de CSV (name, email, company, linkedin, pain_point) al objeto CXEvent.
Trigger: Debe invocar la función reason(db, event) del core cognitivo para cada lead.
Throttling: Debe permitir configurar un delay entre leads para no saturar la API del LLM o los webhooks de n8n.
Deduplicación: Antes de disparar el evento, debe verificar en filter_log si ese email ya tuvo una sesión "outreach" en las últimas 48hs (usando los metadatos de la capa de memoria).

RF-02: Manejo de Sesiones
Cada lead en el batch debe generar un session_id único (ej: batch-outreach-20240623-{hash}).
Los metadatos del lead (LinkedIn, Company) deben persistirse en el payload inicial para que la IA los use en la personalización del mensaje.
*/
const pg_1 = require("pg");
const sync_1 = require("csv-parse/sync");
const fs_1 = require("fs");
const logging_1 = require("../../../shared/logging");
const loop_1 = require("../events/loop");
const uuid_1 = require("uuid");
const logger = (0, logging_1.createLogger)('batch-ingest', 'cognitive');
const db = new pg_1.Pool({
    connectionString: process.env.POSTGRES_URL,
});
// Removed legacy payload_reviewed check — migration 016 added reviewed_at/reviewed_by columns
async function checkRecentOutreach(email) {
    try {
        const res = await db.query(`SELECT id FROM filter_log
       WHERE payload_in->>'email' = $1
       AND action_id = 'acq.contact.outreach'
       AND created_at > NOW() - INTERVAL '48 hours'
       LIMIT 1`, [email]);
        return res.rows.length > 0;
    }
    catch (err) {
        logger.error({ error: err }, 'Error checking recent outreach');
        return false;
    }
}
function generateSessionId() {
    return (0, uuid_1.v4)();
}
function mapLeadToCXEvent(lead) {
    return {
        contact_id: lead.email,
        channel: 'internal',
        input: `Lead from batch ingestion: ${lead.name}, ${lead.company}, ${lead.email}`,
        stage: 'ACQ',
        meta: {
            linkedin: lead.linkedin,
            company: lead.company,
            pain_point: lead.pain_point,
        },
    };
}
async function processLead(lead, processEvent) {
    // Check for recent outreach
    const hasRecentOutreach = await checkRecentOutreach(lead.email);
    if (hasRecentOutreach) {
        logger.info({ email: lead.email }, 'Skipping lead - recent outreach detected');
        return;
    }
    // Create CXEvent
    const event = mapLeadToCXEvent(lead);
    // Generate session ID
    const sessionId = generateSessionId();
    // Add session ID to event metadata
    event.meta = {
        ...event.meta,
        session_id: sessionId,
    };
    logger.info({ email: lead.email, sessionId }, 'Processing lead');
    try {
        await processEvent(event);
        logger.info({ email: lead.email, sessionId }, 'Lead processed successfully');
    }
    catch (err) {
        logger.error({ error: err, email: lead.email, sessionId }, 'Error processing lead');
    }
}
async function main() {
    const args = process.argv.slice(2);
    if (args.length === 0) {
        logger.error('Please provide a CSV file path');
        process.exit(1);
    }
    const csvPath = args[0];
    const delayMs = args[1] ? parseInt(args[1], 10) : 1000; // Default 1 second delay
    try {
        // Read and parse CSV
        const csvContent = (0, fs_1.readFileSync)(csvPath, 'utf-8');
        const records = (0, sync_1.parse)(csvContent, {
            columns: true,
            skip_empty_lines: true,
        });
        logger.info({ count: records.length, csvPath }, 'Starting batch ingestion');
        // Create event loop processor
        const { processEvent } = (0, loop_1.createEventLoop)(db);
        // Process each lead with delay
        for (const [index, lead] of records.entries()) {
            await processLead(lead, processEvent);
            // Add delay between leads
            if (index < records.length - 1) {
                logger.info({ delayMs }, 'Waiting before processing next lead');
                await new Promise(resolve => setTimeout(resolve, delayMs));
            }
        }
        logger.info({ count: records.length }, 'Batch ingestion completed');
    }
    catch (err) {
        logger.error({ error: err }, 'Error during batch ingestion');
        process.exit(1);
    }
    finally {
        await db.end();
    }
}
if (require.main === module) {
    main();
}
