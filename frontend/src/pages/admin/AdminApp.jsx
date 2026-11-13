import { useEffect } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';
import { ToastProvider } from '../../components/admin/Toast.jsx';
import Login from './Login.jsx';
import AdminLayout from './AdminLayout.jsx';
import Dashboard from './Dashboard.jsx';
import ResourceManager from '../../components/admin/ResourceManager.jsx';
import SettingsForm from '../../components/admin/SettingsForm.jsx';
import UsersPage from './UsersPage.jsx';
import { RESOURCES, SETTINGS_PAGES } from './config.js';

const PageTitle = ({ children }) => <h1 className="mb-4 text-2xl font-bold text-gray-800">{children}</h1>;

export default function AdminApp() {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.title = 'Painel administrativo';
    const meta = document.createElement('meta');
    meta.name = 'robots'; meta.content = 'noindex,nofollow';
    document.head.appendChild(meta);
    return () => meta.remove();
  }, []);

  if (loading) return <div className="p-10 text-center text-gray-500">Carregando…</div>;

  return (
    <ToastProvider>
      <Routes>
        <Route path="login" element={user ? <Navigate to="/admin" replace /> : <Login />} />
        <Route element={user ? <AdminLayout /> : <Navigate to="/admin/login" replace />}>
          <Route index element={<Dashboard />} />
          {Object.keys(SETTINGS_PAGES).map((key) => (
            <Route key={key} path={key} element={
              <>
                <PageTitle>{SETTINGS_PAGES[key].label}</PageTitle>
                <SettingsForm page={key} />
                {key === 'sobre' && <ResourceManager resource="about_cards" embedded />}
              </>
            } />
          ))}
          {Object.keys(RESOURCES).filter((k) => k !== 'about_cards').map((key) => (
            <Route key={key} path={key} element={<ResourceManager resource={key} />} />
          ))}
          <Route path="usuarios" element={<UsersPage />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Route>
      </Routes>
    </ToastProvider>
  );
}
