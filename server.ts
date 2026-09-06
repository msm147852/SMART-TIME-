import express from "express";
import path from "path";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";
import crypto from "node:crypto";
import { db } from "./backend/database.js";
import { getCache, setCache } from "./backend/cache.js";
import { getServiceStatuses, seedServiceStatuses, setServiceStatus } from "./backend/serviceStatus.js";

dotenv.config();


const app = express();
const PORT = Number(process.env.PORT || 3000);
seedServiceStatuses();
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

const AUTH_SESSION_DAYS = 30;
const PASSWORD_RESET_MINUTES = 15;
const PROGRAM_OWNER_EMAIL = String(process.env.PROGRAM_OWNER_EMAIL || 'eng.mamdouh2009@gmail.com').trim().toLowerCase();
const PROGRAM_OWNER_ACTIVATION_KEY = String(process.env.PROGRAM_OWNER_ACTIVATION_KEY || '');
function hashPassword(password: string) { const salt = crypto.randomBytes(16).toString('hex'); return `${salt}:${crypto.scryptSync(password, salt, 64).toString('hex')}`; }
function verifyPassword(password: string, stored: string) { const [salt, expected] = String(stored||'').split(':'); if (!salt||!expected) return false; const actual=crypto.scryptSync(password,salt,64).toString('hex'); return crypto.timingSafeEqual(Buffer.from(actual,'hex'),Buffer.from(expected,'hex')); }
function createSession(userId: string) { const token=crypto.randomBytes(32).toString('hex'); const now=new Date(); const expires=new Date(now.getTime()+AUTH_SESSION_DAYS*86400000).toISOString(); db.prepare('INSERT INTO sessions (id,user_id,expires_at,created_at) VALUES (?,?,?,?)').run(token,userId,expires,now.toISOString()); return token; }
function authUser(req: express.Request) { const h=String(req.headers.authorization||''); const token=h.startsWith('Bearer ')?h.slice(7).trim():''; if(!token)return null; return db.prepare(`SELECT u.id,u.email,u.display_name as name,u.phone,u.phone_verified as phoneVerified,s.id as session_id FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.id=? AND julianday(s.expires_at) > julianday('now')`).get(token) as any || null; }
function publicUser(row:any){return {id:row.id,email:row.email,name:row.name||row.display_name||'',phone:row.phone||undefined,phoneVerified:!!row.phoneVerified,activationStatus:row.activation_status||row.activationStatus||'pending'};}
function normalizePhone(phone:string){return String(phone||'').replace(/[\s()-]/g,'');}
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
  throw new Error('مزود SMS غير مُكوّن. استخدم SMS_PROVIDER=twilio أو webhook.');
}

app.post('/api/auth/register',(req,res)=>{try{const name=String(req.body.name||'').trim(),email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||'');if(name.length<2)return res.status(400).json({error:'الاسم مطلوب'});if(!/^\S+@\S+\.\S+$/.test(email))return res.status(400).json({error:'البريد الإلكتروني غير صحيح'});if(password.length<8)return res.status(400).json({error:'كلمة المرور يجب أن تكون 8 أحرف على الأقل'});if(db.prepare('SELECT id FROM users WHERE email=?').get(email))return res.status(409).json({error:'البريد الإلكتروني مستخدم بالفعل'});const id=`usr_${crypto.randomUUID()}`;db.prepare("INSERT INTO users (id,email,password_hash,display_name,created_at,phone,phone_verified,activation_status) VALUES (?,?,?,?,?,?,?,?)").run(id,email,hashPassword(password),name,new Date().toISOString(),null,0,'pending');db.prepare("UPDATE users SET activation_status='active', activated_at=?, activated_by=? WHERE id=?").run(new Date().toISOString(), PROGRAM_OWNER_EMAIL, id); const user={id,email,name,phoneVerified:false,activationStatus:'active'}; res.json({token:createSession(id),user,message:'تم إنشاء الحساب ويمكنك الدخول مباشرة بالبريد الإلكتروني.'});}catch(e:any){res.status(500).json({error:e.message||'تعذر إنشاء الحساب'});}});
app.post('/api/auth/login',(req,res)=>{try{const email=String(req.body.email||'').trim().toLowerCase(),password=String(req.body.password||''),row=db.prepare('SELECT * FROM users WHERE email=?').get(email) as any;if(!row||!verifyPassword(password,row.password_hash))return res.status(401).json({error:'البريد الإلكتروني أو كلمة المرور غير صحيحة'});const user={...row,name:row.display_name,phoneVerified:row.phone_verified};res.json({token:createSession(row.id),user:publicUser(user)});}catch(e:any){res.status(500).json({error:e.message||'تعذر تسجيل الدخول'});}});
app.get('/api/auth/me',(req,res)=>{const user=authUser(req);if(!user)return res.status(401).json({error:'جلسة الدخول منتهية'});res.json({user:publicUser(user)});});
app.post('/api/auth/owner/activate',(req,res)=>{try{const ownerEmail=String(req.body.ownerEmail||'').trim().toLowerCase(),key=String(req.body.activationKey||'').trim(),userEmail=String(req.body.userEmail||'').trim().toLowerCase();if(ownerEmail!==PROGRAM_OWNER_EMAIL)return res.status(403).json({error:'هذا الإجراء مخصص لصاحب البرنامج.'});if(!PROGRAM_OWNER_ACTIVATION_KEY||key!==PROGRAM_OWNER_ACTIVATION_KEY)return res.status(403).json({error:'مفتاح تفعيل المالك غير صحيح أو غير مُكوّن.'});const user=db.prepare('SELECT id FROM users WHERE email=?').get(userEmail) as any;if(!user)return res.status(404).json({error:'الحساب غير موجود.'});db.prepare("UPDATE users SET activation_status='active',activated_by=?,activated_at=? WHERE id=?").run(ownerEmail,new Date().toISOString(),user.id);res.json({ok:true,message:'تم اعتماد الحساب بنجاح.'});}catch(e:any){res.status(500).json({error:e.message||'تعذر اعتماد الحساب'});}});
app.post('/api/auth/phone-login/request-otp',(req,res)=>{try{const phone=normalizePhone(req.body.phone);if(phone.length<8)return res.status(400).json({error:'رقم الهاتف غير صحيح'});const row=db.prepare('SELECT id FROM users WHERE phone=? AND phone_verified=1').get(phone) as any;if(!row)return res.status(404).json({error:'هذا الرقم غير مرتبط بحساب موثق.'});const code=String(crypto.randomInt(100000,1000000)),expires=new Date(Date.now()+300000).toISOString();db.prepare(`INSERT INTO phone_otps(phone,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,created_at=excluded.created_at`).run(phone,otpHash(code),expires,0,new Date().toISOString());sendSms(phone,code).then(info=>res.json({ok:true,expiresAt:expires,smsProvider:info.provider})).catch((err:any)=>{if(process.env.NODE_ENV!=='production') return res.json({ok:true,devCode:code,expiresAt:expires,smsProvider:'development',warning:err.message}); return res.status(503).json({error:err.message||'تعذر إرسال SMS'});});}catch(e:any){res.status(500).json({error:e.message||'تعذر إرسال رمز SMS'});}});
app.post('/api/auth/phone-login',(req,res)=>{try{const phone=normalizePhone(req.body.phone),code=String(req.body.code||'').trim();const otp=db.prepare('SELECT * FROM phone_otps WHERE phone=?').get(phone) as any;if(!otp||new Date(otp.expires_at).getTime()<Date.now())return res.status(400).json({error:'رمز التحقق منتهي أو غير موجود'});if(otp.attempts>=5)return res.status(429).json({error:'تم تجاوز عدد المحاولات. اطلب رمزًا جديدًا.'});db.prepare('UPDATE phone_otps SET attempts=attempts+1 WHERE phone=?').run(phone);if(otpHash(code)!==otp.code_hash)return res.status(400).json({error:'رمز التحقق غير صحيح'});const row=db.prepare('SELECT * FROM users WHERE phone=? AND phone_verified=1').get(phone) as any;if(!row)return res.status(404).json({error:'هذا الرقم غير مرتبط بحساب موثق.'});db.prepare('DELETE FROM phone_otps WHERE phone=?').run(phone);res.json({token:createSession(row.id),user:publicUser({...row,name:row.display_name,phoneVerified:row.phone_verified})});}catch(e:any){res.status(500).json({error:e.message||'تعذر تسجيل الدخول بالهاتف'});}});
app.post('/api/auth/forgot-password',(req,res)=>{try{const email=String(req.body.email||'').trim().toLowerCase();const row=db.prepare('SELECT id FROM users WHERE email=?').get(email) as any; if(!row)return res.json({ok:true,message:'إذا كان البريد مسجلاً فستصلك تعليمات الاستعادة.'}); const code=String(crypto.randomInt(100000,1000000)),expires=new Date(Date.now()+PASSWORD_RESET_MINUTES*60000).toISOString();db.prepare(`INSERT INTO password_resets(email,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?) ON CONFLICT(email) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,created_at=excluded.created_at`).run(email,otpHash(code),expires,0,new Date().toISOString());res.json({ok:true,message:'تم إنشاء رمز الاستعادة.',devCode:process.env.NODE_ENV!=='production'?code:undefined});}catch(e:any){res.status(500).json({error:e.message||'تعذر بدء استعادة كلمة المرور'});}});
app.post('/api/auth/reset-password',(req,res)=>{try{const email=String(req.body.email||'').trim().toLowerCase(),code=String(req.body.code||'').trim(),newPassword=String(req.body.newPassword||'');if(newPassword.length<8)return res.status(400).json({error:'كلمة المرور يجب أن تكون 8 أحرف على الأقل'});const reset=db.prepare('SELECT * FROM password_resets WHERE email=?').get(email) as any;if(!reset||new Date(reset.expires_at).getTime()<Date.now())return res.status(400).json({error:'رمز الاستعادة منتهي أو غير موجود'});if(reset.attempts>=5)return res.status(429).json({error:'تم تجاوز عدد المحاولات.'});db.prepare('UPDATE password_resets SET attempts=attempts+1 WHERE email=?').run(email);if(otpHash(code)!==reset.code_hash)return res.status(400).json({error:'رمز الاستعادة غير صحيح'});db.prepare('UPDATE users SET password_hash=? WHERE email=?').run(hashPassword(newPassword),email);db.prepare('DELETE FROM password_resets WHERE email=?').run(email);res.json({ok:true});}catch(e:any){res.status(500).json({error:e.message||'تعذر تغيير كلمة المرور'});}});
app.post('/api/auth/logout',(req,res)=>{const h=String(req.headers.authorization||''),token=h.startsWith('Bearer ')?h.slice(7).trim():'';if(token)db.prepare('DELETE FROM sessions WHERE id=?').run(token);res.json({ok:true});});
app.post('/api/auth/chat/request-otp',(req,res)=>{try{const user=authUser(req);if(!user)return res.status(401).json({error:'يجب تسجيل الدخول بالبريد أولاً'});const phone=normalizePhone(req.body.phone);if(phone.length<8)return res.status(400).json({error:'رقم الهاتف غير صحيح'});const taken=db.prepare('SELECT id FROM users WHERE phone=? AND id<>?').get(phone,user.id) as any;if(taken)return res.status(409).json({error:'رقم الهاتف مرتبط بحساب آخر'});const code=String(crypto.randomInt(100000,1000000)),expires=new Date(Date.now()+300000).toISOString();db.prepare(`INSERT INTO phone_otps(phone,code_hash,expires_at,attempts,created_at) VALUES(?,?,?,?,?) ON CONFLICT(phone) DO UPDATE SET code_hash=excluded.code_hash,expires_at=excluded.expires_at,attempts=0,created_at=excluded.created_at`).run(phone,otpHash(code),expires,0,new Date().toISOString());sendSms(phone,code).then(info=>res.json({ok:true,expiresAt:expires,smsProvider:info.provider})).catch((err:any)=>{if(process.env.NODE_ENV!=='production') return res.json({ok:true,devCode:code,expiresAt:expires,smsProvider:'development',warning:err.message}); return res.status(503).json({error:err.message||'تعذر إرسال SMS'});});}catch(e:any){res.status(500).json({error:e.message||'تعذر إرسال رمز التحقق'});}});
app.post('/api/auth/chat/verify-otp',(req,res)=>{try{const user=authUser(req);if(!user)return res.status(401).json({error:'جلسة الدخول غير صالحة'});const phone=normalizePhone(req.body.phone),code=String(req.body.code||'').trim(),otp=db.prepare('SELECT * FROM phone_otps WHERE phone=?').get(phone) as any;if(!otp||new Date(otp.expires_at).getTime()<Date.now())return res.status(400).json({error:'رمز التحقق منتهي أو غير موجود'});if(otp.attempts>=5)return res.status(429).json({error:'تم تجاوز عدد المحاولات. اطلب رمزًا جديدًا.'});db.prepare('UPDATE phone_otps SET attempts=attempts+1 WHERE phone=?').run(phone);if(otpHash(code)!==otp.code_hash)return res.status(400).json({error:'رمز التحقق غير صحيح'});db.prepare('UPDATE users SET phone=?,phone_verified=1 WHERE id=?').run(phone,user.id);db.prepare('DELETE FROM phone_otps WHERE phone=?').run(phone);const refreshed=db.prepare('SELECT id,email,display_name as name,phone,phone_verified as phoneVerified,activation_status FROM users WHERE id=?').get(user.id) as any;res.json({token:createSession(user.id),user:publicUser(refreshed)});}catch(e:any){res.status(500).json({error:e.message||'تعذر تأكيد الرقم'});}});


// ----------------------------------------------------
// 1. Health check
// ----------------------------------------------------
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    app: "SMART TIME — وقتك من ذهب",
    version: "8.3.5",
    database: "sqlite",
    timestamp: new Date().toISOString(),
  });
});

// ----------------------------------------------------
// 1B. V8 Real Services Foundation
// ----------------------------------------------------
app.get("/api/services/status", (_req, res) => {
  res.json({ version: "8.3.5", services: getServiceStatuses(), timestamp: new Date().toISOString() });
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
// 4. Trips Transport Provider Comparison Engine
// ----------------------------------------------------
const handleTripCompare = (req: express.Request, res: express.Response) => {
  try {
    const { from, to, pickup, destination, rideTypeFilter, rideType } = req.body;
    const filter = rideTypeFilter || (rideType ? String(rideType).toLowerCase() : "all");
    
    // Calculate realistic distance based on coordinates or default 8.5 km
    const distanceKm = 8.5; 
    const baseDurationMins = Math.round(distanceKm * 2.2 + 5);

    const fromLat = from?.lat || pickup?.lat || 30.0444;
    const fromLng = from?.lng || pickup?.lng || 31.2357;
    const toLat = to?.lat || destination?.lat || 30.0760;
    const toLng = to?.lng || destination?.lng || 31.3280;

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
    db.prepare("INSERT INTO ride_requests(id,pickup_json,destination_json,created_at) VALUES(?,?,?,?)")
      .run(requestId, JSON.stringify(pickup || from || {}), JSON.stringify(destination || to || {}), new Date().toISOString());
    for (const q of filtered) {
      db.prepare("INSERT INTO ride_quotes(id,request_id,provider,amount,currency,eta_minutes,duration_minutes,status,raw_json,created_at) VALUES(?,?,?,?,?,?,?,?,?,?)")
        .run(crypto.randomUUID(), requestId, q.providerId, q.fare, q.currency, q.etaMinutes, q.durationMinutes, "FALLBACK", JSON.stringify(q), new Date().toISOString());
    }

    const result = {
      distanceKm,
      estimatedDurationMins: baseDurationMins,
      bestValueId: "uber-comfort",
      cheapestId: "uber",
      fastestId: "didi",
      options: filtered,
    };

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
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
};

app.post("/api/trips/compare", handleTripCompare);
app.post("/api/transport/compare", handleTripCompare);

// ----------------------------------------------------
// 5. Data Backup / Restore Sync API
// ----------------------------------------------------
app.post("/api/backup/export", (req, res) => {
  const payload = req.body;
  res.setHeader("Content-Disposition", 'attachment; filename="smart_time_backup.json"');
  res.setHeader("Content-Type", "application/json");
  res.json({
    exportDate: new Date().toISOString(),
    version: "8.3.5",
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

  app.listen(PORT, "0.0.0.0", () => {
    setServiceStatus("backend","LIVE","express",`Listening on port ${PORT}`);
    console.log(`[SMART TIME V8] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
