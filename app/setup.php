<?php
// Instalação: cria as tabelas, importa o conteúdo inicial e o primeiro administrador.
// Tudo é idempotente: rodar de novo não apaga nem duplica nada.

declare(strict_types=1);

function install_schema(PDO $pdo): void
{
    $sql = (string) file_get_contents(APP_DIR . '/schema.sql');
    $sql = preg_replace('/^\s*--.*$/m', '', $sql);
    foreach (preg_split('/;\s*\n/', $sql) as $stmt) {
        if (trim($stmt) !== '') $pdo->exec($stmt);
    }
}

/** Importa o conteúdo original do site, só se o banco estiver vazio. */
function seed_content(PDO $pdo): bool
{
    $hasSettings = (int) $pdo->query('SELECT COUNT(*) FROM settings')->fetchColumn();
    $hasSlides = (int) $pdo->query('SELECT COUNT(*) FROM slides')->fetchColumn();
    if ($hasSettings > 0 || $hasSlides > 0) return false;

    $seed = json_decode((string) file_get_contents(APP_DIR . '/seed.json'), true);
    $pdo->beginTransaction();
    try {
        $st = $pdo->prepare('INSERT INTO settings (k, v) VALUES (?, ?)');
        foreach ($seed['settings'] as $k => $v) $st->execute([$k, (string) $v]);
        foreach ($seed as $table => $list) {
            if ($table === 'settings' || !array_key_exists($table, resources())) continue;
            foreach ($list as $r) {
                $cols = array_keys($r);
                $pdo->prepare("INSERT INTO `{$table}` (`" . implode('`,`', $cols) . '`) VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')')
                    ->execute(array_values($r));
            }
        }
        $pdo->commit();
    } catch (Throwable $e) {
        $pdo->rollBack();
        throw $e;
    }
    return true;
}

/** Troca a marca antiga (Instituto Simples / ISDG) pela IBSEN nos textos que ainda estão no padrão.
 *  Textos editados pelo painel não são alterados. */
function rebrand_settings(PDO $pdo): int
{
    $map = [
        "about_heading" => ["Instituto Simples Escola de Negócios", "IBSEN Escola de Negócios"],
        "about_p1" => ["O ISDG é uma empresa de consultoria especializada em sistemas de gestão e desenvolvimento organizacional, com mais de 30 anos de experiência no mercado.", "A IBSEN Escola de Negócios é especializada em sistemas de gestão e desenvolvimento organizacional, com mais de 30 anos de experiência no mercado."],
        "footer_company" => ["Instituto Simples Escola de Negócios", "IBSEN Escola de Negócios"],
        "footer_credit" => ["pela equipe ISDG", "pela equipe IBSEN"],
        "founder_text" => ["Com mais de 30 anos de experiência no mercado, nosso fundador tem liderado a equipe do ISDG na entrega de soluções de excelência para nossos clientes. Sua visão estratégica e conhecimento profundo em sistemas de gestão têm sido fundamentais para o sucesso de nossa organização e de nossos parceiros.", "Com mais de 30 anos de experiência no mercado, nosso fundador tem liderado a equipe da IBSEN na entrega de soluções de excelência para nossos clientes. Sua visão estratégica e conhecimento profundo em sistemas de gestão têm sido fundamentais para o sucesso de nossa organização e de nossos parceiros."],
        "logo_url" => ["/images/isdglogo.png", "/images/logo-ibsen.png"],
        "site_title" => ["Instituto Simples Escola de Negócios", "IBSEN Escola de Negócios"],
    ];
    $n = 0;
    $st = $pdo->prepare('UPDATE settings SET v = ? WHERE k = ? AND v = ?');
    foreach ($map as $k => [$old, $new]) {
        $st->execute([$new, $k, $old]);
        $n += $st->rowCount();
    }
    return $n;
}

function count_users(PDO $pdo): int
{
    return (int) $pdo->query('SELECT COUNT(*) FROM users')->fetchColumn();
}

function write_config(array $c): bool
{
    $php = "<?php\n// Gerado pelo instalador em " . date('Y-m-d H:i') . ". NÃO envie este arquivo ao GitHub.\nreturn " . var_export($c, true) . ";\n";
    $ok = @file_put_contents(CONFIG_FILE, $php, LOCK_EX) !== false;
    if ($ok) @chmod(CONFIG_FILE, 0600);
    return $ok;
}

/* ---------------- Upload de imagens ---------------- */

function upload_dir(): string
{
    return ROOT_DIR . '/uploads';
}

/** Identifica o tipo real pelos bytes iniciais (não confia no nome nem no Content-Type). */
function sniff_image(string $path): ?string
{
    $h = (string) file_get_contents($path, false, null, 0, 12);
    if (strlen($h) < 12) return null;
    if (str_starts_with($h, "\xFF\xD8\xFF")) return 'jpg';
    if (str_starts_with($h, "\x89PNG\r\n\x1a\n")) return 'png';
    if (str_starts_with($h, 'GIF8')) return 'gif';
    if (str_starts_with($h, 'RIFF') && substr($h, 8, 4) === 'WEBP') return 'webp';
    return null;
}

function save_upload(): string
{
    $f = $_FILES['file'] ?? null;
    if (!$f || !is_array($f) || is_array($f['error'])) {
        // Arquivo maior que o limite do PHP (post_max_size) chega sem nada
        if (($_SERVER['CONTENT_LENGTH'] ?? 0) > 0 && empty($_FILES)) fail(413, 'Arquivo grande demais para o servidor.');
        fail(422, 'Nenhum arquivo enviado.');
    }
    if ($f['error'] === UPLOAD_ERR_INI_SIZE || $f['error'] === UPLOAD_ERR_FORM_SIZE || $f['size'] > MAX_UPLOAD_MB * 1024 * 1024) {
        fail(422, 'Arquivo maior que ' . MAX_UPLOAD_MB . ' MB.');
    }
    if ($f['error'] !== UPLOAD_ERR_OK || !is_uploaded_file($f['tmp_name'])) fail(422, 'Falha no envio do arquivo.');

    $ext = sniff_image($f['tmp_name']);
    if (!$ext) fail(422, 'Formato não permitido. Envie JPG, PNG, WebP ou GIF.');

    $dir = upload_dir();
    if (!is_dir($dir)) @mkdir($dir, 0755, true);
    $name = bin2hex(random_bytes(10)) . '.' . $ext;
    if (!@move_uploaded_file($f['tmp_name'], "{$dir}/{$name}")) {
        error_log("[uploads] não consegui gravar em {$dir}");
        fail(500, 'Não foi possível salvar a imagem no servidor. Verifique se a pasta "uploads" existe e aceita gravação.');
    }
    @chmod("{$dir}/{$name}", 0644);
    return "/uploads/{$name}";
}
