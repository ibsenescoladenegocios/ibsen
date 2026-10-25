import { useEffect, useState } from 'react';
import { api } from '../lib/api.js';
import Header from '../components/site/Header.jsx';
import Hero from '../components/site/Hero.jsx';
import About from '../components/site/About.jsx';
import Services from '../components/site/Services.jsx';
import Courses from '../components/site/Courses.jsx';
import Articles from '../components/site/Articles.jsx';
import Clients from '../components/site/Clients.jsx';
import Team from '../components/site/Team.jsx';
import Agenda from '../components/site/Agenda.jsx';
import Contact from '../components/site/Contact.jsx';
import Footer from '../components/site/Footer.jsx';
import BackToTop from '../components/site/BackToTop.jsx';

export default function Home() {
  const [data, setData] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/api/public').then(setData).catch((e) => setError(e.message));
  }, []);

  useEffect(() => {
    if (data?.settings?.site_title) document.title = data.settings.site_title;
  }, [data]);

  if (error) return <div className="p-10 text-center text-gray-600">Não foi possível carregar o conteúdo. Tente novamente em instantes.</div>;
  if (!data) return <div className="p-10 text-center text-gray-500">Carregando…</div>;

  const s = data.settings;
  return (
    <>
      <Header logo={s.logo_url} title={s.site_title} />
      <Hero slides={data.slides} />
      <About s={s} cards={data.about_cards} />
      <Services items={data.service_categories} />
      <Courses items={data.courses} />
      <Articles items={data.articles} />
      <Clients items={data.clients} />
      <Team items={data.team_members} />
      <Agenda items={data.events} />
      <Contact s={s} />
      <Footer s={s} />
      <BackToTop />
    </>
  );
}
