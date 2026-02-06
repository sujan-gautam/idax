import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

const createMockTransporter = (): nodemailer.Transporter => {
    return {
        sendMail: async (options: any) => {
            console.log('---------------------------------------------------');
            console.log('[EMAIL MOCK LOG] SMTP not configured. Catching email:');
            console.log(`To:      ${options.to}`);
            console.log(`Subject: ${options.subject}`);
            console.log(`Text:    ${options.text}`);
            // Extract the verification link from the text to make it easy to copy
            const linkMatch = options.text.match(/https?:\/\/[^\s]+/);
            if (linkMatch) {
                console.log(`LINK:    ${linkMatch[0]}`);
            }
            console.log('---------------------------------------------------');
            return { messageId: 'mock-id-' + Date.now() };
        },
        verify: async () => true
    } as any;
};

// Create a transporter.
const getTransporter = async (): Promise<nodemailer.Transporter> => {
    if (transporter) return transporter;

    // Use Priority 1: Real SMTP
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

    // Use Priority 2: In production without SMTP, skip network calls
    const isProduction = process.env.NODE_ENV === 'production' || process.env.RAILWAY_ENVIRONMENT;
    if (isProduction) {
        console.log('[EMAIL] Running in production/Railway without SMTP_HOST. Falling back to mock.');
        transporter = createMockTransporter();
        return transporter;
    }

    // Use Priority 3: Try Ethereal (usually works locally)
    try {
        console.log('[EMAIL] Attempting to create Ethereal test account...');
        const testAccount = await Promise.race([
            nodemailer.createTestAccount(),
            new Promise<any>((_, reject) => setTimeout(() => reject(new Error('Ethereal timeout')), 4000))
        ]);

        transporter = nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
        console.log('[EMAIL] Ethereal test account created successfully:', testAccount.user);
        return transporter;
    } catch (error) {
        console.warn('[EMAIL_INIT_WARNING] Ethereal failed. Using mock.');
        transporter = createMockTransporter();
        return transporter;
    }
};

export const sendVerificationEmail = async (to: string, token: string) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://projectida.up.railway.app'}/login?verify=${token}`;

    const mailOptions = {
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
    };

    // LOVABLE-STYLE FAST LOGIC: Send email asynchronously!
    // We start the promise but don't await it here, so the API response returns immediately.
    // We still log errors if they happen later.
    const sendTask = async () => {
        try {
            const mailTransporter = await getTransporter();
            const info = await mailTransporter.sendMail(mailOptions);
            console.log(`[EMAIL] Success: Sent to ${to}. MessageID: ${info.messageId}`);

            try {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) console.log(`[EMAIL PREVIEW] ${previewUrl}`);
            } catch (e) { }
        } catch (error: any) {
            console.error('[EMAIL_SEND_ASYNC_ERROR]', error.message);
        }
    };

    // Execute!
    sendTask();

    // Return immediately to the caller
    return { success: true, queued: true };
};
