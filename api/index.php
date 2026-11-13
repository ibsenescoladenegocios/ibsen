<?php
// API do site e do painel. Todas as URLs /api/... chegam aqui (veja o .htaccess da raiz).

declare(strict_types=1);

require __DIR__ . '/../app/bootstrap.php';
require APP_DIR . '/content.php';
require APP_DIR . '/auth.php';
require APP_DIR . '/setup.php';

header('X-Content-Type-Options: nosniff');
header('X-Frame-Options: SAMEORIGIN');
header('Referrer-Policy: strict-origin-when-cross-origin');
header('X-Robots-Tag: noindex');

set_exception_handler(function (Throwable $e) {
    if ($e instanceof HttpError) {
        $out = ['error' => $e->getMessage()];
        if ($e->fields) $out['fields'] = $e->fields;
        json_out($out, $e->status);
    }
    error_log('[api] ' . get_class($e) . ': ' . $e->getMessage() . ' em ' . $e->getFile() . ':' . $e->getLine());
    $msg = $e instanceof PDOException
        ? 'Erro ao acessar o banco de dados. Confira os dados do banco (veja o README) e tente novamente.'
        : 'Erro interno do servidor.';
    json_out(['error' => $msg], 500);
});

// Caminho depois de /api
$path = parse_url($_SERVER['REQUEST_URI'] ?? '/', PHP_URL_PATH) ?: '/';
$path = '/' . trim((string) preg_replace('#^.*?/api(?=/|$)#', '', $path), '/');

// O painel envia PUT/DELETE como POST + X-HTTP-Method-Override (compatível com qualquer proxy)
$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';
$override = strtoupper($_SERVER['HTTP_X_HTTP_METHOD_OVERRIDE'] ?? '');
if ($method === 'POST' && in_array($override, ['PUT', 'DELETE'], true)) $method = $override;

if ($path === '/health') {
    json_out(['ok' => true, 'installed' => is_installed(), 'php' => PHP_VERSION]);
}
if (!is_installed()) {
    fail(503, 'O site ainda não foi instalado. Abra /instalar.php para configurar o banco de dados.');
}

$seg = $path === '/' ? [] : explode('/', substr($path, 1));
$toId = fn (?string $v): int => ($v !== null && ctype_digit($v)) ? (int) $v : fail(404, 'Registro não encontrado.');

/* ----- Público ----- */
if ($path === '/public' && $method === 'GET') {
    json_out(public_payload());
}

/* ----- Autenticação ----- */
if ($path === '/auth/me' && $method === 'GET') {
    json_out(['user' => current_user(), 'csrf' => csrf_token()]);
}
if ($path === '/auth/login' && $method === 'POST') {
    json_out(login());
}
if ($path === '/auth/logout' && $method === 'POST') {
    if (current_user()) require_csrf();
    logout();
    json_out(['ok' => true]);
}

/* ----- Administração (exige login; escrita exige CSRF) ----- */
if (($seg[0] ?? '') === 'admin') {
    $me = require_auth();
    if ($method !== 'GET') require_csrf();
    $a = $seg[1] ?? '';
    $b = $seg[2] ?? null;
    $extra = count($seg) > 3;

    if ($a === 'settings' && !$b) {
        if ($method === 'GET') json_out(['data' => settings_all()]);
        if ($method === 'PUT') json_out(['data' => settings_save(body())]);
    }

    if ($a === 'upload' && !$b && $method === 'POST') {
        json_out(['url' => save_upload()], 201);
    }

    if ($a === 'users' && !$extra) {
        if (!$b && $method === 'GET') json_out(['data' => list_users(), 'me' => $me['id']]);
        if (!$b && $method === 'POST') json_out(['id' => create_user(body())], 201);
        if ($b && $method === 'PUT') { update_user($me, $toId($b), body()); json_out(['ok' => true]); }
        if ($b && $method === 'DELETE') { delete_user($me, $toId($b)); json_out(['ok' => true]); }
    }

    if (array_key_exists($a, resources()) && !$extra) {
        if (!$b && $method === 'GET') json_out(['data' => list_rows($a)]);
        if (!$b && $method === 'POST') json_out(['data' => create_row($a, body())], 201);
        if ($b === 'reorder' && $method === 'POST') { reorder_rows($a, body()['ids'] ?? null); json_out(['ok' => true]); }
        if ($b && $b !== 'reorder') {
            $id = $toId($b);
            if ($method === 'GET') {
                $r = get_row($a, $id);
                $r ? json_out(['data' => $r]) : fail(404, 'Registro não encontrado.');
            }
            if ($method === 'PUT') json_out(['data' => update_row($a, $id, body())]);
            if ($method === 'DELETE') { delete_row($a, $id); json_out(['ok' => true]); }
        }
    }
}

fail(404, 'Rota não encontrada.');
