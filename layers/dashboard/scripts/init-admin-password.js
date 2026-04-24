#!/usr/bin/env node
/**
 * Bootstrap admin password initialization script
 *
 * Usage: node scripts/init-admin-password.js
 *
 * This script:
 * 1. Reads DASHBOARD_ADMIN_PASSWORD from environment
 * 2. Checks if admin password_hash is NULL
 * 3. If so, hashes the password with bcrypt and updates the database
 *
 * This runs during container startup (see Dockerfile CMD)
 */

const bcrypt = require('bcrypt');
const { Pool } = require('pg');

const BCRYPT_COST = 12;

async function initAdminPassword() {
  const password = process.env.DASHBOARD_ADMIN_PASSWORD;

  if (!password) {
    console.log(
      '[admin-init] DASHBOARD_ADMIN_PASSWORD not set — skipping bootstrap'
    );
    return true;
  }

  if (password.length < 8) {
    console.error(
      '[admin-init] DASHBOARD_ADMIN_PASSWORD too short (minimum 8 characters)'
    );
    return false;
  }

  // Connect to database
  const pool = new Pool({
    host: process.env.POSTGRES_HOST || 'postgres',
    port: process.env.POSTGRES_PORT || 5432,
    user: process.env.POSTGRES_USER || 'xnoria',
    password: process.env.POSTGRES_PASSWORD,
    database: process.env.POSTGRES_DB || 'exnoria',
  });

  try {
    // Check if admin password needs to be initialized
    const result = await pool.query(
      'SELECT password_hash FROM operators WHERE handle = $1',
      ['admin']
    );

    if (result.rows.length === 0) {
      console.warn('[admin-init] Admin user not found — skipping bootstrap');
      return false;
    }

    const { password_hash } = result.rows[0];

    if (password_hash !== null) {
      console.log('[admin-init] Admin password already initialized — skipping');
      return true;
    }

    console.log('[admin-init] Initializing admin password...');

    // Hash the password
    const hash = await bcrypt.hash(password, BCRYPT_COST);

    // Update admin row
    await pool.query(
      'UPDATE operators SET password_hash = $1, password_changed = true WHERE handle = $2',
      [hash, 'admin']
    );

    console.log('[admin-init] Admin password initialized successfully');
    return true;
  } catch (err) {
    console.error('[admin-init] Error:', err.message);
    return false;
  } finally {
    await pool.end();
  }
}

// Run initialization
initAdminPassword()
  .then((success) => {
    process.exit(success ? 0 : 1);
  })
  .catch((err) => {
    console.error('[admin-init] Fatal error:', err);
    process.exit(1);
  });
