import { Line } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { memo, useMemo, useRef } from 'react'
import * as THREE from 'three'

interface SpaceSceneProps {
  progress: number
  activeProjectId: string | null
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

function StarField({ count }: { count: number }) {
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

  return (
    <points>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color="#f4f7f6" size={0.032} sizeAttenuation transparent opacity={0.76} />
    </points>
  )
}

function LidarCloud() {
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
        <pointsMaterial color="#4a90e2" size={0.038} sizeAttenuation transparent opacity={0.88} />
      </points>
      <Line
        points={[
          [-1.5, 0, 0],
          [1.5, 0, 0],
        ]}
        color="#4a90e2"
        lineWidth={0.45}
        transparent
        opacity={0.35}
      />
    </group>
  )
}

const beaconColors: Record<string, string> = {
  'flash-cards': '#4a90e2',
  'esports-organizer': '#e0f4ff',
  'vehicle-reservation': '#ff6b35',
  'space-invaders': '#4a90e2',
}

function ProjectBeacons({ activeProjectId }: { activeProjectId: string | null }) {
  const group = useRef<THREE.Group>(null)
  const selectedColor = activeProjectId ? beaconColors[activeProjectId] : '#4a90e2'

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
        <meshStandardMaterial color="#4a90e2" emissive="#4a90e2" emissiveIntensity={0.65} wireframe />
      </mesh>
      <mesh position={[0.9, -0.3, -0.1]} rotation={[0.2, 0, 0.8]}>
        <torusGeometry args={[0.32, 0.07, 8, 24]} />
        <meshStandardMaterial color="#ff6b35" emissive="#ff6b35" emissiveIntensity={0.62} />
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
        opacity={0.5}
      />
    </group>
  )
}

function Planet({ reducedMotion }: { reducedMotion: boolean }) {
  const planet = useRef<THREE.Group>(null)
  const glowMaterial = useRef<THREE.MeshBasicMaterial>(null)
  const dotMaterial = useRef<THREE.PointsMaterial>(null)
  const scanLine = useRef<THREE.Group>(null)

  useFrame(({ clock }, delta) => {
    if (reducedMotion) return

    if (planet.current) planet.current.rotation.y += delta * 0.025
    if (glowMaterial.current) {
      glowMaterial.current.opacity = 0.045 + Math.sin(clock.elapsedTime * 0.7) * 0.018
    }
    if (dotMaterial.current) {
      dotMaterial.current.opacity = 0.28 + Math.sin(clock.elapsedTime * 1.15) * 0.12
    }
    if (scanLine.current) {
      const scanProgress = (clock.elapsedTime * 0.12) % 1
      const y = THREE.MathUtils.lerp(-1.42, 1.42, scanProgress)
      const width = Math.sqrt(Math.max(0, 1 - (y / 1.48) ** 2))
      scanLine.current.position.y = y
      scanLine.current.scale.x = Math.max(0.08, width)
    }
  })

  const orbit = useMemo(() => {
    const points: [number, number, number][] = []
    for (let index = 0; index <= 96; index += 1) {
      const angle = (index / 96) * Math.PI * 2
      points.push([Math.cos(angle) * 2.72, 0, Math.sin(angle) * 1.18])
    }
    return points
  }, [])

  return (
    <group ref={planet} position={[2.65, 0.1, -2.3]} rotation={[0.12, 0, -0.18]}>
      <mesh scale={1.24}>
        <sphereGeometry args={[1.62, 32, 32]} />
        <meshBasicMaterial
          ref={glowMaterial}
          color="#4a90e2"
          transparent
          opacity={0.045}
          side={THREE.BackSide}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </mesh>
      <mesh>
        <sphereGeometry args={[1.62, 48, 48]} />
        <meshStandardMaterial color="#0a192f" roughness={0.82} metalness={0.1} />
      </mesh>
      <mesh scale={1.045}>
        <sphereGeometry args={[1.62, 32, 32]} />
        <meshBasicMaterial color="#4a90e2" transparent opacity={0.11} wireframe />
      </mesh>
      <mesh scale={1.09}>
        <sphereGeometry args={[1.62, 32, 32]} />
        <meshBasicMaterial
          color="#e0f4ff"
          transparent
          opacity={0.11}
          side={THREE.BackSide}
        />
      </mesh>
      <points scale={1.052}>
        <sphereGeometry args={[1.62, 22, 18]} />
        <pointsMaterial
          ref={dotMaterial}
          color="#e0f4ff"
          size={0.022}
          sizeAttenuation
          transparent
          opacity={0.28}
          blending={THREE.AdditiveBlending}
          depthWrite={false}
        />
      </points>
      <group ref={scanLine} position={[0, -1.42, 1.57]}>
        <Line
          points={[
            [-1.45, 0, 0],
            [1.45, 0, 0],
          ]}
          color="#e0f4ff"
          lineWidth={0.7}
          transparent
          opacity={0.42}
        />
        <Line
          points={[
            [-1.45, -0.025, 0],
            [1.45, -0.025, 0],
          ]}
          color="#4a90e2"
          lineWidth={2.4}
          transparent
          opacity={0.08}
        />
      </group>
      <Line points={orbit} color="#4a90e2" lineWidth={0.45} transparent opacity={0.38} />
      <mesh position={[2.15, 0.08, 0]}>
        <sphereGeometry args={[0.1, 16, 16]} />
        <meshBasicMaterial color="#ff6b35" />
      </mesh>
    </group>
  )
}

function SceneRig({
  progress,
  activeProjectId,
  reducedMotion,
  mobile,
}: SpaceSceneProps) {
  const world = useRef<THREE.Group>(null)

  useFrame(({ camera, pointer }, delta) => {
    const motionProgress = reducedMotion ? 0.08 : progress
    const pointerX = mobile || reducedMotion ? 0 : pointer.x * 0.16
    const pointerY = mobile || reducedMotion ? 0 : pointer.y * 0.1
    const targetX = Math.sin(motionProgress * Math.PI * 1.8) * 1.25 + pointerX
    const targetY = 0.35 - motionProgress * 1.15 + pointerY
    const targetZ = 8.2 - motionProgress * 1.65
    const smoothing = 1 - Math.exp(-delta * 3.4)

    camera.position.x = THREE.MathUtils.lerp(camera.position.x, targetX, smoothing)
    camera.position.y = THREE.MathUtils.lerp(camera.position.y, targetY, smoothing)
    camera.position.z = THREE.MathUtils.lerp(camera.position.z, targetZ, smoothing)
    camera.lookAt(0, -0.2 - motionProgress * 0.55, -1.4)

    if (world.current) {
      world.current.rotation.z = THREE.MathUtils.lerp(
        world.current.rotation.z,
        reducedMotion ? 0 : progress * -0.12,
        smoothing,
      )
    }
  })

  return (
    <group ref={world}>
      <StarField count={mobile ? 650 : 1250} />
      <Planet reducedMotion={reducedMotion} />
      <LidarCloud />
      <ProjectBeacons activeProjectId={activeProjectId} />
    </group>
  )
}

function SpaceScene(props: SpaceSceneProps) {
  return (
    <Canvas
      aria-hidden="true"
      camera={{ position: [0, 0.35, 8.2], fov: props.mobile ? 58 : 48, near: 0.1, far: 80 }}
      dpr={props.mobile ? [1, 1.25] : [1, 1.75]}
      gl={{ alpha: true, antialias: !props.mobile, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#0a192f']} />
      <fog attach="fog" args={['#0a192f', 8, 26]} />
      <ambientLight intensity={0.32} color="#4a90e2" />
      <directionalLight position={[-4, 5, 5]} color="#f4f7f6" intensity={2.05} />
      <pointLight position={[4, 1, 2]} color="#ff6b35" intensity={22} distance={10} />
      <pointLight position={[-4, -2, 0]} color="#4a90e2" intensity={15} distance={8} />
      <SceneRig {...props} />
    </Canvas>
  )
}

export default memo(SpaceScene)
