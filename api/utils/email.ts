import { Resend } from 'resend';
import nodemailer from 'nodemailer';

// Initialize Resend if API key is present
const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Fallback SMTP Transporter
let smtpTransporter: nodemailer.Transporter | null = null;

const createMockTransporter = () => {
    return {
        sendMail: async (options: any) => {
            console.log('---------------------------------------------------');
            console.log('[EMAIL MOCK LOG] No Email Service Configured.');
            console.log(`To:      ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            const linkMatch = (options.html || options.text).match(/https?:\/\/[^\s"<>]+/);
            if (linkMatch) {
                console.log(`VERIFICATION LINK: ${linkMatch[0]}`);
            }
            console.log('---------------------------------------------------');
            return { id: 'mock-id-' + Date.now() };
        }
    };
};

const getSmtpTransporter = async () => {
    if (smtpTransporter) return smtpTransporter;

    if (process.env.SMTP_HOST) {
        smtpTransporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        return smtpTransporter;
    }

    return null;
};

export const sendVerificationEmail = async (to: string, token: string) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://projectida.up.railway.app'}/login?verify=${token}`;

    const emailPayload = {
        from: process.env.EMAIL_FROM || 'Project IDA <onboarding@resend.dev>',
        to: [to],
        subject: 'Verify your Project IDA account',
        html: `
            <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
                <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                    <h2 style="color: #4f46e5; margin-top: 0;">Welcome to Project IDA!</h2>
                    <p>To get started, please verify your email address by clicking the button below:</p>
                    <div style="margin: 32px 0;">
                        <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a>
                    </div>
                    <p style="font-size: 14px; color: #6b7280;">If you didn't create an account, you can safely ignore this email.</p>
                    <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                    <p style="font-size: 11px; color: #9ca3af;">
                        Link: <a href="${verificationUrl}" style="color: #4f46e5;">${verificationUrl}</a>
                    </p>
                </div>
            </div>
        `,
    };

    // FAST ASYNC LOGIC (Fire and Forget)
    const execSend = async () => {
        try {
            // Priority 1: Resend API (Recommended for Railway - uses HTTPS/443)
            if (resend) {
                const { data, error } = await resend.emails.send(emailPayload);
                if (error) throw error;
                console.log(`[EMAIL] Sent via Resend API. ID: ${data?.id}`);
                return;
            }

            // Priority 2: SMTP
            const smtp = await getSmtpTransporter();
            if (smtp) {
                const info = await smtp.sendMail({
                    ...emailPayload,
                    to: to // Nodemailer expects string, Resend expects array/string
                });
                console.log(`[EMAIL] Sent via SMTP. ID: ${info.messageId}`);
                return;
            }

            // Priority 3: Mock Fallback
            const mock = createMockTransporter();
            await mock.sendMail({ ...emailPayload, to: to });

        } catch (err: any) {
            console.error('[EMAIL_ASYNC_ERROR]', err.message || err);
        }
    };

    execSend();
    return { success: true };
};
