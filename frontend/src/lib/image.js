// Prepara a imagem no navegador antes do envio: reduz fotos grandes (celular) para
// economizar banda e disco do servidor.
export const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;
const MAX_SIDE = 2000;          // lado maior, em pixels
const COMPRESS_ABOVE = 1.5 * 1024 * 1024;

export async function prepareImage(file) {
  if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) {
    throw new Error('Formato não permitido. Envie JPG, PNG, WebP ou GIF.');
  }
  let out = file;

  // GIFs animados não são recomprimidos (perderiam a animação)
  if (file.type !== 'image/gif') {
    try {
      const bmp = await createImageBitmap(file);
      const scale = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
      if (scale < 1 || file.size > COMPRESS_ABOVE) {
        const w = Math.round(bmp.width * scale);
        const h = Math.round(bmp.height * scale);
        const canvas = document.createElement('canvas');
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(bmp, 0, 0, w, h);
        const blob = await new Promise((res) => canvas.toBlob(res, 'image/webp', 0.85));
        bmp.close?.();
        if (blob && blob.type === 'image/webp' && (blob.size < file.size || scale < 1)) {
          out = new File([blob], file.name.replace(/\.[^.]+$/, '') + '.webp', { type: 'image/webp' });
        }
      } else {
        bmp.close?.();
      }
    } catch { /* se o navegador não conseguir processar, envia o original */ }
  }

  if (out.size > MAX_UPLOAD_BYTES) {
    throw new Error(`Imagem muito grande (${(out.size / 1048576).toFixed(1)} MB). O limite é 5 MB — reduza a imagem e tente de novo.`);
  }
  return out;
}
