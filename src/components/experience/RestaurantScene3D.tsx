import React from 'react'
import * as THREE from 'three'
import { Canvas, useThree, useFrame } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { ExperienceScene, ExperienceHotspot } from '@/config/businessExperience'

/**
 * RestaurantScene3D — the 3D visual layer of the BusinessExperience.
 *
 * The scene is procedural (Three.js primitives) because no production GLB/GLTF
 * asset exists yet. To swap in a real model later: load it with useGLTF(),
 * render it in place of <ProceduralRestaurant />, and point scene.modelUrl at
 * the file — hotspots and camera logic are unchanged because they read
 * position3d from the scene config.
 *
 * Camera interaction:
 *   - OrbitControls gives rotate / wheel-zoom / touch-orbit / pinch-zoom.
 *   - CameraRig smoothly damps the camera + target toward the selected
 *     hotspot's position3d, then releases control back to the user.
 */

export interface SceneApi {
  zoom: (factor: number) => void
  reset: () => void
}

const DEFAULT_TARGET = new THREE.Vector3(0, 0.7, 0)
const DEFAULT_DIST = 12.5
const DEFAULT_FOCUS_DIST = 9.5

function CameraRig({
  focus,
  apiRef,
  reducedMotion,
  controlsRef,
}: {
  focus: ExperienceHotspot | null
  apiRef: React.MutableRefObject<SceneApi | null>
  reducedMotion: boolean
  controlsRef: React.RefObject<OrbitControlsImpl>
}) {
  const { camera } = useThree()
  const desired = React.useRef({
    target: DEFAULT_TARGET.clone(),
    dist: DEFAULT_DIST,
    dir: null as THREE.Vector3 | null,
  })
  const animating = React.useRef(false)
  const zoomMul = React.useRef(1)

  React.useEffect(() => {
    if (focus) {
      const t = focus.focusTarget ?? focus.position3d ?? [0, 0.6, 0]
      desired.current.target.set(t[0], t[1], t[2])
      desired.current.dist = focus.focusDistance ?? DEFAULT_FOCUS_DIST
      desired.current.dir = focus.cameraOffset
        ? new THREE.Vector3(...focus.cameraOffset).normalize()
        : null
    } else {
      desired.current.target.copy(DEFAULT_TARGET)
      desired.current.dist = DEFAULT_DIST
      desired.current.dir = new THREE.Vector3(0.62, 0.5, 0.62).normalize()
    }
    zoomMul.current = 1
    animating.current = true
  }, [focus])

  React.useEffect(() => {
    apiRef.current = {
      zoom: (factor) => {
        zoomMul.current = THREE.MathUtils.clamp(zoomMul.current * factor, 0.35, 2.2)
        animating.current = true
      },
      reset: () => {
        desired.current.target.copy(DEFAULT_TARGET)
        desired.current.dist = DEFAULT_DIST
        desired.current.dir = new THREE.Vector3(0.62, 0.5, 0.62).normalize()
        zoomMul.current = 1
        animating.current = true
      },
    }
    return () => {
      apiRef.current = null
    }
  }, [apiRef])

  useFrame((_, dt) => {
    const controls = controlsRef.current
    if (!controls || !animating.current) return
    const k = reducedMotion ? 1 : Math.min(1, dt * 3.2)
    const goalDist = desired.current.dist * zoomMul.current

    controls.target.lerp(desired.current.target, k)
    if (desired.current.dir) {
      // Intentional framing: aim for an exact camera position relative to the target
      const goal = desired.current.target
        .clone()
        .add(desired.current.dir.clone().multiplyScalar(goalDist))
      camera.position.lerp(goal, k)
      controls.update()
      if (
        controls.target.distanceTo(desired.current.target) < 0.02 &&
        camera.position.distanceTo(goal) < 0.05
      ) {
        animating.current = false
      }
      return
    }
    const dir = camera.position.clone().sub(controls.target)
    const curDist = dir.length()
    const newDist = THREE.MathUtils.lerp(curDist, goalDist, k)
    camera.position.copy(controls.target).add(dir.normalize().multiplyScalar(newDist))
    controls.update()

    if (
      controls.target.distanceTo(desired.current.target) < 0.02 &&
      Math.abs(newDist - goalDist) < 0.05
    ) {
      animating.current = false
    }
  })

  return null
}

/* ── Procedural restaurant (replaceable by a GLB via scene.modelUrl) ── */

const WOOD = '#8b5a2b'
const WOOD_DARK = '#5d3a1a'
const WALL = '#e8dcc8'
const FLOOR = '#3d3229'
const ACCENT = '#e76f51'
const GREEN = '#4a7c59'

function Wall({ position, args }: { position: [number, number, number]; args: [number, number, number] }) {
  return (
    <mesh position={position} castShadow receiveShadow>
      <boxGeometry args={args} />
      <meshStandardMaterial color={WALL} roughness={0.9} />
    </mesh>
  )
}

function Table({ position, seats = 4 }: { position: [number, number, number]; seats?: number }) {
  const chairAngles = Array.from({ length: seats }, (_, i) => (i / seats) * Math.PI * 2)
  return (
    <group position={position}>
      <mesh position={[0, 0.72, 0]} castShadow>
        <cylinderGeometry args={[0.55, 0.55, 0.05, 24]} />
        <meshStandardMaterial color={WOOD} roughness={0.6} />
      </mesh>
      <mesh position={[0, 0.36, 0]}>
        <cylinderGeometry args={[0.06, 0.06, 0.72, 12]} />
        <meshStandardMaterial color={WOOD_DARK} />
      </mesh>
      {chairAngles.map((a, i) => (
        <mesh key={i} position={[Math.cos(a) * 0.95, 0.25, Math.sin(a) * 0.95]} castShadow>
          <boxGeometry args={[0.32, 0.5, 0.32]} />
          <meshStandardMaterial color={WOOD_DARK} />
        </mesh>
      ))}
    </group>
  )
}

function Plant({ position }: { position: [number, number, number] }) {
  return (
    <group position={position}>
      <mesh position={[0, 0.25, 0]}>
        <cylinderGeometry args={[0.22, 0.28, 0.5, 12]} />
        <meshStandardMaterial color="#a0522d" />
      </mesh>
      <mesh position={[0, 0.85, 0]} castShadow>
        <sphereGeometry args={[0.45, 12, 12]} />
        <meshStandardMaterial color={GREEN} roughness={1} />
      </mesh>
    </group>
  )
}

function ProceduralRestaurant() {
  return (
    <group>
      {/* Main floor */}
      <mesh position={[0, -0.05, 0]} receiveShadow>
        <boxGeometry args={[14, 0.1, 10]} />
        <meshStandardMaterial color={FLOOR} roughness={0.95} />
      </mesh>
      {/* Terrace deck */}
      <mesh position={[4.5, 0.01, 3.6]} receiveShadow>
        <boxGeometry args={[4.6, 0.08, 2.6]} />
        <meshStandardMaterial color="#6b4a2f" roughness={0.9} />
      </mesh>

      {/* Cutaway walls: back + left only (open front/right for isometric view) */}
      <Wall position={[0, 1.3, -5]} args={[14, 2.6, 0.18]} />
      <Wall position={[-7, 1.3, 0]} args={[0.18, 2.6, 10]} />
      {/* Front entrance pillars */}
      <Wall position={[-6.2, 1.3, 5]} args={[1.4, 2.6, 0.18]} />
      <Wall position={[-1.8, 1.3, 5]} args={[1.4, 2.6, 0.18]} />
      {/* Entrance lintel */}
      <Wall position={[-4, 2.45, 5]} args={[3, 0.3, 0.18]} />
      {/* Entrance mat */}
      <mesh position={[-4, 0.02, 4.4]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[2.4, 1]} />
        <meshStandardMaterial color={ACCENT} />
      </mesh>

      {/* Kitchen: raised block + counters (back-left) */}
      <mesh position={[-4.5, 1.1, -3.8]} castShadow>
        <boxGeometry args={[4.6, 2.2, 2.2]} />
        <meshStandardMaterial color="#c9c2b4" roughness={0.85} />
      </mesh>
      <mesh position={[-4.5, 0.5, -2.4]} castShadow>
        <boxGeometry args={[4.2, 1, 0.5]} />
        <meshStandardMaterial color="#9aa1a8" roughness={0.4} metalness={0.4} />
      </mesh>
      {/* Serving pass: dark opening + shelf + warmer strip */}
      <mesh position={[-4.5, 1.55, -2.69]}>
        <boxGeometry args={[2.6, 0.75, 0.06]} />
        <meshStandardMaterial color="#2a2119" roughness={1} />
      </mesh>
      <mesh position={[-4.5, 1.12, -2.55]} castShadow>
        <boxGeometry args={[3.0, 0.08, 0.4]} />
        <meshStandardMaterial color={WOOD} roughness={0.5} />
      </mesh>
      <mesh position={[-4.5, 1.95, -2.62]}>
        <boxGeometry args={[2.7, 0.06, 0.12]} />
        <meshStandardMaterial color="#ffb45e" emissive="#e76f51" emissiveIntensity={0.7} />
      </mesh>
      {/* Kitchen equipment hints on top of counter */}
      <mesh position={[-5.6, 1.28, -2.55]} castShadow>
        <boxGeometry args={[0.5, 0.24, 0.32]} />
        <meshStandardMaterial color="#7d848c" metalness={0.5} roughness={0.4} />
      </mesh>
      <mesh position={[-3.4, 1.26, -2.55]} castShadow>
        <boxGeometry args={[0.4, 0.2, 0.3]} />
        <meshStandardMaterial color="#8a6f4d" roughness={0.6} />
      </mesh>

      {/* Bar: counter + shelf (back-right) */}
      <mesh position={[3, 0.55, -3.6]} castShadow>
        <boxGeometry args={[4.6, 1.1, 0.7]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.55} />
      </mesh>
      <mesh position={[3, 1.9, -4.85]}>
        <boxGeometry args={[4.4, 1, 0.25]} />
        <meshStandardMaterial color={WOOD} />
      </mesh>
      {[-1, 0, 1].map((i) => (
        <mesh key={i} position={[3 + i * 1.2, 0.4, -2.6]}>
          <cylinderGeometry args={[0.22, 0.22, 0.8, 16]} />
          <meshStandardMaterial color={ACCENT} />
        </mesh>
      ))}

      {/* Dining tables */}
      <Table position={[-3.2, 0, 1.2]} />
      <Table position={[-0.8, 0, 1.2]} />
      <Table position={[1.4, 0, 1.4]} />
      <Table position={[-3.2, 0, 3.2]} seats={2} />
      <Table position={[-0.8, 0, 3.4]} />
      {/* Terrace tables */}
      <Table position={[3.8, 0, 3.4]} seats={2} />
      <Table position={[5.4, 0, 3.8]} seats={2} />

      {/* Plants */}
      <Plant position={[-6.3, 0, 4.3]} />
      <Plant position={[-1.2, 0, 4.3]} />
      <Plant position={[6.4, 0, -4.3]} />
      <Plant position={[6.4, 0, 4.4]} />
      <Plant position={[0.4, 0, -4.3]} />
    </group>
  )
}

/* ── Marker projector: projects position3d → screen % each frame ── */

export interface MarkerProjection {
  /** % coordinates within the viewport element */
  x: number
  y: number
  /** true when the anchor is behind the camera or outside a sane band */
  hidden: boolean
}

function MarkerProjector({
  hotspots,
  onProject,
}: {
  hotspots: ExperienceHotspot[]
  onProject: (id: string, p: MarkerProjection) => void
}) {
  const { camera } = useThree()
  const v = React.useMemo(() => new THREE.Vector3(), [])
  useFrame(() => {
    for (const h of hotspots) {
      if (!h.position3d) continue
      v.set(h.position3d[0], h.position3d[1], h.position3d[2]).project(camera)
      onProject(h.id, {
        x: (v.x * 0.5 + 0.5) * 100,
        y: (-v.y * 0.5 + 0.5) * 100,
        hidden: v.z > 1 || v.x < -1.25 || v.x > 1.25 || v.y < -1.25 || v.y > 1.25,
      })
    }
  })
  return null
}

export default function RestaurantScene3D({
  scene,
  selectedId,
  apiRef,
  reducedMotion,
  onProject,
}: {
  scene: ExperienceScene
  selectedId: string | null
  apiRef: React.MutableRefObject<SceneApi | null>
  reducedMotion: boolean
  onProject: (id: string, p: MarkerProjection) => void
}) {
  const controlsRef = React.useRef<OrbitControlsImpl>(null)
  const selected = scene.hotspots.find((h) => h.id === selectedId) || null

  return (
    <Canvas
      shadows
      dpr={[1, 1.75]}
      camera={{ position: [9, 7, 9], fov: 44 }}
      style={{ position: 'absolute', inset: 0 }}
    >
      <color attach="background" args={['#10233d']} />
      <fog attach="fog" args={['#10233d', 22, 42]} />

      <ambientLight intensity={0.62} />
      <hemisphereLight args={['#cfe0ff', '#3d3229', 0.35]} />
      <directionalLight position={[8, 12, 6]} intensity={1.05} castShadow shadow-mapSize={[1024, 1024]} />
      {/* Warm interior glow */}
      <pointLight position={[0, 2.4, 0]} intensity={14} color="#ffbf80" distance={12} />
      <pointLight position={[3, 2.2, -3.5]} intensity={8} color={ACCENT} distance={8} />
      {/* Terrace fill — soft warm wash so the deck reads without spotlighting */}
      <pointLight position={[4.5, 3.2, 3.8]} intensity={7} color="#ffd9a8" distance={8} />
      {/* Kitchen pass fill */}
      <pointLight position={[-4.5, 2.4, -2.2]} intensity={5} color="#ffc98a" distance={6} />

      <ProceduralRestaurant />
      <MarkerProjector hotspots={scene.hotspots} onProject={onProject} />

      <OrbitControls
        ref={controlsRef}
        makeDefault
        enableDamping
        dampingFactor={0.08}
        enablePan={false}
        minDistance={4}
        maxDistance={24}
        maxPolarAngle={Math.PI / 2.15}
        target={[0, 0.6, 0]}
      />
      <CameraRig
        focus={selected}
        apiRef={apiRef}
        reducedMotion={reducedMotion}
        controlsRef={controlsRef}
      />
    </Canvas>
  )
}
