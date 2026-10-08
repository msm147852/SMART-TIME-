import assert from "node:assert/strict";
import { sendPasswordResetEmail } from "./passwordResetEmail.js";

const originalEnv = { ...process.env };
const originalFetch = globalThis.fetch;

try {
  process.env.EMAIL_PROVIDER = "resend";
  process.env.EMAIL_FROM = "SMART TIME <onboarding@resend.dev>";
  process.env.RESEND_API_KEY = "test-key";

  let requestBody: any = null;
  globalThis.fetch = (async (_input: any, init?: any) => {
    requestBody = JSON.parse(init.body);
    return new Response(JSON.stringify({ id: "email-test-1" }), { status: 200, headers: { "content-type": "application/json" } });
  }) as any;

  const result = await sendPasswordResetEmail("user@example.com", "123456", 15);
  assert.equal(result.provider, "resend");
  assert.equal(result.messageId, "email-test-1");
  assert.equal(requestBody.to[0], "user@example.com");
  assert.match(requestBody.text, /123456/);
  assert.match(requestBody.text, /15/);

  delete process.env.EMAIL_FROM;
  await assert.rejects(
    () => sendPasswordResetEmail("user@example.com", "123456", 15),
    /EMAIL_FROM مطلوب/
  );

  console.log("password reset email provider tests: PASS");
} finally {
  process.env = originalEnv;
  globalThis.fetch = originalFetch;
}
