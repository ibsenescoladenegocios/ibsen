import { safeHref } from '../../lib/utils.js';

export default function Courses({ items }) {
  if (!items.length) return null;
  return (
    <section id="cursos" className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-blue-800 md:text-4xl">Nossos Cursos</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
          {items.map((c) => (
            <div key={c.id} className="overflow-hidden rounded-lg bg-white shadow-md transition duration-300 hover:shadow-lg">
              <div className="bg-green-600 px-6 py-4 text-white">
                <h3 className="text-xl font-bold">{c.title}</h3>
              </div>
              <div className="p-6">
                {c.description && <p className="mb-4 text-gray-700">“{c.description}”</p>}
                {c.duration && (
                  <div className="mb-4 flex items-center">
                    <i className="fas fa-clock mr-2 text-primary" />
                    <span>Carga horária: {c.duration}</span>
                  </div>
                )}
                {safeHref(c.link) && (
                  <a href={safeHref(c.link)} target="_blank" rel="noopener noreferrer"
                     className="mb-4 inline-block font-medium text-primary hover:underline">
                    <i className="fas fa-link mr-2" />Link para o curso
                  </a>
                )}
                {c.contact_email && (
                  <div className="rounded-lg bg-gray-100 p-4">
                    <p className="text-gray-700">Saiba mais: envie um email para{' '}
                      <a href={`mailto:${c.contact_email}`} className="text-primary hover:underline">{c.contact_email}</a>
                    </p>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
