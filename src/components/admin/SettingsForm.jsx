import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { SETTINGS_PAGES } from '../../pages/admin/config.js';
import Field from './Field.jsx';
import { useToast } from './Toast.jsx';

export default function SettingsForm({ page }) {
  const cfg = SETTINGS_PAGES[page];
  const toast = useToast();
  const [values, setValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setValues(null);
    api.get('/api/admin/settings').then((d) => setValues(d.data)).catch((e) => toast(e.message, 'err'));
  }, [page]); // eslint-disable-line react-hooks/exhaustive-deps

  async function save(e) {
    e.preventDefault();
    setSaving(true); setErrors({});
    const payload = {};
    cfg.fields.forEach((f) => { payload[f.name] = values[f.name] ?? ''; });
    try {
      await api.put('/api/admin/settings', payload);
      toast('Alterações salvas.');
    } catch (ex) { setErrors(ex.fields || {}); toast(ex.message, 'err'); }
    finally { setSaving(false); }
  }

  if (!values) return <p className="text-gray-500">Carregando…</p>;
  return (
    <form onSubmit={save} className="space-y-4 rounded-lg border border-gray-200 bg-white p-5">
      {cfg.fields.map((f) => (
        <Field key={f.name} field={f} value={values[f.name]} error={errors[f.name]}
               onChange={(v) => setValues((cur) => ({ ...cur, [f.name]: v }))} />
      ))}
      <div className="flex justify-end border-t pt-4">
        <button type="submit" className="btn-primary" disabled={saving}>{saving ? 'Salvando…' : 'Salvar alterações'}</button>
      </div>
    </form>
  );
}
