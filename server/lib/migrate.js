import { batchWrite, exec, one } from './db.js';
import { config } from './config.js';
import { hashPassword, passwordError } from './auth.js';
import { seedContent } from './seed.js';
import { SCHEMA_SQL } from './schema.js';

/** Cria tabelas (idempotente), importa o conteúdo inicial e o 1º administrador. */
export async function migrate(log = console) {
  const sql = SCHEMA_SQL.replace(/^\s*--.*$/gm, '');
  const stmts = sql.split(/;\s*\n/).map((t) => t.trim()).filter(Boolean);
  await batchWrite(stmts.map((t) => ({ sql: t, args: [] })));

  if (await seedContent()) log.log('[setup] Conteúdo inicial importado.');

  const { n } = await one('SELECT COUNT(*) AS n FROM users');
  const wantsAdmin = config.adminEmail && config.adminPassword;

  if (wantsAdmin) {
    const pe = passwordError(config.adminPassword);
    if (pe && (n === 0 || config.resetAdmin)) throw new Error(`ADMIN_PASSWORD inválida: ${pe}`);
  }

  if (n === 0) {
    if (wantsAdmin) {
      await exec('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)',
        [config.adminName, config.adminEmail, await hashPassword(config.adminPassword)]);
      log.log(`[setup] Administrador criado: ${config.adminEmail}. REMOVA ADMIN_PASSWORD das variáveis de ambiente e reimplante.`);
    } else {
      log.warn('[setup] Nenhum administrador cadastrado. Defina ADMIN_EMAIL e ADMIN_PASSWORD e reinicie o app.');
    }
  } else if (config.resetAdmin && wantsAdmin) {
    // Recuperação de acesso sem SSH: RESET_ADMIN=1 + ADMIN_EMAIL + ADMIN_PASSWORD
    const hash = await hashPassword(config.adminPassword);
    const found = await one('SELECT id FROM users WHERE email = ?', [config.adminEmail]);
    if (found) {
      await exec('UPDATE users SET password_hash = ? WHERE id = ?', [hash, found.id]);
      await exec('DELETE FROM sessions WHERE user_id = ?', [found.id]);
    } else {
      await exec('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)', [config.adminName, config.adminEmail, hash]);
    }
    log.log(`[setup] Senha de ${config.adminEmail} redefinida. REMOVA RESET_ADMIN e ADMIN_PASSWORD e reimplante.`);
  }
}
