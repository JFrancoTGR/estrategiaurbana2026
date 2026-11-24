<?php
/**
 * Copiar a Hostinger (fuera del build estático de Astro).
 * URL sugerida: /ghl/v2/website-contact-intake.php
 * Variables privadas requeridas: EU_GHL_WEBHOOK_URL, EU_RECAPTCHA_SECRET,
 * EU_RECAPTCHA_ALLOWED_HOSTS, EU_ALLOWED_ORIGINS, EU_STORAGE_DIR.
 */
declare(strict_types=1);

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function finish(int $status, array $result): never
{
    http_response_code($status);
    echo json_encode($result, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
    exit;
}

function setting(string $key): string
{
    return trim((string) (getenv($key) ?: ''));
}

function field(array $body, string $key, int $maxBytes): string
{
    $value = $body[$key] ?? '';
    if (!is_string($value)) finish(422, ['success' => false, 'message' => 'Datos inválidos.']);
    $value = trim($value);
    if (strlen($value) > $maxBytes) finish(422, ['success' => false, 'message' => 'Datos demasiado largos.']);
    if (!preg_match('//u', $value) || str_contains($value, "\0")) {
        finish(422, ['success' => false, 'message' => 'Codificación inválida.']);
    }
    return $value;
}

function listSetting(string $key, string $default): array
{
    return array_filter(array_map('trim', explode(',', setting($key) ?: $default)));
}

$origin = (string) ($_SERVER['HTTP_ORIGIN'] ?? '');
$allowedOrigins = listSetting('EU_ALLOWED_ORIGINS', 'https://estrategiaurbana.info');
if ($origin !== '' && !in_array($origin, $allowedOrigins, true)) {
    finish(403, ['success' => false, 'message' => 'Origen no autorizado.']);
}
if ($origin !== '') {
    header('Access-Control-Allow-Origin: ' . $origin);
    header('Vary: Origin');
    header('Access-Control-Allow-Headers: Content-Type');
    header('Access-Control-Allow-Methods: POST, OPTIONS');
}
if (($_SERVER['REQUEST_METHOD'] ?? '') === 'OPTIONS') finish(200, ['success' => true]);
if (($_SERVER['REQUEST_METHOD'] ?? '') !== 'POST') finish(405, ['success' => false]);

if (!str_starts_with(strtolower((string) ($_SERVER['CONTENT_TYPE'] ?? '')), 'application/json')) {
    finish(415, ['success' => false, 'message' => 'Content-Type inválido.']);
}
if ((int) ($_SERVER['CONTENT_LENGTH'] ?? 0) > 12000) finish(413, ['success' => false]);

$raw = file_get_contents('php://input', false, null, 0, 12001);
if ($raw === false || strlen($raw) > 12000) finish(413, ['success' => false]);
try {
    $body = json_decode($raw, true, 32, JSON_THROW_ON_ERROR);
} catch (JsonException $e) {
    finish(400, ['success' => false, 'message' => 'JSON inválido.']);
}
if (!is_array($body)) finish(400, ['success' => false, 'message' => 'Formato inválido.']);

// Honeypot: éxito aparente para bots, sin ninguna llamada a GHL.
if (!empty($body['website'])) finish(200, ['success' => true]);
if (($body['privacy_consent'] ?? null) !== true) finish(422, ['success' => false, 'message' => 'Se requiere consentimiento.']);
if (($body['event'] ?? null) !== 'corporate_contact_intake') finish(422, ['success' => false]);

$first = field($body, 'first_name', 100);
$last = field($body, 'last_name', 100);
$email = strtolower(field($body, 'contact_email', 190));
$phone = preg_replace('/[\s()\-.]/', '', field($body, 'contact_phone', 32));
$project = field($body, 'project_interest', 140);
$source = field($body, 'conversion_source', 80);
$page = field($body, 'conversion_page', 250);
$message = field($body, 'message', 4000);
$conversionId = field($body, 'conversion_id', 100);
$captchaToken = field($body, 'recaptcha_token', 4096);

if (strlen($first) < 2 || strlen($last) < 2 || preg_match('/[<>]/', $first . $last)) {
    finish(422, ['success' => false, 'message' => 'Nombre inválido.']);
}
if (!filter_var($email, FILTER_VALIDATE_EMAIL)) finish(422, ['success' => false, 'message' => 'Correo inválido.']);
if (!preg_match('/^\+[1-9][0-9]{7,14}$/', (string) $phone)) finish(422, ['success' => false, 'message' => 'Teléfono inválido.']);
if (strlen($message) < 10 || preg_match('/[<>\x00-\x08\x0B\x0C\x0E-\x1F]/', $message)) {
    finish(422, ['success' => false, 'message' => 'Mensaje inválido.']);
}
if (!preg_match('/^[a-z0-9_]{2,80}$/', $source)
    || !preg_match('#^/[a-z0-9/_-]*$#', $page)
    || !preg_match('/^[a-zA-Z0-9_-]{8,100}$/', $conversionId)) {
    finish(422, ['success' => false, 'message' => 'Contexto inválido.']);
}

// Normaliza proyectos antes de GHL; deja intactos los identificadores técnicos.
$project = strtr($project, [
    'Á' => 'A', 'É' => 'E', 'Í' => 'I', 'Ó' => 'O', 'Ú' => 'U', 'Ü' => 'U', 'Ñ' => 'N',
    'á' => 'a', 'é' => 'e', 'í' => 'i', 'ó' => 'o', 'ú' => 'u', 'ü' => 'u', 'ñ' => 'n',
]);
$project = strtoupper((string) preg_replace('/\s+/', ' ', $project));
if (!preg_match('/^[A-Z0-9 .\-]{3,140}$/', $project)) {
    finish(422, ['success' => false, 'message' => 'Proyecto inválido.']);
}
$allowedProjects = listSetting('EU_ALLOWED_PROJECTS', '');
if ($allowedProjects !== [] && !in_array($project, $allowedProjects, true)) {
    finish(422, ['success' => false, 'message' => 'Proyecto no disponible.']);
}

$webhook = setting('EU_GHL_WEBHOOK_URL');
$secret = setting('EU_RECAPTCHA_SECRET');
$allowedHosts = listSetting('EU_RECAPTCHA_ALLOWED_HOSTS', 'estrategiaurbana.info');
$storageDir = setting('EU_STORAGE_DIR');
if (!$webhook || !$secret || !$storageDir || !is_dir($storageDir) || !is_writable($storageDir)
    || !str_starts_with($webhook, 'https://')) {
    error_log('EU Contact Intake: configuración incompleta.');
    finish(503, ['success' => false, 'message' => 'Servicio no disponible.']);
}

// Límite simple por IP. No confiar en X-Forwarded-For enviado por el cliente.
$ip = (string) ($_SERVER['REMOTE_ADDR'] ?? 'unknown');
$ratePath = rtrim($storageDir, '/') . '/rate_' . hash('sha256', $ip) . '.json';
$rate = fopen($ratePath, 'c+');
if ($rate === false || !flock($rate, LOCK_EX)) finish(503, ['success' => false]);
$existing = json_decode((string) stream_get_contents($rate), true);
$now = time();
$windowStart = is_array($existing) ? (int) ($existing['start'] ?? 0) : 0;
$count = is_array($existing) ? (int) ($existing['count'] ?? 0) : 0;
if ($now - $windowStart >= 600) { $windowStart = $now; $count = 0; }
$count++;
rewind($rate);
ftruncate($rate, 0);
fwrite($rate, json_encode(['start' => $windowStart, 'count' => $count]));
fflush($rate);
flock($rate, LOCK_UN);
fclose($rate);
if ($count > 25) finish(429, ['success' => false, 'message' => 'Intenta nuevamente más tarde.']);

if (!function_exists('curl_init')) finish(503, ['success' => false]);
$verify = curl_init('https://www.google.com/recaptcha/api/siteverify');
curl_setopt_array($verify, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_POSTFIELDS => http_build_query(['secret' => $secret, 'response' => $captchaToken]),
    CURLOPT_TIMEOUT => 10,
]);
$verifyRaw = curl_exec($verify);
$verifyCode = curl_getinfo($verify, CURLINFO_HTTP_CODE);
curl_close($verify);
$captcha = is_string($verifyRaw) ? json_decode($verifyRaw, true) : null;
$captchaOk = $verifyCode === 200 && is_array($captcha)
    && ($captcha['success'] ?? false) === true
    && ($captcha['action'] ?? '') === 'eu_contact_intake'
    && in_array((string) ($captcha['hostname'] ?? ''), $allowedHosts, true)
    && (float) ($captcha['score'] ?? 0) >= 0.5
    && !str_contains(json_encode($captcha), 'Over free quota');
if (!$captchaOk) finish(403, ['success' => false, 'message' => 'No se pudo verificar la solicitud.']);

// Idempotencia para reintentos con el mismo conversion_id.
$idPath = rtrim($storageDir, '/') . '/conversion_' . hash('sha256', $conversionId) . '.json';
$idHandle = fopen($idPath, 'c+');
if ($idHandle === false || !flock($idHandle, LOCK_EX)) finish(503, ['success' => false]);
$prior = json_decode((string) stream_get_contents($idHandle), true);
if (is_array($prior) && ($prior['status'] ?? '') === 'sent') {
    flock($idHandle, LOCK_UN);
    fclose($idHandle);
    finish(200, ['success' => true]);
}

$ghlPayload = [
    'event' => 'corporate_contact_intake',
    'first_name' => $first,
    'last_name' => $last,
    'contact_email' => $email,
    'contact_phone' => $phone,
    'project_interest' => $project,
    'conversion_type' => 'contact_form',
    'conversion_source' => $source,
    'conversion_page' => $page,
    'message' => $message,
    'conversion_id' => $conversionId,
    'privacy_consent' => true,
];
foreach (['utm_source', 'utm_medium', 'utm_campaign'] as $key) {
    $value = field($body, $key, 200);
    if ($value !== '') {
        if (preg_match('/[<>\x00-\x1F]/', $value)) finish(422, ['success' => false, 'message' => 'UTM inválida.']);
        $ghlPayload[$key] = $value;
    }
}

$request = curl_init($webhook);
curl_setopt_array($request, [
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POST => true,
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    CURLOPT_POSTFIELDS => json_encode($ghlPayload, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES),
    CURLOPT_TIMEOUT => 15,
]);
$result = curl_exec($request);
$status = curl_getinfo($request, CURLINFO_HTTP_CODE);
curl_close($request);

if (is_string($result) && $status >= 200 && $status < 300) {
    rewind($idHandle);
    ftruncate($idHandle, 0);
    fwrite($idHandle, json_encode(['status' => 'sent', 'at' => time()]));
    fflush($idHandle);
    flock($idHandle, LOCK_UN);
    fclose($idHandle);
    finish(200, ['success' => true]);
}

flock($idHandle, LOCK_UN);
fclose($idHandle);
error_log('EU Contact Intake: GHL webhook failed, HTTP ' . $status . ', conversion ' . $conversionId);
finish(502, ['success' => false, 'message' => 'No se pudo registrar la solicitud.']);
