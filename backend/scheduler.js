/**
 * scheduler.js
 * Cron-based scheduler for daily signal generation.
 * Run this as a long-lived process alongside the main app.
 *
 * Usage: node backend/scheduler.js
 */

const cron = require('node-cron');
const { generateDailySignals } = require('./services/signalGenerator');

// Default: every day at 08:00 UTC
const SIGNAL_CRON = process.env.SIGNAL_GENERATION_CRON || '0 8 * * *';

console.log(`[scheduler] Starting Clon signal scheduler...`);
console.log(`[scheduler] Signal generation cron: ${SIGNAL_CRON}`);

cron.schedule(SIGNAL_CRON, async () => {
  console.log(`[scheduler] ${new Date().toISOString()} — Generating daily signals...`);
  try {
    const signals = await generateDailySignals();
    console.log(`[scheduler] Generated ${signals.length} signal(s).`);
  } catch (err) {
    console.error('[scheduler] Signal generation failed:', err.message);
  }
}, {
  timezone: 'UTC',
});

console.log('[scheduler] Scheduler running. Press Ctrl+C to stop.');
