/**
 * Optional PM2 process config. Using it is entirely opt-in — it doesn't
 * change anything about `npm start` / `npm run dev`, which still run a
 * single plain Node process exactly as before.
 *
 * To use it in production:  pm2 start ecosystem.config.js
 *
 * `instances` is set to 1 by default (identical behavior to today) so
 * nothing changes unless you deliberately raise it. If you do want to
 * scale to multiple instances to use more CPU cores, raise `instances`
 * (e.g. to "max" or a specific number) — but note the two cleanup jobs
 * started in server.js (startRejectedApplicationCleanup /
 * startInterviewRemovalCleanup) are plain in-process timers with no
 * locking, so running more than 1 instance would run them multiple times
 * in parallel. If you scale beyond 1 instance, move those two jobs to a
 * single dedicated worker process (or add a lock) first.
 */
module.exports = {
  apps: [
    {
      name: "job-portal-backend",
      script: "server.js",
      instances: 1,
      exec_mode: "fork",
      autorestart: true,
      watch: false,
      max_memory_restart: "500M",
      env: {
        NODE_ENV: "production",
      },
    },
  ],
};
