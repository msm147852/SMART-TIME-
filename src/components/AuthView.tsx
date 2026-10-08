import React, { useEffect, useRef, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound } from 'lucide-react';
import { loginWithIdentifier, registerWithEmail, requestPasswordReset, resetPassword, selectLoginRole } from '../services/authService';
import { renderTurnstile, resetTurnstile } from '../services/turnstileService';

interface Props {
  onAuthenticated: () => void;
  onGuest: () => void;
  loginNotice?: string;
  requireTripPhoneVerification?: boolean;
}

type Mode = 'login'|'register'|'forgot';

export const AuthView: React.FC<Props> = ({ onAuthenticated, onGuest, loginNotice, requireTripPhoneVerification = false }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [code, setCode] = useState('');
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [resetSent, setResetSent] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');
  const [turnstileError, setTurnstileError] = useState('');
  const [roleChoiceTicket, setRoleChoiceTicket] = useState('');
  const [showRoleChoice, setShowRoleChoice] = useState(false);
  const turnstileContainerRef = useRef<HTMLDivElement | null>(null);
  const turnstileWidgetIdRef = useRef<string | number | null>(null);

  const resetAuthChallenge = () => {
    resetTurnstile(turnstileWidgetIdRef.current);
    setTurnstileToken('');
  };

  useEffect(() => {
    let active = true;
    const mount = async () => {
      try {
        if (!turnstileContainerRef.current) return;
        const widgetId = await renderTurnstile(
          turnstileContainerRef.current,
          (token) => {
            if (!active) return;
            setTurnstileToken(token);
            setTurnstileError('');
          },
          () => {
            if (!active) return;
            setTurnstileToken('');
            setTurnstileError('تعذر إكمال التحقق الأمني. أعد المحاولة.');
          },
        );
        if (active) {
          turnstileWidgetIdRef.current = widgetId;
        } else {
          resetTurnstile(widgetId);
        }
      } catch (error: any) {
        if (active) setTurnstileError(error?.message || 'تعذر تحميل التحقق الأمني.');
      }
    };
    mount();
    return () => {
      active = false;
      resetAuthChallenge();
    };
  }, []);

  const requireTurnstileToken = () => {
    const token = turnstileToken.trim();
    if (!token) throw new Error(turnstileError || 'أكمل التحقق الأمني أولًا.');
    return token;
  };

  const clearError = () => setError('');
  const switchMode = (next: Mode) => { setMode(next); clearError(); setCode(''); setResetSent(false); resetAuthChallenge(); };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault(); setError(''); setBusy(true);
    try {
      const challenge = requireTurnstileToken();
      if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('اكتب اسمًا صحيحًا.');
        if (!username.trim()) throw new Error('اسم المستخدم مطلوب.');
        await registerWithEmail(name.trim(), username.trim(), email.trim(), password, challenge);
        onAuthenticated(); return;
      }
      if (mode === 'forgot') {
        if (!resetSent) {
          const d:any = await requestPasswordReset(email.trim(), challenge);
          if (d.emailSent !== true) throw new Error('لم يتم إرسال رسالة إلى البريد. تأكد من إعداد خدمة البريد ثم حاول مرة أخرى.');
          setResetSent(true); setCode('');
          setError('تم إرسال رمز إعادة التعيين إلى بريدك الإلكتروني. افحص الوارد والرسائل غير المرغوب فيها.');
          return;
        }
        await resetPassword(email.trim(), code.trim(), password, challenge);
        setMode('login'); setCode(''); setPassword(''); setResetSent(false);
        setError('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.'); return;
      }
      if (!email.trim()) throw new Error('أدخل بريدك الإلكتروني.');
      const result = await loginWithIdentifier(email.trim(), password, challenge);
      if ('requiresRoleChoice' in result && result.requiresRoleChoice) {
        setRoleChoiceTicket(result.roleChoiceTicket || '');
        setShowRoleChoice(true);
        setError('');
        return;
      }
      onAuthenticated();
    } catch (err:any) { setError(err.message || 'تعذر تنفيذ العملية.'); }
    finally { setBusy(false); if (!showRoleChoice) resetAuthChallenge(); }
  };

  const chooseRole = async (role: 'admin' | 'user') => {
    setError(''); setBusy(true);
    try {
      if (!roleChoiceTicket) throw new Error('انتهت صلاحية اختيار نوع الدخول. سجّل الدخول مرة أخرى.');
      const challenge = requireTurnstileToken();
      await selectLoginRole(roleChoiceTicket, role);
      onAuthenticated();
    } catch (err:any) { setError(err.message || 'تعذر اختيار نوع الدخول.'); resetAuthChallenge(); }
    finally { setBusy(false); }
  };

  return (
    <main className="min-h-screen bg-slate-50 text-slate-950 flex items-center justify-center px-4 py-8" dir="rtl">
      <div className="w-full max-w-md">
        <div className="rounded-[28px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,.10)] overflow-hidden">
          <header className="p-6 sm:p-7 bg-white border-b border-slate-100 text-center">
            <div className="mx-auto w-24 h-24 rounded-3xl bg-white border border-slate-100 shadow-xl overflow-hidden flex items-center justify-center p-2">
              <img src="/logo.png" alt="SMART TIME" className="w-full h-full object-contain" />
            </div>
            <h1 className="text-2xl font-black tracking-tight mt-4">SMART TIME</h1>
            <p className="text-sm font-black text-slate-700 mt-1">eng/mamdouh saad</p>
            <p className="text-sm text-slate-500 mt-1">{mode === 'login' ? 'تسجيل الدخول إلى حسابك' : mode === 'register' ? 'إنشاء حساب جديد' : 'استعادة كلمة المرور'}</p>
          </header>
          {showRoleChoice ? (
            <div className="p-6 sm:p-7 space-y-4">
              <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-center">
                <div className="text-lg font-black text-slate-950">اختيار نوع الدخول</div>
                <p className="mt-1 text-sm font-bold text-slate-600">تم التعرف على حساب مالك البرنامج. اختر طريقة الدخول لهذه الجلسة.</p>
              </div>
              <button type="button" disabled={busy} onClick={() => chooseRole('admin')} className="w-full rounded-2xl bg-slate-950 text-white p-4 font-black shadow-lg disabled:opacity-50">دخول كـ Admin — كل الصلاحيات</button>
              <button type="button" disabled={busy} onClick={() => chooseRole('user')} className="w-full rounded-2xl border border-slate-200 bg-white p-4 font-black text-slate-900 disabled:opacity-50">دخول كمستخدم عادي</button>
              {error && <div className="rounded-xl bg-red-50 border border-red-100 text-red-700 p-3 text-xs font-bold">{error}</div>}
            </div>
          ) : (
          <form onSubmit={submit} className="p-6 sm:p-7 space-y-4">
            {loginNotice && mode === 'login' && <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">🔐 {loginNotice}</div>}
            {mode === 'register' && <>
              <label className="block"><span className="text-xs font-bold text-slate-700">الاسم</span><div className="relative mt-1"><UserRound className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required value={name} onChange={e=>setName(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="اكتب اسمك" /></div></label>
              <label className="block"><span className="text-xs font-bold text-slate-700">اسم المستخدم</span><input required dir="ltr" value={username} onChange={e=>setUsername(e.target.value.replace(/\s/g,'').slice(0,30))} className="w-full p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="ahmed_123" /></label>
            </>}
            <label className="block"><span className="text-xs font-bold text-slate-700">البريد الإلكتروني</span><div className="relative mt-1"><Mail className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required type="email" value={email} onChange={e=>setEmail(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="name@example.com" /></div></label>
            {mode === 'forgot' && resetSent && <label className="block"><span className="text-xs font-bold text-slate-700">رمز إعادة التعيين المرسل بالبريد</span><input required value={code} onChange={e=>setCode(e.target.value)} className="w-full mt-1 p-3 rounded-xl border border-slate-200 text-center tracking-[.3em]" placeholder="أدخل الرمز" /></label>}
            {mode !== 'forgot' || resetSent ? <label className="block"><span className="text-xs font-bold text-slate-700">{mode === 'forgot' ? 'كلمة المرور الجديدة' : 'كلمة المرور'}</span><div className="relative mt-1"><LockKeyhole className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required minLength={8} type={show?'text':'password'} value={password} onChange={e=>setPassword(e.target.value)} className="w-full pr-10 pl-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="8 أحرف على الأقل" /><button type="button" aria-label={show?'إخفاء كلمة المرور':'إظهار كلمة المرور'} onClick={()=>setShow(!show)} className="absolute left-3 top-3 text-slate-500">{show?<EyeOff className="w-5"/>:<Eye className="w-5"/>}</button></div></label> : null}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-3"><div ref={turnstileContainerRef} className="min-h-[65px] flex items-center justify-center" /><p className="mt-1 text-center text-[10px] font-bold text-slate-500">تحقق أمني لحماية الحساب من محاولات الدخول الآلية.</p></div>
            {turnstileError && <div className="rounded-xl border border-amber-200 bg-amber-50 p-3 text-xs font-bold text-amber-800">{turnstileError}</div>}
            {error && <div className={`rounded-xl p-3 text-xs font-bold ${error.includes('تم ') ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>{error}</div>}
            <button disabled={busy} className="w-full py-3.5 rounded-2xl bg-slate-950 text-white font-black shadow-lg hover:bg-slate-800 transition disabled:opacity-50">{busy?'جارٍ التحقق…':mode==='register'?'إنشاء الحساب':mode==='forgot'?(resetSent?'تغيير كلمة المرور':'إرسال رمز الاستعادة'):'دخول'}</button>
            {mode === 'login' && <div className="flex items-center justify-between gap-3 text-xs font-bold"><button type="button" onClick={()=>switchMode('forgot')} className="text-slate-600 hover:text-slate-950">نسيت كلمة المرور؟</button><button type="button" onClick={()=>switchMode('register')} className="text-slate-600 hover:text-slate-950">إنشاء حساب</button></div>}
            {mode !== 'login' && <button type="button" onClick={()=>switchMode('login')} className="w-full text-xs font-bold text-slate-500">العودة لتسجيل الدخول</button>}
            <button type="button" onClick={onGuest} className="w-full py-3 rounded-2xl border border-slate-200 text-slate-800 font-black bg-white hover:bg-slate-50">الدخول كزائر</button>
          </form>
          )}
        </div>
      </div>
    </main>
  );
};