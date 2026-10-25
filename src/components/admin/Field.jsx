import { useRef, useState } from 'react';
import { api } from '../../lib/api.js';

function ImageInput({ value, onChange, invalid }) {
  const ref = useRef(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState('');

  async function pick(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setBusy(true); setErr('');
    try {
      const { url } = await api.upload(file);
      onChange(url);
    } catch (ex) { setErr(ex.message); } finally { setBusy(false); }
  }

  return (
    <div>
      <div className="flex items-start gap-3">
        <div className="flex h-20 w-28 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-200 bg-gray-100">
          {value ? <img src={value} alt="" className="max-h-full max-w-full object-contain" onError={(e) => { e.currentTarget.style.display = 'none'; }} />
                 : <i className="fas fa-image text-2xl text-gray-300" />}
        </div>
        <div className="min-w-0 flex-1 space-y-2">
          <input className={`input ${invalid ? 'input-error' : ''}`} value={value || ''} placeholder="URL da imagem ou envie um arquivo"
                 onChange={(e) => onChange(e.target.value)} />
          <div className="flex gap-2">
            <button type="button" className="btn-ghost !py-1" disabled={busy} onClick={() => ref.current?.click()}>
              <i className="fas fa-upload" />{busy ? 'Enviando…' : 'Enviar imagem'}
            </button>
            {value && <button type="button" className="btn-ghost !py-1" onClick={() => onChange('')}>Remover</button>}
          </div>
          <input ref={ref} type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={pick} />
        </div>
      </div>
      {err && <p className="mt-1 text-sm text-red-600">{err}</p>}
    </div>
  );
}

export default function Field({ field, value, onChange, error }) {
  const id = `f-${field.name}`;
  const cls = `input ${error ? 'input-error' : ''}`;
  let control;

  switch (field.type) {
    case 'textarea':
      control = <textarea id={id} rows={field.rows || 3} className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'lines':
      control = <textarea id={id} rows={8} className={cls} value={Array.isArray(value) ? value.join('\n') : value ?? ''}
                          onChange={(e) => onChange(e.target.value.split('\n'))} />;
      break;
    case 'select':
      control = (
        <select id={id} className={cls} value={value ?? field.default ?? ''} onChange={(e) => onChange(e.target.value)}>
          {field.options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
        </select>
      );
      break;
    case 'checkbox':
      return (
        <div>
          <label className="flex cursor-pointer items-center gap-2 text-sm font-medium text-gray-700">
            <input type="checkbox" className="h-4 w-4 accent-[#cd2026]" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
            {field.label}
          </label>
          {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
        </div>
      );
    case 'image':
      control = <ImageInput value={value} onChange={onChange} invalid={!!error} />;
      break;
    case 'number':
      control = <input id={id} type="number" min={field.min} max={field.max} className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    case 'date':
      control = <input id={id} type="date" className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
      break;
    default:
      control = <input id={id} type={field.type === 'email' ? 'email' : 'text'} className={cls} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />;
  }

  return (
    <div>
      <label htmlFor={id} className="mb-1 block text-sm font-semibold text-gray-700">
        {field.label}{field.required && <span className="text-primary"> *</span>}
      </label>
      {control}
      {field.help && !error && <p className="mt-1 text-xs text-gray-500">{field.help}</p>}
      {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
    </div>
  );
}
