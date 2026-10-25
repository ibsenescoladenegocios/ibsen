import { useCallback, useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { RESOURCES } from '../../pages/admin/config.js';
import Field from './Field.jsx';
import Modal from './Modal.jsx';
import { useToast } from './Toast.jsx';

function emptyRecord(fields) {
  const r = {};
  fields.forEach((f) => { r[f.name] = f.default ?? (f.type === 'lines' ? [] : f.type === 'checkbox' ? false : ''); });
  return r;
}

export default function ResourceManager({ resource, embedded = false }) {
  const cfg = RESOURCES[resource];
  const base = `/api/admin/${resource}`;
  const toast = useToast();

  const [rows, setRows] = useState(null);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(null);   // {id?, ...valores}
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);
  const [confirmDel, setConfirmDel] = useState(null);

  const load = useCallback(() => {
    api.get(base).then((d) => setRows(d.data)).catch((e) => setError(e.message));
  }, [base]);
  useEffect(() => { setRows(null); setError(''); load(); }, [load]);

  const openNew = () => { setErrors({}); setEditing(emptyRecord(cfg.fields)); };
  const openEdit = (r) => { setErrors({}); setEditing({ ...emptyRecord(cfg.fields), ...r }); };

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    const payload = {};
    cfg.fields.forEach((f) => { payload[f.name] = editing[f.name]; });
    try {
      if (editing.id) await api.put(`${base}/${editing.id}`, payload);
      else await api.post(base, payload);
      toast(editing.id ? 'Alterações salvas.' : 'Registro criado.');
      setEditing(null); load();
    } catch (ex) {
      setErrors(ex.fields || {});
      toast(ex.message, 'err');
    } finally { setSaving(false); }
  }

  async function remove() {
    try {
      await api.del(`${base}/${confirmDel.id}`);
      toast('Registro excluído.');
      setConfirmDel(null); load();
    } catch (ex) { toast(ex.message, 'err'); setConfirmDel(null); }
  }

  async function move(index, dir) {
    const next = [...rows];
    const j = index + dir;
    if (j < 0 || j >= next.length) return;
    [next[index], next[j]] = [next[j], next[index]];
    setRows(next);
    try { await api.post(`${base}/reorder`, { ids: next.map((r) => r.id) }); }
    catch (ex) { toast(ex.message, 'err'); load(); }
  }

  async function toggleActive(r) {
    try { await api.put(`${base}/${r.id}`, { active: !r.active }); load(); }
    catch (ex) { toast(ex.message, 'err'); }
  }

  const Head = embedded ? 'h2' : 'h1';

  return (
    <section className={embedded ? 'mt-10' : ''}>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <Head className="text-2xl font-bold text-gray-800">{cfg.label}</Head>
        <button className="btn-primary" onClick={openNew}><i className="fas fa-plus" />Adicionar {cfg.singular}</button>
      </div>
      {cfg.note && <p className="mb-3 text-sm text-gray-500">{cfg.note}</p>}

      {error && <p className="rounded bg-red-50 p-3 text-red-700">{error}</p>}
      {!rows && !error && <p className="text-gray-500">Carregando…</p>}
      {rows && rows.length === 0 && (
        <p className="rounded-lg border border-dashed border-gray-300 bg-white p-8 text-center text-gray-500">Nenhum registro ainda.</p>
      )}

      {rows && rows.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-gray-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-gray-50 text-gray-600">
              <tr>
                {cfg.sortable && <th className="w-20 px-3 py-3">Ordem</th>}
                <th className="px-3 py-3">{cfg.fields.find((f) => f.name === cfg.titleField)?.label}</th>
                {cfg.columns.map((c) => <th key={c.key} className="hidden px-3 py-3 md:table-cell">{c.label}</th>)}
                <th className="px-3 py-3">Site</th>
                <th className="px-3 py-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((r, i) => (
                <tr key={r.id} className={r.active ? '' : 'bg-gray-50 text-gray-400'}>
                  {cfg.sortable && (
                    <td className="px-3 py-2">
                      <button className="px-1 text-gray-500 hover:text-primary disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label="Subir"><i className="fas fa-arrow-up" /></button>
                      <button className="px-1 text-gray-500 hover:text-primary disabled:opacity-30" disabled={i === rows.length - 1} onClick={() => move(i, 1)} aria-label="Descer"><i className="fas fa-arrow-down" /></button>
                    </td>
                  )}
                  <td className="px-3 py-2 font-medium">{r[cfg.titleField]}</td>
                  {cfg.columns.map((c) => (
                    <td key={c.key} className="hidden max-w-xs truncate px-3 py-2 md:table-cell">
                      {c.render ? c.render(r[c.key]) : String(r[c.key] ?? '')}
                    </td>
                  ))}
                  <td className="px-3 py-2">
                    <button onClick={() => toggleActive(r)} title="Clique para alternar"
                            className={`rounded-full px-2 py-0.5 text-xs font-semibold ${r.active ? 'bg-green-100 text-green-700' : 'bg-gray-200 text-gray-600'}`}>
                      {r.active ? 'Visível' : 'Oculto'}
                    </button>
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 text-right">
                    <button className="btn-ghost !px-3 !py-1" onClick={() => openEdit(r)}><i className="fas fa-pen" />Editar</button>{' '}
                    <button className="btn-danger !px-3 !py-1" onClick={() => setConfirmDel(r)} aria-label="Excluir"><i className="fas fa-trash" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {editing && (
        <Modal wide title={`${editing.id ? 'Editar' : 'Adicionar'} ${cfg.singular}`} onClose={() => setEditing(null)}>
          <form onSubmit={save} className="space-y-4">
            {cfg.fields.map((f) => (
              <Field key={f.name} field={f} value={editing[f.name]} error={errors[f.name]}
                     onChange={(v) => setEditing((cur) => ({ ...cur, [f.name]: v }))} />
            ))}
            <div className="flex justify-end gap-2 border-t pt-4">
              <button type="button" className="btn-ghost" onClick={() => setEditing(null)}>Cancelar</button>
              <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar'}</button>
            </div>
          </form>
        </Modal>
      )}

      {confirmDel && (
        <Modal title="Excluir registro" onClose={() => setConfirmDel(null)}>
          <p className="mb-5 text-gray-700">Excluir <strong>{confirmDel[cfg.titleField]}</strong>? Esta ação não pode ser desfeita. Para apenas esconder do site, use o botão “Visível/Oculto”.</p>
          <div className="flex justify-end gap-2">
            <button className="btn-ghost" onClick={() => setConfirmDel(null)}>Cancelar</button>
            <button className="btn bg-red-600 text-white hover:bg-red-700" onClick={remove}>Excluir</button>
          </div>
        </Modal>
      )}
    </section>
  );
}
