import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', '..');

// Lê .env (se existir) sem depender de pacotes. Variáveis do painel da hospedagem têm prioridade.
function loadEnv(file) {
  if (!existsSync(file)) return;
  for (const line of readFileSync(file, 'utf8').split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)?\s*$/);
    if (!m || line.trim().startsWith('#')) continue;
    let v = (m[2] ?? '').trim();
    if ((v.startsWith('"') && v.endsWith('"')) || (v.startsWith("'") && v.endsWith("'"))) v = v.slice(1, -1);
    if (process.env[m[1]] === undefined) process.env[m[1]] = v;
  }
}
loadEnv(path.join(ROOT, '.env'));

const env = process.env;
export const config = {
  port: Number(env.PORT) || 3000,
  isProd: env.NODE_ENV === 'production',
  db: {
    host: env.DB_HOST || 'localhost',
    port: Number(env.DB_PORT) || 3306,
    database: env.DB_NAME || '',
    user: env.DB_USER || '',
    password: env.DB_PASS || '',
  },
  uploadDir: path.resolve(env.UPLOAD_DIR || path.join(ROOT, 'uploads')),
  maxUploadMb: Number(env.MAX_UPLOAD_MB) || 5,
  distDir: path.join(ROOT, 'dist'),
  sessionCookie: 'isdg_sid',
  sessionMaxIdleMs: 8 * 3600 * 1000,
  minPasswordLen: 10,
  adminEmail: (env.ADMIN_EMAIL || '').trim().toLowerCase(),
  adminPassword: env.ADMIN_PASSWORD || '',
  adminName: env.ADMIN_NAME || 'Administrador',
};
