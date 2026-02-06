import nodemailer from 'nodemailer';

// Create a transporter.
// By default, if no env vars are set, we will use Ethereal (fake SMTP) which provides a preview URL.
const getTransporter = async () => {
    if (process.env.SMTP_HOST) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
        });
    }

    // Fallback to Ethereal
    const testAccount = await nodemailer.createTestAccount();
    return nodemailer.createTransport({
        host: 'smtp.ethereal.email',
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
            user: testAccount.user, // generated ethereal user
            pass: testAccount.pass, // generated ethereal password
        },
    });
};

export const sendVerificationEmail = async (to: string, token: string) => {
    const transporter = await getTransporter();
    const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:5173'}/login?verify=${token}`;

    const info = await transporter.sendMail({
        from: '"Project IDA" <noreply@project-ida.com>',
        to,
        subject: 'Verify your Project IDA account',
        text: `Please verify your account by clicking the following link: ${verificationUrl}`,
        html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                <h2>Welcome to Project IDA!</h2>
                <p>Please verify your account by clicking the button below:</p>
                <a href="${verificationUrl}" style="background-color: #4F46E5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">Verify Email</a>
                <p style="margin-top: 20px; font-size: 12px; color: #666;">If you didn't create this account, you can safely ignore this email.</p>
                <p style="font-size: 12px; color: #888;">${verificationUrl}</p>
            </div>
        `,
    });

    console.log(`[EMAIL] Message sent: ${info.messageId}`);

    // Preview only available when using Ethereal
    const previewUrl = nodemailer.getTestMessageUrl(info);
    if (previewUrl) {
        console.log('---------------------------------------------------');
        console.log(`[EMAIL PREVIEW] View the email here: ${previewUrl}`);
        console.log('---------------------------------------------------');
    }

    return info;
};
