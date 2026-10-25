# Instituto Simples — Site + Painel Administrativo (100% JavaScript)

**React (Vite) + Tailwind** no front · **Node.js (Express)** no back · **MariaDB** como banco.
Um único processo Node serve o site, a API (`/api`) e as imagens enviadas (`/uploads`).

```
isdg-site/
├─ src/                 React: site público (components/site) e painel (pages/admin)
├─ public/images/       Imagens estáticas do site (logo, fotos, logos de clientes)
├─ server/
│  ├─ index.js          Servidor Express (API + site + uploads)
│  ├─ schema.sql        Tabelas (criadas automaticamente na 1ª inicialização)
│  ├─ lib/              auth, validação, CRUD genérico, upload, seed
│  └─ routes/api.js     Rotas /api
├─ scripts/create-admin.js
└─ .env.example         Variáveis de ambiente
```

## ⚠ Hospedagem: confira o seu plano
Segundo a documentação da Hostinger, apps Node.js rodam nos planos **Business e Cloud** (e em VPS).
Os planos compartilhados mais simples (Single/Premium/"Unlimited" antigos) **não** executam Node.js. Para conferir: hPanel → *Websites → Adicionar site* → se aparecer **“Node.js Apps”**, seu plano serve. Caso contrário, faça upgrade para Business ou use um VPS.

## Segurança já implementada
Senhas com bcrypt · sessões no banco (cookie HttpOnly + SameSite, só o hash do token é guardado) · token CSRF em toda escrita · bloqueio após 8 tentativas de login em 15 min · SQL só com consultas parametrizadas · campos em lista branca · links validados (bloqueia `javascript:`) · upload só de imagens reais (confere os bytes do arquivo), nome aleatório e CSP restritiva na pasta de uploads · sessão expira após 8 h sem uso · não permite excluir o último admin.

---

## 1) Imagens do seu site original
Copie para `public/images/`: `isdglogo.png`, `proprietario.png`, `lideranca.png`, `sistema.png`, `ia.png`, `ultragaz.png`, `cemig.png`, `petrobras.png`, `vale.png`, `andre.jpg`, `consltor.png`.
(Depois dá para trocá-las pelo painel, enviando novas imagens.)

## 2) Rodando localmente
Requisitos: Node 18+ e MariaDB/MySQL.

```bash
npm install
# crie um banco vazio:
#   CREATE DATABASE isdg CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
cp .env.example .env        # preencha DB_*, ADMIN_EMAIL e ADMIN_PASSWORD (mín. 10 caracteres)

npm run api    # terminal 1 → API em http://localhost:3000 (cria tabelas, conteúdo e admin sozinha)
npm run dev    # terminal 2 → site em http://localhost:5173  (painel: /admin)
```
Para testar como em produção: `npm run build && npm start` e abra http://localhost:3000.

## 3) Publicando na Hostinger (Node.js Apps)
1. **Banco** — hPanel → *Bancos de Dados → MariaDB*: crie banco e usuário. Anote nome, usuário e senha.
2. **Código** — envie o projeto para um repositório no GitHub (o `.gitignore` já exclui `.env` e `node_modules`) **ou** compacte a pasta em .zip **sem** `node_modules`, `dist` e `.env`.
3. **Criar o app** — hPanel → *Websites → Adicionar site → Node.js Apps* → importe o repositório ou o .zip.
4. **Configurar o app** (build / start):
   - Comando de build: `npm run build`
   - Comando de início / arquivo de entrada: `npm start` (ou `server/index.js`)
   - Versão do Node: 18 ou superior
5. **Variáveis de ambiente** (no próprio painel do app), as mesmas do `.env.example`:
   `NODE_ENV=production`, `DB_HOST`, `DB_NAME`, `DB_USER`, `DB_PASS`, `ADMIN_EMAIL`, `ADMIN_PASSWORD`, `ADMIN_NAME` e
   **`UPLOAD_DIR`** apontando para uma pasta **fora** do código (ex.: `/home/SEU_USUARIO/isdg-uploads`), para que as imagens enviadas não se percam em novos deploys.
6. **Implantar.** Na 1ª inicialização o servidor cria as tabelas, importa o conteúdo atual do site e cadastra o administrador.
7. **Remova `ADMIN_PASSWORD`** das variáveis de ambiente e reimplante. Acesse `https://seudominio/admin`.
8. Copie suas imagens estáticas (passo 1) antes do build, ou envie-as depois pelo painel.

> Se o banco estiver em outro host/porta, ajuste `DB_HOST` e `DB_PORT`. Na Hostinger o host costuma ser `localhost`.

### Criar/redefinir um administrador depois
Com acesso SSH (Business/Cloud/VPS): `npm run create-admin -- email@dominio.com "NovaSenha1234" "Nome"`.
Sem SSH: `ADMIN_EMAIL`/`ADMIN_PASSWORD` só funcionam quando **não existe nenhum usuário**; para os demais, use o painel (menu *Usuários*).

### Atualizações futuras
Altere o código → *commit/push* (ou envie o novo .zip) → reimplante. O conteúdo editado no painel fica no banco, e as imagens em `UPLOAD_DIR`, então nada disso é afetado.

## Backup
Exporte o banco (phpMyAdmin do hPanel) e guarde a pasta `UPLOAD_DIR`.

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

Em todas as listas: **ordem** (setas), **Visível/Oculto** (clique no selo) e **excluir**.

## Adicionando um novo tipo de dado
1. Crie a tabela em `server/schema.sql`.
2. Registre o recurso em `server/lib/resources.js` (`RESOURCES`).
3. Descreva os campos em `src/pages/admin/config.js` e crie o componente público em `src/components/site/`.
O CRUD, a validação e a tela de administração são gerados a partir dessas definições.
