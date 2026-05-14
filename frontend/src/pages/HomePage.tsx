import { Link } from 'react-router-dom'

const modules = [
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
        <circle cx="12" cy="12" r="3"/>
      </svg>
    ),
    title: 'Симулятор',
    desc: 'Загрузи изображение и посмотри как его видят люди с нарушениями зрения',
    href: '/simulator',
    color: 'from-violet-500 to-purple-600',
    bg: 'bg-violet-50',
    text: 'text-violet-700',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <circle cx="13.5" cy="6.5" r="2.5"/>
        <circle cx="6.5" cy="17.5" r="2.5"/>
        <circle cx="17.5" cy="17.5" r="2.5"/>
        <line x1="13.5" y1="9" x2="6.5" y2="15"/>
        <line x1="13.5" y1="9" x2="17.5" y2="15"/>
      </svg>
    ),
    title: 'Конструктор',
    desc: 'Создай доступную цветовую палитру с автоматической проверкой контраста WCAG',
    href: '/constructor',
    color: 'from-blue-500 to-primary-600',
    bg: 'bg-blue-50',
    text: 'text-blue-700',
  },
  {
    icon: (
      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
        <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
      </svg>
    ),
    title: 'Библиотека',
    desc: 'Исследуй готовые палитры сообщества, фильтруй по уровню WCAG и цветовым тонам',
    href: '/library',
    color: 'from-emerald-500 to-teal-600',
    bg: 'bg-emerald-50',
    text: 'text-emerald-700',
  },
]

const beforeAfter = [
  {
    label: 'Дейтеранопия',
    desc: 'Нарушение восприятия зелёного цвета',
    original: ['#E53E3E', '#38A169', '#3182CE'],
    simulated: ['#9B7B00', '#7B7B00', '#3182CE'],
  },
  {
    label: 'Низкий контраст',
    desc: 'Текст неразличим на фоне',
    original: ['#1A202C', '#E2E8F0'],
    simulated: ['#A0AEC0', '#E2E8F0'],
  },
]

const stats = [
  { value: '15%', label: 'людей имеют нарушения зрения' },
  { value: 'WCAG 2.1', label: 'международный стандарт доступности' },
  { value: '4.5:1', label: 'минимальный контраст текста (AA)' },
]

export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden bg-gradient-to-br from-primary-950 via-primary-900 to-primary-800 py-24 md:py-32">
        {/* Decoration */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
          <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-primary-700/30 blur-3xl"/>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-accent-500/20 blur-3xl"/>
        </div>

        <div className="page-container relative">
          <div className="max-w-3xl">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 text-white/80 text-sm font-medium mb-8">
              <span className="w-2 h-2 rounded-full bg-accent-400 animate-pulse-slow"/>
              WCAG 2.1 · AA/AAA совместимость
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6">
              Делай интерфейсы<br/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-400 to-blue-400">
                доступными для всех
              </span>
            </h1>

            <p className="text-lg md:text-xl text-white/70 mb-10 max-w-2xl leading-relaxed">
              Симулируй нарушения зрения, проверяй контраст и создавай цветовые палитры,
              которые соответствуют стандарту WCAG 2.1 — всё в одном месте.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/simulator" className="btn bg-white text-primary-900 hover:bg-white/90 active:scale-95 text-base px-6 py-3">
                Попробовать симулятор
              </Link>
              <Link to="/library" className="btn bg-white/10 text-white hover:bg-white/20 active:scale-95 text-base px-6 py-3">
                Смотреть библиотеку
              </Link>
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-1 sm:grid-cols-3 gap-6">
            {stats.map(s => (
              <div key={s.value} className="bg-white/10 rounded-2xl p-5 backdrop-blur-sm">
                <div className="text-2xl font-bold text-white mb-1">{s.value}</div>
                <div className="text-sm text-white/60">{s.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Modules */}
      <section className="py-20 page-container">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold text-surface-900 mb-4">Три инструмента доступности</h2>
          <p className="text-surface-500 text-lg max-w-2xl mx-auto">
            Полный набор для дизайнеров и разработчиков, которые заботятся о каждом пользователе
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {modules.map(m => (
            <Link key={m.href} to={m.href}
              className="card p-6 group hover:shadow-lg hover:-translate-y-1 transition-all duration-300 flex flex-col">
              <div className={`w-14 h-14 rounded-2xl ${m.bg} ${m.text} flex items-center justify-center mb-5 group-hover:scale-110 transition-transform`}>
                {m.icon}
              </div>
              <h3 className="text-xl font-bold text-surface-900 mb-2">{m.title}</h3>
              <p className="text-surface-500 text-sm leading-relaxed flex-1">{m.desc}</p>
              <div className={`mt-4 flex items-center gap-1 text-sm font-semibold ${m.text}`}>
                Открыть
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"
                  className="group-hover:translate-x-1 transition-transform">
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Before / After */}
      <section className="py-20 bg-surface-100">
        <div className="page-container">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-surface-900 mb-4">До и после симуляции</h2>
            <p className="text-surface-500 text-lg">Посмотри как меняется восприятие цветов при разных нарушениях зрения</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {beforeAfter.map(item => (
              <div key={item.label} className="card overflow-hidden">
                <div className="p-5 border-b border-surface-200">
                  <h3 className="font-semibold text-surface-900">{item.label}</h3>
                  <p className="text-sm text-surface-500 mt-0.5">{item.desc}</p>
                </div>
                <div className="grid grid-cols-2 divide-x divide-surface-200">
                  <div className="p-5">
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">Оригинал</p>
                    <div className="flex gap-2">
                      {item.original.map((c, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg shadow-sm" style={{ backgroundColor: c }}
                          title={c} aria-label={`Цвет ${c}`}/>
                      ))}
                    </div>
                  </div>
                  <div className="p-5">
                    <p className="text-xs font-semibold text-surface-400 uppercase tracking-wide mb-3">Симуляция</p>
                    <div className="flex gap-2">
                      {item.simulated.map((c, i) => (
                        <div key={i} className="w-10 h-10 rounded-lg shadow-sm" style={{ backgroundColor: c }}
                          title={c} aria-label={`Симулированный цвет ${c}`}/>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-8 text-center">
            <Link to="/simulator" className="btn-primary text-base px-8 py-3">
              Проверить своё изображение
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}