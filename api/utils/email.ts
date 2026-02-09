import nodemailer from 'nodemailer';

let transporter: nodemailer.Transporter | null = null;

/**
 * Creates an Ethereal test account for development
 * Ethereal is a fake SMTP service for testing - emails don't actually send
 */
const createEtherealTransporter = async (): Promise<nodemailer.Transporter> => {
    try {
        const testAccount = await nodemailer.createTestAccount();
        console.log('[EMAIL] Using Ethereal test account:', testAccount.user);

        return nodemailer.createTransport({
            host: 'smtp.ethereal.email',
            port: 587,
            secure: false,
            auth: {
                user: testAccount.user,
                pass: testAccount.pass,
            },
        });
    } catch (error) {
        console.error('[EMAIL] Failed to create Ethereal account:', error);
        throw error;
    }
};

/**
 * Creates Gmail SMTP transporter for production
 */
const createGmailTransporter = (): nodemailer.Transporter => {
    if (!process.env.GMAIL_USER || !process.env.GMAIL_APP_PASSWORD) {
        throw new Error('Gmail credentials not configured');
    }

    console.log('[EMAIL] Using Gmail SMTP');
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.GMAIL_USER,
            pass: process.env.GMAIL_APP_PASSWORD,
        },
    });
};

/**
 * Creates custom SMTP transporter
 */
const createCustomSmtpTransporter = (): nodemailer.Transporter => {
    if (!process.env.SMTP_HOST) {
        throw new Error('SMTP_HOST not configured');
    }

    console.log('[EMAIL] Using custom SMTP:', process.env.SMTP_HOST);
    return nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT) || 587,
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS,
        },
    });
};

/**
 * Gets or creates email transporter with automatic fallback
 */
const getTransporter = async (): Promise<nodemailer.Transporter> => {
    if (transporter) return transporter;

    try {
        // Priority 1: Gmail (if configured)
        if (process.env.GMAIL_USER && process.env.GMAIL_APP_PASSWORD) {
            transporter = createGmailTransporter();
            await transporter.verify();
            console.log('[EMAIL] Gmail SMTP verified and ready');
            return transporter;
        }

        // Priority 2: Custom SMTP (if configured)
        if (process.env.SMTP_HOST) {
            transporter = createCustomSmtpTransporter();
            await transporter.verify();
            console.log('[EMAIL] Custom SMTP verified and ready');
            return transporter;
        }

        // Priority 3: Ethereal (development/testing)
        console.log('[EMAIL] No production email configured, using Ethereal test account');
        transporter = await createEtherealTransporter();
        return transporter;

    } catch (error) {
        console.error('[EMAIL] Transporter creation failed:', error);
        // Fallback to Ethereal if everything else fails
        console.log('[EMAIL] Falling back to Ethereal');
        transporter = await createEtherealTransporter();
        return transporter;
    }
};

/**
 * Sends verification email with automatic provider selection
 */
export const sendVerificationEmail = async (to: string, token: string) => {
    const verificationUrl = `${process.env.FRONTEND_URL || 'https://projectida.org'}/login?verify=${token}`;

    const mailOptions = {
        from: process.env.EMAIL_FROM || 'Project IDA <noreply@projectida.org>',
        to: to,
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
        text: `Welcome to Project IDA! Please verify your email by visiting: ${verificationUrl}`,
    };

    // FAST ASYNC SEND (Fire and Forget)
    const sendAsync = async () => {
        try {
            const emailTransporter = await getTransporter();
            const info = await emailTransporter.sendMail(mailOptions);

            console.log('[EMAIL] ✓ Email sent successfully');
            console.log('[EMAIL] Message ID:', info.messageId);

            // If using Ethereal, log the preview URL
            if (info.messageId && process.env.NODE_ENV !== 'production') {
                const previewUrl = nodemailer.getTestMessageUrl(info);
                if (previewUrl) {
                    console.log('[EMAIL] 📧 Preview URL:', previewUrl);
                    console.log('[EMAIL] ⚠️  Using Ethereal - emails are not actually sent!');
                }
            }
        } catch (error: any) {
            console.error('[EMAIL] ✗ Send failed:', error.message);
            // Log verification link so it's not lost
            console.log('[EMAIL] VERIFICATION LINK:', verificationUrl);
        }
    };

    // Execute asynchronously
    sendAsync();

    return { success: true };
};
