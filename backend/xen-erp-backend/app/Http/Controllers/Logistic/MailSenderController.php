<?php

namespace App\Http\Controllers\Logistic;

use PHPMailer\PHPMailer\Exception;
use PHPMailer\PHPMailer\PHPMailer;

class MailSenderController
{
    public static function send($to, $subject, $body, &$error = null)
    {
        $mail = new PHPMailer(true);

        try {
            $mail->isSMTP();
            $mail->Host = 'smtp.office365.com';
            $mail->SMTPAuth = true;
            $mail->Username = 'xenlogistics.noti@xenoptics.com';
            $mail->Password = '2025erpXenopitcs@1';
            $mail->SMTPSecure = 'tls';
            $mail->Port = 587;

            $mail->SMTPOptions = [
                'ssl' => [
                    'verify_peer' => true,
                    'verify_peer_name' => true,
                    'allow_self_signed' => false,
                    'cafile' => '/etc/ssl/certs/ca-certificates.crt',
                ],
            ];

            $mail->setFrom('xenlogistics.noti@xenoptics.com', 'XenLogistics Notification');

            if (is_array($to)) {
                foreach ($to as $recipient) {
                    $mail->addAddress($recipient);
                }
            } else {
                $mail->addAddress($to);
            }

            // Set high priority
            $mail->Priority = 1; // 1 = High
            $mail->AddCustomHeader('X-MSMail-Priority', 'High');
            $mail->AddCustomHeader('Importance', 'High');

            $mail->isHTML(true);
            $mail->Subject = $subject;
            $mail->Body = $body;

            $mail->send();

            return true;
        } catch (Exception $e) {
            $error = $mail->ErrorInfo;
            dd($error);

            return false;
        }
    }
}
