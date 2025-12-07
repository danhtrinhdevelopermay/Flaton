import { Canvas, useFrame, useThree } from '@react-three/fiber'
import { Float, MeshDistortMaterial, Sphere, Torus, Box, Icosahedron } from '@react-three/drei'
import { useRef, useEffect, useState, Suspense } from 'react'
import * as THREE from 'three'

function ScrollAnimatedMesh({ scrollProgress }: { scrollProgress: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const groupRef = useRef<THREE.Group>(null)
  
  useFrame(() => {
    if (meshRef.current && groupRef.current) {
      meshRef.current.rotation.x = scrollProgress * Math.PI * 2
      meshRef.current.rotation.y = scrollProgress * Math.PI * 3
      groupRef.current.position.y = Math.sin(scrollProgress * Math.PI) * 0.5
      groupRef.current.scale.setScalar(1 + scrollProgress * 0.3)
    }
  })

  return (
    <group ref={groupRef}>
      <Float speed={2} rotationIntensity={0.5} floatIntensity={1}>
        <Icosahedron ref={meshRef} args={[1.5, 1]} position={[0, 0, 0]}>
          <MeshDistortMaterial
            color="#6366f1"
            attach="material"
            distort={0.4}
            speed={2}
            roughness={0.2}
            metalness={0.8}
          />
        </Icosahedron>
      </Float>
    </group>
  )
}

function FloatingRing({ scrollProgress, position, color, scale = 1, rotationSpeed = 1 }: { 
  scrollProgress: number
  position: [number, number, number]
  color: string
  scale?: number
  rotationSpeed?: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.3 * rotationSpeed + scrollProgress * Math.PI
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5 * rotationSpeed
      meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() + scrollProgress * 5) * 0.3
    }
  })

  return (
    <Torus ref={meshRef} args={[0.8 * scale, 0.1 * scale, 16, 32]} position={position}>
      <meshStandardMaterial color={color} metalness={0.9} roughness={0.1} />
    </Torus>
  )
}

function FloatingSphere({ scrollProgress, position, color, scale = 1 }: { 
  scrollProgress: number
  position: [number, number, number]
  color: string
  scale?: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.position.x = position[0] + Math.sin(clock.getElapsedTime() * 0.5) * 0.5
      meshRef.current.position.y = position[1] + Math.cos(clock.getElapsedTime() * 0.7 + scrollProgress * 3) * 0.4
    }
  })

  return (
    <Sphere ref={meshRef} args={[0.3 * scale, 32, 32]} position={position}>
      <MeshDistortMaterial
        color={color}
        attach="material"
        distort={0.3}
        speed={3}
        roughness={0.1}
        metalness={0.9}
      />
    </Sphere>
  )
}

function FloatingCube({ scrollProgress, position, color, scale = 1 }: { 
  scrollProgress: number
  position: [number, number, number]
  color: string
  scale?: number 
}) {
  const meshRef = useRef<THREE.Mesh>(null)

  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.x = clock.getElapsedTime() * 0.4 + scrollProgress * Math.PI * 2
      meshRef.current.rotation.z = clock.getElapsedTime() * 0.3
      meshRef.current.position.y = position[1] + Math.sin(clock.getElapsedTime() * 0.8) * 0.3
    }
  })

  return (
    <Box ref={meshRef} args={[0.5 * scale, 0.5 * scale, 0.5 * scale]} position={position}>
      <meshStandardMaterial color={color} metalness={0.8} roughness={0.2} />
    </Box>
  )
}

function ParticleField({ scrollProgress }: { scrollProgress: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 200
  
  const positions = new Float32Array(particleCount * 3)
  for (let i = 0; i < particleCount; i++) {
    positions[i * 3] = (Math.random() - 0.5) * 15
    positions[i * 3 + 1] = (Math.random() - 0.5) * 15
    positions[i * 3 + 2] = (Math.random() - 0.5) * 10
  }

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02 + scrollProgress * 0.5
      pointsRef.current.rotation.x = scrollProgress * 0.3
    }
  })

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
        />
      </bufferGeometry>
      <pointsMaterial size={0.02} color="#818cf8" transparent opacity={0.6} />
    </points>
  )
}

function Scene({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} color="#ffffff" />
      <pointLight position={[-5, -5, 5]} intensity={0.5} color="#a855f7" />
      <pointLight position={[5, -5, -5]} intensity={0.5} color="#06b6d4" />
      
      <ScrollAnimatedMesh scrollProgress={scrollProgress} />
      
      <FloatingRing 
        scrollProgress={scrollProgress} 
        position={[-2.5, 1, -2]} 
        color="#ec4899"
        scale={0.8}
        rotationSpeed={0.7}
      />
      <FloatingRing 
        scrollProgress={scrollProgress} 
        position={[2.5, -0.5, -1]} 
        color="#06b6d4"
        scale={0.6}
        rotationSpeed={1.2}
      />
      
      <FloatingSphere 
        scrollProgress={scrollProgress} 
        position={[-3, -1, 0]} 
        color="#a855f7"
        scale={1.2}
      />
      <FloatingSphere 
        scrollProgress={scrollProgress} 
        position={[3, 1.5, -1]} 
        color="#f59e0b"
        scale={0.8}
      />
      
      <FloatingCube 
        scrollProgress={scrollProgress} 
        position={[-2, 2, -2]} 
        color="#22c55e"
        scale={0.7}
      />
      <FloatingCube 
        scrollProgress={scrollProgress} 
        position={[2.5, -1.5, -1.5]} 
        color="#ef4444"
        scale={0.5}
      />
      
      <ParticleField scrollProgress={scrollProgress} />
    </>
  )
}

export default function Hero3D() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleScroll = () => {
      const scrollTop = window.scrollY
      const docHeight = document.documentElement.scrollHeight - window.innerHeight
      const progress = Math.min(scrollTop / docHeight, 1)
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950" />
      <Canvas
        camera={{ position: [0, 0, 6], fov: 50 }}
        gl={{ antialias: true, alpha: true }}
        style={{ background: 'transparent' }}
      >
        <Suspense fallback={null}>
          <Scene scrollProgress={scrollProgress} />
        </Suspense>
      </Canvas>
    </div>
  )
}
