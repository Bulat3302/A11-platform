import { useState, useRef, useCallback, useEffect } from 'react'
import { useAuthStore } from '../store/authStore'
import { projectsApi } from '../lib/api'

const VISION_TYPES = [
  { id: 'normal', label: 'Нормальное зрение', desc: 'Без фильтра', filter: 'none' },
  { id: 'protanopia', label: 'Протанопия', desc: 'Нарушение восприятия красного', filter: 'url(#protanopia)' },
  { id: 'deuteranopia', label: 'Дейтеранопия', desc: 'Нарушение восприятия зелёного', filter: 'url(#deuteranopia)' },
  { id: 'tritanopia', label: 'Тританопия', desc: 'Нарушение восприятия синего', filter: 'url(#tritanopia)' },
  { id: 'achromatopsia', label: 'Ахроматопсия', desc: 'Полная цветовая слепота', filter: 'url(#achromatopsia)' },
  { id: 'lowcontrast', label: 'Низкий контраст', desc: 'Имитация плохого зрения', filter: 'url(#lowcontrast)' },
]

const SVG_FILTERS = `
<svg style="position:absolute;width:0;height:0" aria-hidden="true">
  <defs>
    <filter id="protanopia">
      <feColorMatrix type="matrix" values="0.567,0.433,0,0,0 0.558,0.442,0,0,0 0,0.242,0.758,0,0 0,0,0,1,0"/>
    </filter>
    <filter id="deuteranopia">
      <feColorMatrix type="matrix" values="0.625,0.375,0,0,0 0.7,0.3,0,0,0 0,0.3,0.7,0,0 0,0,0,1,0"/>
    </filter>
    <filter id="tritanopia">
      <feColorMatrix type="matrix" values="0.95,0.05,0,0,0 0,0.433,0.567,0,0 0,0.475,0.525,0,0 0,0,0,1,0"/>
    </filter>
    <filter id="achromatopsia">
      <feColorMatrix type="matrix" values="0.299,0.587,0.114,0,0 0.299,0.587,0.114,0,0 0.299,0.587,0.114,0,0 0,0,0,1,0"/>
    </filter>
    <filter id="lowcontrast">
      <feComponentTransfer>
        <feFuncR type="linear" slope="0.5" intercept="0.25"/>
        <feFuncG type="linear" slope="0.5" intercept="0.25"/>
        <feFuncB type="linear" slope="0.5" intercept="0.25"/>
      </feComponentTransfer>
    </filter>
  </defs>
</svg>
`

export default function SimulatorPage() {
  const { isAuth } = useAuthStore()
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [selected, setSelected] = useState('normal')
  const [intensity, setIntensity] = useState(100)
  const [dragging, setDragging] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  // Save to project
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [selectedProject, setSelectedProject] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (isAuth) {
      projectsApi.getAll().then(res => setProjects(res.data)).catch(() => {})
    }
  }, [isAuth])

  const handleFile = (file: File) => {
    if (!file.type.startsWith('image/')) return
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setSaved(false)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [])

  const handleSaveToProject = async () => {
    if (!selectedProject || !imageUrl) return
    setSaving(true)
    try {
      await projectsApi.createSimulation(selectedProject, {
        imageUrl,
        visionType: selected,
        intensity,
        results: { filter: selected, intensity },
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
    } finally {
      setSaving(false)
    }
  }

  const activeType = VISION_TYPES.find(v => v.id === selected)!

  return (
    <div className="py-10">
      <div dangerouslySetInnerHTML={{ __html: SVG_FILTERS }} />

      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Симулятор нарушений зрения</h1>
          <p className="text-surface-500">Загрузи изображение и посмотри как его видят люди с разными нарушениями зрения</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Sidebar */}
          <div className="space-y-5">
            <div className="card p-5">
              <h2 className="font-semibold text-surface-900 mb-3">Тип нарушения</h2>
              <div className="space-y-2" role="radiogroup" aria-label="Тип нарушения зрения">
                {VISION_TYPES.map(v => (
                  <button key={v.id} role="radio" aria-checked={selected === v.id}
                    onClick={() => setSelected(v.id)}
                    className={`w-full text-left px-4 py-3 rounded-xl border-2 transition-all ${
                      selected === v.id
                        ? 'border-primary-500 bg-primary-50'
                        : 'border-transparent bg-surface-50 hover:bg-surface-100'
                    }`}>
                    <div className="font-medium text-sm text-surface-900">{v.label}</div>
                    <div className="text-xs text-surface-500 mt-0.5">{v.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {selected !== 'normal' && (
              <div className="card p-5">
                <div className="flex justify-between items-center mb-3">
                  <h2 className="font-semibold text-surface-900">Интенсивность</h2>
                  <span className="text-sm font-mono text-primary-600">{intensity}%</span>
                </div>
                <input type="range" min={0} max={100} value={intensity}
                  onChange={e => setIntensity(Number(e.target.value))}
                  className="w-full accent-primary-600"
                  aria-label="Интенсивность фильтра" />
                <div className="flex justify-between text-xs text-surface-400 mt-1">
                  <span>Слабо</span><span>Полностью</span>
                </div>
              </div>
            )}

            {/* Save to project */}
            {isAuth && imageUrl && (
              <div className="card p-5">
                <h2 className="font-semibold text-surface-900 mb-3">💾 Сохранить в проект</h2>
                {projects.length === 0 ? (
                  <p className="text-sm text-surface-500">У тебя пока нет проектов. Создай проект в личном кабинете.</p>
                ) : (
                  <>
                    <select value={selectedProject} onChange={e => setSelectedProject(e.target.value)}
                      className="input mb-3 text-sm" aria-label="Выбрать проект">
                      <option value="">Выбери проект...</option>
                      {projects.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                    {saved && (
                      <p className="text-green-600 text-sm mb-2 flex items-center gap-1">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" aria-hidden="true">
                          <polyline points="20 6 9 17 4 12"/>
                        </svg>
                        Симуляция сохранена в проект!
                      </p>
                    )}
                    <button onClick={handleSaveToProject} disabled={!selectedProject || saving}
                      className="btn-primary w-full text-sm">
                      {saving ? 'Сохранение...' : 'Сохранить симуляцию'}
                    </button>
                  </>
                )}
              </div>
            )}

            <div className="card p-5 bg-primary-50 border-primary-100">
              <h2 className="font-semibold text-primary-900 mb-2 text-sm">💡 Что проверить</h2>
              <ul className="space-y-1.5 text-sm text-primary-700">
                <li>• Различимы ли кнопки и ссылки?</li>
                <li>• Читаем ли текст на фоне?</li>
                <li>• Понятны ли иконки без цвета?</li>
                <li>• Видна ли важная информация?</li>
              </ul>
            </div>
          </div>

          {/* Main */}
          <div className="lg:col-span-2 space-y-4">
            {!imageUrl ? (
              <div
                className={`card p-12 flex flex-col items-center justify-center text-center cursor-pointer border-2 border-dashed transition-all ${
                  dragging ? 'border-primary-400 bg-primary-50' : 'border-surface-200 hover:border-primary-300 hover:bg-surface-50'
                }`}
                onClick={() => fileRef.current?.click()}
                onDragOver={e => { e.preventDefault(); setDragging(true) }}
                onDragLeave={() => setDragging(false)}
                onDrop={onDrop}
                role="button" tabIndex={0}
                aria-label="Загрузить изображение"
                onKeyDown={e => e.key === 'Enter' && fileRef.current?.click()}
              >
                <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mb-4">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#3366ff" strokeWidth="1.8" aria-hidden="true">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                </div>
                <p className="font-semibold text-surface-900 mb-1">Перетащи изображение или нажми</p>
                <p className="text-sm text-surface-400">PNG, JPG, WebP до 10 МБ</p>
                <input ref={fileRef} type="file" accept="image/*" className="hidden"
                  onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
                  aria-label="Выбрать файл изображения" />
              </div>
            ) : (
              <>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-surface-100">
                      <span className="text-sm font-semibold text-surface-600">Оригинал</span>
                    </div>
                    <div className="p-2">
                      <img src={imageUrl} alt="Оригинальное изображение"
                        className="w-full h-64 object-contain rounded-lg" />
                    </div>
                  </div>
                  <div className="card overflow-hidden">
                    <div className="px-4 py-3 border-b border-surface-100">
                      <span className="text-sm font-semibold text-primary-700">{activeType.label}</span>
                    </div>
                    <div className="p-2">
                      <img src={imageUrl}
                        alt={`Изображение с симуляцией: ${activeType.label}`}
                        className="w-full h-64 object-contain rounded-lg"
                        style={{
                          filter: selected === 'normal' ? 'none' : activeType.filter,
                          opacity: selected === 'normal' ? 1 : 0.5 + (intensity / 200),
                        }} />
                    </div>
                  </div>
                </div>
                <div className="flex justify-end">
                  <button onClick={() => { setImageUrl(null); setSelected('normal'); setSaved(false) }}
                    className="btn-secondary text-sm">
                    Загрузить другое
                  </button>
                </div>
              </>
            )}

            <div className="card p-5 bg-amber-50 border-amber-100">
              <p className="text-sm text-amber-800">
                <strong>По стандарту WCAG 2.1</strong> интерфейс не должен передавать информацию
                исключительно через цвет (критерий 1.4.1). Используй форму, паттерн или текст
                в дополнение к цветовому кодированию.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}