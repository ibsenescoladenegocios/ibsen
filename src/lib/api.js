// Cliente HTTP da API Node. PUT/DELETE são enviados como POST + X-HTTP-Method-Override
// (compatível com proxies que bloqueiam esses métodos).
let csrf = '';
let onUnauthorized = () => {};

export const setCsrf = (t) => { csrf = t || ''; };
export const setUnauthorizedHandler = (fn) => { onUnauthorized = fn; };

async function request(method, url, body, isForm = false) {
  const headers = { Accept: 'application/json' };
  let realMethod = method;
  if (method !== 'GET') {
    headers['X-CSRF-Token'] = csrf;
    if (method !== 'POST') {
      headers['X-HTTP-Method-Override'] = method;
      realMethod = 'POST';
    }
  }
  if (body !== undefined && !isForm) headers['Content-Type'] = 'application/json';

  let res;
  try {
    res = await fetch(url, {
      method: realMethod,
      headers,
      credentials: 'same-origin',
      body: body === undefined ? undefined : isForm ? body : JSON.stringify(body),
    });
  } catch {
    throw Object.assign(new Error('Não foi possível conectar ao servidor.'), { status: 0, fields: {} });
  }

  let data = null;
  try { data = await res.json(); } catch { /* resposta sem JSON */ }

  if (!res.ok) {
    if (res.status === 413 && !data) data = { error: 'Arquivo grande demais para o servidor.' };
    if (res.status === 401 && url.includes('/admin/')) onUnauthorized();
    throw Object.assign(new Error(data?.error || `Erro ${res.status}`), { status: res.status, fields: data?.fields || {} });
  }
  return data;
}

export const api = {
  get: (u) => request('GET', u),
  post: (u, b) => request('POST', u, b ?? {}),
  put: (u, b) => request('PUT', u, b ?? {}),
  del: (u) => request('DELETE', u),
  upload: (file) => {
    const fd = new FormData();
    fd.append('file', file);
    return request('POST', '/api/admin/upload', fd, true);
  },
};
