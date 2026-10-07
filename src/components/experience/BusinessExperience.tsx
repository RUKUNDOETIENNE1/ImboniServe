import React from 'react'
import Image from 'next/image'
import Link from 'next/link'
import dynamic from 'next/dynamic'
import { useRouter } from 'next/router'
import { useSession } from 'next-auth/react'
import { X, ZoomIn, ZoomOut, Maximize2, MapPin, ArrowRight } from 'lucide-react'
import {
  ExperienceScene,
  ExperienceHotspot,
  ExperienceAction,
  ExperienceActionContext,
  resolveExperienceAction,
} from '@/config/businessExperience'
import { trackEvent } from '@/components/AnalyticsScript'
import type { SceneApi, MarkerProjection } from './RestaurantScene3D'

// Real 3D scene — its own chunk, loaded only when WebGL is available.
const Scene3D = dynamic(() => import('./RestaurantScene3D'), { ssr: false })

/**
 * BusinessExperience — the interactive digital business layer.
 *
 * Layers:
 *   - Visual layer: poster image inside a pan/zoom viewport. The viewport is a
 *     camera abstraction (`view` transform) so a real React Three Fiber scene
 *     can replace the image later without changing hotspots or panels — each
 *     hotspot already carries `position3d` for that scene.
 *   - Hotspot layer: semantic <button> markers driven entirely by scene config.
 *   - Context panel: appears on hotspot selection; renders real actions.
 *   - Action layer: actions resolve to real Imboni Serve routes via
 *     resolveExperienceAction(); staff-only actions are hidden for anonymous
 *     users (target routes still enforce auth server-side).
 *
 * Analytics: emits typed events via onEvent (and the existing trackEvent
 * pipeline) for: experience_opened, hotspot_clicked, experience_action_clicked.
 */

export type ExperienceEvent =
  | { type: 'experience_opened'; sceneId: string }
  | { type: 'hotspot_clicked'; sceneId: string; hotspotId: string }
  | { type: 'experience_action_clicked'; sceneId: string; hotspotId: string; action: string }

interface Props {
  scene: ExperienceScene
  /** Real business context for action resolution (demo mode: omit). */
  businessContext?: ExperienceActionContext
  onEvent?: (e: ExperienceEvent) => void
}

interface ViewState {
  x: number // translate %
  y: number
  scale: number
}

const DEFAULT_VIEW: ViewState = { x: 0, y: 0, scale: 1 }
const MIN_SCALE = 1
const MAX_SCALE = 3
const FOCUS_SCALE = 1.8

export default function BusinessExperience({ scene, businessContext, onEvent }: Props) {
  const router = useRouter()
  const { data: session } = useSession()
  const viewportRef = React.useRef<HTMLDivElement>(null)
  const dragRef = React.useRef<{ startX: number; startY: number; viewX: number; viewY: number; pointers: Map<number, { x: number; y: number }>; pinchDist: number | null }>({
    startX: 0,
    startY: 0,
    viewX: 0,
    viewY: 0,
    pointers: new Map(),
    pinchDist: null,
  })

  const [view, setView] = React.useState<ViewState>(DEFAULT_VIEW)
  const [selectedId, setSelectedId] = React.useState<string | null>(null)
  const [reducedMotion, setReducedMotion] = React.useState(false)
  // null = still detecting (show static poster); false = no WebGL (poster fallback); true = 3D
  const [webgl, setWebgl] = React.useState<boolean | null>(null)
  const sceneApiRef = React.useRef<SceneApi | null>(null)
  const markerRefs = React.useRef<Record<string, HTMLButtonElement | null>>({})

  // 3D marker positions are projected each frame inside the Canvas and
  // written to these DOM refs imperatively (no per-frame React re-render).
  const handleMarkerProject = React.useCallback((id: string, p: MarkerProjection) => {
    const el = markerRefs.current[id]
    if (!el) return
    if (p.hidden) {
      el.style.display = 'none'
      return
    }
    el.style.display = ''
    el.style.left = `${p.x}%`
    el.style.top = `${p.y}%`
  }, [])

  const selected = scene.hotspots.find((h) => h.id === selectedId) || null

  const emit = React.useCallback(
    (e: ExperienceEvent) => {
      onEvent?.(e)
      // e.type is already snake_case (experience_opened → EXPERIENCE_OPENED)
      trackEvent(e.type.toUpperCase(), { ...e, businessId: scene.businessId })
    },
    [onEvent, scene.businessId],
  )

  React.useEffect(() => {
    emit({ type: 'experience_opened', sceneId: scene.id })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scene.id])

  React.useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const onChange = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])

  React.useEffect(() => {
    try {
      const c = document.createElement('canvas')
      setWebgl(Boolean(c.getContext('webgl2') || c.getContext('webgl')))
    } catch {
      setWebgl(false)
    }
  }, [])

  const clampView = React.useCallback((v: ViewState): ViewState => {
    const scale = Math.min(MAX_SCALE, Math.max(MIN_SCALE, v.scale))
    const maxOffset = ((scale - 1) / scale) * 50 // keep image covering viewport
    return {
      scale,
      x: Math.min(maxOffset, Math.max(-maxOffset, v.x)),
      y: Math.min(maxOffset, Math.max(-maxOffset, v.y)),
    }
  }, [])

  const focusHotspot = React.useCallback(
    (h: ExperienceHotspot) => {
      // Center the hotspot: translate so its % position sits at viewport centre.
      const scale = FOCUS_SCALE
      setView(
        clampView({
          scale,
          x: (50 - h.position.x) / 1, // offset in % of layer width, applied pre-scale
          y: (50 - h.position.y) / 1,
        }),
      )
    },
    [clampView],
  )

  const selectHotspot = (h: ExperienceHotspot | null) => {
    setSelectedId(h?.id ?? null)
    if (h) {
      if (webgl !== true) focusHotspot(h) // 3D mode: CameraRig handles camera focus
      emit({ type: 'hotspot_clicked', sceneId: scene.id, hotspotId: h.id })
    }
  }

  // ── Pointer / touch / wheel interaction (poster fallback only) ───────
  const onPointerDown = (e: React.PointerEvent) => {
    if (webgl) return
    viewportRef.current?.setPointerCapture(e.pointerId)
    const d = dragRef.current
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    d.startX = e.clientX
    d.startY = e.clientY
    d.viewX = view.x
    d.viewY = view.y
    d.pinchDist = null
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (webgl) return
    const d = dragRef.current
    if (!d.pointers.has(e.pointerId)) return
    d.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
    const el = viewportRef.current
    if (!el) return

    if (d.pointers.size === 2) {
      // Pinch to zoom
      const [a, b] = [...d.pointers.values()]
      const dist = Math.hypot(a.x - b.x, a.y - b.y)
      if (d.pinchDist !== null && d.pinchDist > 0) {
        setView((v) => clampView({ ...v, scale: v.scale * (dist / d.pinchDist!) }))
      }
      d.pinchDist = dist
      return
    }

    const dx = ((e.clientX - d.startX) / el.clientWidth) * 100
    const dy = ((e.clientY - d.startY) / el.clientHeight) * 100
    setView(clampView({ scale: view.scale, x: d.viewX + dx, y: d.viewY + dy }))
  }

  const onPointerUp = (e: React.PointerEvent) => {
    if (webgl) return
    dragRef.current.pointers.delete(e.pointerId)
    dragRef.current.pinchDist = null
  }

  const onWheel = (e: React.WheelEvent) => {
    if (webgl) return
    setView((v) => clampView({ ...v, scale: v.scale * (e.deltaY < 0 ? 1.1 : 0.9) }))
  }

  const zoom = (factor: number) => {
    if (webgl) sceneApiRef.current?.zoom(factor)
    else setView((v) => clampView({ ...v, scale: v.scale * factor }))
  }
  const reset = () => {
    if (webgl) sceneApiRef.current?.reset()
    setView(DEFAULT_VIEW)
    setSelectedId(null)
  }

  const visibleActions = (h: ExperienceHotspot): ExperienceAction[] =>
    h.actions.filter((a) => !a.requiresStaff || session?.user)

  const runAction = (h: ExperienceHotspot, a: ExperienceAction) => {
    emit({ type: 'experience_action_clicked', sceneId: scene.id, hotspotId: h.id, action: a.type })
    const href = resolveExperienceAction(a, businessContext ?? {})
    if (/^https?:\/\//.test(href)) window.open(href, '_blank', 'noopener,noreferrer')
    else router.push(href)
  }

  const transition = reducedMotion ? 'none' : 'transform 500ms cubic-bezier(0.22, 1, 0.36, 1)'

  return (
    <div className="w-full">
      <div className="md:relative">
        {/* ── Viewport ── */}
        <div
          ref={viewportRef}
          role="application"
          aria-label={`Interactive view of ${scene.businessName}`}
          className="relative w-full aspect-[4/3] md:aspect-[16/10] overflow-hidden rounded-2xl bg-imboni-blue select-none touch-none cursor-grab active:cursor-grabbing border border-white/10 shadow-2xl"
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={onPointerUp}
          onPointerCancel={onPointerUp}
          onWheel={onWheel}
          onDoubleClick={reset}
          onKeyDown={(e) => e.key === 'Escape' && selectHotspot(null)}
        >
          {webgl === true ? (
            /* Real 3D scene (lazy chunk) + DOM hotspot markers projected from position3d */
            <>
            <Scene3D
              scene={scene}
              selectedId={selectedId}
              apiRef={sceneApiRef}
              reducedMotion={reducedMotion}
              onProject={handleMarkerProject}
            />
            <div className="absolute inset-0 pointer-events-none z-10">
            {scene.hotspots.map((h) => (
              <button
                key={h.id}
                ref={(el) => { markerRefs.current[h.id] = el }}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  selectHotspot(h)
                }}
                aria-label={`${h.label} — ${h.secondary}`}
                aria-pressed={selectedId === h.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none pointer-events-auto"
                style={{ left: '-20%', top: '-20%' }}
              >
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm transition-colors whitespace-nowrap ${
                    selectedId === h.id
                      ? 'bg-imboni-orange text-white'
                      : 'bg-white/90 text-imboni-blue group-hover:bg-imboni-orange group-hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {h.label}
                </span>
              </button>
            ))}
            </div>
            </>
          ) : (
          /* Poster visual layer — fallback while detecting WebGL or when unsupported */
          <div
            className="absolute inset-0 will-change-transform"
            style={{
              transform: `scale(${view.scale}) translate(${view.x}%, ${view.y}%)`,
              transition,
            }}
          >
            <Image
              src={scene.posterImage}
              alt={`Interactive digital experience of ${scene.businessName}`}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 60vw"
              priority={false}
              draggable={false}
            />

            {/* Hotspot layer */}
            {webgl === false && scene.hotspots.map((h) => (
              <button
                key={h.id}
                type="button"
                onClick={(e) => {
                  e.stopPropagation()
                  selectHotspot(h)
                }}
                onPointerDown={(e) => e.stopPropagation()}
                aria-label={`${h.label} — ${h.secondary}`}
                aria-pressed={selectedId === h.id}
                className="absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none"
                style={{ left: `${h.position.x}%`, top: `${h.position.y}%`, transform: `translate(-50%,-50%) scale(${1 / view.scale})` }}
              >
                <span
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold shadow-lg backdrop-blur-sm transition-colors whitespace-nowrap ${
                    selectedId === h.id
                      ? 'bg-imboni-orange text-white'
                      : 'bg-white/90 text-imboni-blue group-hover:bg-imboni-orange group-hover:text-white'
                  }`}
                >
                  <MapPin className="w-3.5 h-3.5" />
                  {h.label}
                </span>
              </button>
            ))}
          </div>
          )}

          {/* Controls */}
          <div className="absolute top-3 right-3 flex flex-col gap-2 z-10">
            <button
              type="button"
              onClick={() => zoom(1.25)}
              aria-label="Zoom in"
              className="p-2 rounded-lg bg-white/90 text-imboni-blue shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-imboni-orange"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => zoom(0.8)}
              aria-label="Zoom out"
              className="p-2 rounded-lg bg-white/90 text-imboni-blue shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-imboni-orange"
            >
              <ZoomOut className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={reset}
              aria-label="Reset view"
              className="p-2 rounded-lg bg-white/90 text-imboni-blue shadow hover:bg-white focus:outline-none focus:ring-2 focus:ring-imboni-orange"
            >
              <Maximize2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* ── Context panel (overlay on desktop, stacked on mobile) ── */}
        {selected && (
          <div
            role="dialog"
            aria-label={selected.label}
            className="mt-3 md:mt-0 md:absolute md:bottom-4 md:left-4 md:w-80 bg-white rounded-2xl shadow-2xl border border-slate-200 p-5 z-20"
          >
            <div className="flex items-start justify-between mb-1">
              <div>
                <h3 className="text-lg font-bold text-imboni-blue">{selected.label}</h3>
                <p className="text-xs font-medium text-imboni-orange">{selected.secondary}</p>
              </div>
              <button
                type="button"
                onClick={() => selectHotspot(null)}
                aria-label="Close panel"
                className="p-1.5 rounded-lg text-slate-400 hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-imboni-orange"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {selected.description && (
              <p className="text-sm text-slate-600 mb-3">{selected.description}</p>
            )}

            {selected.stats && selected.stats.length > 0 && (
              <dl className="mb-3 space-y-1">
                {selected.stats.map((s) => (
                  <div key={s.label} className="flex justify-between text-sm">
                    <dt className="text-slate-500">{s.label}</dt>
                    <dd className="font-medium text-slate-800">{s.value}</dd>
                  </div>
                ))}
              </dl>
            )}

            <div className="flex flex-col gap-2">
              {visibleActions(selected).map((a) => (
                <button
                  key={a.label}
                  type="button"
                  onClick={() => runAction(selected, a)}
                  className="flex items-center justify-between w-full px-4 py-2.5 rounded-xl bg-imboni-blue text-white text-sm font-semibold hover:bg-imboni-orange transition-colors focus:outline-none focus:ring-2 focus:ring-imboni-orange"
                >
                  {a.label}
                  <ArrowRight className="w-4 h-4" />
                </button>
              ))}
              {visibleActions(selected).length === 0 && selected.customerNote && (
                <p className="text-sm text-slate-500 italic">{selected.customerNote}</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* ── Accessible area list (a11y + mobile hotspots) ── */}
      <nav aria-label="Areas" className="flex flex-wrap gap-2 mt-3">
        {scene.hotspots.map((h) => (
          <button
            key={h.id}
            type="button"
            // preventDefault on mousedown keeps the click from scrolling the
            // viewport out of frame when the chip gains focus
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => selectHotspot(h)}
            className={`px-3.5 py-2 rounded-xl text-sm font-medium border transition-colors focus:outline-none focus:ring-2 focus:ring-imboni-orange ${
              selectedId === h.id
                ? 'bg-imboni-blue text-white border-imboni-blue'
                : 'bg-white text-slate-700 border-slate-200 hover:border-imboni-orange hover:text-imboni-blue'
            }`}
          >
            {h.label}
            <span className="block text-[11px] font-normal opacity-70">{h.secondary}</span>
          </button>
        ))}
      </nav>

      <p className="mt-2 text-xs text-slate-400">
        Drag to explore · Scroll or pinch to zoom · Tap a marker to see what you can do there
      </p>
    </div>
  )
}
