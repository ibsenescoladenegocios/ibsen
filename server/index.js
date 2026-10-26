// Servidor do site: usado localmente (npm run api) e na Hostinger (entry file = server/index.js).
import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './lib/config.js';
import { ready } from './lib/ready.js';
import { checkUploadDir } from './lib/upload.js';
import { createApp } from './app.js';

const app = createApp((a) => {
  // Imagens enviadas pelo painel (ficam em UPLOAD_DIR)
  a.use('/uploads', express.static(config.uploadDir, {
    index: false, dotfiles: 'ignore', maxAge: '30d',
    setHeaders: (res) => res.set('Content-Security-Policy', "default-src 'none'; img-src 'self'"),
  }));

  if (existsSync(config.distDir)) {
    a.use('/assets', express.static(path.join(config.distDir, 'assets'), { immutable: true, maxAge: '1y', index: false }));
    a.use(express.static(config.distDir, { index: false, maxAge: '30d' }));
    a.get('*', (req, res) => {
      if (path.extname(req.path)) return res.status(404).type('text').send('Não encontrado');
      res.set('Cache-Control', 'no-cache').sendFile(path.join(config.distDir, 'index.html'));
    });
  } else {
    a.get('/', (_req, res) => res.type('text').send('API no ar. Rode "npm run build" para gerar o site.'));
  }
});

try {
  await ready();
} catch (e) {
  console.error('[setup] Falha ao preparar o banco:', e.message);
  process.exit(1);
}
app.listen(config.port, () => console.log(`✔ Servidor em http://localhost:${config.port}`));
checkUploadDir().catch(() => {}); // verificação informativa: nunca bloqueia a inicialização
