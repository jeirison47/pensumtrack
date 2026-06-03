'use client'

import { useMemo, useState, useRef, useEffect, useCallback } from 'react'
import type { Subject, SubjectStatus } from '@pensumtrack/types'
import { ZoomIn, ZoomOut, Maximize2 } from 'lucide-react'

const NODE_W = 130
const NODE_H = 52
const COL_GAP = 40
const ROW_GAP = 80
const PADDING = 32

const STATUS_COLORS: Record<SubjectStatus, { bg: string; border: string; text: string }> = {
  passed:        { bg: 'rgba(110,231,183,0.15)', border: '#6ee7b7', text: '#6ee7b7' },
  'in-progress': { bg: 'rgba(251,191,36,0.15)',  border: '#fbbf24', text: '#fbbf24' },
  available:     { bg: 'rgba(56,189,248,0.15)',   border: '#38bdf8', text: '#38bdf8' },
  preselected:   { bg: 'rgba(167,139,250,0.15)',  border: '#a78bfa', text: '#a78bfa' },
  locked:        { bg: 'rgba(30,34,46,0.8)',       border: '#4b5563', text: '#6b7280' },
  pending:       { bg: 'rgba(30,34,46,0.8)',       border: '#4b5563', text: '#6b7280' },
  failed:        { bg: 'rgba(248,113,113,0.15)',   border: '#f87171', text: '#f87171' },
}

interface NodePos { subject: Subject; x: number; y: number }

interface Props {
  subjects: Subject[]
  getSubjectStatus: (code: string) => SubjectStatus
  onSelect: (s: Subject) => void
}

export function PensumMap({ subjects, getSubjectStatus, onSelect }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [scale, setScale] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [fitScale, setFitScale] = useState(1)
  const pinchDistRef = useRef<number | null>(null)
  const lastTouchRef = useRef<{ x: number; y: number } | null>(null)

  const { nodes, arrows, svgWidth, svgHeight } = useMemo(() => {
    const bySemester = new Map<number, Subject[]>()
    for (const s of subjects) {
      if (!bySemester.has(s.semester)) bySemester.set(s.semester, [])
      bySemester.get(s.semester)!.push(s)
    }
    const semesters = Array.from(bySemester.entries()).sort((a, b) => a[0] - b[0])
    const maxPerRow = Math.max(...semesters.map(([, ss]) => ss.length))
    const totalWidth = maxPerRow * NODE_W + (maxPerRow - 1) * COL_GAP + PADDING * 2
    const totalHeight = semesters.length * NODE_H + (semesters.length - 1) * ROW_GAP + PADDING * 2

    const posMap = new Map<string, { x: number; y: number }>()
    const nodes: NodePos[] = []

    semesters.forEach(([, semSubjects], rowIdx) => {
      const rowWidth = semSubjects.length * NODE_W + (semSubjects.length - 1) * COL_GAP
      const startX = (totalWidth - rowWidth) / 2
      const y = PADDING + rowIdx * (NODE_H + ROW_GAP)
      semSubjects.forEach((s, colIdx) => {
        const x = startX + colIdx * (NODE_W + COL_GAP)
        posMap.set(s.code, { x, y })
        nodes.push({ subject: s, x, y })
      })
    })

    const arrows: { from: Subject; to: Subject; fromPos: { x: number; y: number }; toPos: { x: number; y: number } }[] = []
    for (const s of subjects) {
      for (const prereqCode of s.prerequisites) {
        const fromPos = posMap.get(prereqCode)
        const toPos = posMap.get(s.code)
        const fromSubject = subjects.find((sub) => sub.code === prereqCode)
        if (fromPos && toPos && fromSubject) {
          arrows.push({ from: fromSubject, to: s, fromPos, toPos })
        }
      }
    }

    return { nodes, arrows, svgWidth: totalWidth, svgHeight: totalHeight }
  }, [subjects])

  // Ajustar escala inicial al ancho del contenedor
  useEffect(() => {
    if (!containerRef.current || !svgWidth) return
    const w = containerRef.current.clientWidth
    const s = Math.min(1, w / svgWidth)
    setFitScale(s)
    setScale(s)
    setPan({ x: 0, y: 0 })
  }, [svgWidth])

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      pinchDistRef.current = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      )
      lastTouchRef.current = null
    } else if (e.touches.length === 1) {
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      pinchDistRef.current = null
    }
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (e.touches.length === 2 && pinchDistRef.current !== null) {
      const dist = Math.hypot(
        e.touches[1].clientX - e.touches[0].clientX,
        e.touches[1].clientY - e.touches[0].clientY,
      )
      const factor = dist / pinchDistRef.current
      pinchDistRef.current = dist
      setScale(s => Math.max(fitScale * 0.5, Math.min(3, s * factor)))
    } else if (e.touches.length === 1 && lastTouchRef.current) {
      const dx = e.touches[0].clientX - lastTouchRef.current.x
      const dy = e.touches[0].clientY - lastTouchRef.current.y
      lastTouchRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY }
      setPan(p => ({ x: p.x + dx, y: p.y + dy }))
    }
  }, [fitScale])

  const handleTouchEnd = useCallback(() => {
    pinchDistRef.current = null
    lastTouchRef.current = null
  }, [])

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault()
    const factor = e.deltaY < 0 ? 1.1 : 0.9
    setScale(s => Math.max(fitScale * 0.5, Math.min(3, s * factor)))
  }, [fitScale])

  const zoomIn  = () => setScale(s => Math.min(3, s * 1.25))
  const zoomOut = () => setScale(s => Math.max(fitScale * 0.5, s * 0.8))
  const reset   = () => { setScale(fitScale); setPan({ x: 0, y: 0 }) }

  const containerH = Math.max(300, Math.round(svgHeight * fitScale) + 32)

  return (
    <div style={{ position: 'relative' }}>
      {/* Controles de zoom */}
      <div style={{ position: 'absolute', top: 8, right: 8, zIndex: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {([
          { icon: ZoomIn,    fn: zoomIn,  title: 'Acercar' },
          { icon: ZoomOut,   fn: zoomOut, title: 'Alejar'  },
          { icon: Maximize2, fn: reset,   title: 'Ajustar' },
        ] as const).map(({ icon: Icon, fn, title }) => (
          <button key={title} onClick={fn} title={title}
                  className="w-8 h-8 rounded-lg flex items-center justify-center transition hover:opacity-80 cursor-pointer"
                  style={{ background: 'var(--surface2)', border: '1px solid var(--pt-border)', color: 'var(--muted)' }}>
            <Icon size={14} />
          </button>
        ))}
      </div>

      {/* Área del mapa */}
      <div
        ref={containerRef}
        style={{ position: 'relative', overflow: 'hidden', height: containerH, touchAction: 'none', cursor: 'grab', borderRadius: 12 }}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onWheel={handleWheel}
      >
        <div style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${scale})`, transformOrigin: '0 0', willChange: 'transform' }}>
          <svg width={svgWidth} height={svgHeight} style={{ display: 'block' }}>
            <defs>
              {(Object.entries(STATUS_COLORS) as [SubjectStatus, typeof STATUS_COLORS[SubjectStatus]][]).map(([status, { border }]) => (
                <marker key={status} id={`arrow-${status}`} markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                  <path d="M0,0 L0,6 L6,3 z" fill={border} fillOpacity={0.6} />
                </marker>
              ))}
            </defs>

            {/* Flechas */}
            {arrows.map(({ from, to, fromPos, toPos }) => {
              const x1 = fromPos.x + NODE_W / 2
              const y1 = fromPos.y + NODE_H
              const x2 = toPos.x + NODE_W / 2
              const y2 = toPos.y
              const cy = (y1 + y2) / 2
              const fromStatus = getSubjectStatus(from.code)
              return (
                <path key={`${from.code}-${to.code}`}
                      d={`M ${x1} ${y1} C ${x1} ${cy}, ${x2} ${cy}, ${x2} ${y2}`}
                      fill="none" stroke={STATUS_COLORS[fromStatus].border}
                      strokeWidth={1.5} strokeOpacity={0.5}
                      markerEnd={`url(#arrow-${fromStatus})`} />
              )
            })}

            {/* Nodos */}
            {nodes.map(({ subject, x, y }) => {
              const status = getSubjectStatus(subject.code)
              const colors = STATUS_COLORS[status]
              return (
                <g key={subject.code} style={{ cursor: 'pointer' }} onClick={() => onSelect(subject)}>
                  <rect x={x} y={y} width={NODE_W} height={NODE_H} rx={10}
                        fill={colors.bg} stroke={colors.border} strokeWidth={1} strokeOpacity={0.7} />
                  <text x={x + 10} y={y + 18} fontSize={9} fill={colors.border} fontFamily="monospace" opacity={0.8}>
                    {subject.code}
                  </text>
                  <text x={x + 10} y={y + 34} fontSize={10} fill={colors.text} fontFamily="DM Sans, sans-serif">
                    {subject.name.length > 16 ? subject.name.slice(0, 16) + '…' : subject.name}
                  </text>
                  <text x={x + NODE_W - 8} y={y + NODE_H - 8} fontSize={9} fill={colors.border} textAnchor="end" opacity={0.7}>
                    {subject.credits}cr
                  </text>
                </g>
              )
            })}

            {/* Labels de cuatrimestre */}
            {Array.from(new Set(subjects.map((s) => s.semester))).sort().map((sem, idx) => {
              const y = PADDING + idx * (NODE_H + ROW_GAP) + NODE_H / 2 + 4
              return (
                <text key={sem} x={8} y={y} fontSize={10} fill="#6b7280" fontFamily="monospace" fontWeight="bold">
                  C{sem}
                </text>
              )
            })}
          </svg>
        </div>
      </div>
    </div>
  )
}
