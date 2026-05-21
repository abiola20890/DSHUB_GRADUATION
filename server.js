
import 'dotenv/config'; // Must be first — loads .env before any other module reads process.env



import app       from './app.js';
import connectDB from './src/config/db.js';
import { startAnalyticsJob } from './src/jobs/analyticsJob.js';

const PORT = process.env.PORT || 9000;

const startServer = async () => {
  try {
    await connectDB();

    // Start scheduled jobs after DB connection is confirmed
    startAnalyticsJob();

    const server = app.listen(PORT, () => {
      console.log('\n────────────────────────────────────────');
      console.log('  DSHub Graduation API');
      console.log(`  Environment : ${process.env.NODE_ENV || 'development'}`);
      console.log(`  Port        : ${PORT}`);
      console.log(`  Base URL    : http://localhost:${PORT}/api/v1`);
      console.log(`  Health      : http://localhost:${PORT}/health`);
      console.log('────────────────────────────────────────\n');
      console.log("CLOUD NAME:", process.env.CLOUDINARY_CLOUD_NAME);
      console.log("API KEY:", process.env.CLOUDINARY_API_KEY);
      console.log("SECRET LENGTH:", process.env.CLOUDINARY_API_SECRET?.length);
    });

    // ── Graceful Shutdown ──────────────────────────────────────────────────

    const shutdown = async (signal) => {
      console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);

      server.close(async () => {
        console.log('[Server] HTTP server closed.');

        try {
          const mongoose = await import('mongoose');
          await mongoose.default.connection.close();
          console.log('[Server] MongoDB connection closed.');
        } catch (err) {
          console.error('[Server] Error closing MongoDB:', err.message);
        }

        process.exit(0);
      });

      // Force exit if graceful close hangs beyond 10 seconds
      setTimeout(() => {
        console.error('[Server] Forced shutdown after timeout.');
        process.exit(1);
      }, 10_000);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM')); // Render sends this on redeploy
    process.on('SIGINT',  () => shutdown('SIGINT'));  // Ctrl+C in development

  } catch (err) {
    console.error('[Server] Failed to start:', err.message);
    process.exit(1);
  }
};


process.on('unhandledRejection', (err) => {
  console.error('[Server] Unhandled Rejection:', err.message);
  console.error(err.stack);
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  console.error('[Server] Uncaught Exception:', err.message);
  console.error(err.stack);
  process.exit(1);
});


startServer();