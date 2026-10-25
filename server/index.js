import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config, ROOT } from './lib/config.js';
import { loadSession } from './lib/auth.js';
import { migrate } from './lib/migrate.js';
import { api } from './routes/api.js';

const app = express();
app.disable('x-powered-by');
app.set('trust proxy', 1); // atrás do proxy da hospedagem (necessário p/ cookie Secure e IP real)

app.use((_req, res, next) => {
  res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
  next();
});

/* ----- API ----- */
app.use('/api', express.json({ limit: '1mb' }));
// Compatibilidade: o front envia PUT/DELETE como POST + X-HTTP-Method-Override
app.use('/api', (req, _res, next) => {
  const o = String(req.headers['x-http-method-override'] || '').toUpperCase();
  if (req.method === 'POST' && (o === 'PUT' || o === 'DELETE')) req.method = o;
  next();
});
app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
app.use('/api', loadSession, api);

/* ----- Imagens enviadas pelo painel ----- */
app.use('/uploads', express.static(config.uploadDir, {
  index: false, dotfiles: 'ignore', maxAge: '30d',
  setHeaders: (res) => res.set('Content-Security-Policy', "default-src 'none'; img-src 'self'"),
}));

/* ----- Site React (build do Vite) ----- */
if (existsSync(config.distDir)) {
  app.use('/assets', express.static(path.join(config.distDir, 'assets'), { immutable: true, maxAge: '1y', index: false }));
  app.use(express.static(config.distDir, { index: false, maxAge: '30d' }));
  app.get('*', (req, res) => {
    if (path.extname(req.path)) return res.status(404).type('text').send('Não encontrado');
    res.set('Cache-Control', 'no-cache').sendFile(path.join(config.distDir, 'index.html'));
  });
} else {
  app.get('/', (_req, res) => res.type('text').send('API no ar. Rode "npm run build" para gerar o site.'));
}

/* ----- Erros ----- */
app.use((err, _req, res, _next) => {
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Corpo da requisição inválido (JSON esperado).' });
  if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Requisição muito grande.' });
  const status = err.status || 500;
  if (status >= 500) console.error('[erro]', err);
  const body = { error: status >= 500 ? 'Erro interno do servidor.' : err.message };
  if (err.fields) body.fields = err.fields;
  res.status(status).json(body);
});

try {
  await migrate();
} catch (e) {
  console.error('[setup] Falha ao preparar o banco:', e.message);
  process.exit(1);
}
app.listen(config.port, () => console.log(`✔ Servidor em http://localhost:${config.port}`));
