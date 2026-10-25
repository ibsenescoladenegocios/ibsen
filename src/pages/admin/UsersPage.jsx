import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAuth } from '../../lib/AuthContext.jsx';
import Modal from '../../components/admin/Modal.jsx';
import { useToast } from '../../components/admin/Toast.jsx';

const Err = ({ children }) => (children ? <p className="mt-1 text-sm text-red-600">{children}</p> : null);

export default function UsersPage() {
  const toast = useToast();
  const { user: me, setUser } = useAuth();
  const [rows, setRows] = useState(null);
  const [form, setForm] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [del, setDel] = useState(null);

  const load = useCallback(() => { api.get('/api/admin/users').then((d) => setRows(d.data)).catch((e) => toast(e.message, 'err')); }, [toast]);
  useEffect(() => { load(); }, [load]);

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isSelf = form?.id === me.id;

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    const body = { name: form.name, email: form.email };
    if (form.password) body.password = form.password;
    if (form.password && isSelf) body.current_password = form.current_password;
    try {
      if (form.id) await api.put(`/api/admin/users/${form.id}`, body);
      else await api.post('/api/admin/users', body);
      if (isSelf) setUser({ ...me, name: form.name, email: form.email.toLowerCase() });
      toast('Usuário salvo.');
      setForm(null); load();
    } catch (ex) { setErrors(ex.fields || {}); toast(ex.message, 'err'); }
    finally { setSaving(false); }
  }

  async function remove() {
    try { await api.del(`/api/admin/users/${del.id}`); toast('Usuário excluído.'); load(); }
    catch (ex) { toast(ex.message, 'err'); }
    setDel(null);
  }

  return (
    <section>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold text-gray-800">Usuários administradores</h1>
        <button className="btn-primary" onClick={() => { setErrors({}); setForm({ name: '', email: '', password: '' }); }}>
          <i className="fas fa-plus" />Adicionar usuário
        </button>
      </div>
      <p className="mb-3 text-sm text-gray-500">Todos os usuários listados têm acesso total ao painel.</p>

      {!rows ? <p className="text-gray-500">Carregando…</p> : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600"><tr><th className="px-3 py-3">Nome</th><th className="px-3 py-3">E-mail</th><th className="px-3 py-3 text-right">Ações</th></tr></thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2 font-medium">{u.name}{u.id === me.id && <span className="ml-2 rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-600">você</span>}</td>
                  <td className="px-3 py-2">{u.email}</td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button className="btn-ghost !px-3 !py-1" onClick={() => { setErrors({}); setForm({ ...u, password: '', current_password: '' }); }}><i className="fas fa-pen" />Editar</button>{' '}
                    {u.id !== me.id && <button className="btn-danger !px-3 !py-1" onClick={() => setDel(u)} aria-label="Excluir"><i className="fas fa-trash" /></button>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {form && (
        <Modal title={form.id ? 'Editar usuário' : 'Novo usuário'} onClose={() => setForm(null)}>
          <form onSubmit={save} className="space-y-4" autoComplete="off">
            <div><label className="mb-1 block text-sm font-semibold">Nome</label><input className={`input ${errors.name ? 'input-error' : ''}`} value={form.name} onChange={set('name')} required /><Err>{errors.name}</Err></div>
            <div><label className="mb-1 block text-sm font-semibold">E-mail</label><input type="email" className={`input ${errors.email ? 'input-error' : ''}`} value={form.email} onChange={set('email')} required /><Err>{errors.email}</Err></div>
            <div>
              <label className="mb-1 block text-sm font-semibold">{form.id ? 'Nova senha (deixe vazio para manter)' : 'Senha'}</label>
              <input type="password" autoComplete="new-password" className={`input ${errors.password ? 'input-error' : ''}`} value={form.password} onChange={set('password')} required={!form.id} minLength={form.password ? 10 : undefined} />
              <p className="mt-1 text-xs text-gray-500">Mínimo de 10 caracteres.</p><Err>{errors.password}</Err>
            </div>
            {isSelf && form.password && (
              <div><label className="mb-1 block text-sm font-semibold">Senha atual</label><input type="password" autoComplete="current-password" className={`input ${errors.current_password ? 'input-error' : ''}`} value={form.current_password} onChange={set('current_password')} required /><Err>{errors.current_password}</Err></div>
            )}
            <div className="flex justify-end gap-2 border-t pt-4">
              <button type="button" className="btn-ghost" onClick={() => setForm(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {del && (
        <Modal title="Excluir usuário" onClose={() => setDel(null)}>
          <p className="mb-5 text-gray-700">Excluir <strong>{del.name}</strong> ({del.email})? Essa pessoa perderá o acesso ao painel.</p>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setDel(null)}>Cancelar</button>
            <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={remove}>Excluir</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
