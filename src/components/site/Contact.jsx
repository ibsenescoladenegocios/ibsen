import { safeHref } from '../../lib/utils.js';

const SOCIALS = [
  ['social_facebook', 'fa-facebook-f', 'Facebook'],
  ['social_linkedin', 'fa-linkedin-in', 'LinkedIn'],
  ['social_instagram', 'fa-instagram', 'Instagram'],
  ['social_youtube', 'fa-youtube', 'YouTube'],
];

export default function Contact({ s }) {
  const socials = SOCIALS.filter(([k]) => safeHref(s[k]));
  return (
    <section id="contato" className="bg-white py-20">
      <div className="container mx-auto px-4">
        <h2 className="mb-16 text-center text-3xl font-bold text-blue-800 md:text-4xl">Contato</h2>
        <div className="flex flex-col md:flex-row">
          <div className="rounded-lg bg-gray-50 p-8 shadow-md md:w-1/2">
            <h3 className="mb-6 text-2xl font-bold text-primary">Informações de Contato</h3>

            {s.contact_address && (
              <div className="mb-6">
                <h4 className="mb-2 text-lg font-bold text-gray-800">MATRIZ:</h4>
                {s.contact_address.split('\n').map((l, i) => <p key={i} className="text-gray-700">{l}</p>)}
              </div>
            )}
            {s.contact_phone && (
              <div className="mb-6">
                <h4 className="mb-2 text-lg font-bold text-gray-800">Telefone/Fax:</h4>
                <p className="text-gray-700">{s.contact_phone}</p>
              </div>
            )}
            {s.contact_email && (
              <div>
                <h4 className="mb-2 text-lg font-bold text-gray-800">E-mail:</h4>
                {s.contact_email_text && <p className="mb-4 text-gray-700">{s.contact_email_text}</p>}
                <a href={`mailto:${s.contact_email}`} className="font-medium text-primary hover:underline">
                  <i className="fas fa-envelope mr-2" />{s.contact_email}
                </a>
              </div>
            )}
            {socials.length > 0 && (
              <div className="mt-8">
                <h4 className="mb-4 text-lg font-bold text-gray-800">Redes Sociais:</h4>
                <div className="flex space-x-4">
                  {socials.map(([k, icon, label]) => (
                    <a key={k} href={safeHref(s[k])} target="_blank" rel="noopener noreferrer" aria-label={label}
                       className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-white transition duration-300 hover:bg-red-700">
                      <i className={`fab ${icon}`} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
