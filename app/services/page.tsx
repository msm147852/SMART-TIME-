const features = [
  {
    title: "المالية",
    description: "تابع مصروفاتك وميزانيتك وقراراتك المالية في مكان واحد.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
        <path d="M3 10.5 12 4l9 6.5" />
        <path d="M5.5 9.5V20h13V9.5" />
        <path d="M8.5 20v-5h7v5M8 11.5h.01M12 11.5h.01M16 11.5h.01" />
      </svg>
    ),
  },
  {
    title: "التذكيرات",
    description: "لا تفوّت مهمة أو موعدًا مهمًا مع تذكيرات واضحة وفي الوقت المناسب.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9Z" />
        <path d="M10 21h4" />
      </svg>
    ),
  },
  {
    title: "التقويم",
    description: "نظّم يومك، خطط أسبوعك، وشاهد كل التزاماتك في صورة واحدة.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
        <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
        <path d="M8 3v4M16 3v4M3.5 10h17M8 14h.01M12 14h.01M16 14h.01M8 17.5h.01M12 17.5h.01" />
      </svg>
    ),
  },
  {
    title: "AI Assistant",
    description: "مساعد ذكي يفهم طلباتك ويحوّلها إلى إجراءات منظمة بصيغة JSON موثوقة.",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="h-7 w-7" aria-hidden="true">
        <path d="M12 3.5 13.8 9l5.7 1.8-5.7 1.8-1.8 5.9-1.8-5.9-5.7-1.8L10.2 9 12 3.5Z" />
        <path d="m18.5 16 .7 2.3 2.3.7-2.3.7-.7 2.3-.7-2.3-2.3-.7 2.3-.7.7-2.3Z" />
      </svg>
    ),
  },
];

const stats = [
  ["746", "مثال تدريب"],
  ["300", "Finance"],
  ["150", "Reminder"],
  ["150", "Calendar"],
  ["100", "Queries"],
  ["32", "Unsupported"],
  ["14", "Clarification"],
];

export default function ServicesPage() {
  return (
    <main dir="rtl" className="min-h-screen overflow-hidden bg-[#0a0a0a] text-white selection:bg-white selection:text-black">
      <section className="relative isolate">
        <div className="absolute inset-x-0 top-0 -z-10 h-[620px] bg-[radial-gradient(circle_at_50%_0%,rgba(255,255,255,0.12),transparent_48%)]" />
        <div className="mx-auto flex min-h-[680px] max-w-7xl flex-col items-center justify-center px-6 py-24 text-center sm:px-8 lg:px-12">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-4 py-2 text-sm text-white/70 backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 shadow-[0_0_14px_rgba(52,211,153,0.8)]" />
            ذكاء محلي • JSON-Only • جاهز للاستخدام
          </div>

          <h1 className="max-w-5xl text-5xl font-black tracking-tight sm:text-6xl lg:text-8xl">
            SMART TIME
          </h1>
          <p className="mt-5 max-w-3xl text-2xl font-bold leading-relaxed text-white/90 sm:text-3xl">
            نظام إدارة وقت وفلوس بالعربي
          </p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-white/55 sm:text-lg">
            مكان واحد يساعدك تدير يومك، فلوسك، مواعيدك وتتعامل مع مساعد AI
            يفهم طلباتك ويحوّلها إلى إجراءات منظمة.
          </p>

          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
              Qwen3-4B
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
              LoRA r=64 · alpha=128
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
              JSON-Only
            </span>
            <span className="rounded-full border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-white/75">
              95%+ schema-valid
            </span>
          </div>

          <a href="/services/smart-ai"
            className="mt-10 inline-flex items-center gap-3 rounded-2xl bg-white px-7 py-4 text-base font-bold text-black transition hover:-translate-y-0.5 hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
          >
            جرب الـ AI Service
            <span aria-hidden="true">←</span>
          </a>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
        <div className="mb-10">
          <p className="text-sm font-semibold text-white/45">كل ما تحتاجه في مكان واحد</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">أدوات SMART TIME</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {features.map((feature) => (
            <article
              key={feature.title}
              className="group rounded-2xl border border-white/10 bg-white/[0.035] p-6 transition duration-300 hover:-translate-y-1 hover:border-white/20 hover:bg-white/[0.06]"
            >
              <div className="mb-8 flex h-14 w-14 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.06] text-white/85 transition group-hover:bg-white group-hover:text-black">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold">{feature.title}</h3>
              <p className="mt-3 text-sm leading-7 text-white/50">{feature.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto max-w-7xl px-6 py-20 sm:px-8 lg:px-12">
          <div className="mb-10 text-center">
            <p className="text-sm font-semibold text-white/45">أرقام حقيقية من المشروع</p>
            <h2 className="mt-2 text-3xl font-black tracking-tight sm:text-4xl">بُني على بيانات فعلية</h2>
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {stats.map(([value, label]) => (
              <div key={label} className="rounded-2xl border border-white/10 bg-[#0a0a0a] p-5 text-center">
                <div className="text-2xl font-black tracking-tight sm:text-3xl">{value}</div>
                <div className="mt-2 text-xs font-medium text-white/45 sm:text-sm">{label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 py-24 text-center sm:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl rounded-3xl border border-white/10 bg-white/[0.035] px-6 py-12 sm:px-12">
          <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-black">
            <span className="text-lg font-black">AI</span>
          </div>
          <h2 className="text-3xl font-black sm:text-4xl">جاهز تخلي الـ AI يشتغل معاك؟</h2>
          <p className="mx-auto mt-4 max-w-xl text-sm leading-7 text-white/50 sm:text-base">
            جرّب خدمة SMART TIME AI وشوف كيف يتحول طلبك الطبيعي إلى استجابة منظمة وقابلة للتنفيذ.
          </p>
          <a href="/services/smart-ai"
            className="mt-8 inline-flex rounded-2xl border border-white/15 bg-white px-7 py-4 font-bold text-black transition hover:bg-white/90 focus:outline-none focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-[#0a0a0a]"
          >
            جرب الـ AI Service
          </a>
        </div>
      </section>
    </main>
  );
}
