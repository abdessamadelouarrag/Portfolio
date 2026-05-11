<?php

declare(strict_types=1);

use PHPMailer\PHPMailer\Exception as PHPMailerException;
use PHPMailer\PHPMailer\PHPMailer;

header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type');
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(204);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    respond(405, [
        'success' => false,
        'error' => 'Method not allowed.',
    ]);
}

$autoloadPath = dirname(__DIR__) . DIRECTORY_SEPARATOR . 'vendor' . DIRECTORY_SEPARATOR . 'autoload.php';

if (!file_exists($autoloadPath)) {
    respond(500, [
        'success' => false,
        'error' => 'PHPMailer is not installed yet. Run composer install first.',
    ]);
}

require $autoloadPath;

loadEnvFile(dirname(__DIR__) . DIRECTORY_SEPARATOR . '.env');

$input = getRequestData();
$company = trim((string) ($input['company'] ?? ''));

if ($company !== '') {
    respond(200, [
        'success' => true,
        'message' => 'Message ignored successfully.',
    ]);
}

$name = trim((string) ($input['name'] ?? ''));
$email = trim((string) ($input['email'] ?? ''));
$subject = trim((string) ($input['subject'] ?? ''));
$message = trim((string) ($input['message'] ?? ''));

if ($name === '' || $email === '' || $subject === '' || $message === '') {
    respond(400, [
        'success' => false,
        'error' => 'Please fill in all required fields.',
    ]);
}

if (!filter_var($email, FILTER_VALIDATE_EMAIL)) {
    respond(400, [
        'success' => false,
        'error' => 'Please enter a valid email address.',
    ]);
}

if (mb_strlen($message) > 5000) {
    respond(400, [
        'success' => false,
        'error' => 'Message is too long.',
    ]);
}

$smtpHost = envValue('SMTP_HOST');
$smtpUser = envValue('SMTP_USER');
$smtpPass = envValue('SMTP_PASS');
$smtpPort = (int) envValue('SMTP_PORT', '587');
$smtpFrom = envValue('SMTP_FROM', $smtpUser);
$smtpFromName = envValue('SMTP_FROM_NAME', 'Abdessamad Elouarrag');
$contactTo = envValue('CONTACT_TO', $smtpUser);
$smtpEncryption = strtolower(envValue('SMTP_ENCRYPTION', $smtpPort === 465 ? 'ssl' : 'tls'));

if ($smtpHost === '' || $smtpUser === '' || $smtpPass === '' || $contactTo === '') {
    respond(500, [
        'success' => false,
        'error' => 'SMTP configuration is missing. Check your .env file.',
    ]);
}

$safeName = escapeHtml($name);
$safeEmail = escapeHtml($email);
$safeSubject = escapeHtml($subject);
$safeMessage = nl2br(escapeHtml($message), false);
$mailSubject = '[Portfolio] New contact from ' . $name;
$autoReplySubject = 'Thanks for contacting me';
$autoReplyHtml = '
    <div style="margin:0; padding:32px 16px; background:#f3f0ea; font-family:Arial,Helvetica,sans-serif; color:#171717;">
        <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e7dfd3; border-radius:24px; overflow:hidden;">
            <div style="padding:28px 32px; background:linear-gradient(135deg,#171717 0%,#2f2a24 100%); color:#f8f4ee;">
                <p style="margin:0 0 10px; font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:0.78;">Abdessamad Elouarrag</p>
                <h1 style="margin:0; font-size:28px; line-height:1.2; font-weight:700;">Thanks for your message, ' . $safeName . '</h1>
                <p style="margin:12px 0 0; font-size:15px; line-height:1.7; color:#ddd4c7;">I received your message and I will contact you soon.</p>
            </div>
            <div style="padding:32px;">
                <p style="margin:0 0 18px; font-size:16px; line-height:1.8; color:#2b2b2b;">Thank you for taking the time to reach out through my portfolio.</p>
                <div style="margin-bottom:22px; padding:20px; background:#fcfaf7; border:1px solid #eee4d6; border-radius:18px;">
                    <p style="margin:0 0 8px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7d6b;">Your Subject</p>
                    <p style="margin:0; font-size:18px; line-height:1.5; font-weight:700; color:#171717;">' . $safeSubject . '</p>
                </div>
                <p style="margin:0; font-size:15px; line-height:1.8; color:#4f4a43;">I will review your message and get back to you as soon as possible.</p>
                <div style="margin-top:24px; padding:20px; background:#171717; border-radius:18px;">
                    <p style="margin:0 0 12px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#b5a899;">Social Media</p>
                    <p style="margin:0 0 10px; font-size:15px; line-height:1.8;">
                        <a href="https://www.linkedin.com/in/abdessamad-el-ouarrag/" style="color:#f7f2eb; text-decoration:none;">LinkedIn</a>
                    </p>
                    <p style="margin:0; font-size:15px; line-height:1.8;">
                        <a href="https://www.instagram.com/elg04/" style="color:#f7f2eb; text-decoration:none;">Instagram</a>
                    </p>
                </div>
            </div>
        </div>
    </div>
';
$autoReplyText = "Hi {$name},\n\nThanks for contacting me through my portfolio.\nI received your message about: {$subject}\n\nI will contact you soon.\n\nLinkedIn: https://www.linkedin.com/in/abdessamad-el-ouarrag/\nInstagram: https://www.instagram.com/elg04/\n";

try {
    $mail = new PHPMailer(true);
    $mail->isSMTP();
    $mail->Host = $smtpHost;
    $mail->Port = $smtpPort;
    $mail->SMTPAuth = true;
    $mail->Username = $smtpUser;
    $mail->Password = $smtpPass;

    if ($smtpEncryption === 'ssl') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($smtpEncryption === 'tls') {
        $mail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    $mail->setFrom($smtpFrom, $name . ' via Abdessamad Elouarrag');
    $mail->addAddress($contactTo);
    $mail->addReplyTo($email, $name);
    $mail->isHTML(true);
    $mail->Subject = $mailSubject;
    $mail->Body = '
        <div style="margin:0; padding:32px 16px; background:#f3f0ea; font-family:Arial,Helvetica,sans-serif; color:#171717;">
            <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e7dfd3; border-radius:24px; overflow:hidden;">
                <div style="padding:28px 32px; background:linear-gradient(135deg,#171717 0%,#2f2a24 100%); color:#f8f4ee;">
                    <p style="margin:0 0 10px; font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:0.78;">Abdessamad Elouarrag</p>
                    <h1 style="margin:0; font-size:28px; line-height:1.2; font-weight:700;">' . $safeName . ' wants to contact you</h1>
                    <p style="margin:12px 0 0; font-size:15px; line-height:1.7; color:#ddd4c7;">A new message was sent from your portfolio contact form.</p>
                </div>

                <div style="padding:32px;">
                    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px;">
                        <tr>
                            <td style="width:50%; padding:0 10px 12px 0; vertical-align:top;">
                                <div style="padding:18px; background:#f8f4ee; border:1px solid #eee4d6; border-radius:18px;">
                                    <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7d6b;">Client Name</p>
                                    <p style="margin:0; font-size:16px; font-weight:700; color:#171717;">' . $safeName . '</p>
                                </div>
                            </td>
                            <td style="width:50%; padding:0 0 12px 10px; vertical-align:top;">
                                <div style="padding:18px; background:#f8f4ee; border:1px solid #eee4d6; border-radius:18px;">
                                    <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7d6b;">Email</p>
                                    <p style="margin:0; font-size:16px; font-weight:700;"><a href="mailto:' . rawurlencode($email) . '" style="color:#171717; text-decoration:none;">' . $safeEmail . '</a></p>
                                </div>
                            </td>
                        </tr>
                    </table>

                    <div style="margin-bottom:24px; padding:20px; background:#fcfaf7; border:1px solid #eee4d6; border-radius:18px;">
                        <p style="margin:0 0 8px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7d6b;">Project Subject</p>
                        <p style="margin:0; font-size:18px; line-height:1.5; font-weight:700; color:#171717;">' . $safeSubject . '</p>
                    </div>

                    <div style="padding:24px; background:#171717; border-radius:20px;">
                        <p style="margin:0 0 10px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#b5a899;">Message</p>
                        <p style="margin:0; font-size:16px; line-height:1.8; color:#f7f2eb;">' . $safeMessage . '</p>
                    </div>
                </div>
            </div>
        </div>
    ';
    $mail->AltBody = "New message from your portfolio contact form\n\n"
        . 'Name: ' . $name . "\n"
        . 'Email: ' . $email . "\n"
        . 'Project subject: ' . $subject . "\n\n"
        . "Message:\n"
        . $message;

    $mail->send();

    $replyMail = new PHPMailer(true);
    $replyMail->isSMTP();
    $replyMail->Host = $smtpHost;
    $replyMail->Port = $smtpPort;
    $replyMail->SMTPAuth = true;
    $replyMail->Username = $smtpUser;
    $replyMail->Password = $smtpPass;

    if ($smtpEncryption === 'ssl') {
        $replyMail->SMTPSecure = PHPMailer::ENCRYPTION_SMTPS;
    } elseif ($smtpEncryption === 'tls') {
        $replyMail->SMTPSecure = PHPMailer::ENCRYPTION_STARTTLS;
    }

    $replyMail->setFrom($smtpFrom, $smtpFromName);
    $replyMail->addAddress($email, $name);
    $replyMail->addReplyTo($contactTo, $smtpFromName);
    $replyMail->isHTML(true);
    $replyMail->Subject = $autoReplySubject;
    $replyMail->Body = $autoReplyHtml;
    $replyMail->AltBody = $autoReplyText;

    $replyMail->send();

    respond(200, [
        'success' => true,
        'message' => 'Your message was sent successfully.',
    ]);
} catch (PHPMailerException $exception) {
    respond(500, [
        'success' => false,
        'error' => mapMailerError($exception->getMessage()),
    ]);
} catch (Throwable $throwable) {
    respond(500, [
        'success' => false,
        'error' => mapMailerError($throwable->getMessage()),
    ]);
}

function getRequestData(): array
{
    $contentType = $_SERVER['CONTENT_TYPE'] ?? '';

    if (stripos($contentType, 'application/json') !== false) {
        $raw = file_get_contents('php://input');
        $decoded = json_decode($raw ?: '{}', true);

        return is_array($decoded) ? $decoded : [];
    }

    return $_POST;
}

function loadEnvFile(string $path): void
{
    if (!file_exists($path)) {
        return;
    }

    $lines = file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES);

    if ($lines === false) {
        return;
    }

    foreach ($lines as $line) {
        $trimmed = trim($line);

        if ($trimmed === '' || str_starts_with($trimmed, '#') || !str_contains($trimmed, '=')) {
            continue;
        }

        [$key, $value] = explode('=', $trimmed, 2);
        $key = trim($key);
        $value = trim($value);

        if ($value !== '' && (
            (str_starts_with($value, '"') && str_ends_with($value, '"'))
            || (str_starts_with($value, "'") && str_ends_with($value, "'"))
        )) {
            $value = substr($value, 1, -1);
        }

        putenv($key . '=' . $value);
        $_ENV[$key] = $value;
        $_SERVER[$key] = $value;
    }
}

function envValue(string $key, string $default = ''): string
{
    $value = $_ENV[$key] ?? $_SERVER[$key] ?? getenv($key);

    if ($value === false || $value === null) {
        return $default;
    }

    return trim((string) $value);
}

function escapeHtml(string $value): string
{
    return htmlspecialchars($value, ENT_QUOTES, 'UTF-8');
}

function mapMailerError(string $message): string
{
    $normalized = strtolower($message);

    if (str_contains($normalized, 'authenticate')) {
        return 'SMTP authentication failed. Check your email password or app password.';
    }

    if (str_contains($normalized, 'connect host') || str_contains($normalized, 'connection')) {
        return 'SMTP connection failed. Check SMTP host, port, and encryption settings.';
    }

    if ($message !== '') {
        return $message;
    }

    return 'Unable to send email right now.';
}

function respond(int $status, array $payload): void
{
    http_response_code($status);
    echo json_encode($payload, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE);
    exit;
}
