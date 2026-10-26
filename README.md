# Instituto Simples — Site + Painel Administrativo

**React (Vite) + Tailwind** · **Node.js (Express)** · **MariaDB** · feito para a **Hostinger (plano Unlimited/Business)**.
Um único app Node serve o site, a API (`/api`) e as imagens enviadas (`/uploads`).

```
isdg-site/
├─ src/                 React: site público (components/site) e painel (pages/admin)
├─ public/images/       Imagens estáticas do site (logo, fotos, logos de clientes)
├─ server/
│  ├─ index.js          Entrada do app (é o "Entry file" da Hostinger)
│  ├─ app.js            App Express (API)
│  ├─ lib/              db, auth, validação, CRUD, upload, seed, schema.js
│  └─ routes/api.js     Rotas /api
├─ scripts/create-admin.js   (só para uso local)
└─ .env.example
```

## Segurança já implementada
Senhas com bcrypt · sessões no banco (cookie HttpOnly + SameSite; só o hash do token é guardado) · token CSRF em toda escrita · bloqueio após 8 tentativas de login em 15 min · SQL só com consultas parametrizadas · campos em lista branca · links validados (bloqueia `javascript:`) · upload só de imagens reais (confere os bytes) com nome aleatório · sessão expira após 8 h sem uso · não permite excluir o último admin.

---

## 1) Antes de tudo: suas imagens
Copie para `public/images/` os arquivos que a página original usava: `isdglogo.png`, `proprietario.png`, `lideranca.png`, `sistema.png`, `ia.png`, `ultragaz.png`, `cemig.png`, `petrobras.png`, `vale.png`, `andre.jpg`, `consltor.png`.
(Depois dá para trocá-las pelo painel.)

## 2) Teste local com XAMPP (Windows)
Precisa do **Node.js 20+** (nodejs.org). O XAMPP entra só com o MariaDB.

1. XAMPP Control Panel → **Start** no **MySQL**.
2. `http://localhost/phpmyadmin` → *Bancos de dados* → nome `isdg`, collation `utf8mb4_unicode_ci` → **Criar**.
3. Copie `.env.example` para `.env` (`copy .env.example .env`) e deixe:
   ```
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=isdg
   DB_USER=root
   DB_PASSWORD=
   ADMIN_EMAIL=admin@teste.com
   ADMIN_PASSWORD=SenhaForte12345
   ```
   (Remova as linhas `UPLOAD_DIR`, ou deixe-a apontando para uma pasta que exista. Sem ela, as imagens vão para `./uploads`.)
4. Terminal 1: `npm install` e depois `npm run api` (cria as tabelas, o conteúdo e o admin).
5. Terminal 2: `npm run dev` → site em `http://localhost:5173`, painel em `/admin`.

Para ver como em produção: `npm run build` e `npm start` → `http://localhost:3000`.

---

## 3) Publicando na Hostinger — plano Unlimited

> O plano **Unlimited** (chamado **Business** fora do Brasil) executa apps Node.js — o Single e o Premium não. Limites do plano para Node: até 5 sites Node.js, 3 GB de RAM, 2 núcleos de CPU. **Não use PM2 nem cluster** (a Hostinger já gerencia o processo; este projeto já é um processo único).

### 3.1 Contratar
- Escolha **Unlimited** e o período (24 meses). O domínio e os e-mails são grátis **só no 1º ano**; depois renovam pelo preço normal — veja o valor de renovação no carrinho.
- Confira se a extensão que você quer (por exemplo `.com.br`) entra na promoção do domínio grátis; algumas extensões não entram.

### 3.2 Criar o banco MariaDB
1. hPanel → **Bancos de dados → Gerenciamento** (MySQL).
2. Crie banco, usuário e senha. A Hostinger acrescenta um prefixo (algo como `u123456789_`). **Anote os nomes completos.**
3. Host: `localhost` · Porta: `3306`. (O phpMyAdmin fica no mesmo menu, para consultar as tabelas.)

### 3.3 Subir o código no GitHub
Crie um repositório (pode ser **privado**) e envie o projeto, **com `public/images/` incluída**. O `.gitignore` já exclui `.env`, `node_modules` e `dist`.
*Alternativa sem GitHub:* compacte a pasta em .zip **sem** `node_modules`, `dist` e `.env`, e use "Upload your website files".

### 3.4 Pasta das imagens (fora do código)
Cada deploy sobrescreve `public_html` e `hbuilds/` — por isso as imagens enviadas pelo painel não podem ficar lá.
1. hPanel → **Gerenciador de Arquivos**. O caminho mostrado tem a forma `/home/u123456789/domains/seudominio.com.br/…`; anote o seu `u123456789`.
2. Na pasta do usuário (a que contém `domains`), crie a pasta **`isdg-uploads`**.
3. Você vai usar `UPLOAD_DIR=/home/u123456789/isdg-uploads` (com o seu usuário).

### 3.5 Criar o site Node.js
1. hPanel → **Websites → Criar website → Web App**.
2. **Import Git Repository** (autorize o GitHub e escolha o repositório) — ou *Upload your website files* com o .zip.
3. Se o seu domínio já estiver vinculado a outro site no plano (por exemplo, um site padrão/WordPress), a Hostinger exige criar o app Node como **novo website**: faça backup, remova o site antigo (deixe **desmarcado** "Delete email service" para manter os e-mails) e crie o Web App no mesmo domínio.
4. **Configurações de build:**

   | Campo | Valor |
   |---|---|
   | Framework preset | **Express.js** (se detectar *Vite*, troque para Express.js; se não houver, use *Other*) |
   | Versão do Node | 22 |
   | Build command | `npm run build` |
   | Entry file | `server/index.js` |
   | Output directory | deixe vazio |

5. **Environment variables** → *Import from .env file*, colando o conteúdo abaixo já preenchido (**sem** `PORT` e **sem** `NODE_ENV`):
   ```
   DB_HOST=localhost
   DB_PORT=3306
   DB_NAME=u123456789_isdg
   DB_USER=u123456789_isdg
   DB_PASSWORD=sua_senha_do_banco
   ADMIN_NAME=Seu Nome
   ADMIN_EMAIL=voce@seudominio.com.br
   ADMIN_PASSWORD=UmaSenhaForte-com-10+caracteres
   UPLOAD_DIR=/home/u123456789/isdg-uploads
   ```
6. Clique em **Deploy**. Na primeira partida o app cria as 12 tabelas no MariaDB, importa o conteúdo atual do site e cadastra o administrador.

### 3.6 Conferir
1. Abra `https://seudominio.com.br` — o site deve aparecer com os dados.
2. No phpMyAdmin, veja se as tabelas foram criadas.
3. Entre em `https://seudominio.com.br/admin` com o e-mail e a senha que definiu.
4. **Remova `ADMIN_PASSWORD`** das variáveis (Settings → Environment Variables) e faça **Redeploy**. Mudanças em variáveis só valem após reimplantar.
5. **Teste de persistência das imagens:** no painel, troque a foto de algum item, confirme que ela aparece, faça um **Redeploy** e confirme que a foto continua lá.

### 3.7 Atualizar o site depois
`git push` → a Hostinger reconstrói sozinha (deploy automático por push). O conteúdo editado no painel fica no banco, e as imagens em `isdg-uploads` — nada disso é afetado.

### 3.8 Esqueci a senha / perdi o acesso
O `npm` não roda via SSH na Hostinger, então use variáveis: cadastre `RESET_ADMIN=1`, `ADMIN_EMAIL` (o e-mail do administrador) e `ADMIN_PASSWORD` (a nova senha), faça **Redeploy**, entre, e depois **remova `RESET_ADMIN` e `ADMIN_PASSWORD`** e reimplante.

### 3.9 Problemas comuns
| Sintoma | O que verificar |
|---|---|
| O site mostra "API no ar. Rode npm run build" | O build não gerou `dist`: confira o *Build command* (`npm run build`) e o log em **Deployments**. |
| Erro 503 / "too many processes" | Não use PM2/cluster. Reinicie o app (botão *Restart*) e veja o uso de recursos. |
| "Access denied" / não conecta no banco | Nomes completos com prefixo; usuário vinculado ao banco; host `localhost`; porta 3306. |
| Imagem enviada não aparece | `UPLOAD_DIR` apontando para a pasta criada (seu usuário correto) e se a mensagem de erro no painel menciona a pasta. |
| Página `/admin` dá "não encontrado" ao atualizar | Confira se o preset é Express.js (o app trata as rotas do React). |
| Mudei variável e nada mudou | Faça **Redeploy**. |

> **Backups:** além dos backups do plano (veja em hPanel → Backups), exporte o banco pelo phpMyAdmin de tempos em tempos e baixe a pasta `isdg-uploads`.

---

## Como o painel funciona
| Menu | O que edita |
|---|---|
| Geral e rodapé | título do site, logo, rodapé |
| Slides do topo | carrossel (título, texto, botão, imagem, cor) |
| Sobre nós | textos, imagem, fundador e os destaques (com ícones) |
| Serviços de consultoria | categorias e seus itens (um por linha) |
| Cursos · Artigos · Clientes · Equipe | cadastro completo com imagem |
| Agenda | eventos (o site só mostra de hoje em diante) |
| Contato | endereço, telefone, e-mail, redes sociais (vazio = oculta o ícone) |
| Usuários | adicionar/editar/excluir administradores e trocar senha |

Em todas as listas: **ordem** (setas), **Visível/Oculto** (clique no selo) e **excluir**. Ao enviar uma imagem, o navegador reduz fotos grandes automaticamente.

## Adicionando um novo tipo de dado
1. Crie a tabela em `server/lib/schema.js` (`CREATE TABLE IF NOT EXISTS …`) — ela é criada na próxima partida do app.
2. Registre o recurso em `server/lib/resources.js` (`RESOURCES`).
3. Descreva os campos em `src/pages/admin/config.js` e crie o componente público em `src/components/site/`.
