import { motion } from 'framer-motion'
import { useTheme } from '../contexts/ThemeContext'

interface WaterDropProps {
  isActive: boolean
  fromButton: React.RefObject<HTMLButtonElement>
  toLoading: React.RefObject<HTMLDivElement>
}

export default function WaterDropAnimation({ isActive, fromButton, toLoading }: WaterDropProps) {
  const { theme } = useTheme()

  if (!isActive || !fromButton.current || !toLoading.current) {
    return null
  }

  const fromRect = fromButton.current.getBoundingClientRect()
  const toRect = toLoading.current.getBoundingClientRect()

  const startX = fromRect.left + fromRect.width / 2
  const startY = fromRect.top + fromRect.height / 2
  const endX = toRect.left + toRect.width / 2
  const endY = toRect.top + toRect.height / 2

  const duration = 0.8

  return (
    <>
      {/* Main Water Drop */}
      <motion.div
        className="fixed pointer-events-none z-[100]"
        initial={{
          x: startX,
          y: startY,
          scale: 1,
          opacity: 1,
        }}
        animate={{
          x: endX,
          y: endY,
          scale: 0.3,
          opacity: 0,
        }}
        transition={{
          duration,
          ease: 'easeIn',
        }}
      >
        <div
          className="w-6 h-6 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 shadow-lg"
          style={{
            filter: 'drop-shadow(0 0 10px rgba(34, 211, 238, 0.6))',
          }}
        />
      </motion.div>

      {/* Water Splash Effect at End */}
      <motion.div
        className="fixed pointer-events-none z-[100]"
        initial={{
          x: endX,
          y: endY,
          opacity: 0,
          scale: 0,
        }}
        animate={{
          opacity: [0, 1, 0],
          scale: [0, 1, 0],
        }}
        transition={{
          duration: 0.6,
          delay: duration - 0.1,
          ease: 'easeOut',
        }}
      >
        <div className="relative w-16 h-16 -translate-x-1/2 -translate-y-1/2">
          {/* Splash circles */}
          {[0, 1, 2].map((i) => (
            <motion.div
              key={i}
              className="absolute w-3 h-3 rounded-full bg-cyan-400"
              initial={{
                x: 0,
                y: 0,
                opacity: 1,
              }}
              animate={{
                x: Math.cos((i * Math.PI * 2) / 3) * 30,
                y: Math.sin((i * Math.PI * 2) / 3) * 30,
                opacity: 0,
              }}
              transition={{
                duration: 0.6,
                delay: duration - 0.1,
              }}
              style={{
                filter: 'drop-shadow(0 0 8px rgba(34, 211, 238, 0.8))',
              }}
            />
          ))}
        </div>
      </motion.div>

      {/* Ripple effect at destination */}
      <motion.div
        className="fixed pointer-events-none z-[100]"
        style={{
          left: endX,
          top: endY,
          transform: 'translate(-50%, -50%)',
        }}
      >
        {[0, 1, 2].map((i) => (
          <motion.div
            key={`ripple-${i}`}
            className="absolute border-2 border-cyan-400 rounded-full"
            initial={{
              width: 0,
              height: 0,
              opacity: 0.8,
              x: 0,
              y: 0,
            }}
            animate={{
              width: 60,
              height: 60,
              opacity: 0,
              x: -30,
              y: -30,
            }}
            transition={{
              duration: 0.8,
              delay: duration - 0.1 + i * 0.15,
              ease: 'easeOut',
            }}
          />
        ))}
      </motion.div>

      {/* Glow effect on loading area */}
      <motion.div
        className="fixed pointer-events-none z-[99]"
        style={{
          left: endX,
          top: endY,
          width: 100,
          height: 100,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(34, 211, 238, 0.4) 0%, rgba(34, 211, 238, 0) 70%)',
          borderRadius: '50%',
        }}
        animate={{
          scale: [1, 1.5],
          opacity: [1, 0],
        }}
        transition={{
          duration: 0.6,
          delay: duration - 0.1,
          ease: 'easeOut',
        }}
      />
    </>
  )
}
