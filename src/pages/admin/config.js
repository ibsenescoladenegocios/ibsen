// Descrição declarativa dos campos editáveis no painel.
// tipos: text | textarea | url | image | email | date | number | checkbox | select | lines

const active = { name: 'active', label: 'Exibir no site', type: 'checkbox', default: true };

export const RESOURCES = {
  slides: {
    label: 'Slides do topo', singular: 'slide', icon: 'fa-images', sortable: true,
    titleField: 'title', columns: [{ key: 'subtitle', label: 'Subtítulo' }],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'subtitle', label: 'Subtítulo', type: 'text' },
      { name: 'button_text', label: 'Texto do botão', type: 'text' },
      { name: 'button_link', label: 'Link do botão', type: 'url', help: 'Ex.: #cursos (rola até a seção) ou https://…' },
      { name: 'image_url', label: 'Imagem', type: 'image' },
      { name: 'theme', label: 'Cor de fundo', type: 'select', default: 'primary',
        options: [['primary', 'Vermelho (principal)'], ['gray-800', 'Cinza escuro'], ['gray-700', 'Cinza médio'], ['gray-900', 'Quase preto']] },
      active,
    ],
  },
  service_categories: {
    label: 'Serviços de consultoria', singular: 'categoria', icon: 'fa-briefcase', sortable: true,
    titleField: 'title', columns: [{ key: 'items', label: 'Itens', render: (v) => `${v.length} item(ns)` }],
    note: 'A numeração (1 -, 2 -, …) é automática, conforme a ordem.',
    fields: [
      { name: 'title', label: 'Nome da categoria', type: 'text', required: true },
      { name: 'items', label: 'Itens', type: 'lines', help: 'Um item por linha.' },
      active,
    ],
  },
  courses: {
    label: 'Cursos', singular: 'curso', icon: 'fa-graduation-cap', sortable: true,
    titleField: 'title', columns: [{ key: 'duration', label: 'Carga horária' }],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'description', label: 'Descrição', type: 'textarea', rows: 3 },
      { name: 'duration', label: 'Carga horária', type: 'text', help: 'Ex.: 1 mês' },
      { name: 'link', label: 'Link do curso', type: 'url' },
      { name: 'contact_email', label: 'E-mail para saber mais', type: 'email' },
      active,
    ],
  },
  articles: {
    label: 'Artigos', singular: 'artigo', icon: 'fa-newspaper', sortable: true,
    titleField: 'title', columns: [{ key: 'link', label: 'Link' }],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'image_url', label: 'Imagem de capa', type: 'image' },
      { name: 'image_width', label: 'Largura da imagem (px)', type: 'number', default: 140, min: 40, max: 400 },
      { name: 'link', label: 'Link do artigo', type: 'url' },
      active,
    ],
  },
  clients: {
    label: 'Clientes', singular: 'cliente', icon: 'fa-handshake', sortable: true,
    titleField: 'name', columns: [{ key: 'description', label: 'Serviço prestado' }],
    fields: [
      { name: 'name', label: 'Nome', type: 'text', required: true },
      { name: 'description', label: 'Serviço prestado', type: 'text' },
      { name: 'logo_url', label: 'Logo', type: 'image' },
      { name: 'link', label: 'Link “Saiba mais”', type: 'url' },
      active,
    ],
  },
  team_members: {
    label: 'Equipe', singular: 'membro', icon: 'fa-users', sortable: true,
    titleField: 'name', columns: [{ key: 'featured', label: 'Destaque', render: (v) => (v ? 'Sim' : '—') }],
    fields: [
      { name: 'name', label: 'Nome / cargo', type: 'text', required: true },
      { name: 'bio', label: 'Descrição', type: 'textarea', rows: 5 },
      { name: 'photo_url', label: 'Foto', type: 'image' },
      { name: 'featured', label: 'Card em destaque (grande, no topo)', type: 'checkbox', default: false },
      active,
    ],
  },
  events: {
    label: 'Agenda', singular: 'evento', icon: 'fa-calendar-alt', sortable: false,
    titleField: 'title', columns: [{ key: 'event_date', label: 'Data', render: (v) => v.split('-').reverse().join('/') }],
    note: 'O site exibe apenas eventos com data de hoje em diante.',
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'address', label: 'Endereço', type: 'text' },
      { name: 'event_date', label: 'Data', type: 'date', required: true },
      { name: 'event_time', label: 'Horário', type: 'text', help: 'Ex.: 10h' },
      { name: 'phone', label: 'Telefone', type: 'text' },
      active,
    ],
  },
  about_cards: {
    label: 'Destaques (Sobre nós)', singular: 'destaque', icon: 'fa-star', sortable: true,
    titleField: 'title', columns: [{ key: 'icon', label: 'Ícone' }],
    fields: [
      { name: 'title', label: 'Título', type: 'text', required: true },
      { name: 'icon', label: 'Ícone (Font Awesome)', type: 'text', default: 'fa-star',
        help: 'Ex.: fa-user-tie, fa-chart-line, fa-cogs, fa-award. Veja fontawesome.com/icons (gratuitos).' },
      active,
    ],
  },
};

export const SETTINGS_PAGES = {
  geral: {
    label: 'Geral e rodapé', icon: 'fa-sliders-h',
    fields: [
      { name: 'site_title', label: 'Título do site (aba do navegador)', type: 'text' },
      { name: 'logo_url', label: 'Logo', type: 'image' },
      { name: 'footer_company', label: 'Nome da empresa no rodapé', type: 'text', help: '© ano é automático.' },
      { name: 'footer_credit', label: 'Crédito do rodapé', type: 'text', help: 'Aparece após “Desenvolvido com ♥”. Deixe vazio para ocultar.' },
    ],
  },
  sobre: {
    label: 'Sobre nós', icon: 'fa-building',
    fields: [
      { name: 'about_heading', label: 'Título', type: 'text' },
      { name: 'about_image', label: 'Imagem', type: 'image' },
      { name: 'about_p1', label: '1º parágrafo', type: 'textarea', rows: 3 },
      { name: 'about_p2', label: '2º parágrafo', type: 'textarea', rows: 3 },
      { name: 'about_p3', label: '3º parágrafo', type: 'textarea', rows: 3 },
      { name: 'founder_title', label: 'Fundador — título', type: 'text' },
      { name: 'founder_photo', label: 'Fundador — foto', type: 'image' },
      { name: 'founder_text', label: 'Fundador — texto', type: 'textarea', rows: 5 },
    ],
  },
  contato: {
    label: 'Contato', icon: 'fa-address-book',
    fields: [
      { name: 'contact_address', label: 'Endereço da matriz', type: 'textarea', rows: 3, help: 'Cada linha vira uma linha no site.' },
      { name: 'contact_phone', label: 'Telefone', type: 'text' },
      { name: 'contact_email', label: 'E-mail', type: 'email' },
      { name: 'contact_email_text', label: 'Texto acima do e-mail', type: 'textarea', rows: 2 },
      { name: 'social_facebook', label: 'Facebook (URL)', type: 'url', help: 'Deixe vazio para ocultar o ícone.' },
      { name: 'social_linkedin', label: 'LinkedIn (URL)', type: 'url' },
      { name: 'social_instagram', label: 'Instagram (URL)', type: 'url' },
      { name: 'social_youtube', label: 'YouTube (URL)', type: 'url' },
    ],
  },
};
