# IBSEN Escola de Negócios — Site + Painel Administrativo

**PHP 8.1+ · MySQL/MariaDB · React (já compilado)** — feito para a hospedagem comum da Hostinger (qualquer plano com PHP).

Não há app Node.js, processo para reiniciar nem variáveis de ambiente. O servidor web da Hostinger serve os arquivos
e o PHP responde a API. O conteúdo fica no banco de dados e as imagens enviadas pelo painel ficam em `uploads/`.

```
/                  ← tudo isto vai para a pasta public_html
├─ index.html, assets/   site e painel (React compilado — gerado por frontend/)
├─ api/index.php         API (/api/...)
├─ app/                  código do servidor (bloqueado para a web) + config.php gerado na instalação
├─ instalar.php          instalação pelo navegador (roda uma vez)
├─ images/               imagens fixas do site (logo, fotos)
├─ uploads/              imagens enviadas pelo painel
├─ frontend/             código-fonte do React (só para quem for alterar o visual)
└─ .htaccess             rotas e proteções
```

## Publicar na Hostinger

### 1. Banco de dados
hPanel → **Bancos de dados → Gerenciamento**: crie (ou reaproveite) um banco e um usuário. Anote o **nome exato**
do banco e do usuário, com o prefixo `u123456789_` e com as letras minúsculas/maiúsculas como aparecem na lista, e a senha.

> Pode reaproveitar o banco da versão anterior: as tabelas e o conteúdo são mantidos, e o login antigo continua valendo.

### 2. Site PHP no domínio
Se o domínio está hoje ligado a um **app Node.js** (Web App), remova esse app em hPanel → Websites (deixe **desmarcado**
"Delete email service" para manter os e-mails). Depois crie/adicione o domínio como **site comum** (sem Node.js).
Em **Avançado → Configuração PHP**, escolha PHP **8.2** ou **8.3**.

### 3. Enviar os arquivos (escolha um jeito)
- **Arquivo .zip (mais simples):** hPanel → **Gerenciador de Arquivos** → abra `public_html` → apague o que houver lá →
  **Upload** do `site-instituto-simples.zip` → clique com o botão direito → **Extract** (extrair) dentro de `public_html`.
  Confira se `index.html`, `api`, `app`… ficaram direto em `public_html` (e não numa subpasta).
- **Git:** hPanel → **Avançado → GIT** → repositório `https://github.com/ibsenescoladenegocios/ibsen.git`, branch `main`,
  pasta vazia (deixe em branco para `public_html`). Repositório privado exige cadastrar a *SSH key* que a Hostinger mostra
  em GitHub → Settings → Deploy keys. Ative **Auto Deployment** se quiser que cada push atualize o site.

### 4. Instalar
Abra `https://seudominio.com.br/instalar.php`, preencha os dados do banco (servidor `localhost`) e o administrador e
clique em **Instalar**. Ele cria as tabelas, importa o conteúdo inicial (só se o banco estiver vazio) e cadastra o admin.
Pronto: o site está em `/` e o painel em `/admin`.

### 5. Conferir
- Site abre com o conteúdo · `/admin` entra e **continua logado** ao navegar.
- No painel, envie uma imagem em qualquer item e confira no site.

## Problemas comuns
| Sintoma | O que fazer |
|---|---|
| "O site ainda não foi instalado" | Abra `/instalar.php`. |
| Instalador: "Usuário ou senha do banco incorretos" | Redefina a senha do usuário em hPanel → Bancos de dados e tente de novo. |
| Instalador: "O usuário não tem acesso a este banco" | Nome do banco diferente da lista (maiúsculas importam) ou usuário não vinculado. |
| Preciso trocar a senha do banco | Apague `app/config.php` no Gerenciador de Arquivos e rode `/instalar.php` de novo (nada do banco é apagado). |
| Esqueci a senha do painel | Rode `/instalar.php` de novo (apague `app/config.php` antes) informando o mesmo e-mail e uma senha nova. |
| Imagem enviada não aparece | A pasta `uploads/` precisa existir em `public_html` e aceitar gravação (permissão 755). |
| Logo/fotos fixas não aparecem | Envie os arquivos para `images/` (veja `images/LEIA-ME.txt`) ou troque-os pelo painel. |
| Erro 500 na API | Veja o log de erros do PHP em hPanel → Avançado → Logs de erro. |

## Segurança
Senhas com bcrypt · sessão PHP em cookie HttpOnly + SameSite (8 h sem uso) · token CSRF em toda alteração · bloqueio
após 8 tentativas de login em 15 min · SQL só com consultas parametrizadas · campos em lista branca · links validados
(bloqueia `javascript:`) · upload só de imagens reais (confere os bytes) com nome aleatório, e nada em `uploads/` é
executado · `app/` e `frontend/` bloqueados para a web · `app/config.php` fora do Git.

**Backups:** exporte o banco pelo phpMyAdmin de tempos em tempos e baixe a pasta `uploads/`.

## Alterar o visual (desenvolvedores)
```bash
cd frontend && npm install
php -S localhost:8000 -t .. ../app/dev-router.php   # em outro terminal: API PHP local
npm run dev                   # http://localhost:5173 (painel em /admin)
npm run build                 # gera ../index.html e ../assets — faça commit desses arquivos
```
Para um novo tipo de conteúdo: crie a tabela em `app/schema.sql`, registre-a em `resources()` (`app/content.php`),
descreva os campos em `frontend/src/pages/admin/config.js` e crie o componente em `frontend/src/components/site/`.
