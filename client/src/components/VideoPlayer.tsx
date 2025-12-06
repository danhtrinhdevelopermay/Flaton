import { useState, useRef, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Download, Maximize, Settings } from 'lucide-react'

interface VideoPlayerProps {
  videoUrl: string
  title?: string
  description?: string
  onDownload?: () => void
  autoPlay?: boolean
}

export default function VideoPlayer({ 
  videoUrl, 
  title = 'AI Generated Video', 
  description = 'Được tạo bởi AI',
  onDownload,
  autoPlay = true
}: VideoPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [currentTime, setCurrentTime] = useState(0)
  const [duration, setDuration] = useState(0)
  const [volume, setVolume] = useState(0.7)
  const [isMuted, setIsMuted] = useState(false)
  const [playbackRate, setPlaybackRate] = useState(1)
  const [showSpeedMenu, setShowSpeedMenu] = useState(false)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  const playbackSpeeds = [0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75, 2]

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const handleLoadedMetadata = () => {
      setDuration(video.duration)
    }

    const handleTimeUpdate = () => {
      setCurrentTime(video.currentTime)
    }

    const handleEnded = () => {
      setIsPlaying(false)
      setCurrentTime(0)
    }

    video.addEventListener('loadedmetadata', handleLoadedMetadata)
    video.addEventListener('timeupdate', handleTimeUpdate)
    video.addEventListener('ended', handleEnded)

    return () => {
      video.removeEventListener('loadedmetadata', handleLoadedMetadata)
      video.removeEventListener('timeupdate', handleTimeUpdate)
      video.removeEventListener('ended', handleEnded)
    }
  }, [])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    video.volume = isMuted ? 0 : volume
  }, [volume, isMuted])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    if (autoPlay && isPlaying) {
      video.play().catch(err => {
        console.log('Auto-play prevented:', err)
        setIsPlaying(false)
      })
    }
  }, [autoPlay])

  useEffect(() => {
    const video = videoRef.current
    if (!video) return
    
    video.playbackRate = playbackRate
  }, [playbackRate])

  const togglePlay = async () => {
    const video = videoRef.current
    if (!video) return

    if (isPlaying) {
      video.pause()
      setIsPlaying(false)
    } else {
      try {
        await video.play()
        setIsPlaying(true)
      } catch (err) {
        console.error('Play failed:', err)
      }
    }
  }

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const video = videoRef.current
    if (!video) return
    
    const newTime = parseFloat(e.target.value)
    video.currentTime = newTime
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

  const toggleFullscreen = () => {
    const container = containerRef.current
    if (!container) return

    if (!document.fullscreenElement) {
      container.requestFullscreen()
    } else {
      document.exitFullscreen()
    }
  }

  const handleSpeedChange = (speed: number) => {
    setPlaybackRate(speed)
    setShowSpeedMenu(false)
  }

  const formatTime = (time: number) => {
    if (isNaN(time)) return '0:00'
    const minutes = Math.floor(time / 60)
    const seconds = Math.floor(time % 60)
    return `${minutes}:${seconds.toString().padStart(2, '0')}`
  }

  return (
    <div className="video-player-container" ref={containerRef}>
      <div className="video-player-main">
        <div className="video-display-section">
          <video
            ref={videoRef}
            src={videoUrl}
            className="video-element"
            onClick={togglePlay}
          />
          
          {!isPlaying && (
            <div className="video-overlay" onClick={togglePlay}>
              <button className="video-play-overlay">
                <Play className="w-16 h-16" />
              </button>
            </div>
          )}
        </div>

        <div className="video-info-section">
          <h3 className="video-title">{title}</h3>
          <p className="video-description">{description}</p>
        </div>

        <div className="video-controls-section">
          <div className="video-progress-section">
            <span className="time-label">{formatTime(currentTime)}</span>
            <input
              type="range"
              min="0"
              max={duration || 0}
              value={currentTime}
              onChange={handleSeek}
              className="video-seek-bar"
            />
            <span className="time-label">{formatTime(duration)}</span>
          </div>

          <div className="video-controls-buttons">
            <button
              onClick={togglePlay}
              className="video-control-btn primary"
              title={isPlaying ? 'Tạm dừng' : 'Phát'}
            >
              {isPlaying ? (
                <Pause className="w-6 h-6" />
              ) : (
                <Play className="w-6 h-6 ml-0.5" />
              )}
            </button>

            <div className="video-volume-section">
              <button onClick={toggleMute} className="video-volume-btn">
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
                className="video-volume-bar"
              />
            </div>

            <div className="relative">
              <button
                onClick={() => setShowSpeedMenu(!showSpeedMenu)}
                className="video-control-btn secondary"
                title="Tốc độ phát"
              >
                <Settings className="w-5 h-5" />
                <span className="text-xs ml-1">{playbackRate}x</span>
              </button>
              
              {showSpeedMenu && (
                <div className="video-speed-menu">
                  {playbackSpeeds.map(speed => (
                    <button
                      key={speed}
                      onClick={() => handleSpeedChange(speed)}
                      className={`video-speed-option ${playbackRate === speed ? 'active' : ''}`}
                    >
                      {speed}x
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={toggleFullscreen}
              className="video-control-btn secondary"
              title="Toàn màn hình"
            >
              <Maximize className="w-5 h-5" />
            </button>

            {onDownload && (
              <button
                onClick={onDownload}
                className="video-download-btn"
                title="Tải xuống"
              >
                <Download className="w-5 h-5" />
                <span>Tải xuống</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
