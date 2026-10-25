import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { RESOURCES, SETTINGS_PAGES } from './config.js';

const NAV = [
  { to: '/admin', label: 'Painel', icon: 'fa-home', end: true },
  { to: '/admin/geral', label: SETTINGS_PAGES.geral.label, icon: SETTINGS_PAGES.geral.icon },
  { to: '/admin/slides', label: RESOURCES.slides.label, icon: RESOURCES.slides.icon },
  { to: '/admin/sobre', label: SETTINGS_PAGES.sobre.label, icon: SETTINGS_PAGES.sobre.icon },
  ...['service_categories', 'courses', 'articles', 'clients', 'team_members', 'events'].map((k) => ({
    to: `/admin/${k}`, label: RESOURCES[k].label, icon: RESOURCES[k].icon,
  })),
  { to: '/admin/contato', label: SETTINGS_PAGES.contato.label, icon: SETTINGS_PAGES.contato.icon },
  { to: '/admin/usuarios', label: 'Usuários', icon: 'fa-user-shield' },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen bg-gray-100 md:flex">
      <aside className={`${open ? 'block' : 'hidden'} bg-gray-900 text-gray-200 md:block md:w-64 md:shrink-0`}>
        <div className="hidden px-5 py-5 text-lg font-bold text-white md:block">ISDG <span className="text-primary">Admin</span></div>
        <nav className="space-y-1 px-3 pb-4 md:py-0" aria-label="Administração">
          {NAV.map((n) => (
            <NavLink key={n.to} to={n.to} end={n.end} onClick={() => setOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 rounded-md px-3 py-2 text-sm ${isActive ? 'bg-primary text-white' : 'hover:bg-gray-800'}`}>
              <i className={`fas ${n.icon} w-5 text-center`} />{n.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <div className="min-w-0 flex-1">
        <header className="sticky top-0 z-30 flex items-center justify-between border-b bg-white px-4 py-3">
          <div className="flex items-center gap-3">
            <button className="md:hidden" onClick={() => setOpen(!open)} aria-label="Menu"><i className="fas fa-bars text-xl text-gray-700" /></button>
            <a href="/" target="_blank" rel="noopener noreferrer" className="text-sm font-medium text-primary hover:underline">
              <i className="fas fa-external-link-alt mr-1" />Ver site
            </a>
          </div>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden text-gray-600 sm:inline">{user.name}</span>
            <button className="btn-ghost !py-1" onClick={logout}><i className="fas fa-sign-out-alt" />Sair</button>
          </div>
        </header>
        <main className="p-4 md:p-8"><Outlet /></main>
      </div>
    </div>
  );
}
