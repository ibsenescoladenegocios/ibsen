import mysql from 'mysql2/promise';
import { config } from './config.js';

export const pool = mysql.createPool({
  ...config.db,
  charset: 'utf8mb4',
  waitForConnections: true,
  connectionLimit: 8,
  dateStrings: true,        // DATE volta como 'YYYY-MM-DD' (sem fuso)
  namedPlaceholders: false,
});

export const query = async (sql, params = []) => (await pool.query(sql, params))[0];
export const one = async (sql, params = []) => (await query(sql, params))[0] ?? null;
export const exec = async (sql, params = []) => (await pool.execute(sql, params))[0];
