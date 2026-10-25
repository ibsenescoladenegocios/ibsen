import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../lib/AuthContext.jsx';

export default function Login() {
  const { login } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true); setError('');
    try { await login(email, password); }
    catch (ex) { setError(ex.message); setBusy(false); }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-100 p-4">
      <form onSubmit={submit} className="w-full max-w-sm rounded-xl bg-white p-8 shadow-lg">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white"><i className="fas fa-lock" /></div>
          <h1 className="text-xl font-bold text-gray-800">Painel administrativo</h1>
          <p className="text-sm text-gray-500">Instituto Simples Escola de Negócios</p>
        </div>

        {error && <p role="alert" className="mb-4 rounded bg-red-50 p-3 text-sm text-red-700">{error}</p>}

        <label htmlFor="email" className="mb-1 block text-sm font-semibold text-gray-700">E-mail</label>
        <input id="email" type="email" autoComplete="username" required autoFocus className="input mb-4" value={email} onChange={(e) => setEmail(e.target.value)} />

        <label htmlFor="password" className="mb-1 block text-sm font-semibold text-gray-700">Senha</label>
        <input id="password" type="password" autoComplete="current-password" required className="input mb-6" value={password} onChange={(e) => setPassword(e.target.value)} />

        <button type="submit" className="btn-primary w-full" disabled={busy}>{busy ? 'Entrando…' : 'Entrar'}</button>
        <Link to="/" className="mt-4 block text-center text-sm text-gray-500 hover:text-primary">← Voltar ao site</Link>
      </form>
    </div>
  );
}
