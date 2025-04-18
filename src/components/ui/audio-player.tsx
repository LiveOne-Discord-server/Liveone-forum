
import * as React from "react"
import { Slider } from "@/components/ui/slider"
import { cn } from "@/lib/utils"
import { Volume2, Play, Pause, SkipBack, SkipForward, VolumeX } from "lucide-react"
import { formatDuration } from "@/utils/messaging"

interface PlayerProps extends React.AudioHTMLAttributes<HTMLAudioElement> {
  src: string
  className?: string
  onPlay?: () => void
  onPause?: () => void
  onEnded?: () => void
}

export const Player = React.forwardRef<HTMLAudioElement, PlayerProps>(
  ({ src, className, onPlay, onPause, onEnded, ...props }, ref) => {
    const audioRef = React.useRef<HTMLAudioElement>(null)
    const [isPlaying, setIsPlaying] = React.useState(false)
    const [currentTime, setCurrentTime] = React.useState(0)
    const [duration, setDuration] = React.useState(0)
    const [volume, setVolume] = React.useState(100)
    const [showVolumeControl, setShowVolumeControl] = React.useState(false)
    const [isMuted, setIsMuted] = React.useState(false)
    const [isLoaded, setIsLoaded] = React.useState(false)

    React.useImperativeHandle(ref, () => audioRef.current as HTMLAudioElement)

    const togglePlayPause = () => {
      if (isPlaying) {
        audioRef.current?.pause()
      } else {
        audioRef.current?.play().catch(err => {
          console.error("Error playing audio:", err)
        })
      }
    }

    const skipForward = () => {
      if (audioRef.current) {
        audioRef.current.currentTime += 5
      }
    }

    const skipBackward = () => {
      if (audioRef.current) {
        audioRef.current.currentTime -= 5
      }
    }

    const handleTimeUpdate = () => {
      if (audioRef.current) {
        setCurrentTime(audioRef.current.currentTime)
      }
    }

    const handleLoadedMetadata = () => {
      if (audioRef.current) {
        setDuration(audioRef.current.duration)
        setIsLoaded(true)
      }
    }

    const toggleMute = () => {
      if (audioRef.current) {
        if (isMuted) {
          audioRef.current.volume = volume / 100
        } else {
          audioRef.current.volume = 0
        }
        setIsMuted(!isMuted)
      }
    }

    const handleVolumeChange = (value: number[]) => {
      const newVolume = value[0]
      setVolume(newVolume)
      if (audioRef.current) {
        audioRef.current.volume = newVolume / 100
        if (newVolume === 0) {
          setIsMuted(true)
        } else if (isMuted) {
          setIsMuted(false)
        }
      }
    }

    const handleSliderChange = (value: number[]) => {
      const newTime = value[0]
      setCurrentTime(newTime)
      if (audioRef.current) {
        audioRef.current.currentTime = newTime
      }
    }

    React.useEffect(() => {
      const audio = audioRef.current

      const handlePlay = () => {
        setIsPlaying(true)
        onPlay?.()
      }

      const handlePause = () => {
        setIsPlaying(false)
        onPause?.()
      }

      const handleEnded = () => {
        setIsPlaying(false)
        setCurrentTime(0)
        onEnded?.()
      }

      if (audio) {
        audio.addEventListener("play", handlePlay)
        audio.addEventListener("pause", handlePause)
        audio.addEventListener("ended", handleEnded)
        audio.addEventListener("timeupdate", handleTimeUpdate)
        audio.addEventListener("loadedmetadata", handleLoadedMetadata)

        return () => {
          audio.removeEventListener("play", handlePlay)
          audio.removeEventListener("pause", handlePause)
          audio.removeEventListener("ended", handleEnded)
          audio.removeEventListener("timeupdate", handleTimeUpdate)
          audio.removeEventListener("loadedmetadata", handleLoadedMetadata)
        }
      }
    }, [onPlay, onPause, onEnded])

    // Format time values safely
    const displayCurrentTime = isFinite(currentTime) ? formatDuration(Math.floor(currentTime)) : "0:00"
    const displayDuration = isFinite(duration) ? formatDuration(Math.floor(duration)) : "0:00"

    return (
      <div className={cn("flex flex-col gap-1", className)}>
        <audio ref={audioRef} src={src} preload="metadata" {...props} />
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={skipBackward}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Skip backward 5 seconds"
          >
            <SkipBack className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            onClick={togglePlayPause}
            className="p-2 bg-primary rounded-full text-primary-foreground hover:bg-primary/90 transition-colors"
            aria-label={isPlaying ? "Pause" : "Play"}
            disabled={!isLoaded}
          >
            {isPlaying ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
          </button>
          <button
            type="button"
            onClick={skipForward}
            className="p-1.5 rounded-full hover:bg-muted transition-colors"
            aria-label="Skip forward 5 seconds"
          >
            <SkipForward className="h-3.5 w-3.5" />
          </button>
          <div className="flex-1 flex items-center gap-1 mx-1">
            <span className="text-xs tabular-nums text-muted-foreground min-w-[34px]">{displayCurrentTime}</span>
            <Slider
              value={[currentTime]}
              max={duration || 100}
              step={0.1}
              onValueChange={handleSliderChange}
              className="flex-1"
              aria-label="Seek time"
            />
            <span className="text-xs tabular-nums text-muted-foreground min-w-[34px]">{displayDuration}</span>
          </div>
          <div 
            className="relative"
            onMouseEnter={() => setShowVolumeControl(true)}
            onMouseLeave={() => setShowVolumeControl(false)}
          >
            <button
              type="button"
              onClick={toggleMute}
              className="p-1.5 rounded-full hover:bg-muted transition-colors"
            >
              {isMuted ? (
                <VolumeX className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <Volume2 className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </button>
            
            {showVolumeControl && (
              <div className="absolute bottom-full right-0 p-2 bg-popover border rounded-md shadow-md mb-1 z-10">
                <Slider
                  orientation="vertical"
                  value={[isMuted ? 0 : volume]}
                  max={100}
                  onValueChange={handleVolumeChange}
                  className="h-20"
                  aria-label="Volume"
                />
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }
)

Player.displayName = "Player"
