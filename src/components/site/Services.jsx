export default function Services({ items }) {
  if (!items.length) return null;
  return (
    <section id="consultoria" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-blue-800 md:text-4xl">Nossos Serviços de Consultoria</h2>
        <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
          {items.map((c, i) => (
            <div key={c.id} className="overflow-hidden rounded-lg bg-gray-50 shadow-md transition duration-300 hover:shadow-lg">
              <div className="bg-green-500 px-6 py-4 text-white">
                <h3 className="text-xl font-bold">{i + 1} - {c.title}</h3>
              </div>
              <div className="p-6">
                <ul className="space-y-2">
                  {c.items.map((it, k) => (
                    <li key={k} className="flex items-start">
                      <i className="fas fa-check mr-2 mt-1 text-primary" />
                      <span>{it}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
