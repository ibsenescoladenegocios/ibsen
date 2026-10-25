/** Aceita somente links seguros (evita javascript:). */
export function safeHref(url) {
  if (!url) return '';
  return /^(https?:\/\/|mailto:|tel:|\/|#)/i.test(url) && !url.startsWith('//') ? url : '';
}

export function formatDate(iso) {
  if (!iso) return '';
  const [y, m, d] = iso.split('-');
  return `${d}/${m}/${y}`;
}

export function scrollToHash(hash) {
  const el = document.querySelector(hash);
  if (el) window.scrollTo({ top: el.offsetTop - 80, behavior: 'smooth' });
}

/** Clique em âncora interna (#secao) com rolagem suave e deslocamento do header. */
export function handleAnchorClick(e, href, after) {
  if (href && href.startsWith('#') && href.length > 1) {
    e.preventDefault();
    scrollToHash(href);
    after?.();
  }
}
