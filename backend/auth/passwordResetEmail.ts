export type PasswordResetEmailResult = { provider: "resend" | "smtp" | "development"; messageId?: string; devCode?: string };

function required(name: string): string {
  const value = String(process.env[name] || "").trim();
  if (!value) throw new Error(`إعداد البريد غير مكتمل: ${name} مطلوب.`);
  return value;
}

export async function sendPasswordResetEmail(email: string, code: string, ttlMinutes: number): Promise<PasswordResetEmailResult> {
  const provider = String(process.env.EMAIL_PROVIDER || "").trim().toLowerCase();
  const from = required("EMAIL_FROM");
  const subject = "SMART TIME - رمز إعادة تعيين كلمة المرور";
  const text = `رمز إعادة تعيين كلمة المرور في SMART TIME هو: ${code}. صالح لمدة ${ttlMinutes} دقيقة. إذا لم تطلب ذلك، تجاهل هذه الرسالة.`;

  if (provider === "resend") {
    const key = required("RESEND_API_KEY");
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [email], subject, text }),
    });
    const payload = await response.json().catch(() => ({}));
    if (!response.ok) throw new Error(`فشل إرسال البريد عبر Resend (${response.status}).`);
    return { provider: "resend", messageId: typeof payload?.id === "string" ? payload.id : undefined };
  }

  if (provider === "smtp") {
    const nodemailer = await import("nodemailer") as any;
    const host = required("SMTP_HOST");
    const port = Number(process.env.SMTP_PORT || 465);
    const user = required("SMTP_USER");
    const pass = required("SMTP_PASS");
    const secure = String(process.env.SMTP_SECURE || (port === 465 ? "true" : "false")).toLowerCase() === "true";
    const createTransport = nodemailer.default?.createTransport ?? nodemailer.createTransport;
    const transporter = createTransport({ host, port, secure, auth: { user, pass } });
    const info = await transporter.sendMail({ from, to: email, subject, text });
    return { provider: "smtp", messageId: typeof info?.messageId === "string" ? info.messageId : undefined };
  }

  if (String(process.env.ALLOW_DEV_EMAIL_CODE || "").toLowerCase() === "true") {
    return { provider: "development", devCode: code };
  }

  throw new Error("خدمة البريد غير مكوّنة. استخدم EMAIL_PROVIDER=resend أو EMAIL_PROVIDER=smtp واضبط المتغيرات المطلوبة.");
}
