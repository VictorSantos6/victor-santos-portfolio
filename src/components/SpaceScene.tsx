import { Line } from '@react-three/drei'
import { Canvas, useFrame, useThree } from '@react-three/fiber'
import gsap from 'gsap'
import { memo, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import * as THREE from 'three'
import { sectionOrder, sectionThemes } from '../theme'
import type { PlanetTheme, SectionId, SectionTheme } from '../theme'

interface SpaceSceneProps {
  progress: number
  activeProjectId: string | null
  activeSection: SectionId
  theme: SectionTheme
  reducedMotion: boolean
  mobile: boolean
}

function seededRandom(seed: number) {
  let state = seed
  return () => {
    state = (state * 16807) % 2147483647
    return (state - 1) / 2147483646
  }
}

function tweenColor(color: THREE.Color, value: string, duration: number) {
  const target = new THREE.Color(value)
  gsap.killTweensOf(color)
  return gsap.to(color, {
    r: target.r,
    g: target.g,
    b: target.b,
    duration,
    ease: 'expo.inOut',
    overwrite: true,
  })
}

function StarField({ count, color, reducedMotion }: { count: number; color: string; reducedMotion: boolean }) {
  const material = useRef<THREE.PointsMaterial>(null)
  const positions = useMemo(() => {
    const random = seededRandom(29)
    const points = new Float32Array(count * 3)

    for (let index = 0; index < count; index += 1) {
      points[index * 3] = (random() - 0.5) * 32
      points[index * 3 + 1] = (random() - 0.5) * 24
      points[index * 3 + 2] = (random() - 0.5) * 22
    }

    return points
  }, [count])

  useLayoutEffect(() => {
    if (!material.current) return
    const tween = tweenColor(material.current.color, color, reducedMotion ? 0 : 1.2)
    return () => {
      tween.kill()
    }
  }, [color, reducedMotion])

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial
        ref={material}
        color={sectionThemes.top.particle}
        size={0.032}
        sizeAttenuation
        transparent
        opacity={0.72}
      />
    </points>
  )
}

function LidarCloud({ color }: { color: string }) {
  const positions = useMemo(() => {
    const random = seededRandom(71)
    const count = 280
    const points = new Float32Array(count * 3)

    for (let index = 0; index < count; index += 1) {
      const radius = 0.65 + random() * 0.75
      const angle = random() * Math.PI * 2
      points[index * 3] = Math.cos(angle) * radius
      points[index * 3 + 1] = (random() - 0.5) * 1.15
      points[index * 3 + 2] = Math.sin(angle) * radius * 0.55
    }

    return points
  }, [])

  return (
    <group position={[-3.2, -1.1, -1.5]} rotation={[0.2, -0.35, 0.12]}>
      <points>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        </bufferGeometry>
        <pointsMaterial color={color} size={0.038} sizeAttenuation transparent opacity={0.72} />
      </points>
      <Line
        points={[
          [-1.5, 0, 0],
          [1.5, 0, 0],
        ]}
        color={color}
        lineWidth={0.45}
        transparent
        opacity={0.3}
      />
    </group>
  )
}

function ProjectBeacons({ activeProjectId, theme }: { activeProjectId: string | null; theme: SectionTheme }) {
  const group = useRef<THREE.Group>(null)
  const selectedColor = activeProjectId
    ? ({
        'flash-cards': theme.primary,
        'esports-organizer': theme.glow,
        'vehicle-reservation': theme.secondary,
        'space-invaders': theme.planet.detail,
      }[activeProjectId] ?? theme.primary)
    : theme.primary

  useFrame((_, delta) => {
    if (group.current) group.current.rotation.y += delta * 0.08
  })

  return (
    <group ref={group} position={[2.6, -2.2, -1.8]}>
      <mesh position={[0, 0.8, 0]} rotation={[0.45, 0.2, 0.1]}>
        <octahedronGeometry args={[0.34, 0]} />
        <meshStandardMaterial color={selectedColor} emissive={selectedColor} emissiveIntensity={1.3} wireframe />
      </mesh>
      <mesh position={[-0.9, -0.2, 0.15]} rotation={[0.4, 0.7, 0]}>
        <boxGeometry args={[0.48, 0.48, 0.48]} />
        <meshStandardMaterial color={theme.primary} emissive={theme.primary} emissiveIntensity={0.65} wireframe />
      </mesh>
      <mesh position={[0.9, -0.3, -0.1]} rotation={[0.2, 0, 0.8]}>
        <torusGeometry args={[0.32, 0.07, 8, 24]} />
        <meshStandardMaterial color={theme.secondary} emissive={theme.secondary} emissiveIntensity={0.62} />
      </mesh>
      <Line
        points={[
          [-0.9, -0.2, 0.15],
          [0, 0.8, 0],
          [0.9, -0.3, -0.1],
          [-0.9, -0.2, 0.15],
        ]}
        color={selectedColor}
        lineWidth={0.55}
        transparent
        opacity={0.48}
      />
    </group>
  )
}

const orbitPoints: [number, number, number][] = Array.from({ length: 97 }, (_, index) => {
  const angle = (index / 96) * Math.PI * 2
  return [Math.cos(angle) * 2.72, 0, Math.sin(angle) * 1.18]
})

function PlanetDetails({ planet }: { planet: PlanetTheme }) {
  if (planet.variant === 'earth') {
    return (
      <group>
        <mesh position={[0.35, 0.35, 1.52]} scale={[0.9, 0.48, 0.16]} rotation={[0.1, 0.2, -0.35]}>
          <sphereGeometry args={[0.72, 18, 14]} />
          <meshStandardMaterial color={planet.detail} roughness={0.95} />
        </mesh>
        <mesh position={[-0.82, -0.28, 1.3]} scale={[0.52, 0.86, 0.16]} rotation={[0, -0.38, 0.28]}>
          <sphereGeometry args={[0.58, 16, 12]} />
          <meshStandardMaterial color={planet.highlight} roughness={0.95} />
        </mesh>
        <mesh rotation={[Math.PI / 2.25, 0.2, 0.24]}>
          <torusGeometry args={[1.61, 0.018, 8, 96]} />
          <meshBasicMaterial color={planet.highlight} transparent opacity={0.62} />
        </mesh>
        <mesh rotation={[Math.PI / 1.78, -0.1, -0.2]}>
          <torusGeometry args={[1.6, 0.012, 8, 96]} />
          <meshBasicMaterial color={planet.highlight} transparent opacity={0.34} />
        </mesh>
      </group>
    )
  }

  if (planet.variant === 'mars') {
    return (
      <group>
        {[
          [-0.72, 0.52, 1.42, 0.24],
          [0.54, 0.22, 1.52, 0.17],
          [0.16, -0.72, 1.44, 0.28],
        ].map(([x, y, z, size], index) => (
          <mesh position={[x, y, z]} key={index} rotation={[0, 0, index * 0.7]}>
            <torusGeometry args={[size, 0.035, 8, 28]} />
            <meshStandardMaterial color={planet.detail} roughness={1} />
          </mesh>
        ))}
        <mesh position={[-0.2, 0.76, 1.5]} scale={[1.3, 0.22, 0.1]}>
          <sphereGeometry args={[0.65, 18, 12]} />
          <meshBasicMaterial color={planet.highlight} transparent opacity={0.18} />
        </mesh>
      </group>
    )
  }

  if (planet.variant === 'neptune') {
    return (
      <group>
        {[-0.78, -0.38, 0.02, 0.42, 0.82].map((y, index) => (
          <mesh position={[0, y, 0]} key={y} rotation={[Math.PI / 2, 0, 0]}>
            <torusGeometry args={[Math.sqrt(Math.max(0.4, 2.55 - y * y)), index % 2 ? 0.022 : 0.038, 8, 96]} />
            <meshBasicMaterial color={index % 2 ? planet.highlight : planet.detail} transparent opacity={0.42} />
          </mesh>
        ))}
        <mesh position={[0.68, -0.35, 1.48]} scale={[1.4, 0.55, 0.18]} rotation={[0, 0.15, -0.25]}>
          <sphereGeometry args={[0.22, 18, 12]} />
          <meshBasicMaterial color={planet.highlight} transparent opacity={0.7} />
        </mesh>
      </group>
    )
  }

  if (planet.variant === 'saturn') {
    return (
      <group rotation={[1.16, 0.08, -0.22]}>
        <mesh>
          <ringGeometry args={[2.0, 2.72, 128]} />
          <meshStandardMaterial color={planet.ring} transparent opacity={0.62} side={THREE.DoubleSide} roughness={0.8} />
        </mesh>
        <mesh>
          <ringGeometry args={[2.22, 2.38, 128]} />
          <meshBasicMaterial color={planet.highlight} transparent opacity={0.54} side={THREE.DoubleSide} />
        </mesh>
      </group>
    )
  }

  if (planet.variant === 'moon') {
    return (
      <group>
        {[
          [-0.62, 0.45, 1.43, 0.28],
          [0.52, 0.7, 1.36, 0.2],
          [0.62, -0.34, 1.43, 0.34],
          [-0.15, -0.62, 1.5, 0.18],
        ].map(([x, y, z, size], index) => (
          <mesh position={[x, y, z]} key={index}>
            <torusGeometry args={[size, 0.045, 8, 30]} />
            <meshStandardMaterial color={planet.detail} roughness={1} />
          </mesh>
        ))}
      </group>
    )
  }

  return null
}

function Planet({ planet, reducedMotion }: { planet: PlanetTheme; reducedMotion: boolean }) {
  const rotatingPlanet = useRef<THREE.Group>(null)
  const glowMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const dotMaterial = useRef<THREE.PointsMaterial>(null)
  const scanLine = useRef<THREE.Group>(null)

  useFrame(({ clock }, delta) => {
    if (reducedMotion) return

    if (rotatingPlanet.current) rotatingPlanet.current.rotation.y += delta * planet.rotationSpeed
    if (glowMaterial.current) glowMaterial.current.opacity = 0.075 + Math.sin(clock.elapsedTime * 0.7) * 0.025
    if (dotMaterial.current) dotMaterial.current.opacity = 0.2 + Math.sin(clock.elapsedTime * 1.15) * 0.09

    if (scanLine.current) {
      const scanProgress = (clock.elapsedTime * 0.12) % 1
      const y = THREE.MathUtils.lerp(-1.42, 1.42, scanProgress)
      const width = Math.sqrt(Math.max(0, 1 - (y / 1.48) ** 2))
      scanLine.current.position.y = y
      scanLine.current.scale.x = Math.max(0.08, width)
    }
  })

  return (
    <group ref={rotatingPlanet} rotation={[0.12, 0, -0.18]} scale={planet.scale}>
      <mesh scale={1.24}>
        <sphereGeometry args={[1.62, 32, 32]} />
        <meshBasicMaterial
          ref={glowMaterial}
          color={planet.atmosphere}
          transparent
          opacity={0.075}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.62, 48, 48]} />
        <meshStandardMaterial color={planet.surface} roughness={0.84} metalness={0.08} />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[1.62, 28, 28]} />
        <meshBasicMaterial color={planet.detail} transparent opacity={0.075} wireframe />
      </mesh>
      <mesh scale={1.09}>
        <sphereGeometry args={[1.62, 32, 32]} />
        <meshBasicMaterial color={planet.atmosphere} transparent opacity={0.13} side={THREE.BackSide} />
      </mesh>
      <points scale={1.052}>
        <sphereGeometry args={[1.62, 20, 16]} />
        <pointsMaterial
          ref={dotMaterial}
          color={planet.highlight}
          size={0.02}
          sizeAttenuation
          transparent
          opacity={0.2}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>

      <PlanetDetails planet={planet} />

      {planet.variant === 'exoplanet' && (
        <>
          <group ref={scanLine} position={[0, -1.42, 1.57]}>
            <Line points={[[-1.45, 0, 0], [1.45, 0, 0]]} color={planet.highlight} lineWidth={0.7} transparent opacity={0.42} />
            <Line points={[[-1.45, -0.025, 0], [1.45, -0.025, 0]]} color={planet.detail} lineWidth={2.4} transparent opacity={0.08} />
          </group>
          <Line points={orbitPoints} color={planet.ring} lineWidth={0.45} transparent opacity={0.38} />
          <mesh position={[2.15, 0.08, 0]}>
            <sphereGeometry args={[0.1, 16, 16]} />
            <meshBasicMaterial color={planet.highlight} />
          </mesh>
        </>
      )}
    </group>
  )
}

interface PlanetTransitionState {
  current: PlanetTheme
  currentSection: SectionId
  previous: PlanetTheme | null
  direction: 1 | -1
  revision: number
}

function planetEdgeDirection(planet: PlanetTheme, fallback: 1 | -1): 1 | -1 {
  if (Math.abs(planet.position[0]) < 0.01) return fallback
  return planet.position[0] > 0 ? 1 : -1
}

function planetOffscreenOffset(
  planet: PlanetTheme,
  direction: 1 | -1,
  camera: THREE.Camera,
  aspect: number,
) {
  const cameraDepth = Math.max(
    Math.abs(camera.position.z - planet.position[2]),
    Math.abs(planet.camera[2] - planet.position[2]),
  )
  const halfViewportWidth = camera instanceof THREE.PerspectiveCamera
    ? Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * cameraDepth * aspect
    : 10
  const detailRadius = planet.variant === 'saturn' || planet.variant === 'exoplanet' ? 2.72 : 2.05
  const fullyHiddenCenter = direction * (halfViewportWidth + detailRadius * planet.scale + 0.9)

  return fullyHiddenCenter - planet.position[0]
}

function PlanetTransition({
  activeSection,
  theme,
  reducedMotion,
}: Pick<SpaceSceneProps, 'activeSection' | 'theme' | 'reducedMotion'>) {
  const { camera, size } = useThree()
  const incoming = useRef<THREE.Group>(null)
  const outgoing = useRef<THREE.Group>(null)
  const completedRevision = useRef(-1)
  const [transition, setTransition] = useState<PlanetTransitionState>(() => ({
    current: theme.planet,
    currentSection: activeSection,
    previous: null,
    direction: 1,
    revision: 0,
  }))

  useEffect(() => {
    setTransition((current) => {
      if (current.currentSection === activeSection) {
        return reducedMotion && current.previous ? { ...current, previous: null } : current
      }

      const direction = sectionOrder.indexOf(activeSection) >= sectionOrder.indexOf(current.currentSection) ? 1 : -1
      return {
        current: theme.planet,
        currentSection: activeSection,
        previous: reducedMotion ? null : current.current,
        direction,
        revision: current.revision + 1,
      }
    })
  }, [activeSection, reducedMotion, theme.planet])

  useLayoutEffect(() => {
    const next = incoming.current
    const previous = outgoing.current
    if (!next) return

    gsap.killTweensOf([next.position, next.scale])
    if (previous) gsap.killTweensOf([previous.position, previous.scale])

    if (reducedMotion || transition.revision === 0 || completedRevision.current === transition.revision) {
      gsap.set(next.position, { x: 0 })
      gsap.set(next.scale, { x: 1, y: 1, z: 1 })
      return
    }

    const timeline = gsap.timeline({
      onComplete: () => {
        completedRevision.current = transition.revision
        setTransition((current) => current.revision === transition.revision
          ? { ...current, previous: null }
          : current)
      },
    })

    const outgoingDirection = transition.previous
      ? planetEdgeDirection(transition.previous, transition.direction)
      : transition.direction
    const incomingDirection = planetEdgeDirection(transition.current, transition.direction)
    const aspect = size.width / Math.max(size.height, 1)
    const incomingOffset = planetOffscreenOffset(transition.current, incomingDirection, camera, aspect)
    const outgoingOffset = transition.previous
      ? planetOffscreenOffset(transition.previous, outgoingDirection, camera, aspect)
      : 0

    // Move the full model—including rings and orbit details—past the camera
    // frustum so it crosses the viewport wall instead of parking at its edge.
    gsap.set(next.position, { x: incomingOffset })
    gsap.set(next.scale, { x: 0.76, y: 0.76, z: 0.76 })

    if (previous) {
      timeline.to(previous.position, {
        x: outgoingOffset,
        duration: 0.5,
        ease: 'power2.inOut',
      }, 0)
      timeline.to(previous.scale, {
        x: 0.72,
        y: 0.72,
        z: 0.72,
        duration: 0.5,
        ease: 'power2.inOut',
      }, 0)
    }

    timeline.to(next.position, { x: 0, duration: 0.68, ease: 'expo.out' }, 0.52)
    timeline.to(next.scale, { x: 1, y: 1, z: 1, duration: 0.68, ease: 'expo.out' }, 0.52)

    return () => {
      timeline.kill()
    }
  }, [camera, reducedMotion, size.height, size.width, transition])

  return (
    <group>
      {transition.previous && (
        <group key={`outgoing-${transition.revision}`} ref={outgoing}>
          <group position={transition.previous.position}>
            <Planet planet={transition.previous} reducedMotion={reducedMotion} />
          </group>
        </group>
      )}
      <group key={`incoming-${transition.currentSection}-${transition.revision}`} ref={incoming}>
        <group position={transition.current.position}>
          <Planet planet={transition.current} reducedMotion={reducedMotion} />
        </group>
      </group>
    </group>
  )
}

function SceneEnvironment({ theme, reducedMotion }: Pick<SpaceSceneProps, 'theme' | 'reducedMotion'>) {
  const [background] = useState(() => new THREE.Color(sectionThemes.top.background))
  const fog = useRef<THREE.Fog>(null)
  const ambient = useRef<THREE.AmbientLight>(null)
  const keyLight = useRef<THREE.DirectionalLight>(null)
  const accentLight = useRef<THREE.PointLight>(null)
  const fillLight = useRef<THREE.PointLight>(null)

  useLayoutEffect(() => {
    const duration = reducedMotion ? 0 : 1.2
    const tweens = [tweenColor(background, theme.background, duration)]

    if (fog.current) tweens.push(tweenColor(fog.current.color, theme.fog, duration))
    if (ambient.current) tweens.push(tweenColor(ambient.current.color, theme.primary, duration))
    if (keyLight.current) tweens.push(tweenColor(keyLight.current.color, theme.light, duration))
    if (accentLight.current) tweens.push(tweenColor(accentLight.current.color, theme.secondary, duration))
    if (fillLight.current) tweens.push(tweenColor(fillLight.current.color, theme.primary, duration))

    return () => tweens.forEach((tween) => tween.kill())
  }, [background, reducedMotion, theme])

  return (
    <>
      <primitive object={background} attach="background" />
      <fog ref={fog} attach="fog" args={[sectionThemes.top.fog, 8, 26]} />
      <ambientLight ref={ambient} intensity={0.32} color={sectionThemes.top.primary} />
      <directionalLight ref={keyLight} position={[-4, 5, 5]} color={sectionThemes.top.light} intensity={2.05} />
      <pointLight ref={accentLight} position={[4, 1, 2]} color={sectionThemes.top.secondary} intensity={22} distance={10} />
      <pointLight ref={fillLight} position={[-4, -2, 0]} color={sectionThemes.top.primary} intensity={15} distance={8} />
    </>
  )
}

function SceneRig({
  progress,
  activeProjectId,
  activeSection,
  theme,
  reducedMotion,
  mobile,
}: SpaceSceneProps) {
  const world = useRef<THREE.Group>(null)
  const cameraPosition = useRef(new THREE.Vector3(...theme.planet.camera))
  const cameraTarget = useRef(new THREE.Vector3(...theme.planet.cameraTarget))

  useLayoutEffect(() => {
    const duration = reducedMotion ? 0 : 1.2
    const cameraTween = gsap.to(cameraPosition.current, {
      x: theme.planet.camera[0],
      y: theme.planet.camera[1],
      z: theme.planet.camera[2],
      duration,
      ease: 'expo.inOut',
      overwrite: true,
    })
    const targetTween = gsap.to(cameraTarget.current, {
      x: theme.planet.cameraTarget[0],
      y: theme.planet.cameraTarget[1],
      z: theme.planet.cameraTarget[2],
      duration,
      ease: 'expo.inOut',
      overwrite: true,
    })

    return () => {
      cameraTween.kill()
      targetTween.kill()
    }
  }, [reducedMotion, theme])

  useFrame(({ camera, pointer }, delta) => {
    const motionProgress = reducedMotion ? 0 : progress
    const pointerX = mobile || reducedMotion ? 0 : pointer.x * 0.14
    const pointerY = mobile || reducedMotion ? 0 : pointer.y * 0.09
    const targetX = cameraPosition.current.x + Math.sin(motionProgress * Math.PI * 1.8) * 0.32 + pointerX
    const targetY = cameraPosition.current.y - motionProgress * 0.34 + pointerY
    const targetZ = cameraPosition.current.z - motionProgress * 0.28
    const smoothing = 1 - Math.exp(-delta * 3.8)

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, smoothing)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, smoothing)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, smoothing)
    camera.lookAt(
      cameraTarget.current.x,
      cameraTarget.current.y - motionProgress * 0.18,
      cameraTarget.current.z,
    )

    if (world.current) {
      world.current.rotation.z = THREE.MathUtils.lerp(
        world.current.rotation.z,
        reducedMotion ? 0 : progress * -0.08,
        smoothing,
      )
    }
  })

  return (
    <group ref={world}>
      <StarField count={mobile ? 650 : 1250} color={theme.particle} reducedMotion={reducedMotion} />
      <PlanetTransition activeSection={activeSection} theme={theme} reducedMotion={reducedMotion} />
      <LidarCloud color={theme.primary} />
      <ProjectBeacons activeProjectId={activeProjectId} theme={theme} />
    </group>
  )
}

function SpaceScene(props: SpaceSceneProps) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [...props.theme.planet.camera], fov: props.mobile ? 58 : 48, near: 0.1, far: 80 }}
      dpr={props.mobile ? [1, 1.2] : [1, 1.65]}
      gl={{ alpha: true, antialias: !props.mobile, powerPreference: 'high-performance' }}
    >
      <SceneEnvironment theme={props.theme} reducedMotion={props.reducedMotion} />
      <SceneRig {...props} />
    </Canvas>
  )
}

export default memo(SpaceScene)
