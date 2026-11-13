<?php
// Núcleo do backend: configuração, banco (PDO), respostas JSON e erros.
// Esta pasta (app/) é bloqueada para acesso pela web (veja app/.htaccess).

declare(strict_types=1);

define('APP_DIR', __DIR__);
define('ROOT_DIR', dirname(__DIR__));
define('CONFIG_FILE', APP_DIR . '/config.php');

const SESSION_NAME = 'ibsen_sid';
const SESSION_MAX_IDLE = 8 * 3600;     // sessão expira após 8 h sem uso
const MIN_PASSWORD_LEN = 10;
const MAX_UPLOAD_MB = 5;

/** Erro com mensagem para o usuário e (opcional) erros por campo. */
final class HttpError extends Exception
{
    public int $status;
    public ?array $fields;

    public function __construct(int $status, string $message, ?array $fields = null)
    {
        parent::__construct($message);
        $this->status = $status;
        $this->fields = $fields;
    }
}

function fail(int $status, string $message, ?array $fields = null): never
{
    throw new HttpError($status, $message, $fields);
}

function is_installed(): bool
{
    return is_file(CONFIG_FILE);
}

/** Configuração gravada pelo instalador (app/config.php). */
function config(): array
{
    static $cfg = null;
    if ($cfg === null) {
        $cfg = is_installed() ? (require CONFIG_FILE) : [];
        $cfg += ['timezone' => 'America/Sao_Paulo'];
    }
    return $cfg;
}

function make_pdo(string $host, string $port, string $name, string $user, string $pass): PDO
{
    $dsn = "mysql:host={$host};port={$port};dbname={$name};charset=utf8mb4";
    return new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
        PDO::ATTR_STRINGIFY_FETCHES => false,
    ]);
}

function db(): PDO
{
    static $pdo = null;
    if ($pdo === null) {
        $c = config();
        $pdo = make_pdo($c['db_host'], (string) ($c['db_port'] ?? '3306'), $c['db_name'], $c['db_user'], $c['db_pass']);
    }
    return $pdo;
}

/** Executa SQL parametrizado e devolve o statement. */
function q(string $sql, array $args = []): PDOStatement
{
    $st = db()->prepare($sql);
    $st->execute(array_values($args));
    return $st;
}

function rows(string $sql, array $args = []): array
{
    return q($sql, $args)->fetchAll();
}

function row(string $sql, array $args = []): ?array
{
    $r = q($sql, $args)->fetch();
    return $r === false ? null : $r;
}

/** Hoje (YYYY-MM-DD) no fuso do site — usado para esconder eventos passados. */
function today(): string
{
    return (new DateTimeImmutable('now', new DateTimeZone(config()['timezone'])))->format('Y-m-d');
}

function json_out($data, int $status = 200): never
{
    http_response_code($status);
    header('Content-Type: application/json; charset=utf-8');
    header('Cache-Control: no-store');
    echo json_encode($data, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

/** Corpo JSON da requisição (vazio se não houver). */
function body(): array
{
    static $b = null;
    if ($b === null) {
        $raw = file_get_contents('php://input') ?: '';
        if ($raw === '') {
            $b = [];
        } else {
            $b = json_decode($raw, true);
            if (!is_array($b)) {
                fail(400, 'Corpo da requisição inválido (JSON esperado).');
            }
        }
    }
    return $b;
}

function is_https(): bool
{
    return (!empty($_SERVER['HTTPS']) && $_SERVER['HTTPS'] !== 'off')
        || strtolower($_SERVER['HTTP_X_FORWARDED_PROTO'] ?? '') === 'https'
        || ($_SERVER['SERVER_PORT'] ?? '') === '443';
}

function client_ip(): string
{
    $ip = $_SERVER['HTTP_CF_CONNECTING_IP'] ?? '';
    if ($ip === '' && !empty($_SERVER['HTTP_X_FORWARDED_FOR'])) {
        $ip = trim(explode(',', $_SERVER['HTTP_X_FORWARDED_FOR'])[0]);
    }
    if ($ip === '') {
        $ip = $_SERVER['REMOTE_ADDR'] ?? '0.0.0.0';
    }
    return substr($ip, 0, 45);
}
