<?php
// Recursos editáveis pelo painel: lista branca de tabelas/campos, validação e CRUD.

declare(strict_types=1);

const ACTIVE = ['type' => 'bool', 'default' => true];

function resources(): array
{
    return [
        'slides' => ['sortable' => true, 'fields' => [
            'title' => ['type' => 'string', 'max' => 150, 'required' => true],
            'subtitle' => ['type' => 'string', 'max' => 255],
            'button_text' => ['type' => 'string', 'max' => 80],
            'button_link' => ['type' => 'url', 'max' => 255],
            'image_url' => ['type' => 'url', 'max' => 500],
            'theme' => ['type' => 'enum', 'values' => ['primary', 'gray-800', 'gray-700', 'gray-900'], 'default' => 'primary'],
            'active' => ACTIVE,
        ]],
        'about_cards' => ['sortable' => true, 'fields' => [
            'title' => ['type' => 'string', 'max' => 120, 'required' => true],
            'icon' => ['type' => 'string', 'max' => 60, 'default' => 'fa-star'],
            'active' => ACTIVE,
        ]],
        'service_categories' => ['sortable' => true, 'fields' => [
            'title' => ['type' => 'string', 'max' => 150, 'required' => true],
            'items' => ['type' => 'lines'],
            'active' => ACTIVE,
        ]],
        'courses' => ['sortable' => true, 'fields' => [
            'title' => ['type' => 'string', 'max' => 150, 'required' => true],
            'description' => ['type' => 'string', 'max' => 500],
            'duration' => ['type' => 'string', 'max' => 80],
            'link' => ['type' => 'url', 'max' => 500],
            'contact_email' => ['type' => 'email', 'max' => 190],
            'active' => ACTIVE,
        ]],
        'articles' => ['sortable' => true, 'fields' => [
            'title' => ['type' => 'string', 'max' => 190, 'required' => true],
            'image_url' => ['type' => 'url', 'max' => 500],
            'image_width' => ['type' => 'int', 'min' => 40, 'max' => 400, 'default' => 140],
            'link' => ['type' => 'url', 'max' => 500],
            'active' => ACTIVE,
        ]],
        'clients' => ['sortable' => true, 'fields' => [
            'name' => ['type' => 'string', 'max' => 150, 'required' => true],
            'description' => ['type' => 'string', 'max' => 255],
            'logo_url' => ['type' => 'url', 'max' => 500],
            'link' => ['type' => 'url', 'max' => 500],
            'active' => ACTIVE,
        ]],
        'team_members' => ['sortable' => true, 'fields' => [
            'name' => ['type' => 'string', 'max' => 150, 'required' => true],
            'bio' => ['type' => 'text', 'max' => 2000],
            'photo_url' => ['type' => 'url', 'max' => 500],
            'featured' => ['type' => 'bool', 'default' => false],
            'active' => ACTIVE,
        ]],
        'events' => ['sortable' => false, 'order' => 'event_date ASC, id ASC', 'publicFuture' => true, 'fields' => [
            'title' => ['type' => 'string', 'max' => 190, 'required' => true],
            'address' => ['type' => 'string', 'max' => 255],
            'event_date' => ['type' => 'date', 'required' => true],
            'event_time' => ['type' => 'string', 'max' => 40],
            'phone' => ['type' => 'string', 'max' => 40],
            'active' => ACTIVE,
        ]],
    ];
}

/** Textos gerais do site (tabela settings). */
function settings_def(): array
{
    $s = fn ($max) => ['type' => 'string', 'max' => $max];
    $t = fn ($max) => ['type' => 'text', 'max' => $max];
    $u = fn ($max) => ['type' => 'url', 'max' => $max];
    return [
        'site_title' => $s(150), 'logo_url' => $u(500),
        'about_heading' => $s(150), 'about_image' => $u(500),
        'about_p1' => $t(1500), 'about_p2' => $t(1500), 'about_p3' => $t(1500),
        'founder_title' => $s(150), 'founder_text' => $t(2000), 'founder_photo' => $u(500),
        'contact_address' => $t(500), 'contact_phone' => $s(60),
        'contact_email' => ['type' => 'email', 'max' => 190], 'contact_email_text' => $t(500),
        'social_facebook' => $u(300), 'social_linkedin' => $u(300),
        'social_instagram' => $u(300), 'social_youtube' => $u(300),
        'footer_company' => $s(150), 'footer_credit' => $s(150),
    ];
}

/* ---------------- Validação ---------------- */

/** @return array{0: mixed, 1: ?string} [valor, erro] */
function validate_value(array $f, $raw): array
{
    $type = $f['type'];

    if ($type === 'bool') {
        return [in_array($raw, [true, 1, '1', 'true', 'on'], true) ? 1 : 0, null];
    }

    if ($type === 'int') {
        if ($raw === '' || $raw === null) {
            $raw = $f['default'] ?? 0;
        }
        if (!is_numeric($raw) || (int) $raw != $raw) {
            return [null, 'Informe um número inteiro.'];
        }
        $n = (int) $raw;
        if (isset($f['min']) && $n < $f['min']) return [null, "Valor mínimo: {$f['min']}."];
        if (isset($f['max']) && $n > $f['max']) return [null, "Valor máximo: {$f['max']}."];
        return [$n, null];
    }

    if ($type === 'lines') {
        $arr = is_string($raw) ? preg_split('/\r\n|\r|\n/', $raw) : $raw;
        if (!is_array($arr)) return [null, 'Lista inválida.'];
        $out = [];
        foreach ($arr as $line) {
            $t = trim(is_scalar($line) ? (string) $line : '');
            if ($t === '') continue;
            if (mb_strlen($t) > 200) return [null, 'Cada item pode ter até 200 caracteres.'];
            $out[] = $t;
        }
        if (count($out) > 30) return [null, 'No máximo 30 itens.'];
        return [json_encode($out, JSON_UNESCAPED_UNICODE), null];
    }

    $s = (is_string($raw) || is_int($raw) || is_float($raw)) ? trim((string) $raw) : '';
    if (!empty($f['required']) && $s === '') return [null, 'Campo obrigatório.'];
    if (isset($f['max']) && mb_strlen($s) > $f['max']) return [null, "Máximo de {$f['max']} caracteres."];

    switch ($type) {
        case 'url':
            if ($s !== '' && (preg_match('/\s/', $s) || !preg_match('#^(https?://|mailto:|tel:|/|\#)#i', $s) || str_starts_with($s, '//'))) {
                return [null, 'Use um link http(s)://, mailto:, tel:, um caminho iniciando em / ou uma âncora (#secao).'];
            }
            return [$s, null];
        case 'email':
            if ($s !== '' && !preg_match('/^[^\s@]+@[^\s@]+\.[^\s@]+$/', $s)) return [null, 'E-mail inválido.'];
            return [$s, null];
        case 'date':
            $d = DateTimeImmutable::createFromFormat('!Y-m-d', $s);
            if (!$d || $d->format('Y-m-d') !== $s) return [null, 'Data inválida.'];
            return [$s, null];
        case 'enum':
            if ($s === '' && isset($f['default'])) return [$f['default'], null];
            if (!in_array($s, $f['values'], true)) return [null, 'Opção inválida.'];
            return [$s, null];
        default:
            return [$s, null];
    }
}

/** Valida o corpo; $partial = true ignora campos ausentes (edição). */
function validate_payload(array $fields, $input, bool $partial): array
{
    $input = is_array($input) ? $input : [];
    $clean = [];
    $errors = [];
    foreach ($fields as $name => $f) {
        if (!array_key_exists($name, $input)) {
            if ($partial) continue;
            $raw = $f['default'] ?? ($f['type'] === 'lines' ? [] : '');
        } else {
            $raw = $input[$name];
        }
        [$v, $err] = validate_value($f, $raw);
        if ($err !== null) $errors[$name] = $err; else $clean[$name] = $v;
    }
    if ($errors) fail(422, 'Corrija os campos destacados.', $errors);
    return $clean;
}

/* ---------------- CRUD ---------------- */

function row_out(array $def, array $r): array
{
    foreach ($def['fields'] as $name => $f) {
        if (!array_key_exists($name, $r)) continue;
        if ($f['type'] === 'bool') $r[$name] = (bool) $r[$name];
        elseif ($f['type'] === 'int') $r[$name] = (int) $r[$name];
        elseif ($f['type'] === 'lines') {
            $a = json_decode((string) $r[$name], true);
            $r[$name] = is_array($a) ? $a : [];
        }
    }
    $r['id'] = (int) $r['id'];
    unset($r['created_at'], $r['updated_at']);
    return $r;
}

function list_rows(string $name, bool $publicOnly = false): array
{
    $def = resources()[$name];
    $where = [];
    $args = [];
    if ($publicOnly) {
        $where[] = 'active = 1';
        if (!empty($def['publicFuture'])) { $where[] = 'event_date >= ?'; $args[] = today(); }
    }
    $sql = "SELECT * FROM `{$name}`" . ($where ? ' WHERE ' . implode(' AND ', $where) : '')
        . ' ORDER BY ' . ($def['order'] ?? 'sort_order ASC, id ASC');
    return array_map(fn ($r) => row_out($def, $r), rows($sql, $args));
}

function get_row(string $name, int $id): ?array
{
    $r = row("SELECT * FROM `{$name}` WHERE id = ?", [$id]);
    return $r ? row_out(resources()[$name], $r) : null;
}

function create_row(string $name, $input): array
{
    $def = resources()[$name];
    $clean = validate_payload($def['fields'], $input, false);
    if ($def['sortable']) {
        $clean['sort_order'] = (int) row("SELECT COALESCE(MAX(sort_order),0)+1 AS n FROM `{$name}`")['n'];
    }
    $cols = array_keys($clean);
    q("INSERT INTO `{$name}` (`" . implode('`,`', $cols) . '`) VALUES (' . implode(',', array_fill(0, count($cols), '?')) . ')', $clean);
    return get_row($name, (int) db()->lastInsertId());
}

function update_row(string $name, int $id, $input): array
{
    if (!get_row($name, $id)) fail(404, 'Registro não encontrado.');
    $clean = validate_payload(resources()[$name]['fields'], $input, true);
    if ($clean) {
        $set = implode(',', array_map(fn ($c) => "`{$c}` = ?", array_keys($clean)));
        q("UPDATE `{$name}` SET {$set} WHERE id = ?", [...array_values($clean), $id]);
    }
    return get_row($name, $id);
}

function delete_row(string $name, int $id): void
{
    if (q("DELETE FROM `{$name}` WHERE id = ?", [$id])->rowCount() === 0) fail(404, 'Registro não encontrado.');
}

function reorder_rows(string $name, $ids): void
{
    if (empty(resources()[$name]['sortable'])) fail(404, 'Recurso não ordenável.');
    if (!is_array($ids)) fail(422, 'Lista de ids inválida.');
    db()->beginTransaction();
    try {
        foreach (array_values($ids) as $i => $id) {
            q("UPDATE `{$name}` SET sort_order = ? WHERE id = ?", [$i + 1, (int) $id]);
        }
        db()->commit();
    } catch (Throwable $e) {
        db()->rollBack();
        throw $e;
    }
}

function settings_all(): array
{
    $out = array_fill_keys(array_keys(settings_def()), '');
    foreach (rows('SELECT k, v FROM settings') as $r) {
        if (array_key_exists($r['k'], $out)) $out[$r['k']] = $r['v'];
    }
    return $out;
}

function settings_save($input): array
{
    $input = is_array($input) ? $input : [];
    $defs = array_intersect_key(settings_def(), $input);
    $clean = validate_payload($defs, $input, true);
    foreach ($clean as $k => $v) {
        q('INSERT INTO settings (k, v) VALUES (?, ?) ON DUPLICATE KEY UPDATE v = VALUES(v)', [$k, (string) $v]);
    }
    return settings_all();
}

function public_payload(): array
{
    $out = ['settings' => settings_all()];
    foreach (array_keys(resources()) as $name) {
        $out[$name] = list_rows($name, true);
    }
    return $out;
}
