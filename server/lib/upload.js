import crypto from 'node:crypto';
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import multer from 'multer';
import { config } from './config.js';
import { fail } from './http.js';

export const uploadMiddleware = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: config.maxUploadMb * 1024 * 1024, files: 1 },
}).single('file');

/** Identifica o tipo real pelos bytes iniciais (não confia no nome nem no Content-Type). */
function sniff(buf) {
  if (buf.length > 12) {
    if (buf[0] === 0xff && buf[1] === 0xd8 && buf[2] === 0xff) return 'jpg';
    if (buf.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return 'png';
    if (buf.subarray(0, 4).toString('latin1') === 'GIF8') return 'gif';
    if (buf.subarray(0, 4).toString('latin1') === 'RIFF' && buf.subarray(8, 12).toString('latin1') === 'WEBP') return 'webp';
  }
  return null;
}

export async function saveUpload(file) {
  if (!file) fail(422, 'Nenhum arquivo enviado.');
  const ext = sniff(file.buffer);
  if (!ext) fail(422, 'Formato não permitido. Envie JPG, PNG, WebP ou GIF.');
  await mkdir(config.uploadDir, { recursive: true });
  const name = `${crypto.randomBytes(10).toString('hex')}.${ext}`;
  await writeFile(path.join(config.uploadDir, name), file.buffer, { flag: 'wx' });
  return `/uploads/${name}`;
}
