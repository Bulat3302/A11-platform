import { useState, useRef, useCallback } from 'react'

// ── WCAG helpers ────────────────────────────────────────────
function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const n = parseInt(clean, 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}

function relativeLuminance(hex: string): number {
  const rgb = hexToRgb(hex).map(v => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * rgb[0] + 0.7152 * rgb[1] + 0.0722 * rgb[2]
}

function contrastRatio(a: string, b: string): number {
  const L1 = relativeLuminance(a)
  const L2 = relativeLuminance(b)
  const lighter = Math.max(L1, L2)
  const darker  = Math.min(L1, L2)
  return parseFloat(((lighter + 0.05) / (darker + 0.05)).toFixed(2))
}

function wcagLevel(ratio: number): 'AAA' | 'AA' | 'A' | 'FAIL' {
  if (ratio >= 7)   return 'AAA'
  if (ratio >= 4.5) return 'AA'
  if (ratio >= 3)   return 'A'
  return 'FAIL'
}

// ── Canvas color extraction ──────────────────────────────────
function extractColorsFromCanvas(canvas: HTMLCanvasElement, maxColors = 12): string[] {
  const ctx = canvas.getContext('2d')!
  const { width, height } = canvas
  const data = ctx.getImageData(0, 0, width, height).data
  const colorMap: Record<string, number> = {}

  const step = Math.max(1, Math.floor((width * height) / 8000))
  for (let i = 0; i < data.length; i += step * 4) {
    const r = Math.round(data[i]     / 32) * 32
    const g = Math.round(data[i + 1] / 32) * 32
    const b = Math.round(data[i + 2] / 32) * 32
    if (data[i + 3] < 128) continue
    const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`
    colorMap[hex] = (colorMap[hex] ?? 0) + 1
  }

  return Object.entries(colorMap)
    .sort((a, b) => b[1] - a[1])
    .slice(0, maxColors)
    .map(([hex]) => hex)
}

// ── Types ────────────────────────────────────────────────────
interface ColorPair {
  fg: string
  bg: string
  ratio: number
  level: 'AAA' | 'AA' | 'A' | 'FAIL'
}

type FilterLevel = 'ALL' | 'AAA' | 'AA' | 'A' | 'FAIL'

const LEVEL_COLORS: Record<string, string> = {
  AAA:  'bg-emerald-500 text-white',
  AA:   'bg-green-500 text-white',
  A:    'bg-yellow-500 text-white',
  FAIL: 'bg-red-500 text-white',
}

const LEVEL_BORDER: Record<string, string> = {
  AAA:  'border-emerald-400',
  AA:   'border-green-400',
  A:    'border-yellow-400',
  FAIL: 'border-red-400',
}

// ── Component ────────────────────────────────────────────────
export default function AuditorPage() {
  const [colors, setColors]       = useState<string[]>([])
  const [pairs, setPairs]         = useState<ColorPair[]>([])
  const [filter, setFilter]       = useState<FilterLevel>('ALL')
  const [imageUrl, setImageUrl]   = useState<string>('')
  const [isDragging, setIsDragging] = useState(false)
  const [fileName, setFileName]   = useState('')
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // ── Process image ──────────────────────────────────────────
  const processImage = useCallback((file: File) => {
    setFileName(file.name)
    const url = URL.createObjectURL(file)
    setImageUrl(url)
    setColors([])
    setPairs([])

    const img = new Image()
    img.onload = () => {
      const canvas = canvasRef.current!
      const MAX = 600
      const scale = Math.min(1, MAX / Math.max(img.width, img.height))
      canvas.width  = Math.floor(img.width  * scale)
      canvas.height = Math.floor(img.height * scale)
      canvas.getContext('2d')!.drawImage(img, 0, 0, canvas.width, canvas.height)

      const extracted = extractColorsFromCanvas(canvas)
      setColors(extracted)

      const allPairs: ColorPair[] = []
      for (let i = 0; i < extracted.length; i++) {
        for (let j = i + 1; j < extracted.length; j++) {
          const ratio = contrastRatio(extracted[i], extracted[j])
          allPairs.push({ fg: extracted[i], bg: extracted[j], ratio, level: wcagLevel(ratio) })
        }
      }
      allPairs.sort((a, b) => b.ratio - a.ratio)
      setPairs(allPairs)
      URL.revokeObjectURL(url)
    }
    img.src = url
  }, [])

  const handleFile = (file: File | undefined) => {
    if (!file) return
    if (!file.type.startsWith('image/')) return
    processImage(file)
  }

  // drag & drop
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    handleFile(e.dataTransfer.files[0])
  }

  // ── Score ──────────────────────────────────────────────────
  const totalPairs   = pairs.length
  const passingPairs = pairs.filter(p => p.level !== 'FAIL').length
  const score        = totalPairs > 0 ? Math.round((passingPairs / totalPairs) * 100) : 0
  const scoreColor   = score >= 80 ? 'text-emerald-400' : score >= 50 ? 'text-yellow-400' : 'text-red-400'

  const counts: Record<FilterLevel, number> = {
    ALL:  totalPairs,
    AAA:  pairs.filter(p => p.level === 'AAA').length,
    AA:   pairs.filter(p => p.level === 'AA').length,
    A:    pairs.filter(p => p.level === 'A').length,
    FAIL: pairs.filter(p => p.level === 'FAIL').length,
  }

  const filteredPairs = filter === 'ALL' ? pairs : pairs.filter(p => p.level === filter)

  // ── Recommendations ────────────────────────────────────────
  const failPairs = pairs.filter(p => p.level === 'FAIL')
  const recommendations: string[] = []
  if (failPairs.length > 0) {
    recommendations.push(`Обнаружено ${failPairs.length} пар${failPairs.length === 1 ? 'а' : 'ы'} с недостаточным контрастом (FAIL)`)
    const darkFails = failPairs.filter(p => {
      const [r, g, b] = hexToRgb(p.bg)
      return (0.2126*r + 0.7152*g + 0.0722*b) / 255 < 0.18
    })
    if (darkFails.length > 0)
      recommendations.push('Тёмные фоны с похожими тёмными текстами — используйте более светлый текст')
    const lightFails = failPairs.filter(p => {
      const [r, g, b] = hexToRgb(p.bg)
      return (0.2126*r + 0.7152*g + 0.0722*b) / 255 > 0.85
    })
    if (lightFails.length > 0)
      recommendations.push('Светлые фоны с похожими светлыми текстами — используйте более тёмный текст')
  }
  if (score === 100)
    recommendations.push('Все цветовые пары соответствуют минимальному стандарту WCAG 2.1')
  if (counts.AAA > 0)
    recommendations.push(`${counts.AAA} пар${counts.AAA === 1 ? 'а' : ''} достигают наивысшего уровня AAA (≥7:1)`)

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-4 py-10">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">WCAG Аудитор</h1>
          <p className="text-surface-400">
            Загрузите скриншот интерфейса — платформа извлечёт цвета и проверит все пары на соответствие стандарту WCAG 2.1.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Upload zone (left column) ── */}
          <div className="lg:col-span-1 space-y-4">

            {/* Drop zone */}
            <div
              className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
                ${isDragging
                  ? 'border-primary-500 bg-primary-500/10'
                  : 'border-surface-600 hover:border-primary-500/60 hover:bg-surface-700/30'
                }`}
              onClick={() => fileInputRef.current?.click()}
              onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={onDrop}
            >
              <div className="text-4xl mb-3">🖼️</div>
              <p className="text-surface-300 font-medium mb-1">
                {fileName || 'Перетащите скриншот сюда'}
              </p>
              <p className="text-surface-500 text-sm">
                или <span className="text-primary-400 underline">выберите файл</span>
              </p>
              <p className="text-surface-600 text-xs mt-2">PNG, JPG, WebP</p>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => handleFile(e.target.files?.[0])}
              />
            </div>

            {/* Hidden canvas */}
            <canvas ref={canvasRef} className="hidden" />

            {/* Image preview */}
            {imageUrl && (
              <div className="rounded-xl overflow-hidden border border-surface-700">
                <img src={imageUrl} alt="preview" className="w-full object-cover max-h-52" />
              </div>
            )}

            {/* Extracted colors */}
            {colors.length > 0 && (
              <div className="bg-surface-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-surface-400 mb-3 uppercase tracking-wider">
                  Извлечённые цвета ({colors.length})
                </h3>
                <div className="flex flex-wrap gap-2">
                  {colors.map(hex => (
                    <div key={hex} className="flex items-center gap-1.5 bg-surface-700 rounded-lg px-2 py-1">
                      <div
                        className="w-4 h-4 rounded-sm border border-white/20 flex-shrink-0"
                        style={{ backgroundColor: hex }}
                      />
                      <span className="text-xs font-mono text-surface-300">{hex}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Score card */}
            {pairs.length > 0 && (
              <div className="bg-surface-800 rounded-xl p-4 text-center">
                <p className="text-surface-400 text-sm mb-1">Итоговый балл WCAG</p>
                <p className={`text-5xl font-black ${scoreColor}`}>{score}%</p>
                <p className="text-surface-500 text-xs mt-1">
                  {passingPairs} из {totalPairs} пар проходят минимальный уровень
                </p>
                <div className="mt-3 h-2 bg-surface-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${
                      score >= 80 ? 'bg-emerald-500' : score >= 50 ? 'bg-yellow-500' : 'bg-red-500'
                    }`}
                    style={{ width: `${score}%` }}
                  />
                </div>
              </div>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <div className="bg-surface-800 rounded-xl p-4">
                <h3 className="text-sm font-semibold text-surface-400 mb-3 uppercase tracking-wider">
                  Рекомендации
                </h3>
                <ul className="space-y-2">
                  {recommendations.map((rec, i) => (
                    <li key={i} className="flex items-start gap-2 text-sm text-surface-300">
                      <span className="text-primary-400 mt-0.5 flex-shrink-0">→</span>
                      {rec}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>

          {/* ── Color pairs matrix (right columns) ── */}
          <div className="lg:col-span-2">

            {pairs.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-surface-600">
                <div className="text-6xl mb-4">🎨</div>
                <p className="text-lg font-medium">Загрузите изображение</p>
                <p className="text-sm mt-1">чтобы увидеть анализ цветовых пар</p>
              </div>
            ) : (
              <>
                {/* Filter tabs */}
                <div className="flex flex-wrap gap-2 mb-4">
                  {(['ALL', 'AAA', 'AA', 'A', 'FAIL'] as FilterLevel[]).map(lvl => (
                    <button
                      key={lvl}
                      onClick={() => setFilter(lvl)}
                      className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all
                        ${filter === lvl
                          ? lvl === 'ALL'
                            ? 'bg-primary-600 text-white'
                            : LEVEL_COLORS[lvl]
                          : 'bg-surface-700 text-surface-400 hover:bg-surface-600'
                        }`}
                    >
                      {lvl === 'ALL' ? 'Все' : lvl}
                      <span className="ml-1.5 opacity-70">({counts[lvl]})</span>
                    </button>
                  ))}
                </div>

                {/* Pairs grid */}
                <div className="space-y-2 max-h-[620px] overflow-y-auto pr-1">
                  {filteredPairs.length === 0 ? (
                    <div className="text-center py-12 text-surface-600">
                      Нет пар с уровнем {filter}
                    </div>
                  ) : (
                    filteredPairs.map((pair, idx) => (
                      <div
                        key={idx}
                        className={`bg-surface-800 rounded-xl p-4 border ${LEVEL_BORDER[pair.level]} border-opacity-40 flex items-center gap-4`}
                      >
                        {/* Color swatches */}
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="text-center">
                            <div
                              className="w-10 h-10 rounded-lg border border-white/10"
                              style={{ backgroundColor: pair.fg }}
                              title={pair.fg}
                            />
                            <p className="text-xs font-mono text-surface-500 mt-1">{pair.fg}</p>
                          </div>
                          <span className="text-surface-600 text-lg">↔</span>
                          <div className="text-center">
                            <div
                              className="w-10 h-10 rounded-lg border border-white/10"
                              style={{ backgroundColor: pair.bg }}
                              title={pair.bg}
                            />
                            <p className="text-xs font-mono text-surface-500 mt-1">{pair.bg}</p>
                          </div>
                        </div>

                        {/* Preview text */}
                        <div
                          className="flex-1 rounded-lg px-3 py-2 min-w-0"
                          style={{ backgroundColor: pair.bg }}
                        >
                          <p
                            className="text-sm font-semibold truncate"
                            style={{ color: pair.fg }}
                          >
                            Пример текста
                          </p>
                          <p
                            className="text-xs truncate opacity-80"
                            style={{ color: pair.fg }}
                          >
                            Sample text WCAG 2.1
                          </p>
                        </div>

                        {/* Ratio + level */}
                        <div className="text-right flex-shrink-0">
                          <p className="text-lg font-black text-white">{pair.ratio}:1</p>
                          <span className={`inline-block px-2 py-0.5 rounded-md text-xs font-bold mt-1 ${LEVEL_COLORS[pair.level]}`}>
                            {pair.level}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}