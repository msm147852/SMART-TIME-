import nodemailer from 'nodemailer';

export type EmailProviderResult = { provider: string; devCode?: string };

function env(name: string): string {
  return String(process.env[name] || '').trim();
}

function isProduction(): boolean {
  return env('NODE_ENV').toLowerCase() === 'production';
}

function createSmtpTransport() {
  const host = env('SMTP_HOST');
  const port = Number(env('SMTP_PORT') || 465);
  const user = env('SMTP_USER');
  const pass = env('SMTP_PASS');
  const secure = env('SMTP_SECURE')
    ? env('SMTP_SECURE').toLowerCase() === 'true'
    : port === 465;

  if (!host || !user || !pass || !Number.isFinite(port)) {
    throw new Error('إعدادات SMTP غير مكتملة: SMTP_HOST وSMTP_PORT وSMTP_USER وSMTP_PASS مطلوبة.');
  }

  return nodemailer.createTransport({ host, port, secure, auth: { user, pass } });
}

async function sendViaSmtp(to: string, subject: string, text: string): Promise<EmailProviderResult> {
  const from = env('EMAIL_FROM') || env('SMTP_USER');
  if (!from) throw new Error('EMAIL_FROM أو SMTP_USER مطلوب لإرسال البريد.');
  await createSmtpTransport().sendMail({ from, to, subject, text });
  return { provider: 'smtp' };
}

async function sendViaResend(to: string, subject: string, text: string): Promise<EmailProviderResult> {
  const key = env('RESEND_API_KEY');
  const from = env('EMAIL_FROM');
  if (!key || !from) throw new Error('إعدادات Resend غير مكتملة: RESEND_API_KEY وEMAIL_FROM مطلوبان.');
  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from, to: [to], subject, text }),
  });
  if (!response.ok) throw new Error(`فشل إرسال البريد عبر Resend (${response.status}).`);
  return { provider: 'resend' };
}

export async function sendPasswordResetEmail(email: string, code: string, expiryMinutes: number): Promise<EmailProviderResult> {
  const provider = env('EMAIL_PROVIDER').toLowerCase();
  const subject = 'SMART TIME - رمز إعادة تعيين كلمة المرور';
  const text = `رمز إعادة تعيين كلمة المرور في SMART TIME هو: ${code}. صالح لمدة ${expiryMinutes} دقيقة. إذا لم تطلب ذلك، تجاهل هذه الرسالة.`;

  if (provider === 'gmail') {
    const result = await sendViaSmtp(email, subject, text);
    return { ...result, provider: 'gmail' };
  }
  if (provider === 'smtp' || provider === 'brevo') return sendViaSmtp(email, subject, text);
  if (provider === 'resend') return sendViaResend(email, subject, text);
  if (provider === 'development' && !isProduction() && env('ALLOW_DEV_EMAIL_CODE').toLowerCase() === 'true') {
    console.info(`[EMAIL OTP][development] ${email}: ${code}`);
    return { provider: 'development' };
  }

  if (!provider) throw new Error('خدمة البريد غير مكوّنة. اضبط EMAIL_PROVIDER أو فعّل وضع التطوير محليًا.');
  throw new Error(`مزود البريد غير مدعوم أو غير مكوّن: ${provider}.`);
}

export async function sendEmailVerificationEmail(email: string, code: string, expiryMinutes: number): Promise<EmailProviderResult> {
  const provider = env('EMAIL_PROVIDER').toLowerCase();
  const subject = 'SMART TIME - رمز تأكيد البريد الإلكتروني';
  const text = `رمز تأكيد البريد الإلكتروني في SMART TIME هو: ${code}. صالح لمدة ${expiryMinutes} دقيقة. إذا لم تطلب إنشاء الحساب، تجاهل هذه الرسالة.`;
  if (provider === 'gmail') return { ...(await sendViaSmtp(email, subject, text)), provider: 'gmail' };
  if (provider === 'smtp' || provider === 'brevo') return sendViaSmtp(email, subject, text);
  if (provider === 'resend') return sendViaResend(email, subject, text);
  if (provider === 'development' && !isProduction() && env('ALLOW_DEV_EMAIL_CODE').toLowerCase() === 'true') {
    console.info(`[EMAIL OTP][development] ${email}: ${code}`);
    return { provider: 'development' };
  }
  if (!provider) throw new Error('خدمة البريد غير مكوّنة. اضبط EMAIL_PROVIDER أو فعّل وضع التطوير محليًا.');
  throw new Error(`مزود البريد غير مدعوم أو غير مكوّن: ${provider}.`);
}

export function validateEmailProviderConfiguration(): void {
  const provider = env('EMAIL_PROVIDER').toLowerCase();
  if (!provider || provider === 'development') return;
  if (provider === 'gmail' || provider === 'smtp' || provider === 'brevo') {
    if (!env('SMTP_HOST') || !env('SMTP_PORT') || !env('SMTP_USER') || !env('SMTP_PASS')) {
      throw new Error('إعدادات SMTP غير مكتملة.');
    }
    return;
  }
  if (provider === 'resend') {
    if (!env('RESEND_API_KEY') || !env('EMAIL_FROM')) throw new Error('إعدادات Resend غير مكتملة.');
    return;
  }
  throw new Error(`مزود البريد غير مدعوم: ${provider}.`);
}
