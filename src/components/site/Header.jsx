import { useState } from 'react';
import SafeImg from './SafeImg.jsx';
import { handleAnchorClick } from '../../lib/utils.js';

const LINKS = [
  ['#home', 'Home'], ['#sobre', 'Sobre Nós'], ['#consultoria', 'Consultoria'], ['#cursos', 'Cursos'],
  ['#artigos', 'Artigos'], ['#clientes', 'Clientes'], ['#equipe', 'Equipe'], ['#agenda', 'Agenda'], ['#contato', 'Contato'],
];

export default function Header({ logo, title }) {
  const [open, setOpen] = useState(false);
  const click = (e, href) => handleAnchorClick(e, href, () => setOpen(false));

  return (
    <header className="sticky top-0 z-50 bg-white shadow-md">
      <div className="container mx-auto flex items-center justify-between px-4 py-3">
        <a href="#home" onClick={(e) => click(e, '#home')} className="flex items-center">
          <SafeImg src={logo} alt={title || 'Logo'} className="h-20" />
        </a>

        <nav className="hidden md:block" aria-label="Principal">
          <ul className="flex space-x-6">
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <a href={href} onClick={(e) => click(e, href)} className="font-medium text-blue-800 border-b-2 border-transparent hover:border-primary hover:text-primary">{label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <button className="text-gray-800 md:hidden" onClick={() => setOpen(!open)} aria-label="Abrir menu" aria-expanded={open}>
          <i className="fas fa-bars text-2xl" />
        </button>
      </div>

      {open && (
        <div className="bg-white px-4 py-2 shadow-lg md:hidden">
          <ul className="space-y-2">
            {LINKS.map(([href, label]) => (
              <li key={href}>
                <a href={href} onClick={(e) => click(e, href)} className="block py-2 text-gray-800 hover:text-primary">{label}</a>
              </li>
            ))}
          </ul>
        </div>
      )}
    </header>
  );
}
