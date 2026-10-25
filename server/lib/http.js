/** Erro HTTP com mensagem para o usuário e (opcional) erros por campo. */
export class HttpError extends Error {
  constructor(status, message, fields) {
    super(message);
    this.status = status;
    this.fields = fields;
  }
}
export const fail = (status, message, fields) => { throw new HttpError(status, message, fields); };

/** Permite handlers async no Express 4. */
export const wrap = (fn) => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
