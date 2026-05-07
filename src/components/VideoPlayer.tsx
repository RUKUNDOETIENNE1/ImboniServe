import { useRef, useState, useEffect } from 'react'
import { Play, Pause, Volume2, VolumeX, Maximize } from 'lucide-react'

interface VideoPlayerProps {
  src: string
  thumbnail?: string
  autoPlay?: boolean
  muted?: boolean
  loop?: boolean
  className?: string
  postId?: string
}

export default function VideoPlayer({
  src,
  thumbnail,
  autoPlay = false,
  muted = true,
  loop = true,
  className = '',
  postId,
}: VideoPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [isPlaying, setIsPlaying] = useState(autoPlay)
  const [isMuted, setIsMuted] = useState(muted)
  const [progress, setProgress] = useState(0)
  const viewTracked = useRef(false)
  const playStartRef = useRef<number | null>(null)

  useEffect(() => {
    const video = videoRef.current
    if (!video) return

    const updateProgress = () => {
      const percent = (video.currentTime / video.duration) * 100
      setProgress(percent)
    }
    video.addEventListener('timeupdate', updateProgress)
    return () => video.removeEventListener('timeupdate', updateProgress)
  }, [])

  // Fire view event after 3 seconds of play
  useEffect(() => {
    if (!postId) return
    const video = videoRef.current
    if (!video) return

    let timer: ReturnType<typeof setTimeout> | null = null

    const onPlay = () => {
      playStartRef.current = Date.now()
      if (!viewTracked.current) {
        timer = setTimeout(() => {
          viewTracked.current = true
          fetch('/api/cms/analytics?action=track', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ postId }),
          }).catch(() => {})
        }, 3000)
      }
    }

    const reportWatch = () => {
      if (playStartRef.current === null || !postId) return
      const watchedSec = Math.round((Date.now() - playStartRef.current) / 1000)
      playStartRef.current = null
      if (watchedSec < 1) return
      fetch('/api/cms/analytics?action=track', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ postId, durationWatchedSec: watchedSec }),
      }).catch(() => {})
    }

    video.addEventListener('play', onPlay)
    video.addEventListener('pause', reportWatch)
    video.addEventListener('ended', reportWatch)

    return () => {
      if (timer) clearTimeout(timer)
      video.removeEventListener('play', onPlay)
      video.removeEventListener('pause', reportWatch)
      video.removeEventListener('ended', reportWatch)
    }
  }, [postId])

  const togglePlay = () => {
    const video = videoRef.current
    if (!video) return

    if (video.paused) {
      video.play()
      setIsPlaying(true)
    } else {
      video.pause()
      setIsPlaying(false)
    }
  }

  const toggleMute = () => {
    const video = videoRef.current
    if (!video) return

    video.muted = !video.muted
    setIsMuted(video.muted)
  }

  const toggleFullscreen = () => {
    const video = videoRef.current
    if (!video) return

    if (document.fullscreenElement) {
      document.exitFullscreen()
    } else {
      video.requestFullscreen()
    }
  }

  return (
    <div className={`relative group ${className}`}>
      <video
        ref={videoRef}
        src={src}
        poster={thumbnail}
        autoPlay={autoPlay}
        muted={muted}
        loop={loop}
        playsInline
        className="w-full h-full object-cover rounded-xl"
        onClick={togglePlay}
      />

      {/* Progress Bar */}
      <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/30">
        <div
          className="h-full bg-imboni-orange transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-3">
          <button
            onClick={togglePlay}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
          >
            {isPlaying ? (
              <Pause className="w-4 h-4 text-white" />
            ) : (
              <Play className="w-4 h-4 text-white ml-0.5" />
            )}
          </button>

          <button
            onClick={toggleMute}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
          >
            {isMuted ? (
              <VolumeX className="w-4 h-4 text-white" />
            ) : (
              <Volume2 className="w-4 h-4 text-white" />
            )}
          </button>

          <div className="flex-1" />

          <button
            onClick={toggleFullscreen}
            className="w-8 h-8 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center hover:bg-white/30 transition"
          >
            <Maximize className="w-4 h-4 text-white" />
          </button>
        </div>
      </div>

      {/* Play overlay when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center">
          <button
            onClick={togglePlay}
            className="w-16 h-16 rounded-full bg-imboni-orange/90 backdrop-blur-sm flex items-center justify-center hover:bg-imboni-orange transition shadow-lg"
          >
            <Play className="w-8 h-8 text-white ml-1" />
          </button>
        </div>
      )}
    </div>
  )
}
