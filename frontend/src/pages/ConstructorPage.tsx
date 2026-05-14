import { useState, useCallback } from 'react'
import { useAuthStore } from '../store/authStore'
import { palettesApi } from '../lib/api'
import { Link } from 'react-router-dom'

// ── WCAG утилиты ──────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ]
}

function rgbToHex(r: number, g: number, b: number) {
  return '#' + [r, g, b].map(v => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')
}

function relativeLuminance(r: number, g: number, b: number) {
  return [r, g, b].reduce((acc, c, i) => {
    const s = c / 255
    const lin = s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
    return acc + lin * [0.2126, 0.7152, 0.0722][i]
  }, 0)
}

function contrastRatio(hex1: string, hex2: string) {
  const [r1, g1, b1] = hexToRgb(hex1)
  const [r2, g2, b2] = hexToRgb(hex2)
  const L1 = relativeLuminance(r1, g1, b1)
  const L2 = relativeLuminance(r2, g2, b2)
  const lighter = Math.max(L1, L2)
  const darker = Math.min(L1, L2)
  return (lighter + 0.05) / (darker + 0.05)
}

function wcagLevel(ratio: number) {
  if (ratio >= 7) return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3) return 'A'
  return 'FAIL'
}

// Находит ближайший цвет, который даёт контраст ≥ 4.5 с bg
function findFixedColor(fg: string, bg: string): string {
  const [r, g, b] = hexToRgb(fg)
  const bgLum = relativeLuminance(...hexToRgb(bg))
  // Пробуем осветлять и затемнять
  for (let step = 5; step <= 255; step += 5) {
    for (const direction of [1, -1]) {
      const nr = r + direction * step
      const ng = g + direction * step
      const nb = b + direction * step
      if (nr < 0 || nr > 255 || ng < 0 || ng > 255 || nb < 0 || nb > 255) continue
      const candidate = rgbToHex(nr, ng, nb)
      const lum = relativeLuminance(nr, ng, nb)
      const lighter = Math.max(lum, bgLum)
      const darker = Math.min(lum, bgLum)
      const ratio = (lighter + 0.05) / (darker + 0.05)
      if (ratio >= 4.5) return candidate
    }
  }
  return bgLum > 0.5 ? '#000000' : '#ffffff'
}

// ── Экспорт ───────────────────────────────────────────────────
function exportCSS(colors: string[], name: string) {
  const vars = colors.map((c, i) => `  --color-${i === 0 ? 'primary' : i === 1 ? 'background' : `accent-${i - 1}`}: ${c};`).join('\n')
  return `/* ${name} — A11y Platform */\n:root {\n${vars}\n}`
}

function exportSCSS(colors: string[], name: string) {
  const vars = colors.map((c, i) => `$color-${i === 0 ? 'primary' : i === 1 ? 'background' : `accent-${i - 1}`}: ${c};`).join('\n')
  return `// ${name} — A11y Platform\n${vars}`
}

function exportJSON(colors: string[], name: string) {
  const obj: Record<string, string> = {}
  colors.forEach((c, i) => {
    obj[i === 0 ? 'primary' : i === 1 ? 'background' : `accent${i - 1}`] = c
  })
  return JSON.stringify({ name, colors: obj, wcag: '2.1' }, null, 2)
}

// ── Константы ─────────────────────────────────────────────────
const PRESET_PALETTES = [
  { name: 'Ocean', colors: ['#0369a1', '#e0f2fe', '#38bdf8', '#0284c7', '#ffffff'] },
  { name: 'Forest', colors: ['#14532d', '#dcfce7', '#4ade80', '#15803d', '#ffffff'] },
  { name: 'Sunset', colors: ['#7c2d12', '#ffedd5', '#fb923c', '#c2410c', '#ffffff'] },
  { name: 'Minimal', colors: ['#0f172a', '#f1f5f9', '#64748b', '#334155', '#ffffff'] },
]

const WCAG_BADGE: Record<string, string> = {
  AAA: 'badge-aaa', AA: 'badge-aa', A: 'badge-a', FAIL: 'badge-fail'
}

type ExportFormat = 'css' | 'scss' | 'json'

export default function ConstructorPage() {
  const { isAuth } = useAuthStore()
  const [colors, setColors] = useState(['#1a44f5', '#ffffff'])
  const [paletteName, setPaletteName] = useState('')
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState('')

  // Export
  const [exportFormat, setExportFormat] = useState<ExportFormat>('css')
  const [exportCopied, setExportCopied] = useState(false)
  const [showExport, setShowExport] = useState(false)

  const addColor = () => setColors(c => [...c, '#cccccc'])
  const removeColor = (i: number) => setColors(c => c.filter((_, j) => j !== i))
  const updateColor = (i: number, val: string) => setColors(c => c.map((v, j) => j === i ? val : v))
  const applyPreset = (preset: typeof PRESET_PALETTES[0]) => setColors(preset.colors)

  const mainContrast = colors.length >= 2 ? contrastRatio(colors[0], colors[1]) : null
  const level = mainContrast ? wcagLevel(mainContrast) : null
  const fixedColor = (mainContrast && mainContrast < 4.5 && colors.length >= 2)
    ? findFixedColor(colors[0], colors[1])
    : null

  const getExportCode = () => {
    const name = paletteName || 'Моя палитра'
    if (exportFormat === 'css') return exportCSS(colors, name)
    if (exportFormat === 'scss') return exportSCSS(colors, name)
    return exportJSON(colors, name)
  }

  const handleCopyExport = () => {
    navigator.clipboard.writeText(getExportCode())
    setExportCopied(true)
    setTimeout(() => setExportCopied(false), 2000)
  }

  const handleDownloadExport = () => {
    const ext = exportFormat === 'json' ? 'json' : exportFormat === 'scss' ? 'scss' : 'css'
    const blob = new Blob([getExportCode()], { type: 'text/plain' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `${(paletteName || 'palette').replace(/\s+/g, '-').toLowerCase()}.${ext}`
    a.click()
  }

  const handleSave = useCallback(async () => {
    if (!paletteName.trim()) { setError('Введи название палитры'); return }
    setSaving(true); setError('')
    try {
      await palettesApi.create({
        name: paletteName,
        baseColor: colors[0],
        colors,
        wcagLevel: level || 'FAIL',
        tags: [],
      })
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch {
      setError('Ошибка при сохранении')
    } finally {
      setSaving(false)
    }
  }, [paletteName, colors, level])

  return (
    <div className="py-10">
      <div className="page-container">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-surface-900 mb-2">Конструктор палитр</h1>
          <p className="text-surface-500">Создай цветовую палитру с автоматической проверкой WCAG</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* ── Левая панель ── */}
          <div className="space-y-5">

            {/* Пресеты */}
            <div className="card p-5">
              <h2 className="font-semibold text-surface-900 mb-3">Готовые наборы</h2>
              <div className="space-y-2">
                {PRESET_PALETTES.map(p => (
                  <button key={p.name} onClick={() => applyPreset(p)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-surface-50 transition-colors text-left">
                    <div className="flex gap-1">
                      {p.colors.slice(0, 4).map((c, i) => (
                        <div key={i} className="w-5 h-5 rounded-full border border-black/10" style={{ backgroundColor: c }}/>
                      ))}
                    </div>
                    <span className="text-sm font-medium text-surface-700">{p.name}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Контраст + рекомендации */}
            {mainContrast && (
              <div className="card p-5">
                <h2 className="font-semibold text-surface-900 mb-3">Контраст (цвет 1 / цвет 2)</h2>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-3xl font-bold text-surface-900 font-mono">{mainContrast.toFixed(2)}</span>
                  <span className={`badge text-sm px-3 py-1 ${WCAG_BADGE[level!]}`}>{level}</span>
                </div>

                {/* Progress bar */}
                <div className="mb-4">
                  <div className="w-full h-2 bg-surface-100 rounded-full overflow-hidden">
                    <div className={`h-full rounded-full transition-all duration-500 ${
                      mainContrast >= 7 ? 'bg-blue-500' : mainContrast >= 4.5 ? 'bg-green-500' :
                      mainContrast >= 3 ? 'bg-yellow-500' : 'bg-red-500'
                    }`} style={{ width: `${Math.min((mainContrast / 21) * 100, 100)}%` }}/>
                  </div>
                  <div className="flex justify-between text-xs text-surface-400 mt-1">
                    <span>1:1</span><span>4.5 AA</span><span>7 AAA</span><span>21:1</span>
                  </div>
                </div>

                <div className="space-y-1.5 text-sm mb-4">
                  {[['Обычный текст (AA)', 4.5], ['Крупный текст (AA)', 3], ['Улучшенный (AAA)', 7]].map(([label, threshold]) => (
                    <div key={label as string} className="flex justify-between">
                      <span className="text-surface-500">{label as string}</span>
                      <span className={mainContrast >= (threshold as number) ? 'text-green-600 font-semibold' : 'text-red-500'}>
                        {mainContrast >= (threshold as number) ? `✓ ${threshold}:1` : `✗ ${threshold}:1`}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Рекомендация */}
                <div className={`rounded-xl p-3 text-sm ${
                  mainContrast >= 7 ? 'bg-blue-50 text-blue-800' :
                  mainContrast >= 4.5 ? 'bg-green-50 text-green-800' :
                  mainContrast >= 3 ? 'bg-yellow-50 text-yellow-800' : 'bg-red-50 text-red-800'
                }`}>
                  {mainContrast >= 7 && <><strong>✨ Отлично!</strong> Соответствует AAA. Подходит для любого текста.</>}
                  {mainContrast >= 4.5 && mainContrast < 7 && <><strong>✅ Хорошо!</strong> Уровень AA пройден. Для AAA нужно 7:1 — сделай цвета контрастнее.</>}
                  {mainContrast >= 3 && mainContrast < 4.5 && <><strong>⚠️ Частично.</strong> Только для крупного текста (18px+). Обычный текст нечитаем — нужно минимум 4.5:1.</>}
                  {mainContrast < 3 && <><strong>❌ Не проходит.</strong> Контраст {mainContrast.toFixed(1)}:1 недостаточен для любого текста. Измени цвета.</>}
                </div>

                {/* ── Исправленный цвет ── */}
                {fixedColor && (
                  <div className="mt-4 rounded-xl border-2 border-dashed border-primary-200 p-4 bg-primary-50">
                    <p className="text-sm font-semibold text-primary-900 mb-2">🔧 Ближайший проходящий цвет:</p>
                    <div className="flex items-center gap-3">
                      <div className="flex gap-2 items-center">
                        <div className="w-10 h-10 rounded-lg border border-black/10 shadow-sm"
                          style={{ backgroundColor: colors[0] }} title="Текущий цвет"/>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#6366f1" strokeWidth="2.5">
                          <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                        </svg>
                        <div className="w-10 h-10 rounded-lg border border-black/10 shadow-sm"
                          style={{ backgroundColor: fixedColor }} title="Исправленный цвет"/>
                      </div>
                      <div className="flex-1">
                        <p className="text-xs font-mono text-primary-800">{fixedColor}</p>
                        <p className="text-xs text-primary-600">
                          Контраст: {contrastRatio(fixedColor, colors[1]).toFixed(2)}:1 ✓ AA
                        </p>
                      </div>
                      <button
                        onClick={() => updateColor(0, fixedColor)}
                        className="btn-primary text-xs py-1.5 px-3 shrink-0">
                        Применить
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* ── Экспорт ── */}
            <div className="card p-5">
              <button
                onClick={() => setShowExport(!showExport)}
                className="w-full flex items-center justify-between font-semibold text-surface-900">
                <span>📤 Экспорт палитры</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
                  className={`transition-transform ${showExport ? 'rotate-180' : ''}`}>
                  <polyline points="6 9 12 15 18 9"/>
                </svg>
              </button>

              {showExport && (
                <div className="mt-4 space-y-3">
                  {/* Format tabs */}
                  <div className="flex rounded-lg bg-surface-100 p-1 gap-1" role="tablist">
                    {(['css', 'scss', 'json'] as ExportFormat[]).map(fmt => (
                      <button key={fmt} role="tab" aria-selected={exportFormat === fmt}
                        onClick={() => setExportFormat(fmt)}
                        className={`flex-1 py-1.5 rounded-md text-xs font-bold uppercase tracking-wide transition-all ${
                          exportFormat === fmt ? 'bg-white text-surface-900 shadow-sm' : 'text-surface-500 hover:text-surface-700'
                        }`}>
                        {fmt}
                      </button>
                    ))}
                  </div>

                  {/* Code preview */}
                  <div className="relative">
                    <pre className="bg-surface-900 text-green-400 rounded-xl p-4 text-xs overflow-x-auto max-h-48 font-mono leading-relaxed">
                      {getExportCode()}
                    </pre>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2">
                    <button onClick={handleCopyExport}
                      className={`flex-1 btn text-xs py-2 transition-all ${exportCopied ? 'bg-green-600 text-white' : 'btn-secondary'}`}>
                      {exportCopied ? '✓ Скопировано!' : '📋 Копировать'}
                    </button>
                    <button onClick={handleDownloadExport} className="flex-1 btn-primary text-xs py-2">
                      ⬇ Скачать .{exportFormat}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Сохранить */}
            {isAuth ? (
              <div className="card p-5">
                <h2 className="font-semibold text-surface-900 mb-3">Сохранить палитру</h2>
                <input className="input mb-3" placeholder="Название палитры"
                  value={paletteName} onChange={e => { setPaletteName(e.target.value); setError('') }}/>
                {error && <p className="text-red-600 text-sm mb-2">{error}</p>}
                {saved && <p className="text-green-600 text-sm mb-2">✓ Сохранено!</p>}
                <button onClick={handleSave} disabled={saving} className="btn-primary w-full">
                  {saving ? 'Сохранение...' : 'Сохранить'}
                </button>
              </div>
            ) : (
              <div className="card p-5 bg-surface-50">
                <p className="text-sm text-surface-600 mb-3">Войди, чтобы сохранять и делиться палитрами</p>
                <Link to="/auth" className="btn-primary w-full text-center block">Войти</Link>
              </div>
            )}
          </div>

          {/* ── Правая панель ── */}
          <div className="lg:col-span-2 space-y-5">
            {/* Цвета */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-semibold text-surface-900">Цвета палитры</h2>
                <button onClick={addColor} disabled={colors.length >= 8} className="btn-secondary text-sm">
                  + Добавить цвет
                </button>
              </div>
              <div className="space-y-3">
                {colors.map((color, i) => {
                  const pairContrast = i > 0 ? contrastRatio(colors[0], color) : null
                  const pairLevel = pairContrast ? wcagLevel(pairContrast) : null
                  const pairFixed = pairContrast && pairContrast < 4.5 && i > 0
                    ? findFixedColor(color, colors[0]) : null

                  return (
                    <div key={i} className="space-y-2">
                      <div className="flex items-center gap-3">
                        <input type="color" value={color} onChange={e => updateColor(i, e.target.value)}
                          className="w-12 h-12 rounded-xl cursor-pointer border-2 border-surface-200 p-0.5"
                          aria-label={`Цвет ${i + 1}`}/>
                        <input type="text" value={color}
                          onChange={e => /^#[0-9A-Fa-f]{0,6}$/.test(e.target.value) && updateColor(i, e.target.value)}
                          className="input font-mono text-sm w-32" aria-label={`HEX цвета ${i + 1}`}/>
                        <span className="text-sm text-surface-500 flex-1">
                          {i === 0 ? 'Основной' : i === 1 ? 'Фон' : `Цвет ${i + 1}`}
                        </span>
                        {pairContrast && (
                          <span className={`badge text-xs ${WCAG_BADGE[pairLevel!]}`}>
                            {pairContrast.toFixed(1)}
                          </span>
                        )}
                        {colors.length > 2 && (
                          <button onClick={() => removeColor(i)}
                            className="p-2 text-surface-400 hover:text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                            aria-label={`Удалить цвет ${i + 1}`}>
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2"/>
                            </svg>
                          </button>
                        )}
                      </div>

                      {/* Inline fix suggestion */}
                      {pairFixed && (
                        <div className="ml-14 flex items-center gap-2 text-xs bg-amber-50 border border-amber-200 rounded-lg px-3 py-2">
                          <span className="text-amber-700">Исправленный вариант:</span>
                          <div className="w-4 h-4 rounded border border-black/10" style={{ backgroundColor: pairFixed }}/>
                          <span className="font-mono text-amber-800">{pairFixed}</span>
                          <span className="text-amber-600">({contrastRatio(pairFixed, colors[0]).toFixed(1)}:1 ✓)</span>
                          <button onClick={() => updateColor(i, pairFixed)}
                            className="ml-auto text-amber-800 font-semibold hover:underline">
                            Применить
                          </button>
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Предпросмотр */}
            <div className="card p-5">
              <h2 className="font-semibold text-surface-900 mb-4">Предпросмотр</h2>
              <div className="flex h-20 rounded-xl overflow-hidden mb-4">
                {colors.map((c, i) => (
                  <div key={i} className="flex-1" style={{ backgroundColor: c }}/>
                ))}
              </div>
              <div className="rounded-xl p-5" style={{ backgroundColor: colors[1] || '#ffffff' }}>
                <h3 className="text-xl font-bold mb-2" style={{ color: colors[0] }}>Пример заголовка</h3>
                <p className="text-sm mb-1" style={{ color: colors[0] }}>Обычный текст на фоне</p>
                <p className="text-xs mb-3" style={{ color: colors[0] }}>Мелкий текст (12px)</p>
                <button className="px-4 py-2 rounded-lg text-sm font-semibold"
                  style={{ backgroundColor: colors[0], color: colors[1] || '#ffffff' }}>
                  Кнопка
                </button>
              </div>
            </div>

            {/* Матрица контраста */}
            {colors.length > 2 && (
              <div className="card p-5">
                <h2 className="font-semibold text-surface-900 mb-4">Матрица контраста</h2>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr>
                        <th className="w-8"/>
                        {colors.map((c, i) => (
                          <th key={i} className="pb-2">
                            <div className="w-6 h-6 rounded mx-auto border border-surface-200" style={{ backgroundColor: c }}/>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {colors.map((c1, i) => (
                        <tr key={i}>
                          <td className="pr-2">
                            <div className="w-6 h-6 rounded border border-surface-200" style={{ backgroundColor: c1 }}/>
                          </td>
                          {colors.map((c2, j) => {
                            if (i === j) return <td key={j} className="p-1 text-center text-surface-200">—</td>
                            const ratio = contrastRatio(c1, c2)
                            return (
                              <td key={j} className="p-1 text-center">
                                <span className={`badge text-xs ${WCAG_BADGE[wcagLevel(ratio)]}`}>
                                  {ratio.toFixed(1)}
                                </span>
                              </td>
                            )
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}