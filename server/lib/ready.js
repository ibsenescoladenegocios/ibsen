import { migrate } from './migrate.js';

let promise = null;

/**
 * Prepara o banco uma única vez por inicialização do app (cria tabelas, conteúdo e admin).
 * É idempotente. SKIP_MIGRATE=1 pula essa etapa.
 */
export function ready() {
  if (process.env.SKIP_MIGRATE === '1') return Promise.resolve();
  promise ??= migrate().catch((e) => { promise = null; throw e; }); // tenta de novo na próxima requisição
  return promise;
}
