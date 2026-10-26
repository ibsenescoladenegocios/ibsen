import { batchWrite, one } from './db.js';

/** Importa o conteúdo original do site. Só roda se o banco estiver vazio. */
export async function seedContent() {
  const a = await one('SELECT COUNT(*) AS n FROM settings');
  const b = await one('SELECT COUNT(*) AS n FROM slides');
  if (a.n > 0 || b.n > 0) return false;

  const stmts = [];
  const exec = (sql, args) => stmts.push({ sql, args });

  const U = 'https://images.unsplash.com/';
  const Q = '?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=1170&q=80';

  const settings = {
    site_title: 'Instituto Simples Escola de Negócios',
    logo_url: '/images/isdglogo.png',
    about_heading: 'Instituto Simples Escola de Negócios',
    about_image: `${U}photo-1579621970563-ebec7560ff3e${Q}`,
    about_p1: 'O ISDG é uma empresa de consultoria especializada em sistemas de gestão e desenvolvimento organizacional, com mais de 30 anos de experiência no mercado.',
    about_p2: 'Nossa missão é ajudar empresas a alcançarem excelência operacional através da implementação de sistemas de gestão robustos e metodologias comprovadas.',
    about_p3: 'Com uma equipe multidisciplinar de consultores certificados, oferecemos soluções personalizadas para empresas de todos os portes e segmentos.',
    founder_title: 'Conheça Nosso Fundador',
    founder_text: 'Com mais de 30 anos de experiência no mercado, nosso fundador tem liderado a equipe do ISDG na entrega de soluções de excelência para nossos clientes. Sua visão estratégica e conhecimento profundo em sistemas de gestão têm sido fundamentais para o sucesso de nossa organização e de nossos parceiros.',
    founder_photo: '/images/proprietario.png',
    contact_address: 'Av. do Contorno, 9636 - sala 1201 - Barro Preto\n30.110-067 - Belo Horizonte/MG - Brasil',
    contact_phone: '(31) 3295-4105',
    contact_email: 'contato@institutosimples.com.br',
    contact_email_text: 'Caso queira enviar um e-mail através do seu programa de e-mail, envie para:',
    social_facebook: '', social_linkedin: '', social_instagram: '', social_youtube: '',
    footer_company: 'Instituto Simples Escola de Negócios',
    footer_credit: 'pela equipe ISDG',
  };
  for (const [k, v] of Object.entries(settings)) exec('INSERT INTO settings (k, v) VALUES (?, ?)', [k, v]);

  const slides = [
    ['Excelência em Gestão Empresarial', 'Transformando desafios em oportunidades há mais de 30 anos', 'Nossos Serviços', '#consultoria', 'photo-1522071820081-009f0129c71c', 'primary'],
    ['Consultoria Especializada', 'Soluções personalizadas para o sucesso do seu negócio', 'Conheça Nossas Soluções', '#consultoria', 'photo-1551288049-bebda4e38f71', 'gray-800'],
    ['Cursos de Formação', 'Desenvolva suas habilidades de gestão com nossos especialistas', 'Ver Cursos', '#cursos', 'photo-1522202176988-66273c2fd55f', 'gray-700'],
    ['Clientes Satisfeitos', 'Empresas que confiam em nossa expertise', 'Nossos Clientes', '#clientes', 'photo-1563986768609-322da13575f3', 'gray-900'],
    ['Conhecimento Compartilhado', 'Acesse nossos artigos e materiais exclusivos', 'Ler Artigos', '#artigos', 'photo-1450101499163-c8848c66ca85', 'primary'],
  ];
  for (const [i, s] of slides.entries()) {
    exec('INSERT INTO slides (title, subtitle, button_text, button_link, image_url, theme, sort_order) VALUES (?,?,?,?,?,?,?)',
      [s[0], s[1], s[2], s[3], `${U}${s[4]}${Q}`, s[5], i + 1]);
  }

  const cards = [['Consultores Certificados', 'fa-user-tie'], ['Resultados Comprovados', 'fa-chart-line'], ['Soluções Personalizadas', 'fa-cogs']];
  for (const [i, c] of cards.entries()) exec('INSERT INTO about_cards (title, icon, sort_order) VALUES (?,?,?)', [c[0], c[1], i + 1]);

  const services = [
    ['Sistemas de Gestão ISO', ['ISO 9001 (Qualidade)', 'ISO 14001 (Ambiental)', 'ISO 45001 (Segurança)', 'ISO 17025 (Laboratórios)', 'SA 8000 (Responsabilidade Social)']],
    ['Gestão Estratégica', ['Balanced Scorecard (BSC)', 'Planejamento Estratégico', 'Gestão de Diretrizes e Metas', 'Gestão Operacional da Rotina', 'Benchmarking e Melhoria Contínua']],
    ['Excelência Operacional', ['Six Sigma', 'Lean Manufacturing', 'Sistema de Gestão Integrado (SGI)', 'Reestruturação de Processos', 'Gestão da Manutenção (TPM)']],
    ['Gestão de Pessoas', ['Pesquisa de Clima Organizacional', 'Programas Motivacionais', 'Avaliação de Desempenho', 'Desenvolvimento de Liderança', 'Capacitação de Equipes']],
    ['Gestão Ambiental', ['Licenciamento Ambiental', 'Análise de Aspectos e Impactos', 'Programas de Sustentabilidade', 'Gestão de Resíduos', 'Norma NBR 14001']],
    ['Gestão de Riscos', ['Identificação de Perigos e Riscos', 'Gerenciamento de Riscos e Crise', 'Auditorias Internas', 'Avaliação de Fornecedores', 'Normas NRs (10, 13, 17)', 'Implementação e auditoria ISO 45001']],
  ];
  for (const [i, s] of services.entries()) exec('INSERT INTO service_categories (title, items, sort_order) VALUES (?,?,?)', [s[0], JSON.stringify(s[1]), i + 1]);

  const yt = 'https://www.youtube.com/watch?v=S1rsFE2Hdzk';
  exec('INSERT INTO courses (title, description, duration, link, contact_email, sort_order) VALUES (?,?,?,?,?,?)', ['FL - Formação de Líderes', 'Curso de formação de líderes', '1 mês', yt, 'contato@simples.com.br', 1]);
  exec('INSERT INTO courses (title, description, duration, link, contact_email, sort_order) VALUES (?,?,?,?,?,?)', ['FG - Formação de Gestores', 'Curso de formação de gerentes', '1 mês', yt, 'contato@simples.com.br', 2]);

  const dp = 'http://www.dominiopublico.gov.br/pesquisa/PesquisaObraForm.jsp';
  const arts = [['Liderança século XXI', '/images/lideranca.png', 140], ['Sistemas de Gestão Integrados', '/images/sistema.png', 125], ['Era da IAs - Nova realidade', '/images/ia.png', 120]];
  for (const [i, a] of arts.entries()) exec('INSERT INTO articles (title, image_url, image_width, link, sort_order) VALUES (?,?,?,?,?)', [a[0], a[1], a[2], dp, i + 1]);

  const clients = [['Ultragás', 'Consultoria em planejamento estratégico', 'ultragaz'], ['Cemig', 'Auditoria', 'cemig'], ['Petrobras', 'Treinamento', 'petrobras'], ['Vale', 'Treinamento', 'vale']];
  for (const [i, c] of clients.entries()) exec('INSERT INTO clients (name, description, logo_url, link, sort_order) VALUES (?,?,?,?,?)', [c[0], c[1], `/images/${c[2]}.png`, yt, i + 1]);

  const team = [
    ['Consultor Proprietário', 'Consultor a mais de 30 anos, com vasta experiência em sistemas de gestão e desenvolvimento organizacional. Especialista em implementação de normas ISO e metodologias de excelência operacional. Já atendeu mais de 200 empresas em diversos segmentos, ajudando-as a alcançar seus objetivos estratégicos.', '/images/proprietario.png', 1],
    ['Consultor 1', 'Consultor a mais de 30 anos, especializado em gestão estratégica e balanced scorecard. Com experiência em empresas de médio e grande porte.', '/images/andre.jpg', 0],
    ['Consultor 2', 'Consultor a mais de 30 anos, especialista em excelência operacional, Six Sigma e Lean Manufacturing. Com vasta experiência na indústria.', '/images/consltor.png', 0],
  ];
  for (const [i, m] of team.entries()) exec('INSERT INTO team_members (name, bio, photo_url, featured, sort_order) VALUES (?,?,?,?,?)', [...m, i + 1]);

  exec('INSERT INTO events (title, address, event_date, event_time, phone) VALUES (?,?,?,?,?)', ['Reunião Associação dos Empresários', 'Rua das Bandeiras, 105 - Contagem', '2025-08-25', '10h', '31 3333 0527']);
  exec('INSERT INTO events (title, address, event_date, event_time, phone) VALUES (?,?,?,?,?)', ['Curso de Formação de Líderes', 'Rua das Bandeiras, 105 - Contagem', '2025-07-25', '10h', '31 3333 0527']);
  await batchWrite(stmts);
  return true;
}
