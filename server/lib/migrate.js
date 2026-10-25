import { readFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exec, one, pool } from './db.js';
import { config } from './config.js';
import { hashPassword, passwordError } from './auth.js';
import { seedContent } from './seed.js';

const SCHEMA = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'schema.sql');

/** Cria tabelas (idempotente), importa o conteúdo inicial e o 1º administrador. */
export async function migrate(log = console) {
  if (!config.db.database || !config.db.user) {
    throw new Error('Banco não configurado: defina DB_NAME, DB_USER e DB_PASS (arquivo .env ou painel da hospedagem).');
  }
  const sql = readFileSync(SCHEMA, 'utf8').replace(/^\s*--.*$/gm, '');
  for (const stmt of sql.split(/;\s*\n/)) if (stmt.trim()) await pool.query(stmt);

  if (await seedContent()) log.log('[setup] Conteúdo inicial importado.');

  const { n } = await one('SELECT COUNT(*) AS n FROM users');
  if (n === 0) {
    if (config.adminEmail && config.adminPassword) {
      const pe = passwordError(config.adminPassword);
      if (pe) throw new Error(`ADMIN_PASSWORD inválida: ${pe}`);
      await exec('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)',
        [config.adminName, config.adminEmail, await hashPassword(config.adminPassword)]);
      log.log(`[setup] Administrador criado: ${config.adminEmail}. Remova ADMIN_PASSWORD das variáveis de ambiente.`);
    } else {
      log.warn('[setup] Nenhum administrador cadastrado. Defina ADMIN_EMAIL e ADMIN_PASSWORD e reinicie, ou rode: npm run create-admin');
    }
  }
}
