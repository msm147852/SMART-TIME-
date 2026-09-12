import React, { useRef, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound, Phone, ArrowDown, ArrowRight, LogIn, AtSign } from 'lucide-react';
import { loginWithIdentifier, loginWithPhone, requestPhoneLoginOtp, registerWithEmail, verifyRegistrationPhone, requestTripsPhoneOtp, verifyTripsPhone, requestPasswordReset, resetPassword } from '../services/authService';
import approvedLoginVisual from '../assets/images/login-screen-approved.png';

interface Props {
  onAuthenticated: () => void;
  onGuest: () => void;
  loginNotice?: string;
  requireTripPhoneVerification?: boolean;
}

type Mode = 'login'|'register'|'phone'|'forgot'|'trip-phone';
type LoginMethod = 'email'|'username'|'phone';

export const AuthView: React.FC<Props> = ({ onAuthenticated, onGuest, loginNotice, requireTripPhoneVerification = false }) => {
  const [mode, setMode] = useState<Mode>(requireTripPhoneVerification ? 'trip-phone' : 'login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [phoneSent, setPhoneSent] = useState(false);
  const [registerPhoneSent, setRegisterPhoneSent] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [tripPhoneSent, setTripPhoneSent] = useState(false);
  const [registerSmsFailed, setRegisterSmsFailed] = useState(false);
  const page2Ref = useRef<HTMLElement | null>(null);

  const goToLogin = () => page2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const clearError = () => setError('');
  const switchMode = (next: Mode) => { setMode(next); clearError(); setCode(''); setPhoneSent(false); setResetSent(false); setTripPhoneSent(false); setRegisterPhoneSent(false); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      if (mode === 'trip-phone') {
        if (!phone.trim()) throw new Error('أدخل رقم هاتفك لتفعيل الرحلات.');
        if (!tripPhoneSent) {
          const d:any = await requestTripsPhoneOtp(phone.trim()); setTripPhoneSent(true);
          setError(d.devCode ? `رمز التحقق في وضع التطوير: ${d.devCode}` : 'تم إرسال رمز التحقق إلى هاتفك.'); setBusy(false); return;
        }
        const result:any = await verifyTripsPhone(phone.trim(), code.trim());
        setError(result?.giftEligible === false ? 'تم توثيق الهاتف، لكن هدية الرحلات سبق استخدامها بهذا الرقم.' : 'تم توثيق الهاتف 🎁 وحصلت على 3 أبحاث مجانية.');
        onAuthenticated(); return;
      }
      if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('اكتب اسمًا صحيحًا.');
        if (!username.trim()) throw new Error('اسم المستخدم مطلوب.');
        // TEMPORARY (testing phase): phone is optional. Leaving it blank creates the account
        // immediately with no OTP step — full app access right away. Filling it in still runs
        // the normal SMS/WhatsApp verification flow below.
        if (!registerPhoneSent) {
          const result:any = await registerWithEmail(name.trim(), username.trim(), email.trim(), password, phone.trim());
          if (!result?.requiresPhoneVerification) { onAuthenticated(); return; }
          setRegisterPhoneSent(true);
          // The account + email are already saved server-side at this point regardless of SMS outcome.
          setRegisterSmsFailed(!result?.smsSent && !result?.devCode);
          setError(result?.devCode ? `رمز SMS في وضع التطوير: ${result.devCode}` : result?.smsWarning ? result.smsWarning : 'تم إرسال رمز التحقق إلى هاتفك. أدخل الكود لإكمال التسجيل.'); setBusy(false); return;
        }
        const result:any = await verifyRegistrationPhone(phone.trim(), code.trim());
        setError(result?.giftEligible === false ? 'تم تأكيد الهاتف، لكن الهدية سبق استخدامها بهذا الرقم.' : 'تم تأكيد الهاتف 🎁 وحصلت على 3 أبحاث مجانية هدية ترحيبية.');
        onAuthenticated(); return;
      }
      if (mode === 'phone') {
        if (!phoneSent) {
          const d:any = await requestPhoneLoginOtp(phone.trim()); setPhoneSent(true);
          setError(d.devCode ? `رمز SMS في وضع التطوير: ${d.devCode}` : 'تم إرسال رمز SMS إلى هاتفك.'); setBusy(false); return;
        }
        await loginWithPhone(phone.trim(), code.trim()); onAuthenticated(); return;
      }
      if (mode === 'forgot') {
        if (!resetSent) {
          const d:any = await requestPasswordReset(email.trim());
          if (d.emailSent !== true) throw new Error('لم يتم إرسال رسالة إلى البريد. تأكد من إعداد خدمة البريد على السيرفر ثم حاول مرة أخرى.');
          setResetSent(true); setCode('');
          // Only claim a real email was delivered when a real provider sent it. In dev mode
          // (no mail provider configured) the server returns the code directly — show it instead
          // of pretending an email went out, so the user is never told "sent" when nothing arrived.
          setError(d.provider === 'development' ? `وضع التطوير: لا يوجد مزود بريد مُفعّل على السيرفر. رمز إعادة التعيين هو: ${d.devCode}` : 'تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني. افحص الوارد والرسائل غير المرغوب فيها.');
          setBusy(false); return;
        }
        await resetPassword(email.trim(), code.trim(), password); setMode('login'); setCode(''); setPassword(''); setResetSent(false); setError('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.'); setBusy(false); return;
      }
      const identifier = loginMethod === 'email' ? email.trim() : loginMethod === 'username' ? username.trim() : phone.trim();
      if (!identifier) throw new Error(loginMethod === 'email' ? 'أدخل بريدك الإلكتروني.' : loginMethod === 'username' ? 'أدخل اسم المستخدم.' : 'أدخل رقم هاتفك.');
      if (loginMethod === 'phone') { switchMode('phone'); setPhone(identifier); setBusy(false); return; }
      await loginWithIdentifier(identifier, password); onAuthenticated();
    } catch (err:any) { setError(err.message || 'تعذر تنفيذ العملية.'); }
    finally { setBusy(false); }
  };

  const resetToLogin = () => { setMode('login'); setError(''); setCode(''); setPhoneSent(false); setResetSent(false); setTripPhoneSent(false); setRegisterPhoneSent(false); };

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-white text-slate-950" dir="rtl">
      <section className="relative h-screen min-h-[680px] snap-start overflow-hidden bg-white flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(234,179,8,.14),transparent_58%)]" />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
          <div className="w-full max-w-[520px] h-[62vh] min-h-[390px] max-h-[700px] flex items-center justify-center">
            <img src={approvedLoginVisual} alt="SMART TIME" className="max-h-full max-w-full object-contain drop-shadow-[0_25px_60px_rgba(15,23,42,.16)]" />
          </div>
          <div className="max-w-xl mt-2"><p className="text-sm sm:text-base font-bold text-slate-500">كل ما تحتاجه فقط في</p><h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-1">SMART TIME</h1><p className="mt-2 text-sm sm:text-base text-slate-500">المشاوير أسهل • دردشة مباشرة • مصروفاتك • الذكاء الاصطناعي • وأكثر</p></div>
          {loginNotice && <div className="mt-4 max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 shadow-sm">🔐 {loginNotice}</div>}
          <button type="button" onClick={goToLogin} className="mt-5 w-full max-w-md py-4 rounded-2xl bg-slate-950 text-white font-black text-base shadow-xl hover:bg-slate-800 transition flex items-center justify-center gap-2"><LogIn className="w-5 h-5" />سجل الدخول أو أنشئ حسابك<ArrowRight className="w-5 h-5" /></button>
          <button type="button" onClick={onGuest} className="mt-3 text-sm font-bold text-slate-500 hover:text-slate-950 transition">الدخول كزائر</button>
        </div>
        <div className="relative z-10 pb-5 text-center text-xs text-slate-400 flex flex-col items-center gap-1"><span>اسحب لأعلى للتسجيل أو تسجيل الدخول</span><ArrowDown className="w-4 h-4 animate-bounce" /><span>SMART TIME · v1.8</span></div>
      </section>

      <section ref={page2Ref} className="h-screen min-h-[680px] snap-start overflow-y-auto bg-slate-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mb-4 text-xs font-bold text-slate-500 hover:text-slate-950">← العودة إلى صفحة التعريف</button>
          <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,.10)] overflow-hidden">
            <div className="p-6 sm:p-7 bg-white border-b border-slate-100"><div className="flex items-center gap-3"><div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg"><ShieldCheck className="w-6 h-6" /></div><div><h1 className="text-xl sm:text-2xl font-black tracking-tight">مرحبًا بك في SMART TIME ❤️</h1><p className="text-sm text-slate-500 mt-1">تسجيل الدخول أو إنشاء حساب جديد</p></div></div></div>
            <form onSubmit={submit} className="p-6 sm:p-7 space-y-4">
              {mode === 'trip-phone' && <div className="rounded-2xl border-2 border-emerald-200 bg-emerald-50 p-4"><div className="text-lg font-black text-emerald-900">🎁 فعّل هدية الرحلات</div><p className="mt-1 text-sm font-bold text-emerald-800">حسابك مسجل بالفعل بالبريد الإلكتروني. لن تحتاج لإنشاء حساب جديد؛ فقط وثّق رقم هاتفك مرة واحدة لتحصل على 3 أبحاث مجانية.</p></div>}

              {mode !== 'trip-phone' && mode !== 'forgot' && mode !== 'register' && (
                <label className="block"><span className="text-sm font-black text-slate-800">تسجيل الدخول باستخدام</span>
                  <select value={loginMethod} onChange={e => { const key = e.target.value as LoginMethod; setLoginMethod(key); clearError(); if (key === 'phone') { setMode('phone'); setPhoneSent(false); } }} className="w-full mt-2 p-3 rounded-xl border border-slate-200 bg-slate-100 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200 appearance-none">
                    <option value="email">البريد الإلكتروني</option>
                    <option value="username">اسم المستخدم</option>
                    <option value="phone">رقم الهاتف</option>
                  </select>
                </label>
              )}

              {mode === 'register' && <label className="block"><span className="text-xs font-bold text-slate-700">اسمك</span><div className="relative mt-1"><UserRound className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required value={name} onChange={e=>setName(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="اكتب اسمك" /></div></label>}
              {mode === 'register' && <label className="block"><span className="text-xs font-bold text-slate-700">اسم المستخدم</span><div className="relative mt-1"><AtSign className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required dir="ltr" value={username} onChange={e=>setUsername(e.target.value.replace(/\s/g,'').slice(0,30))} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="ahmed_123" /></div><p className="mt-1 text-[10px] text-slate-400">استخدم حروفًا إنجليزية وأرقامًا و _ أو - أو .</p></label>}

              {(mode === 'login' && loginMethod === 'email') || mode === 'forgot' || mode === 'register' ? <label className="block"><span className="text-xs font-bold text-slate-700">البريد الإلكتروني</span><div className="relative mt-1"><Mail className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="name@example.com" /></div></label> : null}

              {mode === 'login' && loginMethod === 'username' && <label className="block"><span className="text-xs font-bold text-slate-700">اسم المستخدم</span><div className="relative mt-1"><AtSign className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required value={username} onChange={e=>setUsername(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="ahmed_123" /></div></label>}

              {mode === 'register' && <><label className="block"><span className="text-xs font-bold text-slate-700">رقم الهاتف (اختياري الآن — وثّقه لاحقًا من قسم الرحلات)</span><div className="relative mt-1"><Phone className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input dir="ltr" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="01XXXXXXXXX (اختياري)" /></div></label>{registerPhoneSent && <label className="block"><span className="text-xs font-bold text-slate-700">رمز تأكيد الهاتف</span><input required inputMode="numeric" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-center tracking-[.4em]" placeholder="••••••" /></label>}</>}

              {(mode === 'trip-phone' || mode === 'phone') && <><label className="block"><span className="text-xs font-bold text-slate-700">رقم الهاتف</span><div className="relative mt-1"><Phone className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required dir="ltr" type="tel" value={phone} onChange={e=>setPhone(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="01XXXXXXXXX" /></div></label>{(mode==='phone' ? phoneSent : tripPhoneSent) && <label className="block"><span className="text-xs font-bold text-slate-700">رمز SMS</span><input required inputMode="numeric" value={code} onChange={e=>setCode(e.target.value.replace(/\D/g,'').slice(0,6))} className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-center tracking-[.4em]" placeholder="••••••" /></label>}</>}

              {mode !== 'phone' && mode !== 'trip-phone' && <label className="block"><span className="text-xs font-bold text-slate-700">{mode === 'forgot' ? 'كلمة المرور الجديدة' : 'كلمة المرور'}</span><div className="relative mt-1"><LockKeyhole className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required={mode !== 'forgot' || resetSent} minLength={8} type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="w-full pr-10 pl-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="8 أحرف على الأقل" /><button type="button" onClick={()=>setShow(!show)} className="absolute left-3 top-3 text-slate-500">{show?<EyeOff className="w-5"/>:<Eye className="w-5"/>}</button></div></label>}
              {mode === 'forgot' && resetSent && <label className="block"><span className="text-xs font-bold text-slate-700">رمز إعادة التعيين المرسل بالبريد</span><input required value={code} onChange={e=>setCode(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-center tracking-[.3em]" placeholder="أدخل الرمز" /></label>}

              {error && <div className={`rounded-xl p-3 text-xs font-bold ${error.includes('تم ') ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>{error}</div>}
              <button disabled={busy} className="w-full py-3.5 rounded-2xl bg-slate-950 text-white font-black shadow-lg hover:bg-slate-800 transition disabled:opacity-50">{busy?'جارٍ التحقق…':mode==='register'?(registerPhoneSent?'تأكيد الهاتف وإنهاء التسجيل':'إرسال رمز التحقق وإنشاء الحساب'):mode==='trip-phone'?(tripPhoneSent?'تأكيد رقم الهاتف والحصول على الهدية':'إرسال رمز التحقق'):mode==='phone'?(phoneSent?'تأكيد رمز SMS والدخول':'إرسال رمز SMS'):mode==='forgot'?(resetSent?'تغيير كلمة المرور':'إرسال رمز الاستعادة'): 'دخول'}</button>

              {mode === 'login' && <div className="flex items-center justify-between gap-3 text-[11px] font-bold"><button type="button" onClick={()=>switchMode('forgot')} className="text-slate-600 hover:text-slate-950">نسيت كلمة المرور؟</button><button type="button" onClick={()=>switchMode('register')} className="text-slate-600 hover:text-slate-950">إنشاء حساب جديد</button></div>}
              {mode === 'phone' && <button type="button" onClick={()=>{setMode('login');setLoginMethod('email');clearError();setCode('');setPhoneSent(false);}} className="w-full text-xs font-bold text-slate-500">العودة لاختيارات تسجيل الدخول</button>}
              {mode !== 'login' && mode !== 'trip-phone' && <button type="button" onClick={resetToLogin} className="w-full text-xs font-bold text-slate-500">العودة لتسجيل الدخول</button>}
              {mode === 'register' && registerSmsFailed && <button type="button" onClick={onAuthenticated} className="w-full text-xs font-bold text-emerald-700">المتابعة الآن إلى التطبيق — يمكنك توثيق الهاتف لاحقًا من قسم الرحلات</button>}
              {mode === 'register' && <p className="text-[10px] text-slate-500 text-center">بعد توثيق الهاتف تحصل على 3 أبحاث مجانية للرحلات كهدية ترحيب.</p>}
              {mode === 'forgot' && <p className="text-[10px] text-slate-500 text-center">لن يظهر نجاح الإرسال إلا بعد تأكيد السيرفر أن الرسالة خرجت من مزود البريد.</p>}
              <button type="button" onClick={onGuest} className="w-full py-3 rounded-2xl border border-slate-200 text-slate-800 font-black bg-white hover:bg-slate-50">الدخول كزائر</button>
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
