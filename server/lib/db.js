import mysql from 'mysql2/promise';
import { config } from './config.js';

const { host, port, user, password, database } = config.db;

if (!database || !user) {
  throw new Error('Banco não configurado: defina DB_NAME, DB_USER e DB_PASSWORD (variáveis de ambiente ou arquivo .env).');
}

export const pool = mysql.createPool({
  host, port, user, password, database,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 6,       // planos compartilhados têm limite de conexões
  dateStrings: true,        // DATE volta como 'YYYY-MM-DD' (sem problemas de fuso)
  timezone: 'Z',
});

export const query = async (sql, args = []) => (await pool.execute(sql, args))[0];
export const one = async (sql, args = []) => (await query(sql, args))[0] ?? null;

/** INSERT/UPDATE/DELETE → { affected, insertId } */
export const exec = async (sql, args = []) => {
  const [r] = await pool.execute(sql, args);
  return { affected: r.affectedRows, insertId: r.insertId || null };
};

/** Várias consultas de leitura em paralelo. */
export const batchRead = (stmts) => Promise.all(stmts.map((s) => query(s.sql, s.args ?? [])));

/** Várias escritas em uma transação (se algo falhar, nada é gravado). */
export async function batchWrite(stmts) {
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();
    for (const s of stmts) await conn.query(s.sql, s.args ?? []);
    await conn.commit();
  } catch (e) {
    await conn.rollback().catch(() => {});
    throw e;
  } finally {
    conn.release();
  }
}
