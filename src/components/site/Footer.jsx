import SafeImg from './SafeImg.jsx';

export default function Footer({ s }) {
  return (
    <footer className="bg-gray-900 py-10 text-white">
      <div className="container mx-auto px-4">
        <div className="flex flex-col items-center justify-between md:flex-row">
          <div className="mb-6 md:mb-0">
            <SafeImg src={s.logo_url} alt={s.site_title} className="h-10" />
          </div>
          <div className="text-center md:text-right">
            <p className="mb-2">© {new Date().getFullYear()} {s.footer_company}. Todos os direitos reservados.</p>
            {s.footer_credit && <p>Desenvolvido com <i className="fas fa-heart text-primary" /> {s.footer_credit}</p>}
          </div>
        </div>
      </div>
    </footer>
  );
}
