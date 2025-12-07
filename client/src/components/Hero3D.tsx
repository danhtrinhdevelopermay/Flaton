import { Canvas, useFrame, useLoader } from '@react-three/fiber'
import { Float, useProgress } from '@react-three/drei'
import { useRef, useEffect, useState, Suspense, useMemo, useCallback } from 'react'
import * as THREE from 'three'
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js'

function Model3D({ 
  objPath, 
  texturePath, 
  scrollProgress, 
  opacity,
  onLoaded 
}: { 
  objPath: string
  texturePath: string
  scrollProgress: number
  opacity: number
  onLoaded?: () => void 
}) {
  const groupRef = useRef<THREE.Group>(null)
  const obj = useLoader(OBJLoader, objPath)
  const texture = useLoader(THREE.TextureLoader, texturePath)
  
  const clonedObj = useMemo(() => {
    const clone = obj.clone()
    clone.traverse((child) => {
      if (child instanceof THREE.Mesh) {
        child.material = new THREE.MeshStandardMaterial({
          map: texture,
          metalness: 0.3,
          roughness: 0.5,
          transparent: true,
          opacity: opacity,
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
  }, [obj, texture, opacity])

  useEffect(() => {
    if (clonedObj && onLoaded) {
      onLoaded()
    }
  }, [clonedObj, onLoaded])

  useEffect(() => {
    if (clonedObj) {
      clonedObj.traverse((child) => {
        if (child instanceof THREE.Mesh && child.material instanceof THREE.MeshStandardMaterial) {
          child.material.opacity = opacity
          child.material.needsUpdate = true
        }
      })
    }
  }, [clonedObj, opacity])

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

function DualModelScene({ 
  scrollProgress, 
  onModel1Loaded, 
  onModel2Loaded 
}: { 
  scrollProgress: number
  onModel1Loaded: () => void
  onModel2Loaded: () => void
}) {
  const transitionPoint = 0.5
  const transitionRange = 0.15
  
  const model1Opacity = useMemo(() => {
    if (scrollProgress < transitionPoint - transitionRange) return 1
    if (scrollProgress > transitionPoint + transitionRange) return 0
    return 1 - (scrollProgress - (transitionPoint - transitionRange)) / (transitionRange * 2)
  }, [scrollProgress])
  
  const model2Opacity = useMemo(() => {
    if (scrollProgress < transitionPoint - transitionRange) return 0
    if (scrollProgress > transitionPoint + transitionRange) return 1
    return (scrollProgress - (transitionPoint - transitionRange)) / (transitionRange * 2)
  }, [scrollProgress])

  return (
    <>
      {model1Opacity > 0 && (
        <Model3D
          objPath="/models/output.obj"
          texturePath="/models/textured_mesh.jpg"
          scrollProgress={scrollProgress}
          opacity={model1Opacity}
          onLoaded={onModel1Loaded}
        />
      )}
      {model2Opacity > 0 && (
        <Model3D
          objPath="/models/model2/output.obj"
          texturePath="/models/model2/textured_mesh.jpg"
          scrollProgress={scrollProgress}
          opacity={model2Opacity}
          onLoaded={onModel2Loaded}
        />
      )}
    </>
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

function Scene({ 
  scrollProgress, 
  onModel1Loaded, 
  onModel2Loaded 
}: { 
  scrollProgress: number
  onModel1Loaded: () => void
  onModel2Loaded: () => void
}) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[5, 5, 5]} intensity={1.2} color="#ffffff" castShadow />
      <directionalLight position={[-5, 3, 2]} intensity={0.8} color="#a855f7" />
      <pointLight position={[-5, -5, 5]} intensity={0.6} color="#06b6d4" />
      <pointLight position={[5, -5, -5]} intensity={0.4} color="#ec4899" />
      
      <Suspense fallback={<LoadingFallback />}>
        <DualModelScene 
          scrollProgress={scrollProgress} 
          onModel1Loaded={onModel1Loaded}
          onModel2Loaded={onModel2Loaded}
        />
      </Suspense>
      
      <ParticleField scrollProgress={scrollProgress} />
    </>
  )
}

function SplashScreen({ progress, isHiding }: { progress: number; isHiding: boolean }) {
  return (
    <div 
      className={`fixed inset-0 z-50 flex flex-col items-center justify-center bg-slate-950 transition-opacity duration-700 ${
        isHiding ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="relative mb-8">
        <div className="w-20 h-20 relative">
          <div className="absolute inset-0 rounded-full border-4 border-slate-800" />
          <div 
            className="absolute inset-0 rounded-full border-4 border-transparent border-t-indigo-500 border-r-purple-500 animate-spin"
            style={{ animationDuration: '1s' }}
          />
          <div className="absolute inset-2 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center">
            <svg className="w-8 h-8 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 2L2 7l10 5 10-5-10-5z" />
              <path d="M2 17l10 5 10-5" />
              <path d="M2 12l10 5 10-5" />
            </svg>
          </div>
        </div>
        
        <div className="absolute -inset-4 rounded-full bg-indigo-500/10 animate-ping" style={{ animationDuration: '2s' }} />
      </div>
      
      <h2 className="text-2xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent mb-4">
        Flaton AI
      </h2>
      
      <div className="w-48 h-1.5 bg-slate-800 rounded-full overflow-hidden mb-2">
        <div 
          className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>
      
      <p className="text-slate-500 text-sm">
        {progress < 100 ? 'Đang tải tài nguyên...' : 'Hoàn tất!'}
      </p>
      
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex gap-1">
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-full bg-indigo-500/50"
            style={{
              animation: 'bounce 1.4s infinite ease-in-out',
              animationDelay: `${i * 0.16}s`,
            }}
          />
        ))}
      </div>
      
      <style>{`
        @keyframes bounce {
          0%, 80%, 100% { transform: scale(0.6); opacity: 0.5; }
          40% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

function ScrollIndicator({ scrollProgress }: { scrollProgress: number }) {
  const currentSection = scrollProgress < 0.5 ? 1 : 2
  
  return (
    <div className="fixed right-6 top-1/2 -translate-y-1/2 z-40 flex flex-col items-center gap-3">
      <div 
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          currentSection === 1 
            ? 'bg-indigo-500 scale-125' 
            : 'bg-slate-600 hover:bg-slate-500'
        }`}
      />
      <div className="w-px h-8 bg-slate-700" />
      <div 
        className={`w-3 h-3 rounded-full transition-all duration-300 ${
          currentSection === 2 
            ? 'bg-purple-500 scale-125' 
            : 'bg-slate-600 hover:bg-slate-500'
        }`}
      />
    </div>
  )
}

export default function Hero3D() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [model1Loaded, setModel1Loaded] = useState(false)
  const [model2Loaded, setModel2Loaded] = useState(false)
  const [isHiding, setIsHiding] = useState(false)
  const [loadProgress, setLoadProgress] = useState(0)
  const containerRef = useRef<HTMLDivElement>(null)

  const allLoaded = model1Loaded && model2Loaded

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

  useEffect(() => {
    const timeout = setTimeout(() => {
      if (!isHiding) {
        setLoadProgress(100)
        setIsHiding(true)
      }
    }, 5000)
    
    return () => clearTimeout(timeout)
  }, [isHiding])

  useEffect(() => {
    const interval = setInterval(() => {
      setLoadProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          return 100
        }
        return prev + Math.random() * 15
      })
    }, 150)
    
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (allLoaded) {
      setLoadProgress(100)
      setTimeout(() => {
        setIsHiding(true)
      }, 300)
    }
  }, [allLoaded])

  const handleModel1Loaded = useCallback(() => {
    setModel1Loaded(true)
  }, [])

  const handleModel2Loaded = useCallback(() => {
    setModel2Loaded(true)
  }, [])

  return (
    <>
      <SplashScreen progress={Math.min(loadProgress, 100)} isHiding={isHiding} />
      <ScrollIndicator scrollProgress={scrollProgress} />
      
      <div ref={containerRef} className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-900 via-slate-900/95 to-slate-950" />
        <Canvas
          camera={{ position: [0, 0, 5], fov: 50 }}
          gl={{ antialias: true, alpha: true }}
          style={{ background: 'transparent' }}
        >
          <Suspense fallback={null}>
            <Scene 
              scrollProgress={scrollProgress} 
              onModel1Loaded={handleModel1Loaded}
              onModel2Loaded={handleModel2Loaded}
            />
          </Suspense>
        </Canvas>
      </div>
    </>
  )
}
