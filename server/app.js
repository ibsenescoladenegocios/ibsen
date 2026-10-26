import express from 'express';
import { loadSession } from './lib/auth.js';
import { HttpError } from './lib/http.js';
import { ready } from './lib/ready.js';
import { api } from './routes/api.js';

/**
 * App Express (API). O server/index.js adiciona o site estático e os uploads via `mount`.
 */
export function createApp(mount) {
  const app = express();
  app.disable('x-powered-by');
  app.set('trust proxy', 1); // atrás do proxy da hospedagem: cookie Secure e IP real do cliente

  app.use((_req, res, next) => {
    res.set({ 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'SAMEORIGIN', 'Referrer-Policy': 'strict-origin-when-cross-origin' });
    next();
  });

  app.use('/api', express.json({ limit: '1mb' }));
  // O front envia PUT/DELETE como POST + X-HTTP-Method-Override
  app.use('/api', (req, _res, next) => {
    const o = String(req.headers['x-http-method-override'] || '').toUpperCase();
    if (req.method === 'POST' && (o === 'PUT' || o === 'DELETE')) req.method = o;
    next();
  });
  app.use('/api', (_req, res, next) => { res.set('Cache-Control', 'no-store'); next(); });
  app.use('/api', (_req, _res, next) => { ready().then(() => next(), next); }, loadSession, api);

  mount?.(app);

  app.use((err, _req, res, _next) => {
    if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Corpo da requisição inválido (JSON esperado).' });
    if (err.type === 'entity.too.large') return res.status(413).json({ error: 'Requisição muito grande.' });
    const status = err.status || 500;
    if (status >= 500) console.error('[erro]', err);
    // Mensagens escritas por nós (HttpError) são mostradas; erros inesperados ficam genéricos
    const body = { error: status >= 500 && !(err instanceof HttpError) ? 'Erro interno do servidor.' : err.message };
    if (err.fields) body.fields = err.fields;
    res.status(status).json(body);
  });

  return app;
}
