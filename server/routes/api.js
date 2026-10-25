import { Router } from 'express';
import multer from 'multer';
import { createSession, createUser, deleteUser, destroySession, listUsers, login, requireAuth, requireCsrf, updateUser } from '../lib/auth.js';
import { fail, wrap } from '../lib/http.js';
import * as R from '../lib/resources.js';
import { saveUpload, uploadMiddleware } from '../lib/upload.js';
import { config } from '../lib/config.js';

export const api = Router();

const toId = (v) => (/^\d+$/.test(String(v)) ? Number(v) : null);

/* ----- Público ----- */
api.get('/public', wrap(async (_req, res) => res.json(await R.publicPayload())));

/* ----- Autenticação ----- */
api.get('/auth/me', (req, res) => res.json({ user: req.user, csrf: req.csrf }));
api.post('/auth/login', wrap(async (req, res) => res.json(await login(req, res))));
api.post('/auth/logout', requireCsrf, wrap(async (req, res) => { await destroySession(req, res); res.json({ ok: true }); }));

/* ----- Administração (exige login + CSRF) ----- */
const admin = Router();
admin.use(requireAuth, requireCsrf);

admin.get('/settings', wrap(async (_req, res) => res.json({ data: await R.settingsAll() })));
admin.put('/settings', wrap(async (req, res) => res.json({ data: await R.settingsSave(req.body) })));

admin.post('/upload', (req, res, next) => {
  uploadMiddleware(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      return next(Object.assign(new Error(err.code === 'LIMIT_FILE_SIZE'
        ? `Arquivo maior que ${config.maxUploadMb} MB.` : 'Falha no envio do arquivo.'), { status: 422 }));
    }
    if (err) return next(err);
    saveUpload(req.file).then((url) => res.status(201).json({ url })).catch(next);
  });
});

admin.get('/users', wrap(async (req, res) => res.json({ data: await listUsers(), me: req.user.id })));
admin.post('/users', wrap(async (req, res) => res.status(201).json({ id: await createUser(req.body || {}) })));
admin.put('/users/:id', wrap(async (req, res) => {
  const id = toId(req.params.id); if (id == null) fail(404, 'Rota não encontrada.');
  await updateUser(req.user, id, req.body || {}); res.json({ ok: true });
}));
admin.delete('/users/:id', wrap(async (req, res) => {
  const id = toId(req.params.id); if (id == null) fail(404, 'Rota não encontrada.');
  await deleteUser(req.user, id); res.json({ ok: true });
}));

/* CRUD genérico: /admin/<recurso>[/<id>] e /admin/<recurso>/reorder */
admin.param('res', (req, _res, next, name) => {
  if (!Object.hasOwn(R.RESOURCES, name)) return next('router');
  req.def = R.RESOURCES[name]; next();
});
admin.get('/:res', wrap(async (req, res) => res.json({ data: await R.list(req.def) })));
admin.post('/:res', wrap(async (req, res) => res.status(201).json({ data: await R.create(req.def, req.body) })));
admin.post('/:res/reorder', wrap(async (req, res) => { await R.reorder(req.def, req.body?.ids); res.json({ ok: true }); }));
admin.get('/:res/:id', wrap(async (req, res) => {
  const id = toId(req.params.id); const row = id != null && await R.get(req.def, id);
  if (!row) fail(404, 'Registro não encontrado.'); res.json({ data: row });
}));
admin.put('/:res/:id', wrap(async (req, res) => {
  const id = toId(req.params.id); if (id == null) fail(404, 'Registro não encontrado.');
  res.json({ data: await R.update(req.def, id, req.body) });
}));
admin.delete('/:res/:id', wrap(async (req, res) => {
  const id = toId(req.params.id); if (id == null) fail(404, 'Registro não encontrado.');
  await R.remove(req.def, id); res.json({ ok: true });
}));

api.use('/admin', admin);
api.use((_req, _res, next) => next(Object.assign(new Error('Rota não encontrada.'), { status: 404 })));
