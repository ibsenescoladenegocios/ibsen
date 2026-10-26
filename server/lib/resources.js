import { batchRead, batchWrite, exec, one, query } from './db.js';
import { config } from './config.js';
import { fail } from './http.js';
import { validatePayload } from './validate.js';

const active = { type: 'bool', default: true };

/** Data de hoje (YYYY-MM-DD) no fuso do site — usada para esconder eventos passados. */
const todayInTz = () => new Intl.DateTimeFormat('en-CA', { timeZone: config.timezone }).format(new Date());

/** Lista branca de recursos editáveis. Só estes campos podem ser gravados. */
export const RESOURCES = {
  slides: { table: 'slides', sortable: true, fields: {
    title: { type: 'string', max: 150, required: true },
    subtitle: { type: 'string', max: 255 },
    button_text: { type: 'string', max: 80 },
    button_link: { type: 'url', max: 255 },
    image_url: { type: 'url', max: 500 },
    theme: { type: 'enum', values: ['primary', 'gray-800', 'gray-700', 'gray-900'], default: 'primary' },
    active } },
  about_cards: { table: 'about_cards', sortable: true, fields: {
    title: { type: 'string', max: 120, required: true },
    icon: { type: 'string', max: 60, default: 'fa-star' },
    active } },
  service_categories: { table: 'service_categories', sortable: true, fields: {
    title: { type: 'string', max: 150, required: true },
    items: { type: 'lines' },
    active } },
  courses: { table: 'courses', sortable: true, fields: {
    title: { type: 'string', max: 150, required: true },
    description: { type: 'string', max: 500 },
    duration: { type: 'string', max: 80 },
    link: { type: 'url', max: 500 },
    contact_email: { type: 'email', max: 190 },
    active } },
  articles: { table: 'articles', sortable: true, fields: {
    title: { type: 'string', max: 190, required: true },
    image_url: { type: 'url', max: 500 },
    image_width: { type: 'int', min: 40, max: 400, default: 140 },
    link: { type: 'url', max: 500 },
    active } },
  clients: { table: 'clients', sortable: true, fields: {
    name: { type: 'string', max: 150, required: true },
    description: { type: 'string', max: 255 },
    logo_url: { type: 'url', max: 500 },
    link: { type: 'url', max: 500 },
    active } },
  team_members: { table: 'team_members', sortable: true, fields: {
    name: { type: 'string', max: 150, required: true },
    bio: { type: 'text', max: 2000 },
    photo_url: { type: 'url', max: 500 },
    featured: { type: 'bool', default: false },
    active } },
  events: { table: 'events', sortable: false, order: 'event_date ASC, id ASC', publicWhere: 'event_date >= ?', publicArgs: () => [todayInTz()], fields: {
    title: { type: 'string', max: 190, required: true },
    address: { type: 'string', max: 255 },
    event_date: { type: 'date', required: true },
    event_time: { type: 'string', max: 40 },
    phone: { type: 'string', max: 40 },
    active } },
};

/** Textos gerais do site (tabela settings). */
export const SETTINGS = {
  site_title: { type: 'string', max: 150 }, logo_url: { type: 'url', max: 500 },
  about_heading: { type: 'string', max: 150 }, about_image: { type: 'url', max: 500 },
  about_p1: { type: 'text', max: 1500 }, about_p2: { type: 'text', max: 1500 }, about_p3: { type: 'text', max: 1500 },
  founder_title: { type: 'string', max: 150 }, founder_text: { type: 'text', max: 2000 }, founder_photo: { type: 'url', max: 500 },
  contact_address: { type: 'text', max: 500 }, contact_phone: { type: 'string', max: 60 },
  contact_email: { type: 'email', max: 190 }, contact_email_text: { type: 'text', max: 500 },
  social_facebook: { type: 'url', max: 300 }, social_linkedin: { type: 'url', max: 300 },
  social_instagram: { type: 'url', max: 300 }, social_youtube: { type: 'url', max: 300 },
  footer_company: { type: 'string', max: 150 }, footer_credit: { type: 'string', max: 150 },
};

function rowOut(def, row) {
  const out = { ...row };
  for (const [name, f] of Object.entries(def.fields)) {
    if (!(name in out)) continue;
    if (f.type === 'bool') out[name] = !!out[name];
    else if (f.type === 'int') out[name] = Number(out[name]);
    else if (f.type === 'lines') {
      try { const a = JSON.parse(out[name]); out[name] = Array.isArray(a) ? a : []; } catch { out[name] = []; }
    }
  }
  delete out.created_at; delete out.updated_at;
  return out;
}

function listStmt(def, publicOnly = false) {
  const where = []; const args = [];
  if (publicOnly) {
    where.push('active = 1');
    if (def.publicWhere) { where.push(def.publicWhere); args.push(...(def.publicArgs?.() ?? [])); }
  }
  const sql = `SELECT * FROM \`${def.table}\`${where.length ? ' WHERE ' + where.join(' AND ') : ''} ORDER BY ${def.order || 'sort_order ASC, id ASC'}`;
  return { sql, args };
}

export async function list(def, publicOnly = false) {
  const { sql, args } = listStmt(def, publicOnly);
  return (await query(sql, args)).map((r) => rowOut(def, r));
}

export async function get(def, id) {
  const r = await one(`SELECT * FROM \`${def.table}\` WHERE id = ?`, [id]);
  return r ? rowOut(def, r) : null;
}

export async function create(def, body) {
  const clean = validatePayload(def.fields, body, false);
  if (def.sortable) clean.sort_order = (await one(`SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM \`${def.table}\``)).n;
  const cols = Object.keys(clean);
  const r = await exec(
    `INSERT INTO \`${def.table}\` (${cols.map((c) => `\`${c}\``).join(',')}) VALUES (${cols.map(() => '?').join(',')})`,
    Object.values(clean));
  return get(def, r.insertId);
}

export async function update(def, id, body) {
  if (!(await get(def, id))) fail(404, 'Registro não encontrado.');
  const clean = validatePayload(def.fields, body, true);
  const cols = Object.keys(clean);
  if (cols.length) {
    await exec(`UPDATE \`${def.table}\` SET ${cols.map((c) => `\`${c}\` = ?`).join(',')} WHERE id = ?`, [...Object.values(clean), id]);
  }
  return get(def, id);
}

export async function remove(def, id) {
  const r = await exec(`DELETE FROM \`${def.table}\` WHERE id = ?`, [id]);
  if (!r.affected) fail(404, 'Registro não encontrado.');
}

export async function reorder(def, ids) {
  if (!def.sortable) fail(404, 'Recurso não ordenável.');
  if (!Array.isArray(ids)) fail(422, 'Lista de ids inválida.');
  await batchWrite(ids.map((id, i) => ({
    sql: `UPDATE \`${def.table}\` SET sort_order = ? WHERE id = ?`,
    args: [i + 1, Number(id) | 0],
  })));
}

export async function settingsAll() {
  const out = Object.fromEntries(Object.keys(SETTINGS).map((k) => [k, '']));
  for (const r of await query('SELECT k, v FROM settings')) if (r.k in out) out[r.k] = r.v;
  return out;
}

export async function settingsSave(body) {
  const input = body && typeof body === 'object' ? body : {};
  const defs = Object.fromEntries(Object.entries(SETTINGS).filter(([k]) => k in input));
  const clean = validatePayload(defs, input, true);
  const stmts = Object.entries(clean).map(([k, v]) => ({
    sql: 'INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)',
    args: [k, String(v)],
  }));
  if (stmts.length) await batchWrite(stmts);
  return settingsAll();
}

export async function publicPayload() {
  const names = Object.keys(RESOURCES);
  const stmts = [{ sql: 'SELECT k, v FROM settings', args: [] }, ...names.map((n) => listStmt(RESOURCES[n], true))];
  const [settingsRows, ...lists] = await batchRead(stmts);
  const settings = Object.fromEntries(Object.keys(SETTINGS).map((k) => [k, '']));
  for (const r of settingsRows) if (r.k in settings) settings[r.k] = r.v;
  const out = { settings };
  names.forEach((n, i) => { out[n] = lists[i].map((r) => rowOut(RESOURCES[n], r)); });
  return out;
}
