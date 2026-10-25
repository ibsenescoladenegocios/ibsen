import { fail } from './http.js';

const isStr = (v) => typeof v === 'string';

/** Valida um único valor. Retorna { value } ou { error }. */
export function validateValue(f, raw) {
  const type = f.type;

  if (type === 'bool') {
    const v = raw === true || raw === 1 || raw === '1' || raw === 'true' || raw === 'on';
    return { value: v ? 1 : 0 };
  }

  if (type === 'int') {
    if (raw === '' || raw == null) raw = f.default ?? 0;
    const n = Number(raw);
    if (!Number.isInteger(n)) return { error: 'Informe um número inteiro.' };
    if (f.min != null && n < f.min) return { error: `Valor mínimo: ${f.min}.` };
    if (f.max != null && n > f.max) return { error: `Valor máximo: ${f.max}.` };
    return { value: n };
  }

  if (type === 'lines') {
    let arr = raw;
    if (isStr(arr)) arr = arr.split(/\r\n|\r|\n/);
    if (!Array.isArray(arr)) return { error: 'Lista inválida.' };
    const out = [];
    for (const line of arr) {
      const t = String(line ?? '').trim();
      if (!t) continue;
      if (t.length > 200) return { error: 'Cada item pode ter até 200 caracteres.' };
      out.push(t);
    }
    if (out.length > 30) return { error: 'No máximo 30 itens.' };
    return { value: JSON.stringify(out) };
  }

  const s = (isStr(raw) || typeof raw === 'number') ? String(raw).trim() : '';
  if (f.required && !s) return { error: 'Campo obrigatório.' };
  if (f.max && [...s].length > f.max) return { error: `Máximo de ${f.max} caracteres.` };

  switch (type) {
    case 'url':
      if (s && (/\s/.test(s) || !/^(https?:\/\/|mailto:|tel:|\/|#)/i.test(s) || s.startsWith('//'))) {
        return { error: 'Use um link http(s)://, mailto:, tel:, um caminho iniciando em / ou uma âncora (#secao).' };
      }
      return { value: s };
    case 'email':
      if (s && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s)) return { error: 'E-mail inválido.' };
      return { value: s };
    case 'date': {
      const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
      const d = m && new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
      if (!d || d.getUTCFullYear() !== +m[1] || d.getUTCMonth() !== +m[2] - 1 || d.getUTCDate() !== +m[3]) {
        return { error: 'Data inválida.' };
      }
      return { value: s };
    }
    case 'enum':
      if (!s && f.default) return { value: f.default };
      if (!f.values.includes(s)) return { error: 'Opção inválida.' };
      return { value: s };
    default:
      return { value: s };
  }
}

/** Valida o corpo; partial=true ignora campos ausentes (PUT). */
export function validatePayload(fields, body, partial) {
  const input = body && typeof body === 'object' && !Array.isArray(body) ? body : {};
  const clean = {};
  const errors = {};
  for (const [name, f] of Object.entries(fields)) {
    let raw = input[name];
    if (!(name in input)) {
      if (partial) continue;
      raw = f.default ?? (f.type === 'lines' ? [] : '');
    }
    const r = validateValue(f, raw);
    if (r.error) errors[name] = r.error; else clean[name] = r.value;
  }
  if (Object.keys(errors).length) fail(422, 'Corrija os campos destacados.', errors);
  return clean;
}
