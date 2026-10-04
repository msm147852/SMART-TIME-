import React, { useRef, useState } from 'react';
import { Eye, EyeOff, LockKeyhole, Mail, ShieldCheck, UserRound, Phone, ArrowDown, ArrowRight, LogIn, AtSign } from 'lucide-react';
import {
  loginWithIdentifier,
  registerWithEmail,
  requestPasswordResetByPhone,
  resetPasswordByPhone,
} from '../services/authService';
import approvedLoginVisual from '../assets/images/login-screen-approved.png';

interface Props {
  onAuthenticated: () => void;
  onGuest: () => void;
  loginNotice?: string;
  requireTripPhoneVerification?: boolean;
}

type Mode = 'login' | 'register' | 'forgot';
type LoginMethod = 'email' | 'username';

export const AuthView: React.FC<Props> = ({ onAuthenticated, onGuest, loginNotice }) => {
  const [mode, setMode] = useState<Mode>('login');
  const [loginMethod, setLoginMethod] = useState<LoginMethod>('email');
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [forgotFound, setForgotFound] = useState(false);
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const page2Ref = useRef<HTMLElement | null>(null);

  const goToLogin = () => page2Ref.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  const clearError = () => setError('');

  const switchMode = (next: Mode) => {
    setMode(next);
    clearError();
    setForgotFound(false);
    setPassword('');
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setBusy(true);
    try {
      if (mode === 'register') {
        if (name.trim().length < 2) throw new Error('اكتب اسمًا صحيحًا.');
        if (!/^[a-z0-9_.-]{3,30}$/i.test(username.trim())) throw new Error('اسم المستخدم يجب أن يكون من 3 إلى 30 حرفًا، باستخدام حروف إنجليزية أو أرقام أو _ أو - أو .');
        if (!/^\S+@\S+\.\S+$/.test(email.trim())) throw new Error('البريد الإلكتروني غير صحيح.');
        if (phone.trim().replace(/\D/g, '').length < 8) throw new Error('رقم الهاتف مطلوب ويجب أن يكون صحيحًا.');
        if (password.length < 8) throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
        await registerWithEmail(name.trim(), username.trim(), email.trim(), password, phone.trim());
        onAuthenticated();
        return;
      }

      if (mode === 'forgot') {
        if (!forgotFound) {
          if (phone.trim().replace(/\D/g, '').length < 8) throw new Error('أدخل رقم هاتف صحيح.');
          const result: any = await requestPasswordResetByPhone(phone.trim());
          if (!result?.found) throw new Error('الرقم غير مسجل على السيرفر');
          setForgotFound(true);
          setPassword('');
          setError('تم العثور على الحساب. أدخل كلمة المرور الجديدة.');
          return;
        }
        if (password.length < 8) throw new Error('كلمة المرور يجب أن تكون 8 أحرف على الأقل.');
        await resetPasswordByPhone(phone.trim(), password);
        setMode('login');
        setForgotFound(false);
        setPassword('');
        setPhone('');
        setError('تم تغيير كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.');
        return;
      }

      const identifier = loginMethod === 'email' ? email.trim() : username.trim();
      if (!identifier) throw new Error(loginMethod === 'email' ? 'أدخل بريدك الإلكتروني.' : 'أدخل اسم المستخدم.');
      if (!password) throw new Error('أدخل كلمة المرور.');
      await loginWithIdentifier(identifier, password);
      onAuthenticated();
    } catch (err: any) {
      setError(err?.message || 'تعذر تنفيذ العملية.');
    } finally {
      setBusy(false);
    }
  };

  const resetToLogin = () => {
    setMode('login');
    setError('');
    setForgotFound(false);
    setPassword('');
    setPhone('');
  };

  return (
    <div className="h-screen overflow-y-auto snap-y snap-mandatory bg-white text-slate-950" dir="rtl">
      <section className="relative h-screen min-h-[680px] snap-start overflow-hidden bg-white flex flex-col">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_30%,rgba(234,179,8,.14),transparent_58%)]" />
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center px-5 py-6 text-center">
          <div className="w-full max-w-[520px] h-[62vh] min-h-[390px] max-h-[700px] flex items-center justify-center">
            <img src={approvedLoginVisual} alt="SMART TIME" className="max-h-full max-w-full object-contain drop-shadow-[0_25px_60px_rgba(15,23,42,.16)]" />
          </div>
          <div className="max-w-xl mt-2">
            <p className="text-sm sm:text-base font-bold text-slate-500">كل ما تحتاجه فقط في</p>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight mt-1">SMART TIME</h1>
            <p className="mt-2 text-sm sm:text-base text-slate-500">المشاوير أسهل • دردشة مباشرة • مصروفاتك • الذكاء الاصطناعي • وأكثر</p>
          </div>
          {loginNotice && <div className="mt-4 max-w-md w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900 shadow-sm">🔐 {loginNotice}</div>}
          <button type="button" onClick={goToLogin} className="mt-5 w-full max-w-md py-4 rounded-2xl bg-slate-950 text-white font-black text-base shadow-xl hover:bg-slate-800 transition flex items-center justify-center gap-2">
            <LogIn className="w-5 h-5" />سجل الدخول أو أنشئ حسابك<ArrowRight className="w-5 h-5" />
          </button>
          <button type="button" onClick={onGuest} className="mt-3 text-sm font-bold text-slate-500 hover:text-slate-950 transition">الدخول كزائر</button>
        </div>
        <div className="relative z-10 pb-5 text-center text-xs text-slate-400 flex flex-col items-center gap-1">
          <span>اسحب لأعلى للتسجيل أو تسجيل الدخول</span><ArrowDown className="w-4 h-4 animate-bounce" /><span>SMART TIME · v1.8</span>
        </div>
      </section>

      <section ref={page2Ref} className="h-screen min-h-[680px] snap-start overflow-y-auto bg-slate-50 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} className="mb-4 text-xs font-bold text-slate-500 hover:text-slate-950">← العودة إلى صفحة التعريف</button>
          <div className="rounded-[32px] border border-slate-200 bg-white shadow-[0_20px_70px_rgba(15,23,42,.10)] overflow-hidden">
            <div className="p-6 sm:p-7 bg-white border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-2xl bg-slate-950 text-white flex items-center justify-center shadow-lg"><ShieldCheck className="w-6 h-6" /></div>
                <div>
                  <h1 className="text-xl sm:text-2xl font-black tracking-tight">مرحبًا بك في SMART TIME ❤️</h1>
                  <p className="text-sm text-slate-500 mt-1">دخول وتسجيل مبسط — بدون أكواد تحقق</p>
                </div>
              </div>
            </div>

            <form onSubmit={submit} className="p-6 sm:p-7 space-y-4">
              {mode === 'login' && (
                <label className="block">
                  <span className="text-sm font-black text-slate-800">تسجيل الدخول باستخدام</span>
                  <select value={loginMethod} onChange={e => { setLoginMethod(e.target.value as LoginMethod); clearError(); }} className="w-full mt-2 p-3 rounded-xl border border-slate-200 bg-slate-100 font-bold text-sm text-slate-800 outline-none focus:ring-2 focus:ring-slate-200 appearance-none">
                    <option value="email">البريد الإلكتروني</option>
                    <option value="username">اسم المستخدم</option>
                  </select>
                </label>
              )}

              {mode === 'register' && (
                <>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">الاسم</span>
                    <div className="relative mt-1"><UserRound className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required value={name} onChange={e => setName(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="اكتب اسمك" /></div>
                  </label>
                  <label className="block">
                    <span className="text-xs font-bold text-slate-700">اسم المستخدم</span>
                    <div className="relative mt-1"><AtSign className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required dir="ltr" value={username} onChange={e => setUsername(e.target.value.replace(/\s/g, '').slice(0, 30))} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="ahmed_123" /></div>
                    <p className="mt-1 text-[10px] text-slate-400">حروف إنجليزية وأرقام و _ أو - أو .</p>
                  </label>
                </>
              )}

              {(mode === 'login' && loginMethod === 'email') || mode === 'register' ? (
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">البريد الإلكتروني</span>
                  <div className="relative mt-1"><Mail className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required type="email" value={email} onChange={e => setEmail(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="name@example.com" /></div>
                </label>
              ) : null}

              {mode === 'login' && loginMethod === 'username' && (
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">اسم المستخدم</span>
                  <div className="relative mt-1"><AtSign className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required value={username} onChange={e => setUsername(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="ahmed_123" /></div>
                </label>
              )}

              {(mode === 'register' || mode === 'forgot') && (
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">رقم الهاتف</span>
                  <div className="relative mt-1"><Phone className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" /><input required dir="ltr" type="tel" value={phone} onChange={e => setPhone(e.target.value)} className="w-full pr-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="01XXXXXXXXX" /></div>
                  {mode === 'forgot' && <p className="mt-1 text-[10px] text-slate-400">لا يوجد كود أو رسالة — السيرفر يتحقق من الرقم مباشرة.</p>}
                </label>
              )}

              {mode !== 'forgot' || forgotFound ? (
                <label className="block">
                  <span className="text-xs font-bold text-slate-700">{mode === 'forgot' ? 'كلمة المرور الجديدة' : 'كلمة المرور'}</span>
                  <div className="relative mt-1">
                    <LockKeyhole className="absolute right-3 top-3.5 w-4 h-4 text-slate-400" />
                    <input required minLength={8} type={show ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)} className="w-full pr-10 pl-10 p-3 rounded-xl border border-slate-200 outline-none focus:ring-2 focus:ring-slate-200" placeholder="8 أحرف على الأقل" />
                    <button type="button" onClick={() => setShow(!show)} className="absolute left-3 top-3 text-slate-500">{show ? <EyeOff className="w-5" /> : <Eye className="w-5" />}</button>
                  </div>
                </label>
              ) : null}

              {error && <div className={`rounded-xl p-3 text-xs font-bold ${error.startsWith('تم ') ? 'bg-emerald-50 border border-emerald-100 text-emerald-700' : 'bg-red-50 border border-red-100 text-red-700'}`}>{error}</div>}

              <button disabled={busy} className="w-full py-3.5 rounded-2xl bg-slate-950 text-white font-black shadow-lg hover:bg-slate-800 transition disabled:opacity-50">
                {busy ? 'جارٍ التنفيذ…' : mode === 'register' ? 'إنشاء الحساب والدخول فورًا' : mode === 'forgot' ? (forgotFound ? 'تعيين كلمة المرور الجديدة' : 'التحقق من رقم الهاتف') : 'دخول'}
              </button>

              {mode === 'login' && (
                <div className="flex items-center justify-between gap-3 text-[11px] font-bold">
                  <button type="button" onClick={() => switchMode('forgot')} className="text-slate-600 hover:text-slate-950">نسيت كلمة المرور؟</button>
                  <button type="button" onClick={() => switchMode('register')} className="text-slate-600 hover:text-slate-950">إنشاء حساب جديد</button>
                </div>
              )}

              {mode !== 'login' && <button type="button" onClick={resetToLogin} className="w-full text-xs font-bold text-slate-500">العودة لتسجيل الدخول</button>}

              {mode === 'register' && <p className="text-[10px] text-slate-500 text-center">يتم تفعيل الحساب فورًا بعد التسجيل، بدون OTP أو تأكيد بريد إلكتروني.</p>}
              {mode === 'forgot' && <p className="text-[10px] text-slate-500 text-center">إذا كان الرقم مسجلًا، يمكنك تعيين كلمة مرور جديدة مباشرة بدون كود تحقق.</p>}
            </form>
          </div>
        </div>
      </section>
    </div>
  );
};
