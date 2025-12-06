import { motion } from 'framer-motion'

interface GlowingOrbProps {
  size?: number
  color?: string
  position?: { top?: string; left?: string; right?: string; bottom?: string }
  delay?: number
  intensity?: 'low' | 'medium' | 'high'
}

export default function GlowingOrb({ 
  size = 100,
  color = '#6366f1',
  position = { top: '20%', left: '10%' },
  delay = 0,
  intensity = 'medium'
}: GlowingOrbProps) {
  
  const glowIntensity = {
    low: 0.3,
    medium: 0.5,
    high: 0.8,
  }
  
  const opacity = glowIntensity[intensity]

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        ...position,
        width: size,
        height: size,
      }}
      animate={{
        scale: [1, 1.2, 1],
        opacity: [opacity * 0.5, opacity, opacity * 0.5],
      }}
      transition={{
        duration: 4,
        repeat: Infinity,
        ease: 'easeInOut',
        delay,
      }}
    >
      <div
        className="w-full h-full rounded-full"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
          filter: 'blur(30px)',
        }}
      />
      
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{
          background: `radial-gradient(circle, ${color} 0%, transparent 50%)`,
          filter: 'blur(10px)',
        }}
        animate={{
          scale: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: 'easeInOut',
          delay: delay + 0.5,
        }}
      />
    </motion.div>
  )
}
