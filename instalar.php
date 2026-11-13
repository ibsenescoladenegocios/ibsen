<?php
// Instalador: roda UMA vez, pelo navegador. Grava app/config.php, cria as tabelas,
// importa o conteúdo inicial e cadastra o primeiro administrador.
// Depois de instalado, esta página só informa que o site já está configurado.

declare(strict_types=1);

require __DIR__ . '/app/bootstrap.php';
require APP_DIR . '/content.php';
require APP_DIR . '/auth.php';
require APP_DIR . '/setup.php';

header('Cache-Control: no-store');
header('X-Robots-Tag: noindex');
header('X-Frame-Options: DENY');

$e = fn ($s) => htmlspecialchars((string) $s, ENT_QUOTES, 'UTF-8');
$in = fn ($k, $d = '') => trim((string) ($_POST[$k] ?? $d));

$errors = [];
$done = null;          // mensagem de sucesso
$manualConfig = null;  // conteúdo para criar app/config.php à mão, se não deu para gravar

// Verificações do servidor
$checks = [
    ['PHP 8.1 ou mais novo', version_compare(PHP_VERSION, '8.1.0', '>='), 'Versão atual: ' . PHP_VERSION . '. Mude em hPanel → Avançado → Configuração PHP.'],
    ['Extensão pdo_mysql', extension_loaded('pdo_mysql'), 'Ative "pdo_mysql" em hPanel → Avançado → Configuração PHP → Extensões.'],
    ['Pasta app/ aceita gravação', is_writable(APP_DIR), 'O instalador mostrará o conteúdo para você criar app/config.php manualmente.'],
    ['Pasta uploads/ aceita gravação', is_dir(ROOT_DIR . '/uploads') ? is_writable(ROOT_DIR . '/uploads') : @mkdir(ROOT_DIR . '/uploads', 0755, true), 'Crie a pasta "uploads" na raiz do site com permissão 755.'],
];
$blocking = !$checks[0][1] || !$checks[1][1];

if (!is_installed() && !$blocking && ($_SERVER['REQUEST_METHOD'] ?? '') === 'POST') {
    $c = [
        'db_host' => $in('db_host', 'localhost'),
        'db_port' => $in('db_port', '3306'),
        'db_name' => $in('db_name'),
        'db_user' => $in('db_user'),
        'db_pass' => (string) ($_POST['db_pass'] ?? ''),
        'timezone' => 'America/Sao_Paulo',
    ];
    $adminName = $in('admin_name', 'Administrador');
    $adminEmail = strtolower($in('admin_email'));
    $adminPass = (string) ($_POST['admin_pass'] ?? '');

    // Só banco local: impede que alguém aponte o site para um banco externo antes de você instalar
    if (!in_array(strtolower($c['db_host']), ['localhost', '127.0.0.1', '::1'], true)) $errors[] = 'O servidor do banco deve ser "localhost" (padrão da Hostinger).';
    if (!ctype_digit($c['db_port'])) $errors[] = 'Porta inválida.';
    if ($c['db_name'] === '' || $c['db_user'] === '') $errors[] = 'Informe o nome do banco e o usuário.';

    $pdo = null;
    if (!$errors) {
        try {
            $pdo = make_pdo($c['db_host'], $c['db_port'], $c['db_name'], $c['db_user'], $c['db_pass']);
        } catch (PDOException $ex) {
            $code = $ex->errorInfo[1] ?? $ex->getCode();
            $errors[] = match ((int) $code) {
                1045 => 'Usuário ou senha do banco incorretos. Confira em hPanel → Bancos de dados (o usuário tem prefixo, ex.: u123456789_nome).',
                1044 => 'O usuário não tem acesso a este banco. Confira se o nome do banco está exato (maiúsculas/minúsculas importam) e se o usuário está vinculado a ele.',
                1049 => 'Banco de dados não encontrado. Copie o nome exato da lista em hPanel → Bancos de dados.',
                2002 => 'Não foi possível conectar ao servidor do banco. Use "localhost".',
                default => 'Falha ao conectar ao banco: ' . $ex->getMessage(),
            };
        }
    }

    if ($pdo) {
        try {
            install_schema($pdo);
            $hasUsers = count_users($pdo) > 0;
            if (!$hasUsers || $adminEmail !== '' || $adminPass !== '') {
                if (!valid_email($adminEmail)) $errors[] = 'Informe um e-mail válido para o administrador.';
                if ($pe = password_error($adminPass)) $errors[] = 'Senha do administrador: ' . $pe;
                if ($adminPass !== (string) ($_POST['admin_pass2'] ?? '')) $errors[] = 'As senhas do administrador não conferem.';
            }
            if (!$errors) {
                $seeded = seed_content($pdo);
                if ($adminEmail !== '') {
                    $st = $pdo->prepare('SELECT id FROM users WHERE email = ?');
                    $st->execute([$adminEmail]);
                    if ($id = $st->fetchColumn()) {
                        $pdo->prepare('UPDATE users SET name = ?, password_hash = ? WHERE id = ?')->execute([$adminName ?: 'Administrador', hash_pw($adminPass), $id]);
                    } else {
                        $pdo->prepare('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)')->execute([$adminName ?: 'Administrador', $adminEmail, hash_pw($adminPass)]);
                    }
                }
                if (write_config($c)) {
                    $done = 'Instalação concluída' . ($seeded ? ', com o conteúdo inicial do site importado' : ' (o conteúdo que já estava no banco foi mantido)') . '.';
                } else {
                    $manualConfig = "<?php\nreturn " . var_export($c, true) . ";\n";
                }
            }
        } catch (Throwable $ex) {
            $errors[] = 'Erro ao preparar o banco: ' . $ex->getMessage();
        }
    }
}
?>
<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Instalação do site</title>
<style>
  :root { --red:#c8102e; --ink:#1f2937; --muted:#6b7280; --line:#e5e7eb; --bg:#f3f4f6; --ok:#047857; --okbg:#ecfdf5; --err:#b91c1c; --errbg:#fef2f2; }
  * { box-sizing: border-box; }
  body { margin:0; background:var(--bg); color:var(--ink); font:16px/1.5 system-ui,-apple-system,Segoe UI,Roboto,sans-serif; }
  main { max-width:640px; margin:32px auto; padding:0 16px; }
  .card { background:#fff; border-radius:12px; box-shadow:0 1px 3px rgba(0,0,0,.08); padding:28px; }
  h1 { font-size:1.5rem; margin:0 0 4px; } h2 { font-size:1.05rem; margin:24px 0 8px; }
  p.lead { color:var(--muted); margin:0 0 20px; }
  label { display:block; font-weight:600; font-size:.9rem; margin:12px 0 4px; }
  small { color:var(--muted); font-weight:400; }
  input { width:100%; padding:10px 12px; border:1px solid #d1d5db; border-radius:8px; font:inherit; }
  input:focus { outline:2px solid var(--red); outline-offset:-1px; border-color:transparent; }
  .row { display:grid; grid-template-columns:1fr 110px; gap:12px; align-items:end; }
  button, .btn { display:inline-block; margin-top:20px; background:var(--red); color:#fff; border:0; border-radius:8px; padding:12px 20px; font:600 1rem system-ui,sans-serif; cursor:pointer; text-decoration:none; }
  .box { border-radius:8px; padding:12px 14px; margin:12px 0; } .ok { background:var(--okbg); color:var(--ok); } .err { background:var(--errbg); color:var(--err); }
  ul.checks { list-style:none; padding:0; margin:0; } ul.checks li { padding:6px 0; border-bottom:1px solid var(--line); font-size:.92rem; }
  ul.checks li:last-child { border:0; } .y { color:var(--ok); font-weight:700; } .n { color:var(--err); font-weight:700; }
  pre { background:#111827; color:#e5e7eb; padding:12px; border-radius:8px; overflow:auto; font-size:.85rem; }
</style>
</head>
<body>
<main>
<div class="card">
  <h1>Instalação do site</h1>
<?php if (is_installed() && !$done): ?>
  <p class="lead">Este site já está instalado.</p>
  <a class="btn" href="/admin">Ir para o painel</a>
  <p style="color:var(--muted);font-size:.9rem;margin-top:20px">Para refazer a instalação (por exemplo, trocar a senha do banco), apague o arquivo <code>app/config.php</code> pelo Gerenciador de Arquivos e abra esta página de novo. Nenhum conteúdo do banco é apagado.</p>
<?php elseif ($done): ?>
  <div class="box ok"><?= $e($done) ?></div>
  <p>Agora entre no painel com o e-mail e a senha do administrador.</p>
  <a class="btn" href="/admin">Ir para o painel</a>
<?php elseif ($manualConfig): ?>
  <div class="box ok">O banco foi preparado com sucesso.</div>
  <div class="box err">Falta só um passo: o servidor não deixou gravar o arquivo de configuração.</div>
  <p>No Gerenciador de Arquivos da Hostinger, crie o arquivo <code>app/config.php</code> com exatamente este conteúdo e depois abra <a href="/admin">/admin</a>:</p>
  <pre><?= $e($manualConfig) ?></pre>
<?php else: ?>
  <p class="lead">Preencha com os dados do banco criado em <b>hPanel → Bancos de dados</b> e defina o administrador do painel.</p>

  <ul class="checks">
  <?php foreach ($checks as [$label, $ok, $help]): ?>
    <li><span class="<?= $ok ? 'y' : 'n' ?>"><?= $ok ? '✓' : '✗' ?></span> <?= $e($label) ?><?= $ok ? '' : ' — <small>' . $e($help) . '</small>' ?></li>
  <?php endforeach; ?>
  </ul>

  <?php if ($errors): ?><div class="box err"><?php foreach ($errors as $m) echo '<div>' . $e($m) . '</div>'; ?></div><?php endif; ?>

  <?php if (!$blocking): ?>
  <form method="post" autocomplete="off">
    <h2>Banco de dados</h2>
    <div class="row">
      <div><label>Servidor <small>(Hostinger: localhost)</small></label><input name="db_host" value="<?= $e($in('db_host', 'localhost')) ?>" required></div>
      <div><label>Porta</label><input name="db_port" value="<?= $e($in('db_port', '3306')) ?>" required></div>
    </div>
    <label>Nome do banco <small>(com o prefixo, ex.: u123456789_site)</small></label>
    <input name="db_name" value="<?= $e($in('db_name')) ?>" required>
    <label>Usuário do banco</label>
    <input name="db_user" value="<?= $e($in('db_user')) ?>" required>
    <label>Senha do banco</label>
    <input name="db_pass" type="password">

    <h2>Administrador do painel</h2>
    <p style="color:var(--muted);font-size:.9rem;margin:0">Se o banco já tiver administradores, pode deixar em branco para mantê-los. Se informar um e-mail que já existe, a senha dele será redefinida.</p>
    <label>Nome</label>
    <input name="admin_name" value="<?= $e($in('admin_name', 'Administrador')) ?>">
    <label>E-mail</label>
    <input name="admin_email" type="email" value="<?= $e($in('admin_email')) ?>">
    <label>Senha <small>(mínimo <?= MIN_PASSWORD_LEN ?> caracteres)</small></label>
    <input name="admin_pass" type="password" minlength="<?= MIN_PASSWORD_LEN ?>">
    <label>Repita a senha</label>
    <input name="admin_pass2" type="password">

    <button type="submit">Instalar</button>
  </form>
  <?php endif; ?>
<?php endif; ?>
</div>
</main>
</body>
</html>
