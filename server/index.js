// Servidor do site: usado localmente (npm run api) e na Hostinger (entry file = server/index.js).
// Se o banco falhar ao iniciar, o servidor NÃO cai: ele sobe mostrando o motivo do erro na tela.
import { existsSync } from 'node:fs';
import path from 'node:path';
import express from 'express';
import { config } from './lib/config.js';

const port = Number(process.env.PORT) || config.port;

function mountSite(a) {
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
}

let app;
try {
  // Importados aqui dentro: se o banco não estiver configurado, o erro é capturado em vez de derrubar o app.
  const { createApp } = await import('./app.js');
  const { ready } = await import('./lib/ready.js');
  app = createApp(mountSite);
  await ready();
  console.log('[setup] Banco OK.');
} catch (e) {
  const motivo = `${e.code ? e.code + ': ' : ''}${e.message}`;
  console.error('[setup] Falha ao iniciar:', motivo);
  app = express();
  app.use((_req, res) => res.status(500).type('text').send(
    'O site não conseguiu iniciar.\n\n' +
    `Motivo: ${motivo}\n\n` +
    'Confira as variáveis de ambiente do banco (DB_HOST, DB_NAME, DB_USER, DB_PASSWORD) e reimplante.'
  ));
}

app.listen(port, () => console.log(`✔ Servidor na porta ${port}`));
import('./lib/upload.js').then((m) => m.checkUploadDir()).catch(() => {}); // só informativo
