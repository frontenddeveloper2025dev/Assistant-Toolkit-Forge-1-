import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Slider } from '@/components/ui/slider'
import { Label } from '@/components/ui/label'
import { 
  Volume2, 
  Play, 
  Pause, 
  Square, 
  SkipBack, 
  SkipForward,
  Download,
  Loader2,
  Settings,
  VolumeX,
  Volume1,
  RotateCcw,
  Clock
} from 'lucide-react'
import { tts } from '@devvai/devv-code-backend'
import { useToast } from '@/hooks/use-toast'

interface AudioState {
  isPlaying: boolean
  currentTime: number
  duration: number
  volume: number
  playbackRate: number
}

export function TextToSpeechTool() {
  const { toast } = useToast()
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const [text, setText] = useState('')
  const [isConverting, setIsConverting] = useState(false)
  const [audioUrl, setAudioUrl] = useState<string | null>(null)
  const [audioState, setAudioState] = useState<AudioState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    playbackRate: 1
  })
  
  // Advanced settings
  const [showSettings, setShowSettings] = useState(false)
  const [voiceSettings, setVoiceSettings] = useState({
    stability: 0.5,
    similarity_boost: 0.75,
    style: 0.5
  })

  const exampleTexts = [
    "Welcome to the Interactive Assistant Toolkit! This text-to-speech feature can convert any text into natural-sounding audio.",
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet.",
    "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell.",
    "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune."
  ]

  // Audio event handlers
  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    const updateTime = () => {
      setAudioState(prev => ({
        ...prev,
        currentTime: audio.currentTime,
        duration: audio.duration || 0
      }))
    }

    const handleEnded = () => {
      setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
    }

    const handleLoadedMetadata = () => {
      setAudioState(prev => ({ ...prev, duration: audio.duration || 0 }))
    }

    audio.addEventListener('timeupdate', updateTime)
    audio.addEventListener('ended', handleEnded)
    audio.addEventListener('loadedmetadata', handleLoadedMetadata)

    return () => {
      audio.removeEventListener('timeupdate', updateTime)
      audio.removeEventListener('ended', handleEnded)
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata)
    }
  }, [audioUrl])

  const handleConvert = async () => {
    if (!text.trim()) {
      toast({
        title: 'No Text',
        description: 'Please enter some text to convert',
        variant: 'destructive'
      })
      return
    }

    setIsConverting(true)
    try {
      const result = await tts.convert({
        text: text.trim(),
        stability: voiceSettings.stability,
        similarity_boost: voiceSettings.similarity_boost,
        style: voiceSettings.style
      })

      setAudioUrl(result.audio_url)
      toast({
        title: 'Conversion Complete',
        description: `Generated ${Math.round(result.size / 1024)}KB audio file`
      })
    } catch (error: any) {
      console.error('TTS conversion failed:', error)
      if (error.message?.includes('API key')) {
        toast({
          title: 'API Key Required',
          description: 'Please configure your ElevenLabs API key in settings',
          variant: 'destructive'
        })
      } else {
        toast({
          title: 'Conversion Failed',
          description: 'Failed to convert text to speech. Please try again.',
          variant: 'destructive'
        })
      }
    } finally {
      setIsConverting(false)
    }
  }

  const togglePlayPause = () => {
    const audio = audioRef.current
    if (!audio) return

    if (audioState.isPlaying) {
      audio.pause()
      setAudioState(prev => ({ ...prev, isPlaying: false }))
    } else {
      audio.play()
      setAudioState(prev => ({ ...prev, isPlaying: true }))
    }
  }

  const stopAudio = () => {
    const audio = audioRef.current
    if (!audio) return

    audio.pause()
    audio.currentTime = 0
    setAudioState(prev => ({ ...prev, isPlaying: false, currentTime: 0 }))
  }

  const skipTime = (seconds: number) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = Math.max(0, Math.min(audio.duration, audio.currentTime + seconds))
  }

  const handleSeek = (value: number[]) => {
    const audio = audioRef.current
    if (!audio) return

    audio.currentTime = value[0]
    setAudioState(prev => ({ ...prev, currentTime: value[0] }))
  }

  const handleVolumeChange = (value: number[]) => {
    const audio = audioRef.current
    const newVolume = value[0]
    
    if (audio) {
      audio.volume = newVolume
    }
    setAudioState(prev => ({ ...prev, volume: newVolume }))
  }

  const handlePlaybackRateChange = (value: number[]) => {
    const audio = audioRef.current
    const newRate = value[0]
    
    if (audio) {
      audio.playbackRate = newRate
    }
    setAudioState(prev => ({ ...prev, playbackRate: newRate }))
  }

  const downloadAudio = () => {
    if (!audioUrl) return

    const link = document.createElement('a')
    link.href = audioUrl
    link.download = 'speech.mp3'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    toast({
      title: 'Download Started',
      description: 'Audio file is being downloaded'
    })
  }

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60)
    const remainingSeconds = Math.floor(seconds % 60)
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`
  }

  const getVolumeIcon = () => {
    if (audioState.volume === 0) return VolumeX
    if (audioState.volume < 0.5) return Volume1
    return Volume2
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold flex items-center justify-center gap-2">
          <Volume2 className="w-6 h-6 text-blue-600" />
          Text to Speech Converter
        </h2>
        <p className="text-muted-foreground">
          Convert your text into natural-sounding speech with advanced audio controls
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Text Input Section */}
        <div className="lg:col-span-2 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Text Input</CardTitle>
              <CardDescription>
                Enter the text you want to convert to speech
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                placeholder="Enter your text here..."
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="min-h-[200px] resize-none"
                maxLength={5000}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">
                  {text.length}/5000 characters
                </span>
                <Button
                  onClick={handleConvert}
                  disabled={isConverting || !text.trim()}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isConverting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Converting...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Convert to Speech
                    </>
                  )}
                </Button>
              </div>

              {/* Example Texts */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Quick Examples:</Label>
                <div className="grid grid-cols-1 gap-2">
                  {exampleTexts.map((example, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      className="h-auto p-3 text-left justify-start text-wrap"
                      onClick={() => setText(example)}
                    >
                      <span className="truncate">{example.slice(0, 80)}...</span>
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Audio Player & Settings */}
        <div className="space-y-4">
          {/* Audio Player */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Audio Player</span>
                {audioUrl && (
                  <Badge variant="secondary">Ready</Badge>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {audioUrl ? (
                <>
                  <audio ref={audioRef} src={audioUrl} preload="metadata" />
                  
                  {/* Progress Bar */}
                  <div className="space-y-2">
                    <Slider
                      value={[audioState.currentTime]}
                      max={audioState.duration || 100}
                      step={0.1}
                      onValueChange={handleSeek}
                      className="w-full"
                    />
                    <div className="flex justify-between text-xs text-muted-foreground">
                      <span>{formatTime(audioState.currentTime)}</span>
                      <span>{formatTime(audioState.duration)}</span>
                    </div>
                  </div>

                  {/* Player Controls */}
                  <div className="flex items-center justify-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => skipTime(-10)}
                    >
                      <SkipBack className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      onClick={togglePlayPause}
                      size="sm"
                      className="bg-blue-600 hover:bg-blue-700"
                    >
                      {audioState.isPlaying ? (
                        <Pause className="w-4 h-4" />
                      ) : (
                        <Play className="w-4 h-4" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={stopAudio}
                    >
                      <Square className="w-4 h-4" />
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => skipTime(10)}
                    >
                      <SkipForward className="w-4 h-4" />
                    </Button>
                  </div>

                  {/* Volume Control */}
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      {(() => {
                        const VolumeIcon = getVolumeIcon()
                        return <VolumeIcon className="w-4 h-4" />
                      })()}
                      Volume: {Math.round(audioState.volume * 100)}%
                    </Label>
                    <Slider
                      value={[audioState.volume]}
                      max={1}
                      step={0.1}
                      onValueChange={handleVolumeChange}
                      className="w-full"
                    />
                  </div>

                  {/* Playback Speed */}
                  <div className="space-y-2">
                    <Label className="text-sm flex items-center gap-2">
                      <Clock className="w-4 h-4" />
                      Speed: {audioState.playbackRate}x
                    </Label>
                    <Slider
                      value={[audioState.playbackRate]}
                      min={0.5}
                      max={2}
                      step={0.1}
                      onValueChange={handlePlaybackRateChange}
                      className="w-full"
                    />
                  </div>

                  {/* Download Button */}
                  <Button
                    variant="outline"
                    onClick={downloadAudio}
                    className="w-full"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download Audio
                  </Button>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Volume2 className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>Convert text to generate audio</p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Voice Settings */}
          <Card>
            <CardHeader>
              <CardTitle 
                className="flex items-center justify-between cursor-pointer"
                onClick={() => setShowSettings(!showSettings)}
              >
                <span className="flex items-center gap-2">
                  <Settings className="w-4 h-4" />
                  Voice Settings
                </span>
                <RotateCcw 
                  className={`w-4 h-4 transition-transform ${showSettings ? 'rotate-180' : ''}`}
                />
              </CardTitle>
            </CardHeader>
            {showSettings && (
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label className="text-sm">
                    Stability: {voiceSettings.stability.toFixed(2)}
                  </Label>
                  <Slider
                    value={[voiceSettings.stability]}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => 
                      setVoiceSettings(prev => ({ ...prev, stability: value[0] }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values make voice more consistent
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Clarity: {voiceSettings.similarity_boost.toFixed(2)}
                  </Label>
                  <Slider
                    value={[voiceSettings.similarity_boost]}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => 
                      setVoiceSettings(prev => ({ ...prev, similarity_boost: value[0] }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values enhance voice clarity
                  </p>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm">
                    Style: {voiceSettings.style.toFixed(2)}
                  </Label>
                  <Slider
                    value={[voiceSettings.style]}
                    max={1}
                    step={0.01}
                    onValueChange={(value) => 
                      setVoiceSettings(prev => ({ ...prev, style: value[0] }))
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Controls speaking style variation
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  )
}