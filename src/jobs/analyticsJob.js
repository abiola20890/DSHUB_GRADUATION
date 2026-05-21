
import cron from 'node-cron';
import { generateSnapshot } from '../services/analytics.service.js';

const DEFAULT_SCHEDULE = '0 * * * *'; // every hour


const runAnalyticsJob = async () => {
  const startedAt = new Date().toISOString();
  console.log(`[AnalyticsJob] Starting snapshot generation at ${startedAt}`);

  try {
    const snapshot = await generateSnapshot(null); // null = system-triggered, not admin
    console.log(
      `[AnalyticsJob] ✅ Snapshot complete. ` +
      `Interns: ${snapshot.totalInterns} | ` +
      `Completion: ${snapshot.completionRate}% | ` +
      `Generated at: ${snapshot.generatedAt.toISOString()}`
    );
  } catch (err) {
    // Never let a failed job crash the server
    console.error(`[AnalyticsJob] ❌ Snapshot failed at ${startedAt}:`, err.message);
  }
};


export const startAnalyticsJob = () => {
  const schedule = process.env.ANALYTICS_CRON_SCHEDULE || DEFAULT_SCHEDULE;

  if (!cron.validate(schedule)) {
    console.error(`[AnalyticsJob] Invalid cron schedule: "${schedule}". Job not started.`);
    return;
  }

  cron.schedule(schedule, runAnalyticsJob, {
    scheduled: true,
    timezone:  process.env.TZ || 'Africa/Lagos', // DSHub is Nigeria-based
  });

  console.log(`[AnalyticsJob] Scheduled — running on: "${schedule}" (${process.env.TZ || 'Africa/Lagos'})`);
};