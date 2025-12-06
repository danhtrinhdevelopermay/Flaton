import { motion } from 'framer-motion'

interface Floating3DShapeProps {
  type?: 'cube' | 'sphere' | 'pyramid' | 'ring'
  size?: number
  color?: string
  position?: { top?: string; left?: string; right?: string; bottom?: string }
  delay?: number
}

export default function Floating3DShape({ 
  type = 'cube',
  size = 60,
  color = '#6366f1',
  position = { top: '20%', left: '10%' },
  delay = 0
}: Floating3DShapeProps) {
  
  const shapes = {
    cube: (
      <div 
        className="relative" 
        style={{ 
          width: size, 
          height: size,
          transformStyle: 'preserve-3d',
        }}
      >
        {[...Array(6)].map((_, i) => {
          const transforms = [
            `rotateY(0deg) translateZ(${size/2}px)`,
            `rotateY(180deg) translateZ(${size/2}px)`,
            `rotateY(90deg) translateZ(${size/2}px)`,
            `rotateY(-90deg) translateZ(${size/2}px)`,
            `rotateX(90deg) translateZ(${size/2}px)`,
            `rotateX(-90deg) translateZ(${size/2}px)`,
          ]
          return (
            <div
              key={i}
              className="absolute inset-0"
              style={{
                transform: transforms[i],
                background: `linear-gradient(135deg, ${color}40, ${color}20)`,
                border: `1px solid ${color}60`,
                backdropFilter: 'blur(4px)',
              }}
            />
          )
        })}
      </div>
    ),
    sphere: (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          background: `radial-gradient(circle at 30% 30%, ${color}80, ${color}20)`,
          boxShadow: `0 0 40px ${color}40, inset 0 0 40px ${color}20`,
        }}
      />
    ),
    pyramid: (
      <div 
        className="relative"
        style={{ 
          width: size, 
          height: size,
          transformStyle: 'preserve-3d',
        }}
      >
        <div
          style={{
            position: 'absolute',
            width: 0,
            height: 0,
            borderLeft: `${size/2}px solid transparent`,
            borderRight: `${size/2}px solid transparent`,
            borderBottom: `${size}px solid ${color}40`,
            filter: `drop-shadow(0 0 10px ${color}40)`,
          }}
        />
      </div>
    ),
    ring: (
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          border: `3px solid ${color}60`,
          boxShadow: `0 0 20px ${color}30, inset 0 0 20px ${color}20`,
        }}
      />
    ),
  }

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        ...position,
        perspective: '1000px',
      }}
      animate={{
        y: [0, -20, 0],
        rotateX: [0, 360],
        rotateY: [0, 360],
      }}
      transition={{
        y: {
          duration: 4,
          repeat: Infinity,
          ease: 'easeInOut',
          delay,
        },
        rotateX: {
          duration: 20,
          repeat: Infinity,
          ease: 'linear',
          delay,
        },
        rotateY: {
          duration: 15,
          repeat: Infinity,
          ease: 'linear',
          delay,
        },
      }}
    >
      {shapes[type]}
    </motion.div>
  )
}
