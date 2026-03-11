require('dotenv').config();

const express = require('express');
const nodemailer = require('nodemailer');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files for the portfolio
app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Create reusable transporter using SMTP settings from environment variables
function createTransporter() {
    if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
        throw new Error('SMTP configuration is missing. Please set SMTP_HOST, SMTP_USER, and SMTP_PASS.');
    }

    const port = Number(process.env.SMTP_PORT) || 587;

    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port,
        secure: port === 465,
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
}

// Contact form API endpoint
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message, company } = req.body || {};

        // Basic honeypot spam protection: bots filling this field are ignored
        if (company && String(company).trim() !== '') {
            return res.status(200).json({ success: true });
        }

        const trimmedName = (name || '').trim();
        const trimmedEmail = (email || '').trim();
        const trimmedSubject = (subject || '').trim();
        const trimmedMessage = (message || '').trim();

        if (!trimmedName || !trimmedEmail || !trimmedSubject || !trimmedMessage) {
            return res.status(400).json({ success: false, error: 'Please fill in all required fields.' });
        }

        const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailPattern.test(trimmedEmail)) {
            return res.status(400).json({ success: false, error: 'Please enter a valid email address.' });
        }

        if (trimmedMessage.length > 5000) {
            return res.status(400).json({ success: false, error: 'Message is too long.' });
        }

        const transporter = createTransporter();

        const toAddress = process.env.CONTACT_TO || 'abdessamad4808@gmail.com';
        const fromAddress = process.env.SMTP_FROM || process.env.SMTP_USER;

        const mailOptions = {
            from: `"Portfolio Contact" <${fromAddress}>`,
            to: toAddress,
            replyTo: `"${trimmedName}" <${trimmedEmail}>`,
            subject: `[Portfolio] ${trimmedSubject}`,
            text: `
New message from your portfolio contact form:

Name: ${trimmedName}
Email: ${trimmedEmail}

Subject: ${trimmedSubject}

Message:
${trimmedMessage}
            `.trim(),
            html: `
                <h2>New portfolio contact</h2>
                <p><strong>Name:</strong> ${trimmedName}</p>
                <p><strong>Email:</strong> ${trimmedEmail}</p>
                <p><strong>Subject:</strong> ${trimmedSubject}</p>
                <p><strong>Message:</strong></p>
                <p>${trimmedMessage.replace(/\n/g, '<br>')}</p>
            `,
        };

        await transporter.sendMail(mailOptions);

        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Error sending contact email:', error);
        return res.status(500).json({ success: false, error: 'Something went wrong while sending your message. Please try again later.' });
    }
});

app.listen(PORT, () => {
    console.log(`Portfolio server running on http://localhost:${PORT}`);
});

