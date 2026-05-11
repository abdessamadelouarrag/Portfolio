require('dotenv').config();

const express = require('express');
const { Resend } = require('resend');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

app.use(function (req, res, next) {
    res.header('Access-Control-Allow-Origin', '*');
    res.header('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(204);
    }

    next();
});

app.use(function (req, res, next) {
    if (req.path.endsWith('.php')) {
        return res.status(404).send('Not found');
    }

    next();
});

app.use(express.static(path.join(__dirname)));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function escapeHtml(value = '') {
    return String(value).replace(/[&<>"']/g, function (char) {
        const map = {
            '&': '&amp;',
            '<': '&lt;',
            '>': '&gt;',
            '"': '&quot;',
            "'": '&#39;',
        };
        return map[char];
    });
}

function createResendClient() {
    const apiKey = process.env.RESEND_API_KEY;

    if (!apiKey) {
        throw new Error('Resend configuration is missing. Check your environment variables.');
    }

    return new Resend(apiKey);
}

function getMailSettings() {
    const fromAddress = process.env.RESEND_FROM;
    const toAddress = process.env.CONTACT_TO;

    if (!fromAddress || !toAddress) {
        throw new Error('Resend configuration is missing. Check your environment variables.');
    }

    return {
        fromAddress,
        toAddress,
    };
}

app.get('/api/test', function (req, res) {
    return res.json({
        success: true,
        message: 'API is working',
    });
});

app.post('/api/contact', async function (req, res) {
    try {
        const { name, email, subject, message, company } = req.body || {};

        // Honeypot anti-spam
        if (company && String(company).trim() !== '') {
            return res.status(200).json({
                success: true,
                message: 'Message ignored successfully.',
            });
        }

        const trimmedName = String(name || '').trim();
        const trimmedEmail = String(email || '').trim();
        const trimmedSubject = String(subject || '').trim();
        const trimmedMessage = String(message || '').trim();

        if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
            return res.status(400).json({
                success: false,
                error: 'Please fill in all required fields.',
            });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(trimmedEmail)) {
            return res.status(400).json({
                success: false,
                error: 'Please enter a valid email address.',
            });
        }

        if (trimmedMessage.length > 5000) {
            return res.status(400).json({
                success: false,
                error: 'Message is too long.',
            });
        }

        const resend = createResendClient();
        const { fromAddress, toAddress } = getMailSettings();

        const safeName = escapeHtml(trimmedName);
        const safeEmail = escapeHtml(trimmedEmail);
        const safeSubject = escapeHtml(trimmedSubject);
        const safeMessage = escapeHtml(trimmedMessage).replace(/\n/g, '<br>');
        const mailSubject = `[Portfolio] New contact from ${trimmedName}`;
        const autoReplySubject = 'Thanks for contacting me';
        const autoReplyHtml = `
            <div style="margin:0; padding:32px 16px; background:#f3f0ea; font-family:Arial,Helvetica,sans-serif; color:#171717;">
                <div style="max-width:640px; margin:0 auto; background:#ffffff; border:1px solid #e7dfd3; border-radius:24px; overflow:hidden;">
                    <div style="padding:28px 32px; background:linear-gradient(135deg,#171717 0%,#2f2a24 100%); color:#f8f4ee;">
                        <p style="margin:0 0 10px; font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:0.78;">Abdessamad Elouarrag</p>
                        <h1 style="margin:0; font-size:28px; line-height:1.2; font-weight:700;">Thanks for your message, ${safeName}</h1>
                        <p style="margin:12px 0 0; font-size:15px; line-height:1.7; color:#ddd4c7;">I received your message and I will contact you soon.</p>
                    </div>
                    <div style="padding:32px;">
                        <p style="margin:0 0 18px; font-size:16px; line-height:1.8; color:#2b2b2b;">Thank you for taking the time to reach out through my portfolio.</p>
                        <div style="margin-bottom:22px; padding:20px; background:#fcfaf7; border:1px solid #eee4d6; border-radius:18px;">
                            <p style="margin:0 0 8px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7d6b;">Your Subject</p>
                            <p style="margin:0; font-size:18px; line-height:1.5; font-weight:700; color:#171717;">${safeSubject}</p>
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
        `;
        const autoReplyText = `Hi ${trimmedName},

Thanks for contacting me through my portfolio.
I received your message about: ${trimmedSubject}

I will contact you soon.

LinkedIn: https://www.linkedin.com/in/abdessamad-el-ouarrag/
Instagram: https://www.instagram.com/elg04/
`;

        const contactEmail = await resend.emails.send({
            from: fromAddress,
            to: [toAddress],
            replyTo: trimmedEmail,
            subject: mailSubject,
            text: `
New message from your portfolio contact form

Name: ${trimmedName}
Email: ${trimmedEmail}
Project subject: ${trimmedSubject}

Message:
${trimmedMessage}
            `.trim(),
            html: `
                <div style="margin:0; padding:32px 16px; background:#f3f0ea; font-family:Arial,Helvetica,sans-serif; color:#171717;">
                    <div style="max-width:680px; margin:0 auto; background:#ffffff; border:1px solid #e7dfd3; border-radius:24px; overflow:hidden;">
                        <div style="padding:28px 32px; background:linear-gradient(135deg,#171717 0%,#2f2a24 100%); color:#f8f4ee;">
                            <p style="margin:0 0 10px; font-size:12px; letter-spacing:2px; text-transform:uppercase; opacity:0.78;">Abdessamad Elouarrag</p>
                            <h1 style="margin:0; font-size:28px; line-height:1.2; font-weight:700;">${safeName} wants to contact you</h1>
                            <p style="margin:12px 0 0; font-size:15px; line-height:1.7; color:#ddd4c7;">A new message was sent from your portfolio contact form.</p>
                        </div>

                        <div style="padding:32px;">
                            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse; margin-bottom:24px;">
                                <tr>
                                    <td style="width:50%; padding:0 10px 12px 0; vertical-align:top;">
                                        <div style="padding:18px; background:#f8f4ee; border:1px solid #eee4d6; border-radius:18px;">
                                            <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7d6b;">Client Name</p>
                                            <p style="margin:0; font-size:16px; font-weight:700; color:#171717;">${safeName}</p>
                                        </div>
                                    </td>
                                    <td style="width:50%; padding:0 0 12px 10px; vertical-align:top;">
                                        <div style="padding:18px; background:#f8f4ee; border:1px solid #eee4d6; border-radius:18px;">
                                            <p style="margin:0 0 6px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7d6b;">Email</p>
                                            <p style="margin:0; font-size:16px; font-weight:700;"><a href="mailto:${trimmedEmail}" style="color:#171717; text-decoration:none;">${safeEmail}</a></p>
                                        </div>
                                    </td>
                                </tr>
                            </table>

                            <div style="margin-bottom:24px; padding:20px; background:#fcfaf7; border:1px solid #eee4d6; border-radius:18px;">
                                <p style="margin:0 0 8px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#8a7d6b;">Project Subject</p>
                                <p style="margin:0; font-size:18px; line-height:1.5; font-weight:700; color:#171717;">${safeSubject}</p>
                            </div>

                            <div style="padding:24px; background:#171717; border-radius:20px;">
                                <p style="margin:0 0 10px; font-size:11px; letter-spacing:1.5px; text-transform:uppercase; color:#b5a899;">Message</p>
                                <p style="margin:0; font-size:16px; line-height:1.8; color:#f7f2eb;">${safeMessage}</p>
                            </div>
                        </div>
                    </div>
                </div>
            `,
        });

        if (contactEmail.error) {
            throw new Error(contactEmail.error.message || 'Unable to send email right now.');
        }

        const autoReplyEmail = await resend.emails.send({
            from: fromAddress,
            to: [trimmedEmail],
            replyTo: toAddress,
            subject: autoReplySubject,
            text: autoReplyText,
            html: autoReplyHtml,
        });

        if (autoReplyEmail.error) {
            throw new Error(autoReplyEmail.error.message || 'Unable to send email right now.');
        }

        return res.status(200).json({
            success: true,
            message: 'Your message was sent successfully.',
        });
    } catch (error) {
        console.error('Error sending contact email:', error);

        let friendlyError = 'Unable to send email right now.';

        if (error && error.message) {
            friendlyError = error.message;
        }

        return res.status(500).json({
            success: false,
            error: friendlyError,
        });
    }
});

app.get('/', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, function () {
    console.log(`Portfolio server running on http://localhost:${PORT}`);
});
