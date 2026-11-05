import { existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

// Local development reads backend/.env; on Render the variables come from the service settings.
const localEnv = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../.env');
if (existsSync(localEnv)) process.loadEnvFile(localEnv);

function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing environment variable ${name} — see backend/.env.example`);
    process.exit(1);
  }
  return value;
}

export const config = {
  production: process.env.NODE_ENV === 'production',
  port: Number(process.env.PORT) || 5000,
  databaseUrl: required('DATABASE_URL'),
  sessionSecret: required('SESSION_SECRET'),
  googleClientId: required('GOOGLE_CLIENT_ID'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean),
  session: { cookie: 'es_session', days: 14 },
};
