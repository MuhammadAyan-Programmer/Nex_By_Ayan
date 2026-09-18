import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';

export interface EmailConfigData {
  provider: 'gmail' | 'smtp' | 'resend' | 'brevo';
  // Gmail
  gmailUser?: string;
  gmailAppPassword?: string;
  // Custom SMTP
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPass?: string;
  smtpFrom?: string;
  // APIs
  resendApiKey?: string;
  brevoApiKey?: string;
}

export interface SendVerificationEmailOptions {
  toEmail: string;
  recipientName?: string;
  verificationToken: string;
  expiresAt: number;
  reqHost?: string;
  reqProtocol?: string;
}

export interface EmailSendResult {
  success: boolean;
  messageId?: string;
  provider?: string;
  error?: string;
  verificationUrl: string;
}

const CONFIG_PATH = path.join(process.cwd(), 'data', 'email_config.json');

// Read dynamic configuration
export function getStoredEmailConfig(): EmailConfigData | null {
  try {
    if (fs.existsSync(CONFIG_PATH)) {
      const raw = fs.readFileSync(CONFIG_PATH, 'utf-8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('[EmailService] Error reading email_config.json:', e);
  }
  return null;
}

// Save dynamic configuration
export function saveStoredEmailConfig(config: EmailConfigData): void {
  try {
    fs.writeFileSync(CONFIG_PATH, JSON.stringify(config, null, 2), 'utf-8');
  } catch (e) {
    console.error('[EmailService] Error saving email_config.json:', e);
  }
}

export function getSafeEmailConfig() {
  const stored = getStoredEmailConfig();
  const gmailUser = stored?.gmailUser || process.env.SMTP_USER || process.env.GMAIL_USER || process.env.ADMIN_EMAIL || '';
  const hasGmailPass = Boolean(stored?.gmailAppPassword || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD);
  const smtpHost = stored?.smtpHost || process.env.SMTP_HOST || '';
  const smtpPort = stored?.smtpPort || (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const smtpUser = stored?.smtpUser || '';
  const hasSmtpPass = Boolean(stored?.smtpPass);
  const hasResend = Boolean(stored?.resendApiKey || process.env.RESEND_API_KEY);
  const hasBrevo = Boolean(stored?.brevoApiKey || process.env.BREVO_API_KEY);

  let activeProvider = 'None configured';
  if (hasResend) activeProvider = 'Resend API';
  else if (hasBrevo) activeProvider = 'Brevo API';
  else if (smtpHost && smtpUser && hasSmtpPass) activeProvider = `SMTP (${smtpHost})`;
  else if (gmailUser && hasGmailPass) activeProvider = `Gmail SMTP (${gmailUser})`;

  return {
    activeProvider,
    gmailUser,
    hasGmailPass,
    smtpHost,
    smtpPort,
    smtpUser,
    hasSmtpPass,
    hasResend,
    hasBrevo,
  };
}

export function buildVerificationUrl(token: string, reqProtocol?: string, reqHost?: string): string {
  let base = process.env.APP_URL;
  if (!base && reqHost) {
    const proto = reqProtocol || 'https';
    base = `${proto}://${reqHost}`;
  }
  if (!base) {
    base = 'https://ais-dev-4k2pai52cy3vrk5e4f7gw2-445900793441.asia-east1.run.app';
  }
  const cleanBase = base.replace(/\/+$/, '');
  return `${cleanBase}/?verifyToken=${encodeURIComponent(token)}`;
}

/**
 * Sends a real verification email via configured SMTP or transactional email provider.
 */
export async function sendVerificationEmail(options: SendVerificationEmailOptions): Promise<EmailSendResult> {
  const { toEmail, recipientName, verificationToken, expiresAt, reqHost, reqProtocol } = options;
  const verificationUrl = buildVerificationUrl(verificationToken, reqProtocol, reqHost);
  const name = recipientName?.trim() || 'Contributor';
  const expiryTimeFormatted = new Date(expiresAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

  const subject = 'Verify your email for Nexora Workforce';
  const textBody = `Hello ${name},

Thank you for registering with Nexora Workforce.

Please verify your email address to activate your account by clicking the link below:
${verificationUrl}

Important: This verification link expires in exactly 5 minutes (at ${expiryTimeFormatted}).
If the link expires, you can request a new verification email from the website.

Welcome to Nexora Workforce!
Global AI Operations & Linguistics Platform`;

  const htmlBody = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${subject}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; color: #1e293b;">
  <table width="100%" border="0" cellspacing="0" cellpadding="0" style="background-color: #f1f5f9; padding: 30px 15px;">
    <tr>
      <td align="center">
        <table width="100%" border="0" cellspacing="0" cellpadding="0" style="max-width: 560px; background-color: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 10px 25px -5px rgba(15, 23, 42, 0.08); border: 1px solid #e2e8f0;">
          <!-- Header -->
          <tr>
            <td style="background-color: #0f172a; padding: 28px 32px; text-align: left;">
              <table width="100%" border="0" cellspacing="0" cellpadding="0">
                <tr>
                  <td>
                    <div style="font-size: 20px; font-weight: 800; color: #ffffff; letter-spacing: -0.5px;">
                      Nexora <span style="color: #60a5fa;">Workforce</span>
                    </div>
                    <div style="font-size: 11px; color: #94a3b8; font-weight: 500; margin-top: 2px;">
                      Global AI Data & Language Operations
                    </div>
                  </td>
                  <td align="right">
                    <span style="display: inline-block; background-color: #1e293b; color: #38bdf8; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: 9999px; border: 1px solid #334155;">
                      Email Verification
                    </span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 32px 28px 32px;">
              <h1 style="margin: 0 0 16px 0; font-size: 22px; font-weight: 800; color: #0f172a; letter-spacing: -0.3px;">
                Verify your email address
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; line-height: 1.6; color: #334155;">
                Hello <strong>${name}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 14px; line-height: 1.6; color: #475569;">
                Thank you for registering with <strong>Nexora Workforce</strong>. To complete your account activation and access verified AI projects, please verify your email address by clicking the button below:
              </p>

              <!-- CTA Button -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 28px 0;">
                <tr>
                  <td align="center">
                    <a href="${verificationUrl}" target="_blank" rel="noopener noreferrer" style="display: inline-block; background-color: #2563eb; color: #ffffff; text-decoration: none; font-size: 15px; font-weight: 700; padding: 14px 32px; border-radius: 10px; box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35); text-align: center;">
                      Verify Email & Activate Account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <!-- 5-minute Expiry Alert Box -->
              <table width="100%" border="0" cellspacing="0" cellpadding="0" style="margin: 24px 0 20px 0; background-color: #fef3c7; border: 1px solid #fde68a; border-radius: 10px;">
                <tr>
                  <td style="padding: 14px 16px;">
                    <div style="font-size: 13px; font-weight: 700; color: #92400e; margin-bottom: 2px;">
                      ⏱️ 5-Minute Expiration Notice
                    </div>
                    <div style="font-size: 12px; line-height: 1.5; color: #b45309;">
                      For account security, this verification link will expire in exactly <strong>5 minutes</strong> (at ${expiryTimeFormatted}).
                    </div>
                  </td>
                </tr>
              </table>

              <!-- Link Fallback -->
              <p style="margin: 20px 0 6px 0; font-size: 12px; color: #64748b;">
                Button not working? Copy and paste this URL into your browser:
              </p>
              <p style="margin: 0 0 24px 0; font-size: 11px; word-break: break-all; color: #2563eb; background-color: #f8fafc; padding: 10px 12px; border-radius: 8px; border: 1px solid #e2e8f0; font-family: monospace;">
                <a href="${verificationUrl}" style="color: #2563eb; text-decoration: underline;">${verificationUrl}</a>
              </p>

              <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px 0;">

              <p style="margin: 0; font-size: 12px; color: #94a3b8; line-height: 1.5;">
                If you did not register for Nexora Workforce, please safely disregard this email.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #f8fafc; padding: 20px 32px; border-top: 1px solid #e2e8f0; text-align: center;">
              <p style="margin: 0; font-size: 11px; color: #64748b;">
                &copy; ${new Date().getFullYear()} Nexora Workforce. All rights reserved. &bull; Global AI Operations & Linguistics
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;

  const stored = getStoredEmailConfig();

  // 1. Resend API
  const resendKey = stored?.resendApiKey || process.env.RESEND_API_KEY;
  if (resendKey) {
    try {
      console.log(`[EmailService] Dispatching via Resend API to ${toEmail}...`);
      const fromAddr = stored?.smtpFrom || process.env.SMTP_FROM || 'Nexora Workforce <onboarding@resend.dev>';
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${resendKey.trim()}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: fromAddr,
          to: [toEmail],
          subject,
          text: textBody,
          html: htmlBody,
        }),
      });

      const data: any = await res.json();
      if (res.ok && data?.id) {
        console.log(`[EmailService] Resend email successfully dispatched (ID: ${data.id}) to ${toEmail}`);
        return {
          success: true,
          messageId: data.id,
          provider: 'Resend',
          verificationUrl,
        };
      } else {
        const errorMsg = data?.message || JSON.stringify(data);
        console.error(`[EmailService] Resend API error: ${errorMsg}`);
      }
    } catch (err: any) {
      console.error(`[EmailService] Resend fetch exception:`, err);
    }
  }

  // 2. Brevo API
  const brevoKey = stored?.brevoApiKey || process.env.BREVO_API_KEY;
  if (brevoKey) {
    try {
      console.log(`[EmailService] Dispatching via Brevo API to ${toEmail}...`);
      const senderEmail = stored?.smtpUser || process.env.SMTP_USER || process.env.ADMIN_EMAIL || 'verify@nexora.work';
      const res = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': brevoKey.trim(),
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sender: { name: 'Nexora Workforce', email: senderEmail },
          to: [{ email: toEmail, name }],
          subject,
          textContent: textBody,
          htmlContent: htmlBody,
        }),
      });

      const data: any = await res.json();
      if (res.ok && data?.messageId) {
        console.log(`[EmailService] Brevo API email dispatched (ID: ${data.messageId}) to ${toEmail}`);
        return {
          success: true,
          messageId: data.messageId,
          provider: 'Brevo',
          verificationUrl,
        };
      } else {
        console.error(`[EmailService] Brevo API error:`, data);
      }
    } catch (err: any) {
      console.error(`[EmailService] Brevo fetch exception:`, err);
    }
  }

  // 3. Nodemailer SMTP (Gmail or Custom SMTP)
  const smtpUser = stored?.gmailUser || stored?.smtpUser || process.env.SMTP_USER || process.env.GMAIL_USER || process.env.ADMIN_EMAIL;
  // Only use dedicated SMTP_PASS or GMAIL_APP_PASSWORD, or stored password
  const smtpPass = stored?.gmailAppPassword || stored?.smtpPass || process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD;
  const isGmail = (stored?.provider === 'gmail') || (!stored?.smtpHost && (smtpUser?.toLowerCase().endsWith('@gmail.com')));
  const smtpHost = stored?.smtpHost || process.env.SMTP_HOST || (isGmail ? 'smtp.gmail.com' : undefined);
  const smtpPort = stored?.smtpPort || (process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : 587);
  const smtpSecure = stored?.smtpSecure ?? (process.env.SMTP_SECURE === 'true' || smtpPort === 465);

  if (smtpUser && smtpPass) {
    try {
      console.log(`[EmailService] Attempting SMTP dispatch to ${toEmail} via ${smtpHost || 'gmail'}...`);
      const transporter = isGmail
        ? nodemailer.createTransport({
            service: 'gmail',
            auth: {
              user: smtpUser,
              pass: smtpPass.replace(/\s+/g, ''), // Strip spaces from 16-char app passwords
            },
          })
        : nodemailer.createTransport({
            host: smtpHost,
            port: smtpPort,
            secure: smtpSecure,
            auth: {
              user: smtpUser,
              pass: smtpPass,
            },
          });

      const fromAddress = stored?.smtpFrom || process.env.SMTP_FROM || `Nexora Workforce <${smtpUser}>`;
      const info = await transporter.sendMail({
        from: fromAddress,
        to: toEmail,
        subject,
        text: textBody,
        html: htmlBody,
      });

      console.log(`[EmailService] SMTP email sent successfully! Message ID: ${info.messageId}`);
      return {
        success: true,
        messageId: info.messageId,
        provider: isGmail ? 'Gmail SMTP' : 'Custom SMTP',
        verificationUrl,
      };
    } catch (smtpErr: any) {
      console.error(`[EmailService] SMTP send error:`, smtpErr.message);
      let friendlyError = smtpErr.message;
      if (smtpErr.message.includes('535') || smtpErr.message.includes('BadCredentials')) {
        friendlyError = 'Google rejected the login. Gmail requires a 16-character Google App Password (not your normal password). Generate one at https://myaccount.google.com/apppasswords';
      }
      return {
        success: false,
        error: friendlyError,
        verificationUrl,
      };
    }
  }

  // 4. Missing Credentials
  const errMsg = smtpUser && !smtpPass
    ? `Email address (${smtpUser}) configured, but 16-character Google App Password is missing. Go to Admin Settings -> Email Delivery or configure SMTP_PASS.`
    : 'No active email delivery provider configured. Please configure your Gmail App Password or SMTP in Admin Settings.';

  console.warn(`[EmailService] ⚠️ ${errMsg}`);
  return {
    success: false,
    error: errMsg,
    verificationUrl,
  };
}

/**
 * Sends a live test email to verify credentials.
 */
export async function testEmailConnection(targetEmail: string): Promise<{ success: boolean; message: string; details?: any }> {
  try {
    const result = await sendVerificationEmail({
      toEmail: targetEmail,
      recipientName: 'Platform Administrator',
      verificationToken: 'test-token-' + Date.now(),
      expiresAt: Date.now() + 5 * 60 * 1000,
    });

    if (result.success) {
      return {
        success: true,
        message: `Real test email successfully delivered to ${targetEmail} via ${result.provider}! Message ID: ${result.messageId}`,
        details: result,
      };
    } else {
      return {
        success: false,
        message: result.error || 'Failed to send test email.',
        details: result,
      };
    }
  } catch (err: any) {
    return {
      success: false,
      message: `Test dispatch error: ${err.message}`,
    };
  }
}
