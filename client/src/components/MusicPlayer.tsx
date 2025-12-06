import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Download, SkipBack, SkipForward } from 'lucide-react'

interface MusicPlayerProps {
  audioUrl: string
  title?: string
  description?: string
  coverImage?: string
  onDownload?: () => void
  autoPlay?: boolean
}

export default function MusicPlayer({ 
  audioUrl, 
  title = 'AI Generated Music', 
  description = 'Được tạo bởi Suno AI',
  coverImage,
  onDownload,
  autoPlay = true
}: MusicPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [visualizerData, setVisualizerData] = useState<number[]>(new Array(64).fill(0))
  
  const audioRef = useRef<HTMLAudioElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const audioContextRef = useRef<AudioContext | null>(null)
  const analyserRef = useRef<AnalyserNode | null>(null)
  const sourceRef = useRef<MediaElementAudioSourceNode | null>(null)
  const animationIdRef = useRef<number | null>(null)

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const handleLoadedMetadata = () => {
      setDuration(audio.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    audio.addEventListener('loadedmetadata', handleLoadedMetadata)
    audio.addEventListener('timeupdate', handleTimeUpdate)
    audio.addEventListener('ended', handleEnded)

    return () => {
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
      audio.removeEventListener('timeupdate', handleTimeUpdate)
      audio.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)()
      analyserRef.current = audioContextRef.current.createAnalyser()
      analyserRef.current.fftSize = 256
      analyserRef.current.smoothingTimeConstant = 0.8
      
      try {
        sourceRef.current = audioContextRef.current.createMediaElementSource(audio)
        sourceRef.current.connect(analyserRef.current)
        analyserRef.current.connect(audioContextRef.current.destination)
      } catch (error) {
        console.error('Error creating audio source:', error)
      }
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [])

  useEffect(() => {
    if (isPlaying && analyserRef.current) {
      const analyser = analyserRef.current
      const bufferLength = analyser.frequencyBinCount
      const dataArray = new Uint8Array(bufferLength)

      const animate = () => {
        analyser.getByteFrequencyData(dataArray)
        
        const bars = 64
        const step = Math.floor(bufferLength / bars)
        const newData = []
        
        for (let i = 0; i < bars; i++) {
          let sum = 0
          for (let j = 0; j < step; j++) {
            sum += dataArray[i * step + j]
          }
          newData.push(sum / step / 255)
        }
        
        setVisualizerData(newData)
        animationIdRef.current = requestAnimationFrame(animate)
      }

      animate()
    } else {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
      setVisualizerData(new Array(64).fill(0.1))
    }

    return () => {
      if (animationIdRef.current) {
        cancelAnimationFrame(animationIdRef.current)
      }
    }
  }, [isPlaying])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return
    
    audio.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  useEffect(() => {
    const audio = audioRef.current
    const audioContext = audioContextRef.current
    if (!audio || !audioContext) return

    if (autoPlay) {
      const tryAutoPlay = async () => {
        try {
          if (audioContext.state === 'suspended') {
            await audioContext.resume()
          }
          await audio.play()
          setIsPlaying(true)
        } catch (err) {
          console.log('Auto-play prevented:', err)
          setIsPlaying(false)
        }
      }
      tryAutoPlay()
    }
  }, [autoPlay, audioUrl])

  const togglePlay = async () => {
    const audio = audioRef.current
    const audioContext = audioContextRef.current
    if (!audio) return

    if (isPlaying) {
      audio.pause()
      setIsPlaying(false)
    } else {
      try {
        if (audioContext && audioContext.state === 'suspended') {
          await audioContext.resume()
        }
        await audio.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Play failed:', err)
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newTime = parseFloat(e.target.value)
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newVolume = parseFloat(e.target.value)
    setVolume(newVolume)
    setIsMuted(false)
  }

  const toggleMute = () => {
    setIsMuted(!isMuted)
  }

  const skipTime = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return
    
    const newTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
    audio.currentTime = newTime
    setCurrentTime(newTime)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="music-player-container">
      <audio ref={audioRef} src={audioUrl} />
      
      <div className="music-player-main">
        <div className="music-player-cover-section">
          <div className="music-player-cover">
            {coverImage ? (
              <img src={coverImage} alt={title} className="cover-image" />
            ) : (
              <div className="cover-placeholder">
                <div className="vinyl-record">
                  <div className="vinyl-center"></div>
                  <div className="vinyl-groove"></div>
                  <div className="vinyl-groove"></div>
                  <div className="vinyl-groove"></div>
                </div>
              </div>
            )}
            <div className={`playing-animation ${isPlaying ? 'active' : ''}`}>
              <div className="pulse-ring"></div>
              <div className="pulse-ring delay-1"></div>
              <div className="pulse-ring delay-2"></div>
            </div>
          </div>
          
          <div className="music-info">
            <h3 className="music-title">{title}</h3>
            <p className="music-description">{description}</p>
          </div>
        </div>

        <div className="visualizer-section">
          <div className="visualizer-bars">
            {visualizerData.map((value, index) => (
              <div
                key={index}
                className="visualizer-bar"
                style={{
                  height: `${Math.max(10, value * 100)}%`,
                  animationDelay: `${index * 0.01}s`
                }}
              />
            ))}
          </div>
        </div>

        <div className="controls-section">
          <div className="progress-section">
            <span className="time-label">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="seek-bar"
            />
            <span className="time-label">{formatTime(duration)}</span>
          </div>

          <div className="controls-buttons">
            <button
              onClick={() => skipTime(-10)}
              className="control-btn secondary"
              title="Lùi 10 giây"
            >
              <SkipBack className="w-5 h-5" />
            </button>

            <button
              onClick={togglePlay}
              className="control-btn primary"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? (
                <Pause className="w-7 h-7" />
              ) : (
                <Play className="w-7 h-7 ml-1" />
              )}
            </button>

            <button
              onClick={() => skipTime(10)}
              className="control-btn secondary"
              title="Tiến 10 giây"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          </div>

          <div className="volume-section">
            <button onClick={toggleMute} className="volume-btn">
              {isMuted || volume === 0 ? (
                <VolumeX className="w-5 h-5" />
              ) : (
                <Volume2 className="w-5 h-5" />
              )}
            </button>
            <input
              type="range"
              min="0"
              max="1"
              step="0.01"
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="volume-bar"
            />
          </div>

          {onDownload && (
            <button
              onClick={onDownload}
              className="download-btn"
              title="Tải xuống"
            >
              <Download className="w-5 h-5" />
              <span>Tải xuống</span>
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
