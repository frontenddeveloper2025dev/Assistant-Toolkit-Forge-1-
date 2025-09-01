import React, { useState, useRef } from 'react';
import { Play, Pause, Download, Volume2, Settings, Mic, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { tts } from '@devvai/devv-code-backend';

interface AudioState {
  url: string;
  isPlaying: boolean;
  duration: number;
  currentTime: number;
}

export function TextToSpeechPage() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioState, setAudioState] = useState<AudioState | null>(null);
  const [settings, setSettings] = useState({
    stability: [0.5],
    similarityBoost: [0.75],
    style: [0.5],
    voiceId: '',
    modelId: '',
    outputFormat: 'mp3_44100_128'
  });
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const sampleTexts = [
    "Welcome to the Interactive Assistant Toolkit. This is a sample text to demonstrate the text-to-speech functionality.",
    "The quick brown fox jumps over the lazy dog. This pangram contains every letter of the alphabet.",
    "In a hole in the ground there lived a hobbit. Not a nasty, dirty, wet hole filled with the ends of worms and an oozy smell.",
    "To be or not to be, that is the question. Whether 'tis nobler in the mind to suffer the slings and arrows of outrageous fortune."
  ];

  const handleGenerate = async () => {
    if (!text.trim()) {
      toast({
        title: "Error",
        description: "Please enter some text to convert to speech",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const options: any = {
        text: text.trim(),
        stability: settings.stability[0],
        similarity_boost: settings.similarityBoost[0],
        style: settings.style[0],
        output_format: settings.outputFormat
      };

      if (settings.voiceId) options.voice_id = settings.voiceId;
      if (settings.modelId) options.model_id = settings.modelId;

      const result = await tts.convert(options);
      
      setAudioState({
        url: result.audio_url,
        isPlaying: false,
        duration: 0,
        currentTime: 0
      });

      toast({
        title: "Success",
        description: `Audio generated successfully (${Math.round(result.size / 1024)}KB)`,
      });

    } catch (error: any) {
      console.error('TTS error:', error);
      if (error.message?.includes('API key')) {
        toast({
          title: "API Key Required",
          description: "Please configure your ElevenLabs API key in the project settings",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Generation Failed",
          description: "Failed to generate audio. Please try again.",
          variant: "destructive"
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePlayPause = () => {
    if (!audioRef.current || !audioState) return;

    if (audioState.isPlaying) {
      audioRef.current.pause();
      setAudioState(prev => prev ? { ...prev, isPlaying: false } : null);
    } else {
      audioRef.current.play();
      setAudioState(prev => prev ? { ...prev, isPlaying: true } : null);
    }
  };

  const handleDownload = () => {
    if (!audioState?.url) return;

    const link = document.createElement('a');
    link.href = audioState.url;
    link.download = `tts-audio-${Date.now()}.mp3`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const loadSampleText = (sample: string) => {
    setText(sample);
  };

  const handleAudioLoad = () => {
    if (audioRef.current && audioState) {
      setAudioState(prev => prev ? {
        ...prev,
        duration: audioRef.current!.duration || 0
      } : null);
    }
  };

  const handleTimeUpdate = () => {
    if (audioRef.current && audioState) {
      setAudioState(prev => prev ? {
        ...prev,
        currentTime: audioRef.current!.currentTime || 0
      } : null);
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Text-to-Speech</h1>
        <p className="text-purple-200">Convert your text to natural-sounding speech</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Text Input */}
        <div className="lg:col-span-2">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Mic className="w-5 h-5" />
                Text Input
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="min-h-[200px] bg-white/10 border-white/20 text-white placeholder:text-purple-300 resize-none"
                maxLength={5000}
              />
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-300">
                  {text.length}/5000 characters
                </span>
                <Button
                  onClick={handleGenerate}
                  disabled={!text.trim() || isGenerating}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Volume2 className="w-4 h-4 mr-2" />
                      Generate Speech
                    </>
                  )}
                </Button>
              </div>

              {/* Sample Texts */}
              <div className="space-y-2">
                <Label className="text-purple-200">Quick Samples:</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {sampleTexts.map((sample, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => loadSampleText(sample)}
                      className="text-left text-xs h-auto p-2 border-white/20 text-purple-200 hover:bg-white/10 hover:text-white"
                    >
                      {sample.substring(0, 60)}...
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Settings */}
        <div>
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Voice Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-purple-200">Voice ID (Optional)</Label>
                <input
                  type="text"
                  value={settings.voiceId}
                  onChange={(e) => setSettings(prev => ({ ...prev, voiceId: e.target.value }))}
                  placeholder="Enter ElevenLabs voice ID"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-purple-300 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Model ID (Optional)</Label>
                <input
                  type="text"
                  value={settings.modelId}
                  onChange={(e) => setSettings(prev => ({ ...prev, modelId: e.target.value }))}
                  placeholder="e.g., eleven_monolingual_v1"
                  className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-md text-white placeholder:text-purple-300 text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Output Format</Label>
                <Select
                  value={settings.outputFormat}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, outputFormat: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="mp3_44100_128">MP3 (44kHz, 128kbps)</SelectItem>
                    <SelectItem value="mp3_22050_32">MP3 (22kHz, 32kbps)</SelectItem>
                    <SelectItem value="pcm_16000">PCM (16kHz)</SelectItem>
                    <SelectItem value="pcm_22050">PCM (22kHz)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label className="text-purple-200">Stability: {settings.stability[0]}</Label>
                  <Slider
                    value={settings.stability}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, stability: value }))}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-purple-300">Higher values make voice more consistent</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-200">Similarity Boost: {settings.similarityBoost[0]}</Label>
                  <Slider
                    value={settings.similarityBoost}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, similarityBoost: value }))}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-purple-300">Higher values make voice clearer</p>
                </div>

                <div className="space-y-2">
                  <Label className="text-purple-200">Style: {settings.style[0]}</Label>
                  <Slider
                    value={settings.style}
                    onValueChange={(value) => setSettings(prev => ({ ...prev, style: value }))}
                    max={1}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-purple-300">Higher values add more expression</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Audio Player */}
      {audioState && (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-semibold">Generated Audio</h3>
              <Button
                onClick={handleDownload}
                variant="outline"
                size="sm"
                className="border-purple-400 text-purple-300 hover:bg-purple-500/10"
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex items-center gap-4">
              <Button
                onClick={handlePlayPause}
                size="lg"
                className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              >
                {audioState.isPlaying ? (
                  <Pause className="w-5 h-5" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </Button>

              <div className="flex-1">
                <div className="flex items-center justify-between text-sm text-purple-300 mb-1">
                  <span>{formatTime(audioState.currentTime)}</span>
                  <span>{formatTime(audioState.duration)}</span>
                </div>
                <div className="w-full bg-white/10 rounded-full h-2">
                  <div 
                    className="bg-gradient-to-r from-purple-400 to-purple-600 h-2 rounded-full transition-all"
                    style={{ 
                      width: audioState.duration > 0 
                        ? `${(audioState.currentTime / audioState.duration) * 100}%` 
                        : '0%' 
                    }}
                  />
                </div>
              </div>
            </div>

            <audio
              ref={audioRef}
              src={audioState.url}
              onLoadedMetadata={handleAudioLoad}
              onTimeUpdate={handleTimeUpdate}
              onEnded={() => setAudioState(prev => prev ? { ...prev, isPlaying: false } : null)}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}