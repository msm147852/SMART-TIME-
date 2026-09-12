import express from "express";
import http from "node:http";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { db, seedDefaultChatRooms } from "./backend/database.js";
import { getCache, setCache } from "./backend/cache.js";
import { getServiceStatuses, seedServiceStatuses, setServiceStatus } from "./backend/serviceStatus.js";
import { chatRouter, setupChatWebSocket } from "./backend/chatServer.js";

dotenv.config();

let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY environment variable is required");
    }
    geminiClient = new GoogleGenAI({ apiKey });
  }
  return geminiClient;
}

const app = express();
app.set("trust proxy", 1);
const PORT = Number(process.env.PORT || 3000);
seedServiceStatuses();
seedDefaultChatRooms();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Mount Chat API
app.use("/api/chat", chatRouter);

const AUTH_SESSION_DAYS = 30;
const PASSWORD_RESET_MINUTES = 15;
const PROGRAM_OWNER_EMAIL = String(process.env.PROGRAM_OWNER_EMAIL || '').trim().toLowerCase();
const PROGRAM_OWNER_USER_ID = String(process.env.PROGRAM_OWNER_USER_ID || '').trim();
const PROGRAM_OWNER_ACTIVATION_KEY = String(process.env.PROGRAM_OWNER_ACTIVATION_KEY || '');
// تكلفة كل بحث/مقارنة رحلة بالجنيه المصري (يمكن تعديلها بمتغير بيئة TRIP_SEARCH_COST_EGP)
const parsedTripCost = Number(process.env.TRIP_SEARCH_COST_EGP || 5);
const TRIP_SEARCH_COST_EGP = Number.isFinite(parsedTripCost) && parsedTripCost >= 0 ? Math.round(parsedTripCost * 100) / 100 : 5;
const TRIP_WELCOME_FREE_SEARCHES = 3;
const TRIP_GIFT_HASH_SALT = String(process.env.TRIP_GIFT_HASH_SALT || 'smart-time-trip-gift-v1');
function clientIp(req: express.Request): string { const ip=String(req.ip||req.socket.remoteAddress||'').trim().toLowerCase(); return ip.replace(/^::ffff:/,''); }
function giftSignalHash(value:string): string { return crypto.createHash('sha256').update(`${TRIP_GIFT_HASH_SALT}:${value}`).digest('hex'); }
const OWNER_WALLET_NUMBER = String(process.env.OWNER_WALLET_NUMBER || '01126621962').trim();
const OWNER_INSTAPAY_ADDRESS = String(process.env.OWNER_INSTAPAY_ADDRESS || '01126621962').trim();
const parsedTopupMin = Number(process.env.WALLET_TOPUP_MIN_EGP || 5);
const parsedTopupMax = Number(process.env.WALLET_TOPUP_MAX_EGP || 10000);
const WALLET_TOPUP_MIN_EGP = Number.isFinite(parsedTopupMin) && parsedTopupMin > 0 ? parsedTopupMin : 5;
const WALLET_TOPUP_MAX_EGP = Number.isFinite(parsedTopupMax) && parsedTopupMax >= WALLET_TOPUP_MIN_EGP ? parsedTopupMax : 10000;
const ALLOWED_TOPUP_METHODS = new Set(['vodafone_cash', 'instapay', 'etisalat_cash', 'other']);
const MAX_REVIEW_NOTE_LENGTH = 300;
function hashPassword(password: string) { const salt = crypto.randomBytes(16).toString('hex'); return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`; }
function verifyPassword(password: string, stored: string) { const [salt, expected] = String(stored||'').split(':'); if (!salt||!expected) return false; const actual=crypto.scryptSync(password,salt,64).toString('hex'); return crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex')); }
function createSession(userId: string) { const token=crypto.randomBytes(32).toString('hex'); const now=new Date(); const expires=new Date(now.getTime()+AUTH_SESSION_DAYS*86400000).toISOString(); db.prepare('INSERT INTO sessions (id,user_id,expires_at,created_at) VALUES (?,?,?,?)').run(token,userId,expires,now.toISOString()); return token; }
function authUser(req: express.Request) { const h=String(req.headers.authorization||''); const token=h.startsWith('Bearer ')?h.slice(7).trim():''; if(!token)return null; return db.prepare(`SELECT u.id,u.email,u.username,u.display_name as name,u.phone,u.phone_verified as phoneVerified,s.id as session_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND julianday(s.expires_at) > julianday('now')`).get(token) as any || null; }
function publicUser(row:any){return {id:row.id,email:row.email,username:row.username||undefined,name:row.name||row.display_name||'',phone:row.phone||undefined,phoneVerified:!!row.phoneVerified,activationStatus:row.activation_status||row.activationStatus||'pending'};}
function normalizePhone(phone:string){return String(phone||'').replace(/[\s()-]/g,'');}
function normalizeUsername(username:string){return String(username||'').trim().toLowerCase();}
function otpHash(code:string){return crypto.createHash('sha256').update(code).digest('hex');}
async function sendSms(phone:string, code:string){
  const provider=String(process.env.SMS_PROVIDER||'').trim().toLowerCase();
  const body=`رمز التحقق من SMART TIME هو: ${code}. صالح لمدة 5 دقائق.`;
  if(provider==='twilio'){
    const sid=String(process.env.TWILIO_ACCOUNT_SID||'').trim();
    const token=String(process.env.TWILIO_AUTH_TOKEN||'').trim();
    const from=String(process.env.TWILIO_FROM||'').trim();
    if(!sid||!token||!from) throw new Error('إعدادات Twilio غير مكتملة.');
    const params=new URLSearchParams({To:phone,From:from,Body:body});
    const auth=Buffer.from(`${sid}:${token}`).toString('base64');
    const r=await fetch(`https://api.twilio.com/2010-04-01/Accounts/${encodeURIComponent(sid)}/Messages.json`,{method:'POST',headers:{Authorization:`Basic ${auth}`,'Content-Type':'application/x-www-form-urlencoded'},body:params});
    if(!r.ok) throw new Error(`فشل إرسال SMS (${r.status}).`);
    return {provider:'twilio'};
  }
  if(provider==='webhook'){
    const url=String(process.env.SMS_WEBHOOK_URL||'').trim();
    const secret=String(process.env.SMS_WEBHOOK_SECRET||'').trim();
    if(!url) throw new Error('رابط SMS Webhook غير مُكوّن.');
    const r=await fetch(url,{method:'POST',headers:{'Content-Type':'application/json',...(secret?{'X-SMS-Secret':secret}:{})},body:JSON.stringify({to:phone,message:body,code})});
    if(!r.ok) throw new Error(`فشل مزود SMS (${r.status}).`);
    return {provider:'webhook'};
  }
  throw new Error('مزود SMS غير مُكوّن. استخدم SMS_PROVIDER=twilio أو webhook أو messagecentral.');
}

// ----------------------------------------------------
// Message Central (VerifyNow) — no-credit-card SMS OTP alternative to Twilio.
// Unlike Twilio/webhook above, Message Central generates AND validates the OTP itself;
// we only keep a reference (verificationId) to check against later.
// Docs: https://www.messagecentral.com/product/verify-now/api
// ----------------------------------------------------
let messageCentralTokenCache: { token: string; fetchedAt: number } | null = null;
async function getMessageCentralToken(): Promise<string> {
  const customerId = String(process.env.MESSAGECENTRAL_CUSTOMER_ID || '').trim();
  const key = String(process.env.MESSAGECENTRAL_KEY || '').trim();
  if (!customerId || !key) throw new Error('إعدادات Message Central غير مكتملة: MESSAGECENTRAL_CUSTOMER_ID و MESSAGECENTRAL_KEY مطلوبان.');
  if (messageCentralTokenCache && (Date.now() - messageCentralTokenCache.fetchedAt) < 20 * 60 * 60 * 1000) {
    return messageCentralTokenCache.token;
  }
  const url = `https://cpaas.messagecentral.com/auth/v1/authentication/token?customerId=${encodeURIComponent(customerId)}&key=${encodeURIComponent(key)}&scope=NEW`;
  const r = await fetch(url, { headers: { accept: '*/*' } });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok || !data?.token) throw new Error('فشل الحصول على توكن Message Central. تأكد من MESSAGECENTRAL_CUSTOMER_ID و MESSAGECENTRAL_KEY.');
  messageCentralTokenCache = { token: data.token, fetchedAt: Date.now() };
  return data.token;
}
function splitPhoneForMessageCentral(phone: string): { countryCode: string; localNumber: string } {
  let p = String(phone || '').trim();
  if (p.startsWith('+')) p = p.slice(1);
  if (p.startsWith('00')) p = p.slice(2);
  if (p.startsWith('20')) return { countryCode: '20', localNumber: p.slice(2).replace(/^0+/, '') };
  if (p.startsWith('0')) return { countryCode: '20', localNumber: p.slice(1) };
  return { countryCode: '20', localNumber: p };
}
async function sendOtpViaMessageCentral(phone: string, flowType: 'WHATSAPP' | 'SMS'): Promise<{ verificationId: string }> {
  const token = await getMessageCentralToken();
  const { countryCode, localNumber } = splitPhoneForMessageCentral(phone);
  const url = `https://cpaas.messagecentral.com/verification/v3/send?countryCode=${encodeURIComponent(countryCode)}&flowType=${flowType}&mobileNumber=${encodeURIComponent(localNumber)}`;
  const r = await fetch(url, { method: 'POST', headers: { authToken: token } });
  const data: any = await r.json().catch(() => ({}));
  if (!r.ok || data?.responseCode !== 200 || !data?.data?.verificationId) throw new Error(data?.message || data?.data?.errorMessage || `فشل إرسال رمز التحقق عبر Message Central (${flowType}).`);
  return { verificationId: String(data.data.verificationId) };
}
// يحاول واتساب أولاً، ولو فشل الإرسال (رقم مش على واتساب، أو الميزة غير مفعّلة بالحساب) يرجع تلقائيًا لـ SMS عادي.
async function sendSmsViaMessageCentral(phone: string): Promise<{ verificationId: string; channel: 'whatsapp' | 'sms' }> {
  try {
    const { verificationId } = await sendOtpViaMessageCentral(phone, 'WHATSAPP');
    return { verificationId, channel: 'whatsapp' };
  } catch (whatsappErr) {
    const { verificationId } = await sendOtpViaMessageCentral(phone, 'SMS');
    return { verificationId, channel: 'sms' };
  }
}
async function validateMessageCentralOtp(verificationId: string, code: string): Promise<boolean> {
  const token = await getMessageCentralToken();
  const url = `https://cpaas.messagecentral.com/verification/v3/validateOtp?verificationId=${encodeURIComponent(verificationId)}&code=${encodeURIComponent(code)}`;
  const r = await fetch(url, { method: 'GET', headers: { authToken: token } });
  const data: any = await r.json().catch(() => ({}));
  return !!(r.ok && data?.responseCode === 200 && data?.data?.verificationStatus === 'VERIFICATION_COMPLETED');
}

// ----------------------------------------------------
// Shared phone-OTP issue/verify helpers used by all phone-verification endpoints below.
// These branch between the "we generate the code" providers (twilio/webhook/dev-fallback)
// and the "provider generates the code" flow (messagecentral).
// ----------------------------------------------------
async function requestPhoneOtp(phone: string): Promise<{ expires: string; provider: string; devCode?: string }> {
  const provider = String(process.env.SMS_PROVIDER || '').trim().toLowerCase();
  const expires = new Date(Date.now() + 300000).toISOString();
  const createdAt = new Date().toISOString();
  if (provider === 'messagecentral') {
    const { verificationId, channel } = await sendSmsViaMessageCentral(phone);
    db.prepare(`INSERT INTO phone_otps(phone,code_hash,expires_at,attempts,created_at,remote_provider,remote_verification_id) VALUES(?,?,?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,created_at=excluded.created_at,remote_provider=excluded.remote_provider,remote_verification_id=excluded.remote_verification_id`)
      .run(phone, '', expires, 0, createdAt, 'messagecentral', verificationId);
    return { expires, provider: `messagecentral_${channel}` };
  }
  const code = String(crypto.randomInt(100000, 1000000));
  db.prepare(`INSERT INTO phone_otps(phone,code_hash,expires_at,attempts,created_at,remote_provider,remote_verification_id) VALUES(?,?,?,?,?,NULL,NULL) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,created_at=excluded.created_at,remote_provider=NULL,remote_verification_id=NULL`)
    .run(phone, otpHash(code), expires, 0, createdAt);
  try {
    const info = await sendSms(phone, code);
    return { expires, provider: info.provider };
  } catch (e: any) {
    if (process.env.NODE_ENV !== 'production') return { expires, provider: 'development', devCode: code };
    throw e;
  }
}
async function checkPhoneOtp(phone: string, code: string): Promise<{ ok: true } | { ok: false; error: string; status: number }> {
  const otp = db.prepare('SELECT * FROM phone_otps WHERE phone=?').get(phone) as any;
  if (!otp || new Date(otp.expires_at).getTime() < Date.now()) return { ok: false, error: 'رمز التحقق منتهي أو غير موجود', status: 400 };
  if (otp.attempts >= 5) return { ok: false, error: 'تم تجاوز عدد المحاولات. اطلب رمزًا جديدًا.', status: 429 };
  db.prepare('UPDATE phone_otps SET attempts=attempts+1 WHERE phone=?').run(phone);
  let valid = false;
  if (otp.remote_provider === 'messagecentral' && otp.remote_verification_id) {
    try { valid = await validateMessageCentralOtp(otp.remote_verification_id, code); } catch { valid = false; }
  } else {
    valid = otpHash(code) === otp.code_hash;
  }
  if (!valid) return { ok: false, error: 'رمز التحقق غير صحيح', status: 400 };
  return { ok: true };
}

async function sendPasswordResetEmail(email:string, code:string){
  const provider=String(process.env.EMAIL_PROVIDER||'').trim().toLowerCase();
  const from=String(process.env.EMAIL_FROM||'').trim();
  const subject='SMART TIME - رمز إعادة تعيين كلمة المرور';
  const text=`رمز إعادة تعيين كلمة المرور في SMART TIME هو: ${code}. صالح لمدة ${PASSWORD_RESET_MINUTES} دقيقة. إذا لم تطلب ذلك، تجاهل هذه الرسالة.`;
  if(provider==='resend'){
    const key=String(process.env.RESEND_API_KEY||'').trim();
    if(!key||!from) throw new Error('إعدادات البريد غير مكتملة: RESEND_API_KEY و EMAIL_FROM مطلوبان.');
    const r=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:`Bearer ${key}`,'Content-Type':'application/json'},body:JSON.stringify({from,to:[email],subject,text})});
    if(!r.ok) throw new Error(`فشل إرسال البريد (${r.status}).`);
    return {provider:'resend'};
  }
  if(String(process.env.ALLOW_DEV_EMAIL_CODE||'').toLowerCase()==='true') return {provider:'development',devCode:code};
  throw new Error('خدمة البريد غير مكوّنة. اضبط EMAIL_PROVIDER=resend و RESEND_API_KEY و EMAIL_FROM أولاً.');
}


app.post('/api/auth/register', async (req,res)=>{
  try{
    const name=String(req.body.name||'').trim(), username=normalizeUsername(req.body.username), email=String(req.body.email||'').trim().toLowerCase(), password=String(req.body.password||'');
    // TEMPORARY (testing phase): phone is now optional at signup. Leaving it blank skips phone
    // verification entirely — the account is created and usable immediately across every section.
    // The Trips section's phone-gift screen still asks for it later, whenever the user chooses to.
    // To make phone required again, restore the `if(phone.length<8) return res.status(400)...` check below.
    const rawPhone=normalizePhone(req.body.phone), phone = rawPhone.length>=8 ? rawPhone : '';
    const deviceId=String(req.body.deviceId||'').trim().slice(0,200);
    if(name.length<2)return res.status(400).json({error:'الاسم مطلوب'});
    if(!/^[a-z0-9_.-]{3,30}$/.test(username))return res.status(400).json({error:'اسم المستخدم يجب أن يكون من 3 إلى 30 حرفًا، باستخدام حروف إنجليزية أو أرقام أو _ أو - أو .'});
    if(!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'البريد الإلكتروني غير صحيح'});
    if(password.length<8)return res.status(400).json({error:'كلمة المرور يجب أن تكون 8 أحرف على الأقل'});
    if(db.prepare('SELECT id FROM users WHERE email=?').get(email))return res.status(409).json({error:'البريد الإلكتروني مستخدم بالفعل'});
    if(db.prepare('SELECT id FROM users WHERE username=?').get(username))return res.status(409).json({error:'اسم المستخدم مستخدم بالفعل.'});
    if(phone && db.prepare('SELECT id FROM users WHERE phone=?').get(phone))return res.status(409).json({error:'رقم الهاتف مرتبط بحساب آخر.'});
    const id=`usr_${crypto.randomUUID()}`, now=new Date().toISOString();
    db.prepare("INSERT INTO users (id,email,username,password_hash,display_name,created_at,phone,phone_verified,activation_status,trip_free_searches) VALUES (?,?,?,?,?,?,?,?,?,0)").run(id,email,username,hashPassword(password),name,now,phone||null,0,'active');
    // IMPORTANT: the account (with its email) is already committed to the users table above.
    // A failure to send the phone-verification SMS must never delete that row again — losing the
    // SMS provider must not mean losing the registration. We keep the account and let the user
    // retry verification later (via the Trips phone-gift screen, which re-sends a fresh OTP).
    let expires = new Date(Date.now()+300000).toISOString();
    let smsSent = false;
    let devCode: string | undefined;
    if (phone) {
      try { const otpResult = await requestPhoneOtp(phone); expires = otpResult.expires; devCode = otpResult.devCode; smsSent = otpResult.provider !== 'development'; }
      catch(e:any) { /* smsSent stays false; user can retry from the Trips phone-gift screen */ }
    }
    const user={id,email,username,name,phone:phone||undefined,phoneVerified:false,activationStatus:'active'};
    res.json({
      token:createSession(id),
      user,
      requiresPhoneVerification: !!phone,
      expiresAt:expires,
      devCode,
      smsSent,
      smsWarning: (!smsSent && process.env.NODE_ENV==='production') ? 'تم إنشاء حسابك وتسجيل بريدك الإلكتروني بنجاح، لكن تعذر إرسال رمز SMS الآن. يمكنك إعادة طلب رمز التحقق لاحقًا من شاشة تفعيل هدية الرحلات.' : undefined,
    });
  }catch(e:any){res.status(500).json({error:e.message||'تعذر إنشاء الحساب'});}
});

app.post('/api/auth/register/verify-phone',async(req,res)=>{
  try{
    const user=authUser(req); if(!user)return res.status(401).json({error:'يجب تسجيل الدخول أولاً'});
    const phone=normalizePhone(req.body.phone), code=String(req.body.code||'').trim();
    const row=db.prepare('SELECT * FROM users WHERE id=? AND phone=?').get(user.id,phone) as any;
    if(!row)return res.status(400).json({error:'رقم الهاتف غير مرتبط بهذا الحساب.'});
    const check=await checkPhoneOtp(phone,code);
    if(!check.ok)return res.status(check.status).json({error:check.error});
    db.exec('BEGIN IMMEDIATE');
    try {
      const priorClaim=db.prepare('SELECT id FROM trip_gift_claims WHERE user_id<>? AND phone_hash=? LIMIT 1').get(user.id,giftSignalHash(phone)) as any;
      const giftEligible=!priorClaim;
      db.prepare('UPDATE users SET phone_verified=1,trip_free_searches=?,trip_gift_claimed_at=? WHERE id=?').run(giftEligible?TRIP_WELCOME_FREE_SEARCHES:0,giftEligible?new Date().toISOString():null,user.id);
      if(giftEligible) db.prepare('INSERT INTO trip_gift_claims (id,user_id,device_hash,ip_hash,phone_hash,created_at) VALUES (?,?,?,?,?,?)').run(`gift_${crypto.randomUUID()}`,user.id,req.body.deviceId?giftSignalHash(String(req.body.deviceId)):null,giftSignalHash(clientIp(req)),giftSignalHash(phone),new Date().toISOString());
      db.prepare('DELETE FROM phone_otps WHERE phone=?').run(phone); db.exec('COMMIT');
      const refreshed=db.prepare('SELECT id,email,username,display_name as name,phone,phone_verified as phoneVerified,activation_status FROM users WHERE id=?').get(user.id) as any;
      res.json({ok:true,user:publicUser(refreshed),giftEligible,freeSearches:giftEligible?TRIP_WELCOME_FREE_SEARCHES:0,message:giftEligible?'تم تأكيد رقم الهاتف 🎉 وحصلت على 3 أبحاث مجانية هدية ترحيبية.':'تم تأكيد رقم الهاتف، لكن الهدية سبق استخدامها بهذا الرقم.'});
    } catch(e){db.exec('ROLLBACK'); throw e;}
  }catch(e:any){res.status(500).json({error:e.message||'تعذر تأكيد رقم الهاتف'});}
});

app.post('/api/auth/trips/request-phone-otp',async(req,res)=>{
  try{ const user=authUser(req); if(!user)return res.status(401).json({error:'يجب تسجيل الدخول أولاً'}); const phone=normalizePhone(req.body.phone); if(phone.length<8)return res.status(400).json({error:'رقم الهاتف غير صحيح'}); const taken=db.prepare('SELECT id FROM users WHERE phone=? AND id<>?').get(phone,user.id) as any; if(taken)return res.status(409).json({error:'رقم الهاتف مرتبط بحساب آخر.'}); try{ const otpResult=await requestPhoneOtp(phone); res.json({ok:true,devCode:otpResult.devCode,expiresAt:otpResult.expires}); }catch(e:any){ return res.status(503).json({error:e.message||'تعذر إرسال SMS'}); } }catch(e:any){res.status(500).json({error:e.message||'تعذر إرسال رمز التحقق'});}
});

app.post('/api/auth/trips/verify-phone',async(req,res)=>{
  try{ const user=authUser(req); if(!user)return res.status(401).json({error:'يجب تسجيل الدخول أولاً'}); const phone=normalizePhone(req.body.phone),code=String(req.body.code||'').trim(); const row=db.prepare('SELECT * FROM users WHERE id=?').get(user.id) as any; if(!row)return res.status(404).json({error:'الحساب غير موجود'}); if(row.phone_verified)return res.json({ok:true,user:publicUser({...row,phoneVerified:true}),freeSearches:Number(row.trip_free_searches||0),alreadyVerified:true}); const check=await checkPhoneOtp(phone,code); if(!check.ok)return res.status(check.status).json({error:check.error}); const taken=db.prepare('SELECT id FROM users WHERE phone=? AND id<>?').get(phone,user.id) as any; if(taken)return res.status(409).json({error:'رقم الهاتف مرتبط بحساب آخر.'}); db.exec('BEGIN IMMEDIATE'); try{ const priorClaim=db.prepare('SELECT id FROM trip_gift_claims WHERE user_id<>? AND phone_hash=? LIMIT 1').get(user.id,giftSignalHash(phone)) as any; const giftEligible=!priorClaim; db.prepare('UPDATE users SET phone=?,phone_verified=1,trip_free_searches=?,trip_gift_claimed_at=? WHERE id=?').run(phone,giftEligible?TRIP_WELCOME_FREE_SEARCHES:0,giftEligible?new Date().toISOString():null,user.id); if(giftEligible)db.prepare('INSERT INTO trip_gift_claims (id,user_id,device_hash,ip_hash,phone_hash,created_at) VALUES (?,?,?,?,?,?)').run(`gift_${crypto.randomUUID()}`,user.id,req.body.deviceId?giftSignalHash(String(req.body.deviceId)):null,giftSignalHash(clientIp(req)),giftSignalHash(phone),new Date().toISOString()); db.prepare('DELETE FROM phone_otps WHERE phone=?').run(phone); db.exec('COMMIT'); const refreshed=db.prepare('SELECT id,email,username,display_name as name,phone,phone_verified as phoneVerified,activation_status FROM users WHERE id=?').get(user.id) as any; res.json({ok:true,user:publicUser(refreshed),giftEligible,freeSearches:giftEligible?3:0,message:giftEligible?'تم تأكيد رقم الهاتف 🎉 حصلت على 3 أبحاث مجانية هدية ترحيبية.':'تم تأكيد الهاتف، لكن الهدية سبق استخدامها بهذا الرقم.'}); }catch(e){db.exec('ROLLBACK');throw e;} }catch(e:any){res.status(500).json({error:e.message||'تعذر تأكيد رقم الهاتف'});}
});

app.post('/api/auth/login',(req,res)=>{try{const identifier=String(req.body.identifier||req.body.email||'').trim(),normalizedEmail=identifier.toLowerCase(),normalizedUsername=normalizeUsername(identifier),password=String(req.body.password||'');let row:any=null;if(identifier.includes('@')) row=db.prepare('SELECT * FROM users WHERE email=?').get(normalizedEmail) as any;else row=db.prepare('SELECT * FROM users WHERE username=?').get(normalizedUsername) as any;if(!row||!verifyPassword(password,row.password_hash))return res.status(401).json({error:'بيانات الدخول غير صحيحة. تأكد من البريد أو اسم المستخدم وكلمة المرور.'});const user={...row,name:row.display_name,phoneVerified:row.phone_verified};res.json({token:createSession(row.id),user:publicUser(user)});}catch(e:any){res.status(500).json({error:e.message||'تعذر تسجيل الدخول'});}});
app.get('/api/auth/me',(req,res)=>{const user=authUser(req);if(!user)return res.status(401).json({error:'جلسة الدخول منتهية'});res.json({user:publicUser(user)});});
app.post('/api/auth/owner/activate',(req,res)=>{try{const ownerEmail=String(req.body.ownerEmail||'').trim().toLowerCase(),key=String(req.body.activationKey||'').trim(),userEmail=String(req.body.userEmail||'').trim().toLowerCase();if(ownerEmail!==PROGRAM_OWNER_EMAIL)return res.status(403).json({error:'هذا الإجراء مخصص لصاحب البرنامج.'});if(!PROGRAM_OWNER_ACTIVATION_KEY||key!==PROGRAM_OWNER_ACTIVATION_KEY)return res.status(403).json({error:'مفتاح تفعيل المالك غير صحيح أو غير مُكوّن.'});const user=db.prepare('SELECT id FROM users WHERE email=?').get(userEmail) as any;if(!user)return res.status(404).json({error:'الحساب غير موجود.'});db.prepare("UPDATE users SET activation_status='active',activated_by=?,activated_at=? WHERE id=?").run(ownerEmail,new Date().toISOString(),user.id);res.json({ok:true,message:'تم اعتماد الحساب بنجاح.'});}catch(e:any){res.status(500).json({error:e.message||'تعذر اعتماد الحساب'});}});
app.post('/api/auth/phone-login/request-otp',async(req,res)=>{try{const phone=normalizePhone(req.body.phone);if(phone.length<8)return res.status(400).json({error:'رقم الهاتف غير صحيح'});const row=db.prepare('SELECT id FROM users WHERE phone=? AND phone_verified=1').get(phone) as any;if(!row)return res.status(404).json({error:'هذا الرقم غير مرتبط بحساب موثق.'});try{const otpResult=await requestPhoneOtp(phone);res.json({ok:true,expiresAt:otpResult.expires,devCode:otpResult.devCode,smsProvider:otpResult.provider});}catch(err:any){return res.status(503).json({error:err.message||'تعذر إرسال SMS'});}}catch(e:any){res.status(500).json({error:e.message||'تعذر إرسال رمز SMS'});}});
app.post('/api/auth/phone-login',async(req,res)=>{try{const phone=normalizePhone(req.body.phone),code=String(req.body.code||'').trim();const check=await checkPhoneOtp(phone,code);if(!check.ok)return res.status(check.status).json({error:check.error});const row=db.prepare('SELECT * FROM users WHERE phone=? AND phone_verified=1').get(phone) as any;if(!row)return res.status(404).json({error:'هذا الرقم غير مرتبط بحساب موثق.'});db.prepare('DELETE FROM phone_otps WHERE phone=?').run(phone);res.json({token:createSession(row.id),user:publicUser({...row,name:row.display_name,phoneVerified:row.phone_verified})});}catch(e:any){res.status(500).json({error:e.message||'تعذر تسجيل الدخول بالهاتف'});}});
app.post('/api/auth/forgot-password',async(req,res)=>{try{const email=String(req.body.email||'').trim().toLowerCase();const row=db.prepare('SELECT id FROM users WHERE email=?').get(email) as any;if(!row)return res.json({ok:true,emailSent:false,message:'إذا كان البريد مسجلاً فستصلك تعليمات الاستعادة.'});const code=String(crypto.randomInt(100000,1000000)),expires=new Date(Date.now()+PASSWORD_RESET_MINUTES*60000).toISOString();db.prepare(`INSERT INTO password_resets(email,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,created_at=excluded.created_at`).run(email,otpHash(code),expires,0,new Date().toISOString());try{const info=await sendPasswordResetEmail(email,code);res.json({ok:true,emailSent:true,provider:info.provider,devCode:info.devCode});}catch(mailErr:any){db.prepare('DELETE FROM password_resets WHERE email=?').run(email);res.status(503).json({error:mailErr.message||'تعذر إرسال رسالة إعادة تعيين كلمة المرور.'});}}catch(e:any){res.status(500).json({error:e.message||'تعذر بدء استعادة كلمة المرور'});}});
app.post('/api/auth/reset-password',(req,res)=>{try{const email=String(req.body.email||'').trim().toLowerCase(),code=String(req.body.code||'').trim(),newPassword=String(req.body.newPassword||'');if(newPassword.length<8)return res.status(400).json({error:'كلمة المرور يجب أن تكون 8 أحرف على الأقل'});const reset=db.prepare('SELECT * FROM password_resets WHERE email=?').get(email) as any;if(!reset||new Date(reset.expires_at).getTime()<Date.now())return res.status(400).json({error:'رمز الاستعادة منتهي أو غير موجود'});if(reset.attempts>=5)return res.status(429).json({error:'تم تجاوز عدد المحاولات.'});db.prepare('UPDATE password_resets SET attempts=attempts+1 WHERE email=?').run(email);if(otpHash(code)!==reset.code_hash)return res.status(400).json({error:'رمز الاستعادة غير صحيح'});db.prepare('UPDATE users SET password_hash=? WHERE email=?').run(hashPassword(newPassword),email);db.prepare('DELETE FROM password_resets WHERE email=?').run(email);res.json({ok:true});}catch(e:any){res.status(500).json({error:e.message||'تعذر تغيير كلمة المرور'});}});
app.post('/api/auth/logout',(req,res)=>{const h=String(req.headers.authorization||''),token=h.startsWith('Bearer ')?h.slice(7).trim():'';if(token)db.prepare('DELETE FROM sessions WHERE id=?').run(token);res.json({ok:true});});
app.post('/api/auth/chat/request-otp',async(req,res)=>{try{const user=authUser(req);if(!user)return res.status(401).json({error:'يجب تسجيل الدخول بالبريد أولاً'});const phone=normalizePhone(req.body.phone);if(phone.length<8)return res.status(400).json({error:'رقم الهاتف غير صحيح'});const taken=db.prepare('SELECT id FROM users WHERE phone=? AND id<>?').get(phone,user.id) as any;if(taken)return res.status(409).json({error:'رقم الهاتف مرتبط بحساب آخر'});try{const otpResult=await requestPhoneOtp(phone);res.json({ok:true,expiresAt:otpResult.expires,devCode:otpResult.devCode,smsProvider:otpResult.provider});}catch(err:any){return res.status(503).json({error:err.message||'تعذر إرسال SMS'});}}catch(e:any){res.status(500).json({error:e.message||'تعذر إرسال رمز التحقق'});}});
app.post('/api/auth/chat/verify-otp',async(req,res)=>{try{const user=authUser(req);if(!user)return res.status(401).json({error:'جلسة الدخول غير صالحة'});const phone=normalizePhone(req.body.phone),code=String(req.body.code||'').trim();const check=await checkPhoneOtp(phone,code);if(!check.ok)return res.status(check.status).json({error:check.error});db.prepare('UPDATE users SET phone=?,phone_verified=1 WHERE id=?').run(phone,user.id);db.prepare('DELETE FROM phone_otps WHERE phone=?').run(phone);const refreshed=db.prepare('SELECT id,email,username,display_name as name,phone,phone_verified as phoneVerified,activation_status FROM users WHERE id=?').get(user.id) as any;res.json({token:createSession(user.id),user:publicUser(refreshed)});}catch(e:any){res.status(500).json({error:e.message||'تعذر تأكيد الرقم'});}});


// ----------------------------------------------------
// 1. Health check
// ----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "SMART TIME — وقتك من ذهب",
    version: "8.3.14",
    database: "sqlite",
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// 1B. V8 Real Services Foundation
// ----------------------------------------------------
app.get("/api/services/status", (_req, res) => {
  res.json({ version: "8.3.14", services: getServiceStatuses(), timestamp: new Date().toISOString() });
});

app.get("/api/database/health", (_req, res) => {
  try {
    const row = db.prepare("SELECT datetime('now') as now").get();
    setServiceStatus("database", "LIVE", "sqlite", "Database is writable and reachable");
    res.json({ status: "LIVE", engine: "sqlite", row });
  } catch (error:any) {
    setServiceStatus("database", "OFFLINE", "sqlite", error.message);
    res.status(500).json({ status: "OFFLINE", error: error.message });
  }
});

// ----------------------------------------------------
// 2. AI Center - Real Server-Side Gemini Chat
// ----------------------------------------------------
const handleAiChat = async (req: express.Request, res: express.Response) => {
  try {
    const { message, prompt, modelProvider = "gemini", model, conversationHistory = [], history = [], systemPrompt } = req.body;
    const userPrompt = message || prompt;

    if (!userPrompt || typeof userPrompt !== "string") {
      return res.status(400).json({ error: "Message is required" });
    }

    const activeProvider = modelProvider || model || "gemini";

    // Default system instruction in Arabic & English
    const baseSystemPrompt =
      systemPrompt ||
      `أنت المساعد الذكي لتطبيق "Smart Time — وقتك من ذهب" (Your Time. Your Gold). 
أنت تجيب بلغة المستخدم (عربية أو إنجليزية) بأسلوب احترافي، موجز، ودقيق. 
تساعد المستخدم في تنظيم وقته، حساباته ومصروفاته، سياراته، دراسة أبنائه، وصفات طعامه، رحلاته، واستفساراته اليومية.
إذا كان النموذج المحدد هو ${activeProvider}، قم بمحاكاته بأسلوبه المميز مع الحفاظ على الكفاءة العالية.`;

    try {
      const ai = getGemini();
      
      // Build contents array with context
      const chatHistory = conversationHistory.length > 0 ? conversationHistory : history;
      const formattedHistory = chatHistory.slice(-6).map((msg: any) => {
        const role = msg.sender === "user" || msg.role === "user" ? "user" : "model";
        const text = msg.text || (msg.parts && msg.parts[0]?.text) || "";
        return {
          role,
          parts: [{ text }],
        };
      });

      const contents = [
        ...formattedHistory,
        { role: "user", parts: [{ text: userPrompt }] },
      ];

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: contents,
        config: {
          systemInstruction: baseSystemPrompt,
          temperature: 0.7,
        },
      });

      const responseText = response.text || "عذرًا، لم أتمكن من معالجة الطلب في الوقت الحالي.";
      return res.json({
        reply: responseText,
        provider: activeProvider,
        timestamp: new Date().toISOString(),
      });
    } catch (aiErr: any) {
      console.warn("Gemini call fallback:", aiErr?.message);
      // Fallback response for offline or unconfigured API keys
      return res.json({
        reply: `[${activeProvider.toUpperCase()}] تم استلام استفسارك: "${userPrompt}". النظام يعمل في وضع Offline المدمج بنجاح. يمكنك استعراض كافة أقسام التطبيق وتخزين بياناتك محليًا بأمان.`,
        provider: activeProvider,
        offlineMode: true,
        timestamp: new Date().toISOString(),
      });
    }
  } catch (error: any) {
    console.error("AI Chat error:", error);
    res.status(500).json({ error: error?.message || "Internal server error" });
  }
};

app.post("/api/ai/chat", handleAiChat);
app.post("/api/gemini/chat", handleAiChat);

// ----------------------------------------------------
// 3. Smart Search Intent Parser
// ----------------------------------------------------
app.post("/api/ai/search-intent", async (req, res) => {
  try {
    const { query } = req.body;
    if (!query) {
      return res.status(400).json({ error: "Query is required" });
    }

    let parsed = {
      originalQuery: query,
      detectedCategory: "all",
      timeFilter: "all",
      keywords: query.split(" ").filter((w: string) => w.length > 1),
    };

    // Keyword heuristics
    const qLower = query.toLowerCase();
    if (qLower.includes("صرف") || qLower.includes("مصاريف") || qLower.includes("فاتورة") || qLower.includes("فلوس") || qLower.includes("expense")) {
      parsed.detectedCategory = "expenses";
    } else if (qLower.includes("عربية") || qLower.includes("سيارة") || qLower.includes("بنزين") || qLower.includes("زيت") || qLower.includes("car") || qLower.includes("fuel")) {
      parsed.detectedCategory = "vehicles";
    } else if (qLower.includes("ملاحظ") || qLower.includes("نوت") || qLower.includes("note") || qLower.includes("كتبت")) {
      parsed.detectedCategory = "notes";
    } else if (qLower.includes("طعام") || qLower.includes("أكل") || qLower.includes("وصفة") || qLower.includes("طبخ") || qLower.includes("كيتو") || qLower.includes("recipe") || qLower.includes("food")) {
      parsed.detectedCategory = "food";
    } else if (qLower.includes("رحلة") || qLower.includes("مشوار") || qLower.includes("اوبر") || qLower.includes("كريم") || qLower.includes("trip") || qLower.includes("uber")) {
      parsed.detectedCategory = "trips";
    } else if (qLower.includes("مدرسة") || qLower.includes("تعليم") || qLower.includes("درس") || qLower.includes("طالب") || qLower.includes("school") || qLower.includes("lesson")) {
      parsed.detectedCategory = "education";
    } else if (qLower.includes("قرآن") || qLower.includes("ذكر") || qLower.includes("صلاة") || qLower.includes("دعاء") || qLower.includes("bible") || qLower.includes("prayer")) {
      parsed.detectedCategory = "religious";
    }

    if (qLower.includes("الشهر اللي فات") || qLower.includes("الشهر الماضي") || qLower.includes("last month")) {
      parsed.timeFilter = "last_month";
    } else if (qLower.includes("النهاردة") || qLower.includes("اليوم") || qLower.includes("today")) {
      parsed.timeFilter = "today";
    } else if (qLower.includes("الأسبوع ده") || qLower.includes("this week")) {
      parsed.timeFilter = "this_week";
    }

    res.json(parsed);
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// ----------------------------------------------------
// 4. Trips Transport Provider Comparison Engine & Maps Proxy
// ----------------------------------------------------
function computeCoordinatesDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  if (!lat1 || !lon1 || !lat2 || !lon2 || (Math.abs(lat1 - lat2) < 0.0001 && Math.abs(lon1 - lon2) < 0.0001)) return 5.0;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const directDist = R * c;
  const roadDist = directDist * 1.35; // typical city road factor
  return Math.max(1.0, Math.round(roadDist * 10) / 10);
}

const handleTripCompare = (req: express.Request, res: express.Response) => {
  try {
    // التحقق من تسجيل الدخول والرصيد قبل تنفيذ أي بحث (كل بحث يكلف TRIP_SEARCH_COST_EGP)
    const user = authUser(req);
    if (!user) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول لاستخدام خدمة مقارنة الرحلات' });
    }
    const userRow = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(user.id) as any;
    const currentBalance = userRow?.wallet_balance || 0;
    if (currentBalance < TRIP_SEARCH_COST_EGP) {
      return res.status(402).json({
        error: `رصيدك الحالي (${currentBalance.toFixed(2)} ج.م) غير كافٍ. تكلفة البحث ${TRIP_SEARCH_COST_EGP} ج.م، من فضلك اشحن رصيدك أولاً.`,
        code: 'INSUFFICIENT_BALANCE',
        balance: currentBalance,
        required: TRIP_SEARCH_COST_EGP,
      });
    }

    const { from, to, pickup, destination, rideTypeFilter, rideType } = req.body;
    const filter = rideTypeFilter || (rideType ? String(rideType).toLowerCase() : "all");
    
    const fromLat = from?.lat || pickup?.lat || pickup?.latitude || 30.0561;
    const fromLng = from?.lng || pickup?.lng || pickup?.longitude || 31.3301;
    const toLat = to?.lat || destination?.lat || destination?.latitude || 30.0131;
    const toLng = to?.lng || destination?.lng || destination?.longitude || 31.4289;

    // Calculate realistic distance based on coordinates
    const distanceKm = computeCoordinatesDistanceKm(fromLat, fromLng, toLat, toLng); 
    const baseDurationMins = Math.max(5, Math.round(distanceKm * 2.2 + 4));

    // Dynamic providers comparison adhering to Provider Adapter pattern
    const providers = [
      {
        providerId: "uber",
        providerName: "Uber",
        logoUrl: "https://images.unsplash.com/photo-1617788138017-80ad40651399?w=100&auto=format&fit=crop&q=80",
        vehicleType: "Uber X (سيدان قياسية)",
        rideType: "Uber X (Normal)",
        typeCategory: "normal",
        fare: Math.round(distanceKm * 9.5 + 25),
        estimatedFareMin: Math.round(distanceKm * 9.5 + 20),
        estimatedFareMax: Math.round(distanceKm * 9.5 + 30),
        currency: "EGP",
        etaMinutes: 4,
        durationMinutes: baseDurationMins,
        isLive: false,
        quoteStatus: "FALLBACK",
        quoteSource: "smart-time-estimator",
        driverRating: 4.8,
        rating: 4.8,
        badge: "cheapest",
        deepLink: `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${fromLat}&pickup[longitude]=${fromLng}&dropoff[latitude]=${toLat}&dropoff[longitude]=${toLng}`,
      },
      {
        providerId: "uber-comfort",
        providerName: "Uber Comfort",
        logoUrl: "https://images.unsplash.com/photo-1549399542-7e3f8b79c341?w=100&auto=format&fit=crop&q=80",
        vehicleType: "Comfort (سيارات حديثة مكيفة)",
        rideType: "Uber Comfort (مكيفة حديثة)",
        typeCategory: "comfort",
        fare: Math.round(distanceKm * 13.5 + 35),
        estimatedFareMin: Math.round(distanceKm * 13.5 + 30),
        estimatedFareMax: Math.round(distanceKm * 13.5 + 40),
        currency: "EGP",
        etaMinutes: 3,
        durationMinutes: baseDurationMins - 2,
        isLive: false,
        quoteStatus: "FALLBACK",
        quoteSource: "smart-time-estimator",
        driverRating: 4.9,
        rating: 4.9,
        badge: "best",
        deepLink: `https://m.uber.com/ul/?action=setPickup&pickup[latitude]=${fromLat}&pickup[longitude]=${fromLng}&dropoff[latitude]=${toLat}&dropoff[longitude]=${toLng}`,
      },
      {
        providerId: "careem",
        providerName: "Careem GO",
        logoUrl: "https://images.unsplash.com/photo-1508974239320-0a029497e820?w=100&auto=format&fit=crop&q=80",
        vehicleType: "Careem GO (توفير وموثوقية)",
        rideType: "Careem GO",
        typeCategory: "normal",
        fare: Math.round(distanceKm * 10.2 + 22),
        estimatedFareMin: Math.round(distanceKm * 10.2 + 18),
        estimatedFareMax: Math.round(distanceKm * 10.2 + 28),
        currency: "EGP",
        etaMinutes: 5,
        durationMinutes: baseDurationMins,
        isLive: false,
        quoteStatus: "FALLBACK",
        quoteSource: "smart-time-estimator",
        driverRating: 4.7,
        rating: 4.7,
        badge: null,
        deepLink: `careem://book?from_lat=${fromLat}&from_lng=${fromLng}&to_lat=${toLat}&to_lng=${toLng}`,
      },
      {
        providerId: "indrive",
        providerName: "inDrive",
        logoUrl: "https://images.unsplash.com/photo-1541899481282-d53bffe3c35d?w=100&auto=format&fit=crop&q=80",
        vehicleType: "inDrive (حدد سعرك وتفاوض)",
        rideType: "inDrive (عرض سعرك)",
        typeCategory: "normal",
        fare: Math.round(distanceKm * 8.0 + 20),
        estimatedFareMin: Math.round(distanceKm * 8.0 + 15),
        estimatedFareMax: Math.round(distanceKm * 8.0 + 25),
        currency: "EGP",
        etaMinutes: 6,
        durationMinutes: baseDurationMins + 1,
        isLive: false, // Estimated fallback only
        quoteStatus: "FALLBACK",
        quoteSource: "smart-time-estimator",
        driverRating: 4.6,
        rating: 4.6,
        badge: null,
        deepLink: `indrive://route?start_lat=${fromLat}&start_lng=${fromLng}&end_lat=${toLat}&end_lng=${toLng}`,
      },
      {
        providerId: "didi",
        providerName: "DiDi Express",
        logoUrl: "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=100&auto=format&fit=crop&q=80",
        vehicleType: "DiDi Express (سريع واقتصادي)",
        rideType: "DiDi Express",
        typeCategory: "normal",
        fare: Math.round(distanceKm * 9.0 + 23),
        estimatedFareMin: Math.round(distanceKm * 9.0 + 18),
        estimatedFareMax: Math.round(distanceKm * 9.0 + 28),
        currency: "EGP",
        etaMinutes: 2,
        durationMinutes: baseDurationMins - 1,
        isLive: false,
        quoteStatus: "FALLBACK",
        quoteSource: "smart-time-estimator",
        driverRating: 4.7,
        rating: 4.7,
        badge: "fastest",
        deepLink: `didiglobal://trip?pick_lat=${fromLat}&pick_lng=${fromLng}&drop_lat=${toLat}&drop_lng=${toLng}`,
      },
      {
        providerId: "scooter",
        providerName: "Scooter Express",
        logoUrl: "https://images.unsplash.com/photo-1558981806-ec527fa84c39?w=100&auto=format&fit=crop&q=80",
        vehicleType: "دراجة نارية سريعة (سكوتر)",
        rideType: "دراجة نارية سريعة (Motorcycle)",
        typeCategory: "scooter",
        fare: Math.round(distanceKm * 5.5 + 15),
        estimatedFareMin: Math.round(distanceKm * 5.5 + 12),
        estimatedFareMax: Math.round(distanceKm * 5.5 + 18),
        currency: "EGP",
        etaMinutes: 2,
        durationMinutes: Math.round(baseDurationMins * 0.65),
        isLive: false,
        quoteStatus: "FALLBACK",
        quoteSource: "smart-time-estimator",
        driverRating: 4.8,
        rating: 4.8,
        badge: null,
        deepLink: `https://m.uber.com/ul/?action=setPickup`,
      },
    ];

    let filtered = providers;
    if (filter && filter !== "all" && filter !== "normal") {
      filtered = providers.filter((p) => p.typeCategory === filter || p.providerId.includes(filter));
      if (filtered.length === 0) filtered = providers;
    }

    // V8 policy: these are estimates only until an official provider integration is configured.
    for (const provider of ["uber", "careem", "indrive", "didi"]) {
      setServiceStatus(provider, "NOT_CONFIGURED", "transport", "Showing SMART TIME estimate only; not an official live fare");
    }
    const requestId = crypto.randomUUID();

    const result = {
      distanceKm,
      estimatedDurationMins: baseDurationMins,
      bestValueId: "uber-comfort",
      cheapestId: "uber",
      fastestId: "didi",
      options: filtered,
    };

    // الخصم والحفظ يتمان في معاملة واحدة حتى لا يحدث خصم مزدوج أو رصيد سالب
    // عند ضغط المستخدم أكثر من مرة أو وصول طلبين في نفس اللحظة.
    let newBalance = currentBalance;
    try {
      db.exec('BEGIN IMMEDIATE');
      const debit = db.prepare(
        'UPDATE users SET wallet_balance = ROUND(wallet_balance - ?, 2) WHERE id = ? AND wallet_balance >= ?'
      ).run(TRIP_SEARCH_COST_EGP, user.id, TRIP_SEARCH_COST_EGP) as any;
      if (!debit.changes) {
        const latest = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(user.id) as any;
        db.exec('ROLLBACK');
        return res.status(402).json({
          error: `رصيدك الحالي (${Number(latest?.wallet_balance || 0).toFixed(2)} ج.م) غير كافٍ. تكلفة البحث ${TRIP_SEARCH_COST_EGP} ج.م، من فضلك اشحن رصيدك أولاً.`,
          code: 'INSUFFICIENT_BALANCE',
          balance: Number(latest?.wallet_balance || 0),
          required: TRIP_SEARCH_COST_EGP,
        });
      }

      const balanceRow = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(user.id) as any;
      newBalance = Number(balanceRow?.wallet_balance || 0);

      db.prepare("INSERT INTO ride_requests(id,pickup_json,destination_json,created_at) VALUES(?,?,?,?)")
        .run(requestId, JSON.stringify(pickup || from || {}), JSON.stringify(destination || to || {}), new Date().toISOString());
      for (const q of filtered) {
        db.prepare("INSERT INTO ride_quotes(id,request_id,provider,amount,currency,eta_minutes,duration_minutes,status,raw_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
          .run(crypto.randomUUID(), requestId, q.providerId, q.fare, q.currency, q.etaMinutes, q.durationMinutes, "FALLBACK", JSON.stringify(q), new Date().toISOString());
      }
      db.prepare(
        `INSERT INTO wallet_transactions (id, user_id, amount, type, reference, balance_after, created_at) VALUES (?, ?, ?, 'trip_search', ?, ?, ?)`
      ).run(`wtx_${crypto.randomUUID()}`, user.id, -TRIP_SEARCH_COST_EGP, requestId, newBalance, new Date().toISOString());
      db.exec('COMMIT');
    } catch (txError) {
      try { db.exec('ROLLBACK'); } catch {}
      throw txError;
    }

    res.json({
      success: true,
      result,
      distanceKm,
      baseDurationMins,
      options: filtered,
      recommendations: {
        best: providers.find((p) => p.badge === "best"),
        cheapest: providers.find((p) => p.badge === "cheapest"),
        fastest: providers.find((p) => p.badge === "fastest"),
      },
      requestId,
      livePricing: false,
      quoteStatus: "FALLBACK",
      warning: "Official transport fare APIs are not configured. Prices shown are estimates only.",
      timestamp: new Date().toISOString(),
      walletBalance: newBalance,
      tripCost: TRIP_SEARCH_COST_EGP,
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// ============ نظام المحفظة (Wallet) ============

function requireAuthUser(req: express.Request, res: express.Response): any | null {
  const user = authUser(req);
  if (!user) {
    res.status(401).json({ error: 'يجب تسجيل الدخول أولاً' });
    return null;
  }
  return user;
}

function isOwnerRequest(req: express.Request): boolean {
  const user = authUser(req);
  if (!user) return false;
  if (PROGRAM_OWNER_USER_ID) return String(user.id || '') === PROGRAM_OWNER_USER_ID;
  return !!PROGRAM_OWNER_EMAIL && String(user.email || '').trim().toLowerCase() === PROGRAM_OWNER_EMAIL;
}

// جلب رصيد المستخدم الحالي
app.get('/api/wallet/me', (req, res) => {
  const user = requireAuthUser(req, res);
  if (!user) return;
  const row = db.prepare('SELECT wallet_balance, trip_free_searches, phone_verified FROM users WHERE id = ?').get(user.id) as any;
  res.json({
    balance: Number(row?.wallet_balance || 0),
    tripCost: TRIP_SEARCH_COST_EGP,
    isOwner: isOwnerRequest(req),
    walletNumber: OWNER_WALLET_NUMBER || undefined,
    instapayAddress: OWNER_INSTAPAY_ADDRESS || undefined,
    topupMin: WALLET_TOPUP_MIN_EGP,
    topupMax: WALLET_TOPUP_MAX_EGP,
    freeSearches: Math.max(0, Number(row?.trip_free_searches || 0)),
    phoneVerified: !!row?.phone_verified,
  });
});

// المستخدم يطلب شحن رصيد بعد ما يحول فلوس يدويًا
app.post('/api/wallet/topup-request', (req, res) => {
  const user = requireAuthUser(req, res);
  if (!user) return;
  const amountRaw = Number(req.body.amount);
  const amount = Math.round(amountRaw * 100) / 100;
  const method = String(req.body.method || '').trim();
  const note = String(req.body.note || '').trim().slice(0, 120);
  if (!Number.isFinite(amount) || amount < WALLET_TOPUP_MIN_EGP || amount > WALLET_TOPUP_MAX_EGP) {
    return res.status(400).json({ error: `المبلغ يجب أن يكون من ${WALLET_TOPUP_MIN_EGP} إلى ${WALLET_TOPUP_MAX_EGP} ج.م` });
  }
  if (!ALLOWED_TOPUP_METHODS.has(method)) return res.status(400).json({ error: 'وسيلة الشحن غير مدعومة' });

  // منع الضغط المكرر أو إرسال نفس الطلب عدة مرات خلال دقيقتين.
  const recentCutoff = new Date(Date.now() - 2 * 60 * 1000).toISOString();
  const duplicate = db.prepare(
    `SELECT id FROM wallet_topups WHERE user_id = ? AND amount = ? AND method = ? AND status = 'pending' AND created_at >= ? LIMIT 1`
  ).get(user.id, amount, method, recentCutoff) as any;
  if (duplicate) return res.status(409).json({ error: 'يوجد طلب شحن مماثل قيد المراجعة بالفعل' });

  const id = `topup_${crypto.randomUUID()}`;
  db.prepare(
    `INSERT INTO wallet_topups (id, user_id, amount, method, note, status, created_at) VALUES (?, ?, ?, ?, ?, 'pending', ?)`
  ).run(id, user.id, amount, method, note, new Date().toISOString());

  res.json({ ok: true, id, message: 'تم إرسال طلب الشحن، سيتم مراجعته والموافقة عليه قريبًا' });
});

// المستخدم يشوف طلباته وحالتها
app.get('/api/wallet/topup-requests/mine', (req, res) => {
  const user = requireAuthUser(req, res);
  if (!user) return;
  const rows = db.prepare(
    `SELECT id, amount, method, note, status, created_at, reviewed_at FROM wallet_topups WHERE user_id = ? ORDER BY created_at DESC`
  ).all(user.id);
  res.json({ requests: rows });
});

// سجل حركات المحفظة للمستخدم الحالي
app.get('/api/wallet/transactions', (req, res) => {
  const user = requireAuthUser(req, res);
  if (!user) return;
  const rows = db.prepare(
    `SELECT id, amount, type, reference, balance_after, created_at
     FROM wallet_transactions WHERE user_id = ? ORDER BY created_at DESC LIMIT 50`
  ).all(user.id);
  res.json({ transactions: rows });
});

// --- نقاط نهاية خاصة بصاحب البرنامج (الأدمن) فقط ---

// جلب كل طلبات الشحن (اختياريًا فلترة بالحالة)
app.get('/api/admin/wallet/summary', (req, res) => {
  if (!isOwnerRequest(req)) return res.status(403).json({ error: 'هذا الإجراء مخصص لصاحب البرنامج فقط' });
  const pending = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM wallet_topups WHERE status='pending'").get() as any;
  const approved = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM wallet_topups WHERE status='approved'").get() as any;
  const rejected = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(amount),0) as amount FROM wallet_topups WHERE status='rejected'").get() as any;
  const users = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(wallet_balance),0) as balances FROM users").get() as any;
  const tripUsage = db.prepare("SELECT COUNT(*) as count, COALESCE(SUM(-amount),0) as amount FROM wallet_transactions WHERE type='trip_search'").get() as any;
  res.json({
    pending: { count: Number(pending?.count||0), amount: Number(pending?.amount||0) },
    approved: { count: Number(approved?.count||0), amount: Number(approved?.amount||0) },
    rejected: { count: Number(rejected?.count||0), amount: Number(rejected?.amount||0) },
    users: { count: Number(users?.count||0), balances: Number(users?.balances||0) },
    tripUsage: { count: Number(tripUsage?.count||0), amount: Number(tripUsage?.amount||0) },
    tripCost: TRIP_SEARCH_COST_EGP,
    topupMin: WALLET_TOPUP_MIN_EGP,
    topupMax: WALLET_TOPUP_MAX_EGP,
  });
});

app.get('/api/admin/wallet/topups', (req, res) => {
  if (!isOwnerRequest(req)) return res.status(403).json({ error: 'هذا الإجراء مخصص لصاحب البرنامج فقط' });
  const status = String(req.query.status || 'pending');
  const q = String(req.query.q || '').trim().slice(0, 80);
  const limit = Math.min(Math.max(Number(req.query.limit || 100), 1), 200);
  const params: any[] = [];
  let where = 't.status = ?'; params.push(status);
  if (q) { where += ' AND (u.email LIKE ? OR u.display_name LIKE ? OR u.phone LIKE ? OR t.id LIKE ?)'; const x=`%${q}%`; params.push(x,x,x,x); }
  params.push(limit);
  const rows = db.prepare(
    `SELECT t.id, t.user_id, u.email, u.display_name, u.phone, t.amount, t.method, t.note, t.status,
            t.reviewed_by, t.reviewed_at, t.review_note, t.created_at
     FROM wallet_topups t JOIN users u ON u.id = t.user_id
     WHERE ${where} ORDER BY t.created_at ${status === 'pending' ? 'ASC' : 'DESC'} LIMIT ?`
  ).all(...params);
  res.json({ requests: rows });
});

app.get('/api/admin/wallet/users', (req, res) => {
  if (!isOwnerRequest(req)) return res.status(403).json({ error: 'هذا الإجراء مخصص لصاحب البرنامج فقط' });
  const q = String(req.query.q || '').trim().slice(0, 80);
  const params: any[] = [];
  let where = '1=1';
  if (q) { where += ' AND (email LIKE ? OR display_name LIKE ? OR phone LIKE ?)'; const x=`%${q}%`; params.push(x,x,x); }
  params.push(Math.min(Math.max(Number(req.query.limit || 100),1),200));
  const rows = db.prepare(`SELECT id,email,display_name,phone,wallet_balance,created_at FROM users WHERE ${where} ORDER BY wallet_balance DESC LIMIT ?`).all(...params);
  res.json({ users: rows });
});

app.get('/api/admin/wallet/audit', (req, res) => {
  if (!isOwnerRequest(req)) return res.status(403).json({ error: 'هذا الإجراء مخصص لصاحب البرنامج فقط' });
  const limit = Math.min(Math.max(Number(req.query.limit || 100),1),200);
  const rows = db.prepare(`SELECT id,topup_id,user_id,action,amount,note,actor_id,actor_email,created_at FROM wallet_admin_actions ORDER BY created_at DESC LIMIT ?`).all(limit);
  res.json({ actions: rows });
});

// الموافقة على طلب شحن وزيادة رصيد المستخدم فعليًا
app.post('/api/admin/wallet/topups/:id/approve', (req, res) => {
  if (!isOwnerRequest(req)) return res.status(403).json({ error: 'هذا الإجراء مخصص لصاحب البرنامج فقط' });
  try {
    db.exec('BEGIN IMMEDIATE');
    const topup = db.prepare(`SELECT * FROM wallet_topups WHERE id = ?`).get(req.params.id) as any;
    if (!topup) { db.exec('ROLLBACK'); return res.status(404).json({ error: 'الطلب غير موجود' }); }
    if (topup.status !== 'pending') { db.exec('ROLLBACK'); return res.status(409).json({ error: 'تمت مراجعة هذا الطلب من قبل' }); }

    const reviewedAt = new Date().toISOString();
    const reviewNote = String(req.body?.note || '').trim().slice(0, MAX_REVIEW_NOTE_LENGTH);
    const reviewer = String((authUser(req) as any)?.id || PROGRAM_OWNER_EMAIL || 'owner');
    const review = db.prepare(
      `UPDATE wallet_topups SET status = 'approved', reviewed_by = ?, reviewed_at = ?, review_note = ? WHERE id = ? AND status = 'pending'`
    ).run(PROGRAM_OWNER_EMAIL || reviewer, reviewedAt, reviewNote, topup.id) as any;
    if (!review.changes) { db.exec('ROLLBACK'); return res.status(409).json({ error: 'تمت مراجعة هذا الطلب بالفعل' }); }

    db.prepare('UPDATE users SET wallet_balance = ROUND(wallet_balance + ?, 2) WHERE id = ?').run(topup.amount, topup.user_id);
    const userRow = db.prepare('SELECT wallet_balance FROM users WHERE id = ?').get(topup.user_id) as any;
    const newBalance = Number(userRow?.wallet_balance || 0);
    db.prepare(
      `INSERT INTO wallet_transactions (id, user_id, amount, type, reference, balance_after, created_at) VALUES (?, ?, ?, 'topup', ?, ?, ?)`
    ).run(`wtx_${crypto.randomUUID()}`, topup.user_id, topup.amount, topup.id, newBalance, reviewedAt);
    db.prepare(`INSERT INTO wallet_admin_actions (id,topup_id,user_id,action,amount,note,actor_id,actor_email,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(`waa_${crypto.randomUUID()}`, topup.id, topup.user_id, 'approve', topup.amount, reviewNote, reviewer, PROGRAM_OWNER_EMAIL || reviewer, reviewedAt);
    db.exec('COMMIT');
    res.json({ ok: true, newBalance });
  } catch (e: any) {
    try { db.exec('ROLLBACK'); } catch {}
    res.status(500).json({ error: e?.message || 'تعذر اعتماد طلب الشحن' });
  }
});

app.post('/api/admin/wallet/topups/:id/reject', (req, res) => {
  if (!isOwnerRequest(req)) return res.status(403).json({ error: 'هذا الإجراء مخصص لصاحب البرنامج فقط' });
  try {
    db.exec('BEGIN IMMEDIATE');
    const reviewedAt = new Date().toISOString();
    const reviewNote = String(req.body?.note || '').trim().slice(0, MAX_REVIEW_NOTE_LENGTH);
    const reviewer = String((authUser(req) as any)?.id || PROGRAM_OWNER_EMAIL || 'owner');
    const result = db.prepare(
      `UPDATE wallet_topups SET status = 'rejected', reviewed_by = ?, reviewed_at = ?, review_note = ? WHERE id = ? AND status = 'pending'`
    ).run(PROGRAM_OWNER_EMAIL || reviewer, reviewedAt, reviewNote, req.params.id) as any;
    if (!result.changes) {
      db.exec('ROLLBACK');
      const exists = db.prepare('SELECT id FROM wallet_topups WHERE id = ?').get(req.params.id);
      return res.status(exists ? 409 : 404).json({ error: exists ? 'تمت مراجعة هذا الطلب من قبل' : 'الطلب غير موجود' });
    }
    const topup = db.prepare('SELECT user_id,amount FROM wallet_topups WHERE id=?').get(req.params.id) as any;
    db.prepare(`INSERT INTO wallet_admin_actions (id,topup_id,user_id,action,amount,note,actor_id,actor_email,created_at) VALUES (?,?,?,?,?,?,?,?,?)`)
      .run(`waa_${crypto.randomUUID()}`, req.params.id, topup?.user_id || null, 'reject', Number(topup?.amount||0), reviewNote, reviewer, PROGRAM_OWNER_EMAIL || reviewer, reviewedAt);
    db.exec('COMMIT');
    res.json({ ok: true });
  } catch (e:any) {
    try { db.exec('ROLLBACK'); } catch {}
    res.status(500).json({ error: e?.message || 'تعذر رفض طلب الشحن' });
  }
});

app.post("/api/trips/compare", handleTripCompare);
app.post("/api/transport/compare", handleTripCompare);

// ----------------------------------------------------
// 4B. Google Maps & Geolocation Proxy Endpoints
// ----------------------------------------------------
app.get("/api/maps/geocode", async (req, res) => {
  try {
    const address = String(req.query.address || "").trim();
    if (!address) return res.status(400).json({ error: "Address is required" });

    // 1) Mapbox (مجاني بدون بطاقة دفع - أولوية أولى لو الـ Token موجود)
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      try {
        const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(address)}.json?country=eg&language=ar&limit=1&access_token=${mapboxToken}`;
        const mr = await fetch(mbUrl);
        const mdata = await mr.json();
        if (mdata.features?.length) {
          const item = mdata.features[0];
          return res.json({
            address: item.place_name,
            latitude: item.center[1],
            longitude: item.center[0],
            placeId: item.id,
          });
        }
      } catch (mbErr) {
        // لو Mapbox فشل، كمل للخيارات التانية تحت
      }
    }

    // 2) Google Maps (لو مفتاحه موجود)
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (mapsKey) {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(address)}&language=ar&region=eg&key=${mapsKey}`;
      const r = await fetch(gUrl);
      const data = await r.json();
      if (data.status === "OK" && data.results?.length) {
        const item = data.results[0];
        return res.json({
          address: item.formatted_address,
          latitude: item.geometry.location.lat,
          longitude: item.geometry.location.lng,
          placeId: item.place_id,
        });
      }
    }
    // Fallback Geocoding
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + " Egypt")}&format=json&accept-language=ar&limit=1`;
    const nr = await fetch(nomUrl, { headers: { "User-Agent": "SmartTimeGold/8.3" } });
    const ndata = await nr.json();
    if (Array.isArray(ndata) && ndata.length > 0) {
      return res.json({
        address: ndata[0].display_name,
        latitude: parseFloat(ndata[0].lat),
        longitude: parseFloat(ndata[0].lon),
        placeId: ndata[0].place_id?.toString(),
      });
    }
    return res.status(404).json({ error: "Location not found" });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/maps/reverse-geocode", async (req, res) => {
  try {
    const lat = parseFloat(String(req.query.lat));
    const lng = parseFloat(String(req.query.lng));
    if (isNaN(lat) || isNaN(lng)) return res.status(400).json({ error: "Valid lat and lng required" });

    // 1) Mapbox
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      try {
        const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${lng},${lat}.json?language=ar&limit=1&access_token=${mapboxToken}`;
        const mr = await fetch(mbUrl);
        const mdata = await mr.json();
        if (mdata.features?.length) {
          const item = mdata.features[0];
          return res.json({
            address: item.place_name,
            latitude: lat,
            longitude: lng,
            placeId: item.id,
          });
        }
      } catch (mbErr) {
        // كمل للخيارات التانية
      }
    }

    // 2) Google Maps
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (mapsKey) {
      const gUrl = `https://maps.googleapis.com/maps/api/geocode/json?latlng=${lat},${lng}&language=ar&key=${mapsKey}`;
      const r = await fetch(gUrl);
      const data = await r.json();
      if (data.status === "OK" && data.results?.length) {
        const item = data.results[0];
        return res.json({
          address: item.formatted_address,
          latitude: lat,
          longitude: lng,
          placeId: item.place_id,
        });
      }
    }
    // Fallback Reverse Geocoding
    const nomUrl = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json&accept-language=ar`;
    const nr = await fetch(nomUrl, { headers: { "User-Agent": "SmartTimeGold/8.3" } });
    const ndata = await nr.json();
    if (ndata && ndata.display_name) {
      return res.json({
        address: ndata.display_name,
        latitude: lat,
        longitude: lng,
        placeId: ndata.place_id?.toString(),
      });
    }
    return res.json({
      address: `الموقع المحدد (${lat.toFixed(4)}, ${lng.toFixed(4)})`,
      latitude: lat,
      longitude: lng,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

app.get("/api/maps/places-search", async (req, res) => {
  try {
    const query = String(req.query.query || "").trim();
    if (!query) return res.json({ results: [] });

    // 1) Mapbox
    const mapboxToken = process.env.MAPBOX_ACCESS_TOKEN || process.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (mapboxToken) {
      try {
        const mbUrl = `https://api.mapbox.com/geocoding/v5/mapbox.places/${encodeURIComponent(query)}.json?country=eg&language=ar&limit=8&access_token=${mapboxToken}`;
        const mr = await fetch(mbUrl);
        const mdata = await mr.json();
        if (mdata.features?.length) {
          const results = mdata.features.map((p: any) => ({
            address: p.place_name,
            name: p.text || p.place_name,
            latitude: p.center[1],
            longitude: p.center[0],
            placeId: p.id,
          }));
          return res.json({ results });
        }
      } catch (mbErr) {
        // كمل للخيارات التانية
      }
    }

    // 2) Google Maps
    const mapsKey = process.env.GOOGLE_MAPS_API_KEY || process.env.VITE_GOOGLE_MAPS_API_KEY;
    if (mapsKey) {
      const gUrl = `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(query + " مصر")}&language=ar&key=${mapsKey}`;
      const r = await fetch(gUrl);
      const data = await r.json();
      if (data.status === "OK" && data.results?.length) {
        const results = data.results.slice(0, 8).map((p: any) => ({
          address: p.formatted_address || p.name,
          name: p.name,
          latitude: p.geometry.location.lat,
          longitude: p.geometry.location.lng,
          placeId: p.place_id,
        }));
        return res.json({ results });
      }
    }
    // Fallback Nominatim Search
    const nomUrl = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query + " Egypt")}&format=json&accept-language=ar&limit=6`;
    const nr = await fetch(nomUrl, { headers: { "User-Agent": "SmartTimeGold/8.3" } });
    const ndata = await nr.json();
    if (Array.isArray(ndata)) {
      const results = ndata.map((item: any) => ({
        address: item.display_name,
        name: item.display_name.split(",")[0],
        latitude: parseFloat(item.lat),
        longitude: parseFloat(item.lon),
        placeId: item.place_id?.toString(),
      }));
      return res.json({ results });
    }
    return res.json({ results: [] });
  } catch (err: any) {
    res.status(500).json({ results: [], error: err.message });
  }
});

app.post("/api/maps/parse-voice-trip", async (req, res) => {
  try {
    const text = String(req.body.text || "").trim();
    if (!text) return res.status(400).json({ error: "Text is required" });
    
    // Use Gemini for Arabic speech extraction
    try {
      const gemini = getGemini();
      const response = await gemini.models.generateContent({
        model: "gemini-2.5-flash",
        contents: `You are an Arabic transport route parser for Egypt. Extract the pickup location and dropoff/destination location from the following user voice text:
"${text}"
Return ONLY valid JSON matching this schema:
{
  "pickup": "pickup location in Arabic (e.g. مدينة نصر، شارع عباس العقاد)",
  "dropoff": "dropoff destination in Arabic (e.g. مطار القاهرة الدولي)"
}`,
        config: {
          responseMimeType: "application/json",
        },
      });
      const parsed = JSON.parse(response.text?.trim() || "{}");
      return res.json({ success: true, pickup: parsed.pickup || "", dropoff: parsed.dropoff || "" });
    } catch (gErr) {
      let pickup = "";
      let dropoff = "";
      const match1 = text.match(/(?:من|من عند|من مكان)\s+(.+?)\s+(?:إلى|الى|لحد|رايح|ل|لـ)\s+(.+)/i);
      if (match1) {
        pickup = match1[1].trim();
        dropoff = match1[2].trim();
      } else {
        pickup = text;
      }
      return res.json({ success: true, pickup, dropoff });
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// ----------------------------------------------------
// 5. Data Backup / Restore Sync API
// ----------------------------------------------------
app.post("/api/backup/export", (req, res) => {
  const payload = req.body;
  res.setHeader("Content-Disposition", 'attachment; filename="smart_time_backup.json"');
  res.setHeader("Content-Type", "application/json");
  res.json({
    exportDate: new Date().toISOString(),
    version: "8.3.14",
    data: payload,
  });
});

// ----------------------------------------------------
// 6. Live Internet Data Layer
// ----------------------------------------------------
// Real-time data is fetched server-side so API keys never reach the browser.
// Providers can be changed later without changing the UI/data layer.
const fetchJson = async (url: string, init: RequestInit = {}) => {
  const response = await fetch(url, { ...init, signal: AbortSignal.timeout(12000) });
  if (!response.ok) throw new Error(`HTTP ${response.status} from ${url}`);
  return response.json();
};

let cryptoBlockedUntil = 0;
let cryptoInFlight: Promise<any> | null = null;

app.get("/api/live/market", async (_req, res) => {
  const marketCacheKey = "market:composite:v2";
  const cached = getCache<any>(marketCacheKey);
  if (cached) {
    return res.json({ ...cached.value, cache: "HIT" });
  }

  const result: any = {
    source: "live",
    fetchedAt: new Date().toISOString(),
    gold: null,
    silver: null,
    currencies: {},
    crypto: {},
    statuses: {},
  };

  const metalsCache = getCache<any>("market:metals:v2", true);
  try {
    const [gold, silver] = await Promise.all([
      fetchJson("https://api.gold-api.com/price/XAU"),
      fetchJson("https://api.gold-api.com/price/XAG"),
    ]);
    result.gold = gold; result.silver = silver; result.statuses.metals = "LIVE";
    setCache("market:metals:v2", { gold, silver }, 60_000);
  } catch (error) {
    result.gold = metalsCache?.value?.gold ?? null; result.silver = metalsCache?.value?.silver ?? null;
    result.statuses.metals = metalsCache ? "FALLBACK" : "OFFLINE";
    console.warn("Live metals provider unavailable:", (error as Error)?.message);
  }

  const fxCache = getCache<any>("market:fx:v2", true);
  try {
    const fx = await fetchJson("https://api.frankfurter.dev/v2/rates?base=USD&quotes=EGP,EUR,GBP,SAR,AED");
    for (const row of Array.isArray(fx) ? fx : []) result.currencies[row.quote] = row.rate;
    result.statuses.fx = "LIVE";
    setCache("market:fx:v2", result.currencies, 120_000);
  } catch (error) {
    result.currencies = fxCache?.value ?? {}; result.statuses.fx = fxCache ? "FALLBACK" : "OFFLINE";
    console.warn("Live FX provider unavailable:", (error as Error)?.message);
  }

  const cryptoCache = getCache<any>("market:crypto:v2", true);
  const now = Date.now();
  try {
    if (now < cryptoBlockedUntil && cryptoCache) throw new Error("CoinGecko rate limited; using cached data");
    if (!cryptoInFlight) {
      const ids = "bitcoin,ethereum,solana,binancecoin,ripple";
      cryptoInFlight = fetchJson(`https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=usd&include_24hr_change=true`)
        .finally(() => { cryptoInFlight = null; });
    }
    result.crypto = await cryptoInFlight;
    result.statuses.crypto = "LIVE";
    cryptoBlockedUntil = 0;
    setCache("market:crypto:v2", result.crypto, 120_000);
  } catch (error) {
    const message = (error as Error)?.message || "Crypto provider unavailable";
    if (message.includes("HTTP 429") || message.includes("rate limited")) cryptoBlockedUntil = Date.now() + 5 * 60_000;
    result.crypto = cryptoCache?.value ?? {}; result.statuses.crypto = cryptoCache ? "FALLBACK" : "OFFLINE";
    console.warn("Live crypto provider unavailable:", message);
  }

  const hasData = result.gold || result.silver || Object.keys(result.currencies).length || Object.keys(result.crypto).length;
  if (hasData) setCache(marketCacheKey, result, 45_000);
  res.json({ ...result, cache: "MISS" });
});

const stripXml = (value: string) => value.replace(/<[^>]*>/g, "").replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#39;/g, "'").trim();

async function fetchGoogleNewsRss(lang: string) {
  const hl = lang === "ar" ? "ar" : "en-US";
  const gl = "EG";
  const ceid = lang === "ar" ? "EG:ar" : "US:en";
  const xml = await fetch(`https://news.google.com/rss?hl=${hl}&gl=${gl}&ceid=${ceid}`, { signal: AbortSignal.timeout(12000) }).then(async r => {
    if (!r.ok) throw new Error(`HTTP ${r.status} from Google News`);
    return r.text();
  });
  const items = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
  return items.slice(0, 15).map((m) => {
    const block = m[1];
    const get = (tag: string) => stripXml(block.match(new RegExp(`<${tag}>([\s\S]*?)<\/${tag}>`))?.[1] || "");
    const source = get("source");
    const url = get("link");
    const title = get("title");
    const publishedAt = get("pubDate");
    return { title, description: "", url, publishedAt, source: { name: source } };
  }).filter((a) => a.title && a.url);
}

app.get("/api/live/news", async (req, res) => {
  try {
    const key = process.env.GNEWS_API_KEY;
    const lang = String(req.query.lang || "ar");
    const country = String(req.query.country || "eg");
    const category = String(req.query.category || "general");
    const max = String(req.query.max || "10");

    if (key) {
      try {
        const data = await fetchJson(`https://gnews.io/api/v4/top-headlines?category=${encodeURIComponent(category)}&lang=${encodeURIComponent(lang)}&country=${encodeURIComponent(country)}&max=${max}&apikey=${encodeURIComponent(key)}`);
        const payload = { source: "gnews", configured: true, fetchedAt: new Date().toISOString(), articles: data.articles || [], status: "LIVE" }; setCache(`news:${lang}:${country}:${category}`, payload, 5*60*1000); setServiceStatus("news","LIVE","gnews","Fresh provider data"); return res.json(payload);
      } catch (gnewsError) {
        console.warn("GNews unavailable, falling back to Google News RSS:", (gnewsError as Error)?.message);
      }
    }

    const articles = await fetchGoogleNewsRss(lang);
    const payload = { source: "google-news-rss", configured: Boolean(key), fetchedAt: new Date().toISOString(), articles, status: key ? "FALLBACK" : "LIVE" }; setCache(`news:${lang}:${country}:${category}`, payload, 5*60*1000); setServiceStatus("news", key ? "FALLBACK" : "LIVE", "google-news-rss", key ? "GNews unavailable; RSS fallback active" : "RSS live source active"); return res.json(payload);
  } catch (error) {
    const lang = String(req.query.lang || "ar"), country = String(req.query.country || "eg"), category = String(req.query.category || "general");
    const stale = getCache<any>(`news:${lang}:${country}:${category}`, true);
    if (stale) { setServiceStatus("news","FALLBACK","cache",(error as Error)?.message); return res.json({ ...stale.value, status:"FALLBACK", stale:true }); }
    setServiceStatus("news","OFFLINE","news",(error as Error)?.message);
    res.status(502).json({ source: "news", configured: Boolean(process.env.GNEWS_API_KEY), articles: [], status:"OFFLINE", error: (error as Error)?.message });
  }
});

app.get("/api/live/weather", async (req, res) => {
  try {
    const requestedCity = String(req.query.city || "Cairo").trim() || "Cairo";
    const geo = await fetchJson(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(requestedCity)}&count=1&language=en&format=json`);
    const place = geo?.results?.[0];
    if (!place?.latitude || !place?.longitude) {
      return res.status(404).json({ source: "open-meteo", error: "City not found" });
    }
    const weather = await fetchJson(`https://api.open-meteo.com/v1/forecast?latitude=${place.latitude}&longitude=${place.longitude}&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m&timezone=auto`);
    const current = weather?.current || {};
    return res.json({
      source: "open-meteo",
      fetchedAt: new Date().toISOString(),
      city: place.name || requestedCity,
      temperatureC: Number(current.temperature_2m),
      humidity: Number(current.relative_humidity_2m),
      windKmh: Number(current.wind_speed_10m),
      weatherCode: Number(current.weather_code),
    });
  } catch (error) {
    return res.status(502).json({ source: "open-meteo", error: (error as Error)?.message });
  }
});

app.get("/api/live/sports", async (req, res) => {
  const key = process.env.API_FOOTBALL_KEY;
  if (!key) {
    return res.json({ source: "unconfigured", matches: [], configured: false, fetchedAt: new Date().toISOString() });
  }
  try {
    const live = String(req.query.live || "all");
    const url = `https://v3.football.api-sports.io/fixtures?live=${encodeURIComponent(live)}`;
    const data = await fetchJson(url, { headers: { "x-apisports-key": key, Accept: "application/json" } });
    res.json({ source: "api-football", configured: true, fetchedAt: new Date().toISOString(), matches: data.response || [] });
  } catch (error) {
    res.status(502).json({ source: "api-football", configured: true, matches: [], error: (error as Error)?.message });
  }
});

// ----------------------------------------------------
// 6. Vite Integration
// ----------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  const httpServer = http.createServer(app);
  setupChatWebSocket(httpServer);

  httpServer.listen(PORT, "0.0.0.0", () => {
    setServiceStatus("backend", "LIVE", "express", `Listening on port ${PORT}`);
    setServiceStatus("chat_realtime", "LIVE", "websocket", "Realtime chat WebSocket ready on /ws/chat");
    console.log(`[SMART TIME V8] Server & Chat WebSocket running on http://0.0.0.0:${PORT}`);
  });
}


startServer();
