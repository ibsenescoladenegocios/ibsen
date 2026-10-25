// Uso: npm run create-admin -- email@dominio.com "SenhaForte123" "Nome"
import { exec, one, pool } from '../server/lib/db.js';
import { hashPassword, passwordError } from '../server/lib/auth.js';
import { migrate } from '../server/lib/migrate.js';

const [email, password, name = 'Administrador'] = process.argv.slice(2);
if (!email || !password) { console.error('Uso: npm run create-admin -- email senha [nome]'); process.exit(1); }
const pe = passwordError(password);
if (pe) { console.error(pe); process.exit(1); }

await migrate();
const e = email.trim().toLowerCase();
if (await one('SELECT 1 AS x FROM users WHERE email = ?', [e])) {
  await exec('UPDATE users SET password_hash = ? WHERE email = ?', [await hashPassword(password), e]);
  console.log('Senha atualizada para', e);
} else {
  await exec('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)', [name, e, await hashPassword(password)]);
  console.log('Administrador criado:', e);
}
await pool.end();
