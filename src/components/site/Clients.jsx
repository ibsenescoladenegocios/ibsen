import SafeImg from './SafeImg.jsx';
import { safeHref } from '../../lib/utils.js';

export default function Clients({ items }) {
  if (!items.length) return null;
  return (
    <section id="clientes" className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-blue-800 md:text-4xl">Nossos Clientes</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-4">
          {items.map((c) => (
           
           
           <div key={c.id} className="overflow-hidden rounded-lg bg-white shadow-md transition duration-300 hover:shadow-lg">
              <div className="flex h-40 items-center justify-center bg-gray-200 p-4">
                <SafeImg src={c.logo_url} alt={c.name} className="max-h-full max-w-full" />
              </div>
              <div className="p-6">
                <h3 className="mb-2 text-xl font-bold text-gray-800">{c.name}</h3>
                {c.description && <p className="mb-4 text-gray-700">“{c.description}”</p>}
                {safeHref(c.link) && (
                  <a href={safeHref(c.link)} target="_blank" rel="noopener noreferrer"
                     className="inline-block font-medium text-primary hover:underline">
                    <i className="fas fa-external-link-alt mr-2" />Saiba mais
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
