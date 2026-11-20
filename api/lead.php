<?php
// Приём заявок «Уточнить запись» (специалисты без онлайн-записи) на хостинге Timeweb: JSON от страницы → письмо на help@.
// Работает только на хостинге с PHP (на GitHub и локальном просмотре форма покажет телефон центра).
// Доказательство согласия (ч. 3 ст. 9 152-ФЗ): каждая принятая заявка пишется в журнал ~/yulia-berdnikova/private/consents.jsonl —
// вне папки сайта, по HTTP недоступен. Поля: номер заявки, время, специалист, отметки, редакция согласия, имя, телефон, страница.
// Срок хранения журнала — см. политику, раздел 5. Сделано по образцу belovet.ru.

const MAIL_TO   = 'help@psy-berdnikova.ru';
const MAIL_FROM = 'site@psy-berdnikova.ru';       // адрес на домене сайта, чтобы письмо не попадало в спам
const HOSTS     = ['psy-berdnikova.ru', 'www.psy-berdnikova.ru'];
const SPECIALISTS = ['Ольга Сергеевна Авдашина'];
const RATE_MAX  = 5;                              // не больше 5 заявок с одного IP за 10 минут
const RATE_WIN  = 600;

header('Content-Type: application/json; charset=utf-8');
header('X-Robots-Tag: noindex');

function out($code, $body) { http_response_code($code); echo json_encode($body, JSON_UNESCAPED_UNICODE); exit; }
function cut($s, $n) { return mb_substr(trim((string)$s), 0, $n); }
function clean($s) { return str_replace(["\r", "\n", "\0"], ' ', $s); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(405, ['ok' => false]);
$host = parse_url($_SERVER['HTTP_ORIGIN'] ?? $_SERVER['HTTP_REFERER'] ?? '', PHP_URL_HOST);
if ($host && !in_array($host, HOSTS, true)) out(403, ['ok' => false, 'error' => 'origin']);

$d = json_decode(file_get_contents('php://input', false, null, 0, 64 * 1024), true);
if (!is_array($d)) out(400, ['ok' => false, 'error' => 'json']);
if (!empty($d['website'])) out(200, ['ok' => true]);   // поле-ловушка: заполняют только боты

// Ограничение частоты по IP (во временной папке хранится только хеш IP и время)
$ipKey = sys_get_temp_dir() . '/pb_' . hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'psy-berdnikova');
$hits = array_filter(array_map('intval', @file($ipKey, FILE_IGNORE_NEW_LINES) ?: []), fn($t) => $t > time() - RATE_WIN);
if (count($hits) >= RATE_MAX) out(429, ['ok' => false, 'error' => 'rate']);

$name = clean(cut($d['name'] ?? '', 80));
$phone = clean(cut($d['phone'] ?? '', 40));
$digits = preg_replace('/\D/', '', $phone);
$version = preg_replace('/[^0-9-]/', '', (string)($d['consent_version'] ?? ''));
// Сервер сам отклоняет заявку без обеих отметок и без редакции согласия
if ($name === '' || strlen($digits) !== 11 || ($d['privacy'] ?? false) !== true || ($d['consent'] ?? false) !== true || $version === '') out(400, ['ok' => false, 'error' => 'fields']);
$specialist = in_array($d['specialist'] ?? '', SPECIALISTS, true) ? $d['specialist'] : 'не указан';
$page = clean(cut($d['page'] ?? '', 300));

date_default_timezone_set('Europe/Moscow');
$id = date('Ymd-His') . '-' . bin2hex(random_bytes(3));

// Журнал согласий пишется до отправки письма: без записи в журнал заявку не принимаем
$logDir = dirname(__DIR__, 2) . '/private';
if (!is_dir($logDir)) { @mkdir($logDir, 0700, true); @file_put_contents($logDir . '/.htaccess', "Require all denied\n"); }
$entry = json_encode(['id' => $id, 'at' => date('c'), 'specialist' => $specialist, 'privacy' => true, 'consent' => true,
  'consent_version' => $version, 'name' => $name, 'phone' => $phone, 'page' => $page], JSON_UNESCAPED_UNICODE);
if (@file_put_contents($logDir . '/consents.jsonl', $entry . "\n", FILE_APPEND | LOCK_EX) === false) out(500, ['ok' => false, 'error' => 'log']);

$text = "Заявка на консультацию с сайта psy-berdnikova.ru\n\n"
  . "Специалист: $specialist\nИмя: $name\nТелефон: $phone\n"
  . 'Время: ' . date('d.m.Y H:i') . " (МСК)\nСтраница: $page\nЗаявка №: $id\nСогласие: отметки поставлены, редакция $version\n\n"
  . "Позвонить: tel:+$digits\n";
$enc = fn($s) => '=?UTF-8?B?' . base64_encode($s) . '?=';
$headers = implode("\r\n", [
  'From: ' . $enc('Сайт psy-berdnikova.ru') . ' <' . MAIL_FROM . '>',
  'MIME-Version: 1.0',
  'Content-Type: text/plain; charset=UTF-8',
  'Content-Transfer-Encoding: base64'
]);
if (!mail(MAIL_TO, $enc("Заявка к специалисту: $name, $phone"), chunk_split(base64_encode($text)), $headers, '-f' . MAIL_FROM)) out(502, ['ok' => false, 'error' => 'delivery']);

$hits[] = time();
@file_put_contents($ipKey, implode("\n", $hits));
out(200, ['ok' => true]);
