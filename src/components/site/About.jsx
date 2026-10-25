import SafeImg from './SafeImg.jsx';

export default function About({ s, cards }) {
  return (
    <section id="sobre" className="bg-gray-50 py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-blue-800 md:text-4xl">Sobre Nós</h2>

        <div className="flex flex-col items-center md:flex-row">
          <div className="mb-10 md:mb-0 md:w-1/2 md:pr-10">
            <SafeImg src={s.about_image} alt={s.about_heading} className="w-full rounded-lg shadow-lg" />
          </div>
          <div className="md:w-1/2">
            <h3 className="mb-6 text-2xl font-bold text-primary">{s.about_heading}</h3>
            {[s.about_p1, s.about_p2, s.about_p3].filter(Boolean).map((p, i) => (
              <p key={i} className="mb-6 text-gray-700">{p}</p>
            ))}
            {cards.length > 0 && (
              <div className="mb-10 grid grid-cols-1 gap-4 md:grid-cols-3">
                {cards.map((c) => (
                  <div key={c.id} className="rounded-lg bg-white p-4 text-center shadow-md">
                    <i className={`fas ${c.icon} mb-3 text-3xl text-primary`} />
                    <h4 className="font-bold text-gray-800">{c.title}</h4>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {(s.founder_text || s.founder_title) && (
          <div className="mt-20 flex flex-col items-center rounded-lg bg-white p-8 shadow-lg md:flex-row">
            <div className="mb-6 md:mb-0 md:w-1/3">
              <SafeImg src={s.founder_photo} alt="Fundador" className="mx-auto h-48 w-48 rounded-full border-4 border-primary object-cover" />
            </div>
            <div className="md:w-2/3 md:pl-10">
              <h3 className="mb-4 text-2xl font-bold text-primary">{s.founder_title}</h3>
              <p className="text-gray-700">{s.founder_text}</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
