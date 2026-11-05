import mongoose from 'mongoose';
import { buildApp } from './app.js';
import { config } from './config.js';
import { connectDatabase } from './db.js';

try {
  await connectDatabase();
} catch (err) {
  console.error('[db] connection failed:', err.message);
  process.exit(1);
}

const server = buildApp().listen(config.port, () => console.log(`[api] listening on :${config.port}`));

const shutdown = (signal) => {
  console.log(`[api] ${signal} — closing`);
  server.close(() => mongoose.disconnect().finally(() => process.exit(0)));
  setTimeout(() => process.exit(1), 10_000).unref();
};
process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
