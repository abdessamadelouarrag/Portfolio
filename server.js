require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = Number(process.env.PORT) || 3000;

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

function createTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT) || 587;
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
        throw new Error('SMTP configuration is missing. Check your .env file.');
    }

    return nodemailer.createTransport({
        host,
        port,
        secure: port === 465,
        auth: {
            user,
            pass,
        },
    });
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

        const transporter = createTransporter();
        await transporter.verify();

        const toAddress = process.env.CONTACT_TO || process.env.SMTP_USER;
        const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

        const safeName = escapeHtml(trimmedName);
        const safeEmail = escapeHtml(trimmedEmail);
        const safeSubject = escapeHtml(trimmedSubject);
        const safeMessage = escapeHtml(trimmedMessage).replace(/\n/g, '<br>');

        await transporter.sendMail({
            from: `"Portfolio Contact" <${fromAddress}>`,
            to: toAddress,
            replyTo: trimmedEmail,
            subject: `[Portfolio] ${trimmedSubject}`,
            text: `
New message from your portfolio contact form

Name: ${trimmedName}
Email: ${trimmedEmail}
Subject: ${trimmedSubject}

Message:
${trimmedMessage}
            `.trim(),
            html: `
                <div style="font-family: Arial, sans-serif; line-height: 1.6;">
                    <h2>New portfolio contact</h2>
                    <p><strong>Name:</strong> ${safeName}</p>
                    <p><strong>Email:</strong> ${safeEmail}</p>
                    <p><strong>Subject:</strong> ${safeSubject}</p>
                    <p><strong>Message:</strong></p>
                    <p>${safeMessage}</p>
                </div>
            `,
        });

        return res.status(200).json({
            success: true,
            message: 'Your message was sent successfully.',
        });
    } catch (error) {
        console.error('Error sending contact email:', error);

        let friendlyError = 'Unable to send email right now.';

        if (error && error.code === 'EAUTH') {
            friendlyError = 'SMTP authentication failed. Check your Gmail app password.';
        } else if (error && error.code === 'ESOCKET') {
            friendlyError = 'SMTP connection failed. Check SMTP host/port.';
        } else if (error && error.message) {
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