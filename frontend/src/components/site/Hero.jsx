import { useEffect, useState } from 'react';
import SafeImg from './SafeImg.jsx';
import { handleAnchorClick, safeHref } from '../../lib/utils.js';

// Classes completas para o Tailwind enxergar cada uma
const THEMES = {
  primary:    { bg: 'bg-primary',  btn: 'bg-white text-primary hover:bg-gray-100' },
  'gray-800': { bg: 'bg-gray-800', btn: 'bg-primary text-white hover:bg-red-700' },
  'gray-700': { bg: 'bg-gray-700', btn: 'bg-primary text-white hover:bg-red-700' },
  'gray-900': { bg: 'bg-gray-900', btn: 'bg-primary text-white hover:bg-red-700' },
};

export default function Hero({ slides }) {
  const [current, setCurrent] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = slides.length;

  useEffect(() => { if (current >= count) setCurrent(0); }, [count, current]);

  useEffect(() => {
    if (paused || count < 2) return undefined;
    const id = setInterval(() => setCurrent((c) => (c + 1) % count), 5000);
    return () => clearInterval(id);
  }, [paused, count]);

  if (!count) return <section id="home" />;
  const go = (i) => setCurrent((i + count) % count);

  return (
    <section id="home" className="relative" onMouseEnter={() => setPaused(true)} onMouseLeave={() => setPaused(false)}>
      {slides.map((s, i) => {
        if (i !== current) return null;
        const t = THEMES[s.theme] || THEMES.primary;
        const href = safeHref(s.button_link);
        return (
          <div key={s.id} className={`${t.bg} py-20 text-white`}>
            <div className="container mx-auto flex flex-col items-center px-4 md:flex-row">
              <div className="mb-10 md:mb-0 md:w-1/2">
                <h1 className="mb-4 text-4xl font-bold md:text-5xl">{s.title}</h1>
                {s.subtitle && <p className="mb-8 text-xl">{s.subtitle}</p>}
                {s.button_text && href && (
                  <a href={href} onClick={(e) => handleAnchorClick(e, href)}
                     className={`inline-block rounded-lg px-6 py-3 font-bold transition duration-300 ${t.btn}`}>
                    {s.button_text}
                  </a>
                )}
              </div>
              <div className="md:w-1/2">
                <SafeImg src={s.image_url} alt={s.title} className="rounded-lg shadow-xl" />
              </div>
            </div>
          </div>
        );
      })}

      {count > 1 && (
        <>
          <div className="absolute bottom-10 left-0 right-0 flex justify-center space-x-2">
            {slides.map((s, i) => (
              <button key={s.id} onClick={() => go(i)} aria-label={`Slide ${i + 1}`}
                      className={`h-3 w-3 rounded-full bg-white hover:opacity-100 ${i === current ? 'opacity-100' : 'opacity-50'}`} />
            ))}
          </div>
          <button onClick={() => go(current - 1)} aria-label="Slide anterior"
                  className="absolute left-4 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-2 text-white hover:bg-white/50">
            <i className="fas fa-chevron-left text-xl" />
          </button>
          <button onClick={() => go(current + 1)} aria-label="Próximo slide"
                  className="absolute right-4 top-1/2 -translate-y-1/2 rounded-full bg-white/30 p-2 text-white hover:bg-white/50">
            <i className="fas fa-chevron-right text-xl" />
          </button>
        </>
      )}
    </section>
  );
}
