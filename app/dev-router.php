<?php
// Só para desenvolvimento local (php -S): imita o .htaccess. Na Hostinger não é usado.
$path = parse_url($_SERVER['REQUEST_URI'], PHP_URL_PATH);
if (preg_match('#^/api(/|$)#', $path)) { require __DIR__ . '/../api/index.php'; return true; }
return false;
