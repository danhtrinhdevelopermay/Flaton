import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Float, Environment, OrbitControls } from '@react-three/drei'
import { useRef, useEffect, useState, Suspense, useMemo } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

function CustomModel({ scrollProgress }: { scrollProgress: number }) {
  const groupRef = useRef<THREE.Group>(null)
  const obj = useLoader(OBJLoader, '/models/output.obj')
  const texture = useLoader(THREE.TextureLoader, '/models/textured_mesh.jpg')
  
  const clonedObj = useMemo(() => {
    const clone = obj.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.3,
          roughness: 0.5,
        })
      }
    })
    
    const box = new THREE.Box3().setFromObject(clone)
    const center = box.getCenter(new THREE.Vector3())
    const size = box.getSize(new THREE.Vector3())
    const maxDim = Math.max(size.x, size.y, size.z)
    const scale = 3 / maxDim
    
    clone.scale.setScalar(scale)
    clone.position.sub(center.multiplyScalar(scale))
    
    return clone
  }, [obj, texture])

  useFrame(({ clock }) => {
    if (groupRef.current) {
      groupRef.current.rotation.y = clock.getElapsedTime() * 0.3 + scrollProgress * Math.PI * 2
      groupRef.current.rotation.x = Math.sin(scrollProgress * Math.PI) * 0.3
      groupRef.current.position.y = Math.sin(clock.getElapsedTime() * 0.5) * 0.2
      const baseScale = 1 + scrollProgress * 0.2
      groupRef.current.scale.setScalar(baseScale)
    }
  })

  return (
    <group ref={groupRef}>
      <Float speed={1.5} rotationIntensity={0.2} floatIntensity={0.5}>
        <primitive object={clonedObj} />
      </Float>
    </group>
  )
}

function ParticleField({ scrollProgress }: { scrollProgress: number }) {
  const pointsRef = useRef<THREE.Points>(null)
  const particleCount = 300
  
  const positions = useMemo(() => {
    const pos = new Float32Array(particleCount * 3)
    for (let i = 0; i < particleCount; i++) {
      pos[i * 3] = (Math.random() - 0.5) * 20
      pos[i * 3 + 1] = (Math.random() - 0.5) * 20
      pos[i * 3 + 2] = (Math.random() - 0.5) * 15
    }
    return pos
  }, [])

  useFrame(({ clock }) => {
    if (pointsRef.current) {
      pointsRef.current.rotation.y = clock.getElapsedTime() * 0.02 + scrollProgress * 0.5
      pointsRef.current.rotation.x = scrollProgress * 0.2
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
      <pointsMaterial 
        size={0.03} 
        color="#818cf8" 
        transparent 
        opacity={0.5}
        sizeAttenuation
      />
    </points>
  )
}

function LoadingFallback() {
  const meshRef = useRef<THREE.Mesh>(null)
  
  useFrame(({ clock }) => {
    if (meshRef.current) {
      meshRef.current.rotation.y = clock.getElapsedTime() * 0.5
    }
  })

  return (
    <mesh ref={meshRef}>
      <icosahedronGeometry args={[1.5, 1]} />
      <meshStandardMaterial color="#6366f1" wireframe />
    </mesh>
  )
}

function Scene({ scrollProgress }: { scrollProgress: number }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" castShadow />
      <directionalLight position={[-5, 3, 2]} intensity={0.8} color="#a855f7" />
      <pointLight position={[-5, -5, 5]} intensity={0.6} color="#06b6d4" />
      <pointLight position={[5, -5, -5]} intensity={0.4} color="#ec4899" />
      
      <Suspense fallback={<LoadingFallback />}>
        <CustomModel scrollProgress={scrollProgress} />
      </Suspense>
      
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
      const progress = docHeight > 0 ? Math.min(scrollTop / docHeight, 1) : 0
      setScrollProgress(progress)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <div ref={containerRef} className="fixed inset-0 -z-10">
      <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950" />
      <Canvas
        camera={{ position: [0, 0, 5], fov: 50 }}
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
