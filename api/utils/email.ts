import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

// Create a transporter.
// By default, if no env vars are set, we will use Ethereal (fake SMTP) which provides a preview URL.
const getTransporter = async () => {
    if (transporter) return transporter;

    if (process.env.SMTP_HOST) {
        console.log('[EMAIL] Using custom SMTP configuration:', process.env.SMTP_HOST);
        transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
        return transporter;
    }

    try {
        console.log('[EMAIL] No SMTP config found, attempting to create Ethereal test account...');
        // Fallback to Ethereal
        const testAccount = await nodemailer.createTestAccount();
        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false, // true for 465, false for other ports
            auth: {
                user: testAccount.user, // generated ethereal user
                pass: testAccount.pass, // generated ethereal password
            },
        });
        console.log('[EMAIL] Ethereal test account created successfully:', testAccount.user);
        return transporter;
    } catch (error) {
        console.error('[EMAIL_INIT_ERROR] Failed to initialize email transporter:', error);
        // Return a mock transporter that just logs to console so the app doesn't crash
        return {
            sendMail: async (options: any) => {
                console.log('---------------------------------------------------');
                console.log('[EMAIL MOCK FALLBACK] Transporter init failed. Here is the email:');
                console.log(`To: ${options.to}`);
                console.log(`Subject: ${options.subject}`);
                console.log(`Text: ${options.text}`);
                console.log('---------------------------------------------------');
                return { messageId: 'mock-id-' + Date.now() };
            }
        } as any;
    }
};

export const sendVerificationEmail = async (to: string, token: string) => {
    try {
        const mailTransporter = await getTransporter();
        const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verify=${token}`;

        const info = await mailTransporter.sendMail({
            from: '"Project IDA" <noreply@project-ida.com>',
            to,
            subject: 'Verify your Project IDA account',
            text: `Please verify your account by clicking the following link: ${verificationUrl}`,
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #1f2937;">
                    <div style="padding: 24px; border: 1px solid #e5e7eb; border-radius: 8px;">
                        <h2 style="color: #4f46e5; margin-top: 0;">Welcome to Project IDA!</h2>
                        <p>We're excited to have you on board. To get started, please verify your email address by clicking the button below:</p>
                        <div style="margin: 32px 0;">
                            <a href="${verificationUrl}" style="background-color: #4f46e5; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; display: inline-block;">Verify Email Address</a>
                        </div>
                        <p style="font-size: 14px; color: #6b7280;">If you didn't create an account, you can safely ignore this email.</p>
                        <hr style="border: none; border-top: 1px solid #f3f4f6; margin: 24px 0;" />
                        <p style="font-size: 12px; color: #9ca3af; word-break: break-all;">
                            Trouble clicking the button? Copy and paste this link into your browser:<br />
                            <a href="${verificationUrl}" style="color: #4f46e5; text-decoration: none;">${verificationUrl}</a>
                        </p>
                    </div>
                </div>
            `,
        });

        console.log(`[EMAIL] Message sent successfully to ${to}. MessageID: ${info.messageId}`);

        // Preview only available when using Ethereal
        const previewUrl = nodemailer.getTestMessageUrl(info);
        if (previewUrl) {
            console.log('---------------------------------------------------');
            console.log(`[EMAIL PREVIEW] View the email here: ${previewUrl}`);
            console.log('---------------------------------------------------');
        }

        return info;
    } catch (error: any) {
        console.error('[EMAIL_SEND_ERROR] Critical failure in sendVerificationEmail:', error.message);
        // If it's a mock transporter, it won't throw. If it's real, it might.
        // We throw so start-verification can inform the user, but in some contexts we might want to suppress it.
        throw error;
    }
};
