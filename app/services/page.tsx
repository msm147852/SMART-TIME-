import { useState } from "react";
import SmartAIDemo from "../../components/smart-ai/SmartAIDemo";

const teaserCards = [
  { title: "المالية", description: "إدارة المصاريف والدخل", icon: "💰" },
  { title: "التذكيرات", description: "تذكير بالمهام والأدوية", icon: "⏰" },
  { title: "التقويم", description: "تقويم ذكي للأحداث", icon: "📅" },
  { title: "الذكريات", description: "احفظ ذكرياتك", icon: "📸" },
  { title: "التحليلات", description: "تقارير ذكية", icon: "📊" },
];

function DownloadIcon() {
  return <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-5 w-5" aria-hidden="true"><path d="M12 3v12m0 0 4-4m-4 4-4-4M5 20h14" strokeLinecap="round" strokeLinejoin="round" /></svg>;
}

export default function ServicesPage() {
  const [selected, setSelected] = useState<string | null>(null);
  return (
    <main dir="rtl" className="min-h-screen bg-[#0a0a0a] text-white selection:bg-white selection:text-black">
      <header className="border-b border-zinc-800/80 bg-[#0a0a0a]">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 px-5 py-8 text-center sm:flex-row sm:justify-between sm:text-right">
          <div><h1 className="text-2xl font-black tracking-tight sm:text-3xl">SMART TIME</h1><p className="mt-1 text-sm text-zinc-400">حمل التطبيق الكامل</p></div>
          <a href="/downloads/smart-time.apk" download className="inline-flex items-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black transition hover:bg-zinc-200 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"><DownloadIcon />تحميل APK</a>
        </div>
      </header>
      <section className="mx-auto max-w-3xl px-4 pb-16 pt-12 sm:px-6 sm:pt-16">
        <div className="mb-8 text-center"><p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-500">SMART TIME AI</p><h2 className="mt-3 text-3xl font-black sm:text-4xl">اتكلم مع مساعدك الذكي</h2><p className="mx-auto mt-3 max-w-xl text-sm leading-7 text-zinc-400">اسأل براحتك بالعربي. المساعد يفهمك ويرد عليك بصوت واضح، والميزات الكاملة موجودة داخل التطبيق.</p></div>
        <SmartAIDemo />
      </section>
      <section className="mx-auto max-w-5xl px-4 pb-20 sm:px-6">
        <div className="mb-7 text-center"><h2 className="text-2xl font-black sm:text-3xl">جرب باقي المميزات في التطبيق</h2></div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {teaserCards.map((card) => <button key={card.title} type="button" onClick={() => setSelected(card.title)} className="group rounded-2xl border border-zinc-800 bg-zinc-950 p-6 text-right transition hover:-translate-y-0.5 hover:border-white focus:outline-none focus:ring-2 focus:ring-white"><div className="text-3xl" aria-hidden="true">{card.icon}</div><h3 className="mt-5 text-lg font-bold">{card.title}</h3><p className="mt-2 text-sm text-zinc-400">{card.description}</p></button>)}
        </div>
      </section>
      {selected && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 px-4 backdrop-blur-sm" role="dialog" aria-modal="true" aria-labelledby="feature-dialog-title" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelected(null); }}>
        <div className="w-full max-w-md rounded-2xl border border-zinc-800 bg-[#0a0a0a] p-6 shadow-2xl">
          <h3 id="feature-dialog-title" className="text-xl font-black">الميزة دي موجودة في التطبيق الكامل</h3><p className="mt-3 text-sm leading-7 text-zinc-400">حمل التطبيق من هنا واستمتع بكل مميزات SMART TIME.</p>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row"><a href="/downloads/smart-time.apk" download className="inline-flex flex-1 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3 text-sm font-bold text-black hover:bg-zinc-200"><DownloadIcon />تحميل APK</a><button type="button" onClick={() => setSelected(null)} className="rounded-xl border border-zinc-800 px-5 py-3 text-sm font-bold text-white hover:border-white">إغلاق</button></div>
        </div>
      </div>}
    </main>
  );
}
