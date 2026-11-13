<?php
// Login, sessão (sessões nativas do PHP), CSRF, limite de tentativas e usuários.

declare(strict_types=1);

/**
 * Inicia a sessão. O id vem do cookie ou, se a hospedagem/CDN descartar cookies,
 * do cabeçalho X-Session-Token (o painel envia os dois).
 */
function session_boot(): void
{
    if (session_status() === PHP_SESSION_ACTIVE) return;

    $hdr = $_SERVER['HTTP_X_SESSION_TOKEN'] ?? '';
    if (preg_match('/^[a-zA-Z0-9,-]{22,128}$/', $hdr) && empty($_COOKIE[SESSION_NAME])) {
        session_id($hdr);
    }
    session_name(SESSION_NAME);
    session_set_cookie_params([
        'lifetime' => 0,
        'path' => '/',
        'secure' => is_https(),
        'httponly' => true,
        'samesite' => 'Lax',
    ]);
    ini_set('session.use_strict_mode', '1');
    ini_set('session.gc_maxlifetime', (string) (SESSION_MAX_IDLE + 600));
    session_start();

    // Sessão expirada por inatividade
    if (isset($_SESSION['uid']) && time() - ($_SESSION['seen'] ?? 0) > SESSION_MAX_IDLE) {
        $_SESSION = [];
    }
    if (isset($_SESSION['uid'])) $_SESSION['seen'] = time();
}

/** Usuário logado (ou null). Confere no banco a cada requisição. */
function current_user(): ?array
{
    static $user = false;
    if ($user !== false) return $user;
    $user = null;
    session_boot();
    if (!empty($_SESSION['uid'])) {
        $r = row('SELECT id, name, email FROM users WHERE id = ?', [(int) $_SESSION['uid']]);
        if ($r) {
            $user = ['id' => (int) $r['id'], 'name' => $r['name'], 'email' => $r['email']];
        } else {
            $_SESSION = [];
        }
    }
    return $user;
}

function csrf_token(): string
{
    return current_user() ? (string) ($_SESSION['csrf'] ?? '') : '';
}

function require_auth(): array
{
    $u = current_user();
    if (!$u) fail(401, 'Sessão expirada ou usuário não autenticado.');
    return $u;
}

function require_csrf(): void
{
    $sent = (string) ($_SERVER['HTTP_X_CSRF_TOKEN'] ?? '');
    $real = csrf_token();
    if ($real === '' || !hash_equals($real, $sent)) {
        fail(403, 'Token de segurança inválido. Recarregue a página e tente novamente.');
    }
}

function password_error($pw): ?string
{
    return is_string($pw) && mb_strlen($pw) >= MIN_PASSWORD_LEN
        ? null
        : 'A senha deve ter pelo menos ' . MIN_PASSWORD_LEN . ' caracteres.';
}

function hash_pw(string $pw): string
{
    return password_hash($pw, PASSWORD_BCRYPT, ['cost' => 12]);
}

/* ---------------- Login / logout ---------------- */

function login(): array
{
    $b = body();
    $email = strtolower(trim((string) ($b['email'] ?? '')));
    $password = (string) ($b['password'] ?? '');
    $ip = client_ip();

    if ($email === '' || $password === '') fail(422, 'Informe e-mail e senha.');

    q('DELETE FROM login_attempts WHERE created_at < UNIX_TIMESTAMP() - 86400');
    $byIp = (int) row('SELECT COUNT(*) AS n FROM login_attempts WHERE ip = ? AND created_at > UNIX_TIMESTAMP() - 900', [$ip])['n'];
    $byEmail = (int) row('SELECT COUNT(*) AS n FROM login_attempts WHERE email = ? AND created_at > UNIX_TIMESTAMP() - 900', [$email])['n'];
    if ($byIp >= 8 || $byEmail >= 25) fail(429, 'Muitas tentativas. Aguarde 15 minutos e tente novamente.');

    $u = row('SELECT id, name, email, password_hash FROM users WHERE email = ?', [$email]);
    // Hash fixo quando o e-mail não existe, para o tempo de resposta ser parecido
    $hash = $u['password_hash'] ?? '$2y$12$BeFCGzKScyJ8j0UVO.3qpuaHSoyHkfxcLPd1dGmud6RRliK.XmiO6';
    if (!password_verify($password, $hash) || !$u) {
        q('INSERT INTO login_attempts (ip, email, created_at) VALUES (?, ?, UNIX_TIMESTAMP())', [$ip, mb_substr($email, 0, 190)]);
        fail(401, 'E-mail ou senha incorretos.');
    }
    q('DELETE FROM login_attempts WHERE ip = ?', [$ip]);

    if (password_needs_rehash($u['password_hash'], PASSWORD_BCRYPT, ['cost' => 12])) {
        q('UPDATE users SET password_hash = ? WHERE id = ?', [hash_pw($password), $u['id']]);
    }

    session_boot();
    session_regenerate_id(true);
    $_SESSION = ['uid' => (int) $u['id'], 'csrf' => bin2hex(random_bytes(32)), 'seen' => time()];

    return [
        'user' => ['id' => (int) $u['id'], 'name' => $u['name'], 'email' => $u['email']],
        'csrf' => $_SESSION['csrf'],
        'token' => session_id(),
    ];
}

function logout(): void
{
    session_boot();
    $_SESSION = [];
    session_destroy();
    setcookie(SESSION_NAME, '', ['expires' => time() - 3600, 'path' => '/', 'secure' => is_https(), 'httponly' => true, 'samesite' => 'Lax']);
}

/* ---------------- Usuários administradores ---------------- */

function valid_email(string $e): bool
{
    return (bool) preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $e) && strlen($e) <= 190;
}

function list_users(): array
{
    return array_map(function ($r) {
        $r['id'] = (int) $r['id'];
        return $r;
    }, rows('SELECT id, name, email, created_at FROM users ORDER BY name'));
}

function create_user(array $b): int
{
    $name = trim((string) ($b['name'] ?? ''));
    $email = strtolower(trim((string) ($b['email'] ?? '')));
    $password = (string) ($b['password'] ?? '');
    $errors = [];
    if ($name === '' || mb_strlen($name) > 120) $errors['name'] = 'Informe o nome (até 120 caracteres).';
    if (!valid_email($email)) $errors['email'] = 'E-mail inválido.';
    if ($pe = password_error($password)) $errors['password'] = $pe;
    if (!isset($errors['email']) && row('SELECT 1 AS x FROM users WHERE email = ?', [$email])) {
        $errors['email'] = 'Já existe um usuário com este e-mail.';
    }
    if ($errors) fail(422, 'Corrija os campos destacados.', $errors);
    q('INSERT INTO users (name, email, password_hash) VALUES (?,?,?)', [$name, $email, hash_pw($password)]);
    return (int) db()->lastInsertId();
}

function update_user(array $me, int $id, array $b): void
{
    $user = row('SELECT * FROM users WHERE id = ?', [$id]);
    if (!$user) fail(404, 'Usuário não encontrado.');
    $name = trim((string) ($b['name'] ?? $user['name']));
    $email = strtolower(trim((string) ($b['email'] ?? $user['email'])));
    $password = (string) ($b['password'] ?? '');
    $errors = [];
    if ($name === '' || mb_strlen($name) > 120) $errors['name'] = 'Informe o nome (até 120 caracteres).';
    if (!valid_email($email)) $errors['email'] = 'E-mail inválido.';
    if (!isset($errors['email']) && $email !== $user['email'] && row('SELECT 1 AS x FROM users WHERE email = ? AND id <> ?', [$email, $id])) {
        $errors['email'] = 'Já existe um usuário com este e-mail.';
    }
    $newHash = null;
    if ($password !== '') {
        if ($pe = password_error($password)) {
            $errors['password'] = $pe;
        } elseif ($id === $me['id'] && !password_verify((string) ($b['current_password'] ?? ''), $user['password_hash'])) {
            $errors['current_password'] = 'Senha atual incorreta.';
        } else {
            $newHash = hash_pw($password);
        }
    }
    if ($errors) fail(422, 'Corrija os campos destacados.', $errors);
    if ($newHash) {
        q('UPDATE users SET name = ?, email = ?, password_hash = ? WHERE id = ?', [$name, $email, $newHash, $id]);
    } else {
        q('UPDATE users SET name = ?, email = ? WHERE id = ?', [$name, $email, $id]);
    }
}

function delete_user(array $me, int $id): void
{
    if ($id === $me['id']) fail(422, 'Você não pode excluir o próprio usuário.');
    if ((int) row('SELECT COUNT(*) AS n FROM users')['n'] <= 1) fail(422, 'Não é possível excluir o último administrador.');
    if (q('DELETE FROM users WHERE id = ?', [$id])->rowCount() === 0) fail(404, 'Usuário não encontrado.');
}
