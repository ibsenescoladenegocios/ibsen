import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../../lib/api.js';
import { RESOURCES } from './config.js';

export default function Dashboard() {
  const [counts, setCounts] = useState({});
  useEffect(() => {
    Object.keys(RESOURCES).forEach((k) => {
      api.get(`/api/admin/${k}`).then((d) => setCounts((c) => ({ ...c, [k]: d.data.length }))).catch(() => {});
    });
  }, []);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-bold text-gray-800">Painel</h1>
      <p className="mb-6 text-gray-600">Escolha uma área para adicionar, editar ou remover conteúdo do site.</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Object.entries(RESOURCES).filter(([k]) => k !== 'about_cards').map(([k, r]) => (
          <Link key={k} to={`/admin/${k}`} className="rounded-lg border border-gray-200 bg-white p-5 transition hover:border-primary hover:shadow">
            <i className={`fas ${r.icon} mb-3 text-2xl text-primary`} />
            <div className="font-semibold text-gray-800">{r.label}</div>
            <div className="text-sm text-gray-500">{counts[k] ?? '…'} registro(s)</div>
          </Link>
        ))}
      </div>
    </div>
  );
}
