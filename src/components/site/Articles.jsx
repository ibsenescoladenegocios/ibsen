import SafeImg from './SafeImg.jsx';
import { safeHref } from '../../lib/utils.js';

export default function Articles({ items }) {
  if (!items.length) return null;
  return (
    <section id="artigos" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-gray-800 md:text-4xl">Artigos</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
          {items.map((a) => (
            <div key={a.id} className="overflow-hidden rounded-lg bg-gray-50 shadow-md transition duration-300 hover:shadow-lg">
              <div className="flex h-48 items-center justify-center bg-gray-300">
                <SafeImg src={a.image_url} alt={a.title} style={{ width: a.image_width }} />
              </div>
              <div className="p-6">
                <h3 className="mb-3 text-xl font-bold text-gray-800">{a.title}</h3>
                {safeHref(a.link) && (
                  <a href={safeHref(a.link)} target="_blank" rel="noopener noreferrer"
                     className="inline-block font-medium text-primary hover:underline">
                    <i className="fas fa-external-link-alt mr-2" />Ler artigo completo
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
