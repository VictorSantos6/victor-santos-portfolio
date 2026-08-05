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
    ease: 'power2.out',
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
    ? {
        'flash-cards': theme.primary,
        'esports-organizer': theme.glow,
        'vehicle-reservation': theme.secondary,
        'space-invaders': theme.planet.detail,
      }[activeProjectId] ?? theme.primary
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

function smoothstep(edge0: number, edge1: number, value: number) {
  const amount = THREE.MathUtils.clamp((value - edge0) / (edge1 - edge0), 0, 1)
  return amount * amount * (3 - 2 * amount)
}

function textureNoise(x: number, y: number) {
  const value = Math.sin(x * 127.1 + y * 311.7) * 43758.5453123
  return value - Math.floor(value)
}

function interpolatedNoise(x: number, y: number) {
  const x0 = Math.floor(x)
  const y0 = Math.floor(y)
  const tx = smoothstep(0, 1, x - x0)
  const ty = smoothstep(0, 1, y - y0)
  const top = THREE.MathUtils.lerp(textureNoise(x0, y0), textureNoise(x0 + 1, y0), tx)
  const bottom = THREE.MathUtils.lerp(textureNoise(x0, y0 + 1), textureNoise(x0 + 1, y0 + 1), tx)
  return THREE.MathUtils.lerp(top, bottom, ty)
}

function fractalNoise(x: number, y: number) {
  let amplitude = 0.55
  let frequency = 1
  let value = 0
  let weight = 0

  for (let octave = 0; octave < 5; octave += 1) {
    value += interpolatedNoise(x * frequency, y * frequency) * amplitude
    weight += amplitude
    amplitude *= 0.5
    frequency *= 2.03
  }

  return value / weight
}

function wrappedDistance(value: number, center: number) {
  const distance = Math.abs(value - center)
  return Math.min(distance, 1 - distance)
}

function continentField(u: number, v: number) {
  const ellipse = (
    centerX: number,
    centerY: number,
    radiusX: number,
    radiusY: number,
    rotation: number,
  ) => {
    const x = wrappedDistance(u, centerX) * (u < centerX && Math.abs(u - centerX) < 0.5 ? -1 : 1)
    const y = v - centerY
    const cosine = Math.cos(rotation)
    const sine = Math.sin(rotation)
    const rotatedX = x * cosine - y * sine
    const rotatedY = x * sine + y * cosine
    return 1 - Math.hypot(rotatedX / radiusX, rotatedY / radiusY)
  }

  // Broad, overlapping plates suggest familiar geography without creating raised clay meshes.
  const plates = [
    ellipse(0.2, 0.68, 0.12, 0.15, -0.2),
    ellipse(0.27, 0.59, 0.08, 0.1, 0.35),
    ellipse(0.31, 0.38, 0.065, 0.2, -0.38),
    ellipse(0.49, 0.79, 0.055, 0.075, 0.12),
    ellipse(0.53, 0.49, 0.085, 0.19, 0.18),
    ellipse(0.57, 0.67, 0.12, 0.075, -0.12),
    ellipse(0.69, 0.67, 0.18, 0.09, 0.08),
    ellipse(0.79, 0.59, 0.11, 0.13, -0.35),
    ellipse(0.83, 0.31, 0.075, 0.065, 0.15),
  ]
  const land = Math.max(...plates)
  const carvedWaterways = Math.max(
    ellipse(0.43, 0.62, 0.075, 0.035, -0.08),
    ellipse(0.58, 0.59, 0.035, 0.08, 0.35),
  )
  const coastlineNoise = (fractalNoise(u * 9.5, v * 8.5) - 0.5) * 0.42

  return Math.min(land + coastlineNoise, -carvedWaterways + 0.16)
}

function createIllustratedEarthTexture(planet: PlanetTheme) {
  const width = 768
  const height = 384
  const colorData = new Uint8Array(width * height * 4)
  const oceanDeep = new THREE.Color(planet.surface).multiplyScalar(0.52)
  const atmosphereColor = new THREE.Color(planet.atmosphere)
  const oceanMid = new THREE.Color(planet.surface).lerp(atmosphereColor, 0.48)
  const oceanLight = new THREE.Color(planet.surface).lerp(atmosphereColor, 0.78)
  const coast = new THREE.Color(planet.surface).multiplyScalar(0.38)
  const highlightColor = new THREE.Color(planet.highlight)
  const landShadow = new THREE.Color(planet.detail).lerp(highlightColor, 0.08)
  const landMid = new THREE.Color(planet.detail).lerp(highlightColor, 0.28)
  const landLight = new THREE.Color(planet.detail).lerp(highlightColor, 0.64)
  const landBright = new THREE.Color(planet.detail).lerp(highlightColor, 0.9)
  const pixelColor = new THREE.Color()

  for (let y = 0; y < height; y += 1) {
    const v = 1 - y / (height - 1)

    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1)
      const index = (y * width + x) * 4
      const landField = continentField(u, v)
      const terrain = fractalNoise(u * 12 + 5, v * 10 + 9)
      const oceanFlow = THREE.MathUtils.clamp(
        0.5
          + Math.sin(u * Math.PI * 5 + Math.sin(v * Math.PI * 4) * 1.3) * 0.16
          + Math.sin(u * Math.PI * 9 - v * Math.PI * 5) * 0.09
          + (fractalNoise(u * 4 + 21, v * 4 + 13) - 0.5) * 0.28,
        0,
        1,
      )
      const oceanBand = Math.floor(oceanFlow * 5) / 4
      const oceanContour = Math.abs(oceanFlow * 5 - Math.round(oceanFlow * 5)) < 0.045

      pixelColor.copy(oceanDeep)
      if (oceanBand >= 0.25) pixelColor.copy(oceanMid)
      if (oceanBand >= 0.75) pixelColor.copy(oceanLight)
      if (oceanContour) pixelColor.lerp(atmosphereColor, 0.14)

      if (landField > -0.045) pixelColor.copy(coast)
      if (landField > -0.016) {
        const landBand = Math.floor(terrain * 4)
        if (landBand <= 0) pixelColor.copy(landShadow)
        else if (landBand === 1) pixelColor.copy(landMid)
        else if (landBand === 2) pixelColor.copy(landLight)
        else pixelColor.copy(landBright)

        const innerCoast = smoothstep(-0.016, 0.075, landField)
        pixelColor.lerp(landBright, (1 - innerCoast) * 0.9)
      }

      colorData[index] = Math.round(THREE.MathUtils.clamp(pixelColor.r, 0, 1) * 255)
      colorData[index + 1] = Math.round(THREE.MathUtils.clamp(pixelColor.g, 0, 1) * 255)
      colorData[index + 2] = Math.round(THREE.MathUtils.clamp(pixelColor.b, 0, 1) * 255)
      colorData[index + 3] = 255
    }
  }

  const texture = new THREE.DataTexture(colorData, width, height, THREE.RGBAFormat)
  texture.wrapS = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

function createTextureFromData(data: Uint8Array, width: number, height: number) {
  const texture = new THREE.DataTexture(data, width, height, THREE.RGBAFormat)
  texture.wrapS = THREE.RepeatWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

function writeTextureColor(data: Uint8Array, index: number, color: THREE.Color) {
  data[index] = Math.round(THREE.MathUtils.clamp(color.r, 0, 1) * 255)
  data[index + 1] = Math.round(THREE.MathUtils.clamp(color.g, 0, 1) * 255)
  data[index + 2] = Math.round(THREE.MathUtils.clamp(color.b, 0, 1) * 255)
  data[index + 3] = 255
}

function illustratedDistance(u: number, v: number, centerX: number, centerY: number, radius: number) {
  // Equirectangular textures span 2π horizontally and π vertically.
  const x = wrappedDistance(u, centerX) * 2
  const y = v - centerY
  return Math.hypot(x, y) / radius
}

function createIllustratedMarsTexture(planet: PlanetTheme) {
  const width = 768
  const height = 384
  const data = new Uint8Array(width * height * 4)
  const deep = new THREE.Color(planet.detail).multiplyScalar(0.62)
  const shadow = new THREE.Color(planet.detail).lerp(new THREE.Color(planet.surface), 0.4)
  const mid = new THREE.Color(planet.surface)
  const bright = new THREE.Color(planet.surface).lerp(new THREE.Color(planet.atmosphere), 0.72)
  const rim = new THREE.Color(planet.atmosphere).lerp(new THREE.Color(planet.highlight), 0.28)
  const pixelColor = new THREE.Color()
  const craters = [
    [0.16, 0.7, 0.028], [0.29, 0.34, 0.085], [0.42, 0.63, 0.052],
    [0.56, 0.78, 0.022], [0.68, 0.49, 0.035], [0.78, 0.27, 0.068],
    [0.89, 0.62, 0.021], [0.52, 0.22, 0.035], [0.08, 0.43, 0.018],
  ] as const

  for (let y = 0; y < height; y += 1) {
    const v = 1 - y / (height - 1)
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1)
      const index = (y * width + x) * 4
      const terrain = THREE.MathUtils.clamp(
        fractalNoise(u * 7 + 19, v * 6 + 31)
          + Math.sin(u * Math.PI * 4 + v * Math.PI * 3) * 0.12,
        0,
        1,
      )
      const terrainBand = Math.floor(terrain * 5)

      if (terrainBand <= 0) pixelColor.copy(deep)
      else if (terrainBand <= 1) pixelColor.copy(shadow)
      else if (terrainBand <= 3) pixelColor.copy(mid)
      else pixelColor.copy(bright)

      for (const [centerX, centerY, radius] of craters) {
        const distance = illustratedDistance(u, v, centerX, centerY, radius)
        if (distance < 1.18 && distance > 0.84) pixelColor.copy(rim)
        else if (distance <= 0.84) {
          pixelColor.copy(deep).lerp(shadow, smoothstep(0.1, 0.82, distance))
          if (distance < 0.22) pixelColor.lerp(bright, 0.18)
        }
      }

      const etchedContour = Math.abs(terrain * 6 - Math.round(terrain * 6)) < 0.025
      if (etchedContour) pixelColor.lerp(rim, 0.15)
      writeTextureColor(data, index, pixelColor)
    }
  }

  return createTextureFromData(data, width, height)
}

function createIllustratedNeptuneTexture(planet: PlanetTheme) {
  const width = 768
  const height = 384
  const data = new Uint8Array(width * height * 4)
  const palette = [
    new THREE.Color(planet.ring).lerp(new THREE.Color(planet.surface), 0.25),
    new THREE.Color(planet.surface),
    new THREE.Color(planet.surface).lerp(new THREE.Color(planet.detail), 0.58),
    new THREE.Color(planet.detail),
    new THREE.Color(planet.detail).lerp(new THREE.Color(planet.atmosphere), 0.62),
    new THREE.Color(planet.atmosphere).lerp(new THREE.Color(planet.highlight), 0.62),
  ]
  const stormDark = new THREE.Color(planet.ring).lerp(new THREE.Color(planet.surface), 0.4)
  const stormLight = new THREE.Color(planet.highlight)
  const pixelColor = new THREE.Color()
  const storms = [[0.18, 0.68, 0.025], [0.56, 0.34, 0.052], [0.81, 0.72, 0.034]] as const

  for (let y = 0; y < height; y += 1) {
    const v = 1 - y / (height - 1)
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1)
      const index = (y * width + x) * 4
      const distortion = (fractalNoise(u * 4 + 7, v * 5 + 23) - 0.5) * 2.2
      const phase = v * Math.PI * 13
        + Math.sin(u * Math.PI * 4) * 1.35
        + Math.sin(u * Math.PI * 9 - v * Math.PI * 3) * 0.46
        + distortion
      const ribbon = 0.5 + Math.sin(phase) * 0.32 + Math.sin(phase * 0.47 + 1.1) * 0.18
      const paletteIndex = THREE.MathUtils.clamp(Math.floor(ribbon * palette.length), 0, palette.length - 1)
      pixelColor.copy(palette[paletteIndex])

      const fineRibbon = Math.abs(Math.sin(phase * 1.96))
      if (fineRibbon < 0.055) pixelColor.lerp(stormLight, 0.56)

      for (const [centerX, centerY, radius] of storms) {
        const distance = illustratedDistance(u, v, centerX, centerY, radius)
        if (distance < 1.25 && distance > 0.82) pixelColor.copy(stormLight)
        else if (distance <= 0.82) pixelColor.copy(stormDark).lerp(stormLight, smoothstep(0.05, 0.8, distance) * 0.44)
      }

      writeTextureColor(data, index, pixelColor)
    }
  }

  return createTextureFromData(data, width, height)
}

function createIllustratedMoonTexture(planet: PlanetTheme) {
  const width = 768
  const height = 384
  const data = new Uint8Array(width * height * 4)
  const light = new THREE.Color(planet.highlight)
  const base = new THREE.Color(planet.atmosphere).lerp(light, 0.56)
  const shade = new THREE.Color(planet.surface).lerp(new THREE.Color(planet.atmosphere), 0.44)
  const crater = new THREE.Color(planet.detail).lerp(new THREE.Color(planet.surface), 0.5)
  const craterRim = new THREE.Color(planet.atmosphere).lerp(light, 0.28)
  const pixelColor = new THREE.Color()
  const craters = [
    [0.09, 0.28, 0.02], [0.14, 0.72, 0.055], [0.23, 0.46, 0.023],
    [0.32, 0.79, 0.075], [0.38, 0.25, 0.036], [0.47, 0.56, 0.03],
    [0.58, 0.32, 0.052], [0.66, 0.74, 0.028], [0.74, 0.47, 0.02],
    [0.82, 0.22, 0.067], [0.9, 0.62, 0.045], [0.96, 0.38, 0.018],
  ] as const

  for (let y = 0; y < height; y += 1) {
    const v = 1 - y / (height - 1)
    for (let x = 0; x < width; x += 1) {
      const u = x / (width - 1)
      const index = (y * width + x) * 4
      const paperGrain = (fractalNoise(u * 11 + 41, v * 9 + 17) - 0.5) * 0.12
      const sideShadow = smoothstep(0.64, 0.92, u + Math.sin(v * Math.PI) * 0.06)
      const lowerShadow = smoothstep(0.72, 0.98, 1 - v)
      pixelColor.copy(base).lerp(light, 0.16 + paperGrain)
      pixelColor.lerp(shade, Math.max(sideShadow * 0.72, lowerShadow * 0.48))

      for (const [centerX, centerY, radius] of craters) {
        const distance = illustratedDistance(u, v, centerX, centerY, radius)
        if (distance < 1.14 && distance > 0.86) pixelColor.copy(craterRim)
        else if (distance <= 0.86) pixelColor.copy(crater).lerp(shade, smoothstep(0.12, 0.86, distance) * 0.5)
      }

      writeTextureColor(data, index, pixelColor)
    }
  }

  return createTextureFromData(data, width, height)
}

function createIllustratedPlanetTexture(planet: PlanetTheme) {
  if (planet.variant === 'earth') return createIllustratedEarthTexture(planet)
  if (planet.variant === 'mars') return createIllustratedMarsTexture(planet)
  if (planet.variant === 'neptune') return createIllustratedNeptuneTexture(planet)
  return createIllustratedMoonTexture(planet)
}

function IllustratedPlanetSurface({ planet }: { planet: PlanetTheme }) {
  const texture = useMemo(() => createIllustratedPlanetTexture(planet), [planet])

  useEffect(() => () => texture.dispose(), [texture])

  return (
    <mesh>
      <sphereGeometry args={[1.62, 96, 96]} />
      <meshBasicMaterial map={texture} toneMapped={false} />
    </mesh>
  )
}

function PlanetDetails({ planet }: { planet: PlanetTheme }) {
  if (planet.variant === 'earth' || planet.variant === 'mars' || planet.variant === 'neptune' || planet.variant === 'moon') return null

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

  return null
}

function Planet({ planet, reducedMotion }: { planet: PlanetTheme; reducedMotion: boolean }) {
  const rotatingPlanet = useRef<THREE.Group>(null)
  const glowMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const dotMaterial = useRef<THREE.PointsMaterial>(null)
  const scanLine = useRef<THREE.Group>(null)
  const hasIllustratedSurface = planet.variant === 'earth'
    || planet.variant === 'mars'
    || planet.variant === 'neptune'
    || planet.variant === 'moon'

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
      {hasIllustratedSurface ? (
        <IllustratedPlanetSurface planet={planet} />
      ) : (
        <mesh>
          <sphereGeometry args={[1.62, 48, 48]} />
          <meshStandardMaterial color={planet.surface} roughness={0.84} metalness={0.08} />
        </mesh>
      )}
      {!hasIllustratedSurface && (
        <mesh scale={1.045}>
          <sphereGeometry args={[1.62, 28, 28]} />
          <meshBasicMaterial color={planet.detail} transparent opacity={0.075} wireframe />
        </mesh>
      )}
      <mesh scale={1.09}>
        <sphereGeometry args={[1.62, 32, 32]} />
        <meshBasicMaterial color={planet.atmosphere} transparent opacity={0.13} side={THREE.BackSide} />
      </mesh>
      {!hasIllustratedSurface && (
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
      )}

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
        duration: 0.28,
        ease: 'power2.in',
      }, 0)
      timeline.to(previous.scale, {
        x: 0.72,
        y: 0.72,
        z: 0.72,
        duration: 0.28,
        ease: 'power2.in',
      }, 0)
    }

    timeline.to(next.position, { x: 0, duration: 0.4, ease: 'power3.out' }, 0.24)
    timeline.to(next.scale, { x: 1, y: 1, z: 1, duration: 0.4, ease: 'power3.out' }, 0.24)

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
    const duration = reducedMotion ? 0 : 0.38
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
    const duration = reducedMotion ? 0 : 0.42
    const cameraTween = gsap.to(cameraPosition.current, {
      x: theme.planet.camera[0],
      y: theme.planet.camera[1],
      z: theme.planet.camera[2],
      duration,
      ease: 'power2.out',
      overwrite: true,
    })
    const targetTween = gsap.to(cameraTarget.current, {
      x: theme.planet.cameraTarget[0],
      y: theme.planet.cameraTarget[1],
      z: theme.planet.cameraTarget[2],
      duration,
      ease: 'power2.out',
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
