import SafeImg from './SafeImg.jsx';

export default function Team({ items }) {
  if (!items.length) return null;
  const featured = items.filter((m) => m.featured);
  const others = items.filter((m) => !m.featured);
  return (
    <section id="equipe" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-blue-800 md:text-4xl">Nossa Equipe</h2>

        {featured.map((m) => (
          <div key={m.id} className="mb-16 flex flex-col items-center rounded-lg bg-gray-50 p-8 shadow-lg md:flex-row">
            <div className="mb-6 md:mb-0 md:w-1/3">
              <SafeImg src={m.photo_url} alt={m.name} className="mx-auto h-48 w-48 rounded-full border-4 border-primary object-cover" />
            </div>
            <div className="md:w-2/3 md:pl-10">
              <h3 className="mb-4 text-2xl font-bold text-primary">{m.name}</h3>
              <p className="text-gray-700">{m.bio}</p>
            </div>
          </div>
        ))}

        {others.length > 0 && (
          <div className="grid grid-cols-1 gap-8 md:grid-cols-2">
            {others.map((m) => (
              <div key={m.id} className="flex items-center rounded-lg bg-gray-50 p-6 shadow-md">
                <div className="mr-6 shrink-0">
                  <SafeImg src={m.photo_url} alt={m.name} className="w-32 border-4 border-primary object-cover sm:w-40" />
                </div>
                <div>
                  <h3 className="mb-2 text-xl font-bold text-gray-800">{m.name}</h3>
                  <p className="text-gray-700">{m.bio}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
