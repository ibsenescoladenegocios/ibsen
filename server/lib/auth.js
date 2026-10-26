import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import { config } from './config.js';
import { exec, one, query } from './db.js';
import { fail } from './http.js';

const sha256 = (s) => crypto.createHash('sha256').update(s).digest('hex');
const rand = (n = 32) => crypto.randomBytes(n).toString('hex');
const nowSec = () => Math.floor(Date.now() / 1000);

export const BCRYPT_ROUNDS = 12;
export const hashPassword = (pw) => bcrypt.hash(pw, BCRYPT_ROUNDS);
// Hash fixo para igualar o tempo de resposta quando o e-mail não existe
const DUMMY_HASH = bcrypt.hashSync('dummy-password', BCRYPT_ROUNDS);

export function passwordError(pw) {
  return typeof pw === 'string' && [...pw].length >= config.minPasswordLen
    ? null
    : `A senha deve ter pelo menos ${config.minPasswordLen} caracteres.`;
}

/* ---------- Cookies ---------- */
function parseCookies(header = '') {
  const out = {};
  for (const part of header.split(';')) {
    const i = part.indexOf('=');
    if (i > 0) out[part.slice(0, i).trim()] = decodeURIComponent(part.slice(i + 1).trim());
  }
  return out;
}

function setSessionCookie(req, res, token) {
  res.cookie(config.sessionCookie, token, {
    httpOnly: true, sameSite: 'lax', secure: req.secure, path: '/',
  });
}

/* ---------- Sessões (guardadas no banco; só o hash do token é salvo) ---------- */
export async function createSession(req, res, userId) {
  const token = rand(32);
  const csrf = rand(32);
  await exec('DELETE FROM sessions WHERE last_activity < ?', [nowSec() - 86400]);
  await exec('INSERT INTO sessions (id, user_id, csrf, last_activity, created_at) VALUES (?,?,?,?,?)',
    [sha256(token), userId, csrf, nowSec(), nowSec()]);
  setSessionCookie(req, res, token);
  return csrf;
}

export async function destroySession(req, res) {
  const token = parseCookies(req.headers.cookie)[config.sessionCookie];
  if (token) await exec('DELETE FROM sessions WHERE id = ?', [sha256(token)]);
  res.clearCookie(config.sessionCookie, { path: '/' });
}

/** Middleware: carrega req.user e req.csrf se houver sessão válida. */
export async function loadSession(req, _res, next) {
  try {
    req.user = null; req.csrf = '';
    const token = parseCookies(req.headers.cookie)[config.sessionCookie];
    if (token) {
      const row = await one(
        `SELECT s.csrf, s.last_activity, u.id, u.name, u.email
           FROM sessions s JOIN users u ON u.id = s.user_id WHERE s.id = ?`,
        [sha256(token)]);
      const idle = row ? nowSec() - row.last_activity : 0;
      if (row && idle * 1000 <= config.sessionMaxIdleMs) {
        req.user = { id: row.id, name: row.name, email: row.email };
        req.csrf = row.csrf;
        if (idle > 60) await exec('UPDATE sessions SET last_activity = ? WHERE id = ?', [nowSec(), sha256(token)]);
      } else if (row) {
        await exec('DELETE FROM sessions WHERE id = ?', [sha256(token)]);
      }
    }
    next();
  } catch (e) { next(e); }
}

export function requireAuth(req, _res, next) {
  if (!req.user) return next(Object.assign(new Error('Sessão expirada ou usuário não autenticado.'), { status: 401 }));
  next();
}

export function requireCsrf(req, _res, next) {
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = String(req.headers['x-csrf-token'] || '');
  const ok = sent.length === req.csrf.length && req.csrf && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(req.csrf));
  if (!ok) return next(Object.assign(new Error('Token de segurança inválido. Recarregue a página e tente novamente.'), { status: 419 }));
  next();
}

/* ---------- Limite de tentativas de login ---------- */
async function throttled(ip, email) {
  const now = nowSec();
  await exec('DELETE FROM login_attempts WHERE created_at < ?', [now - 86400]);
  const a = await one('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND created_at > ?', [ip, now - 900]);
  if (a.n >= 8) return true;
  const b = await one('SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND created_at > ?', [email, now - 900]);
  return b.n >= 25;
}

export async function login(req, res) {
  const email = String(req.body?.email ?? '').trim().toLowerCase();
  const password = String(req.body?.password ?? '');
  const ip = String(req.ip || '0.0.0.0').slice(0, 45);

  if (!email || !password) fail(422, 'Informe e-mail e senha.');
  if (await throttled(ip, email)) fail(429, 'Muitas tentativas. Aguarde 15 minutos e tente novamente.');

  const row = await one('SELECT id, name, email, password_hash FROM users WHERE email = ?', [email]);
  const ok = await bcrypt.compare(password, row?.password_hash ?? DUMMY_HASH);
  if (!ok || !row) {
    await exec('INSERT INTO login_attempts (ip, email, created_at) VALUES (?, ?, ?)', [ip, email.slice(0, 190), nowSec()]);
    fail(401, 'E-mail ou senha incorretos.');
  }
  await exec('DELETE FROM login_attempts WHERE ip = ?', [ip]);
  const csrf = await createSession(req, res, row.id);
  return { user: { id: row.id, name: row.name, email: row.email }, csrf };
}

/* ---------- Usuários administradores ---------- */
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function listUsers() {
  return query('SELECT id, name, email, created_at FROM users ORDER BY name');
}

export async function createUser(body) {
  const name = String(body.name ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  const errors = {};
  if (!name || [...name].length > 120) errors.name = 'Informe o nome (até 120 caracteres).';
  if (!EMAIL_RE.test(email) || email.length > 190) errors.email = 'E-mail inválido.';
  const pe = passwordError(password); if (pe) errors.password = pe;
  if (!errors.email && await one('SELECT 1 AS x FROM users WHERE email = ?', [email])) errors.email = 'Já existe um usuário com este e-mail.';
  if (Object.keys(errors).length) fail(422, 'Corrija os campos destacados.', errors);
  const r = await exec('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)', [name, email, await hashPassword(password)]);
  return r.insertId;
}

export async function updateUser(me, id, body) {
  const user = await one('SELECT * FROM users WHERE id = ?', [id]);
  if (!user) fail(404, 'Usuário não encontrado.');
  const errors = {};
  const name = String(body.name ?? user.name).trim();
  const email = String(body.email ?? user.email).trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!name || [...name].length > 120) errors.name = 'Informe o nome (até 120 caracteres).';
  if (!EMAIL_RE.test(email) || email.length > 190) errors.email = 'E-mail inválido.';
  if (!errors.email && email !== user.email && await one('SELECT 1 AS x FROM users WHERE email = ? AND id <> ?', [email, id])) {
    errors.email = 'Já existe um usuário com este e-mail.';
  }
  let newHash = null;
  if (password) {
    const pe = passwordError(password);
    if (pe) errors.password = pe;
    else if (id === me.id && !(await bcrypt.compare(String(body.current_password ?? ''), user.password_hash))) {
      errors.current_password = 'Senha atual incorreta.';
    }
    if (!pe && !errors.current_password) newHash = await hashPassword(password);
  }
  if (Object.keys(errors).length) fail(422, 'Corrija os campos destacados.', errors);
  if (newHash) {
    await exec('UPDATE users SET name=?, email=?, password_hash=? WHERE id=?', [name, email, newHash, id]);
    // Troca de senha encerra as outras sessões desse usuário
    if (id !== me.id) await exec('DELETE FROM sessions WHERE user_id = ?', [id]);
  } else {
    await exec('UPDATE users SET name=?, email=? WHERE id=?', [name, email, id]);
  }
}

export async function deleteUser(me, id) {
  if (id === me.id) fail(422, 'Você não pode excluir o próprio usuário.');
  const { n } = await one('SELECT COUNT(*) AS n FROM users');
  if (n <= 1) fail(422, 'Não é possível excluir o último administrador.');
  const r = await exec('DELETE FROM users WHERE id = ?', [id]);
  if (!r.affected) fail(404, 'Usuário não encontrado.');
  await exec('DELETE FROM sessions WHERE user_id = ?', [id]);
}
