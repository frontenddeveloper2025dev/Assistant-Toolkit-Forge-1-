import React, { useState, useRef } from 'react';
import { Volume2, Play, Pause, Download, Loader2, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { tts } from '@devvai/devv-code-backend';

interface AudioHistory {
  id: string;
  text: string;
  audioUrl: string;
  timestamp: Date;
  settings: {
    stability: number;
    similarity: number;
    style: number;
  };
}

export function TextToSpeech() {
  const [text, setText] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [audioHistory, setAudioHistory] = useState<AudioHistory[]>([]);
  const [currentAudio, setCurrentAudio] = useState<HTMLAudioElement | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  
  // Voice settings
  const [stability, setStability] = useState([0.5]);
  const [similarity, setSimilarity] = useState([0.75]);
  const [style, setStyle] = useState([0.5]);
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const { toast } = useToast();

  const generateSpeech = async () => {
    if (!text.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await tts.convert({
        text: text.trim(),
        stability: stability[0],
        similarity_boost: similarity[0],
        style: style[0],
        output_format: 'mp3_44100_128'
      });

      const newAudio: AudioHistory = {
        id: crypto.randomUUID(),
        text: text.trim(),
        audioUrl: result.audio_url,
        timestamp: new Date(),
        settings: {
          stability: stability[0],
          similarity: similarity[0],
          style: style[0]
        }
      };

      setAudioHistory(prev => [newAudio, ...prev.slice(0, 9)]); // Keep last 10
      setText('');
      
      toast({
        title: 'Success',
        description: `Generated audio (${Math.round(result.size / 1024)}KB)`
      });
    } catch (error: any) {
      console.error('TTS error:', error);
      if (error.message?.includes('API key')) {
        toast({
          title: 'API Key Required',
          description: 'Please configure your ElevenLabs API key in external settings',
          variant: 'destructive'
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to generate speech. Please try again.',
          variant: 'destructive'
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const playAudio = (audioUrl: string, id: string) => {
    // Stop current audio if playing
    if (currentAudio) {
      currentAudio.pause();
      currentAudio.currentTime = 0;
    }

    const audio = new Audio(audioUrl);
    setCurrentAudio(audio);
    setPlayingId(id);

    audio.onended = () => {
      setPlayingId(null);
      setCurrentAudio(null);
    };

    audio.onerror = () => {
      toast({
        title: 'Playback Error',
        description: 'Failed to play audio file',
        variant: 'destructive'
      });
      setPlayingId(null);
      setCurrentAudio(null);
    };

    audio.play().catch(() => {
      toast({
        title: 'Playback Error',
        description: 'Unable to play audio. Please try downloading instead.',
        variant: 'destructive'
      });
      setPlayingId(null);
      setCurrentAudio(null);
    });
  };

  const pauseAudio = () => {
    if (currentAudio) {
      currentAudio.pause();
      setPlayingId(null);
      setCurrentAudio(null);
    }
  };

  const downloadAudio = (audioUrl: string, text: string) => {
    const link = document.createElement('a');
    link.href = audioUrl;
    link.download = `tts-${text.substring(0, 30).replace(/[^a-zA-Z0-9]/g, '-')}.mp3`;
    link.click();
  };

  const clearHistory = () => {
    setAudioHistory([]);
    if (currentAudio) {
      currentAudio.pause();
      setCurrentAudio(null);
      setPlayingId(null);
    }
    toast({
      title: 'Cleared',
      description: 'Audio history cleared'
    });
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-purple-200">
        <div className="flex items-center gap-2">
          <Volume2 className="h-5 w-5 text-purple-600" />
          <h2 className="font-semibold text-gray-900">Text to Speech</h2>
        </div>
        {audioHistory.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={clearHistory}
            className="text-purple-600 border-purple-200 hover:bg-purple-50"
          >
            Clear History
          </Button>
        )}
      </div>

      <div className="flex-1 p-4 space-y-6">
        {/* Input Section */}
        <Card className="p-4 border-purple-200">
          <div className="space-y-4">
            <div>
              <Label htmlFor="text-input" className="text-sm font-medium text-gray-700">
                Text to Convert
              </Label>
              <Textarea
                id="text-input"
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Enter the text you want to convert to speech..."
                className="mt-1 min-h-[100px] border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                disabled={isGenerating}
              />
              <p className="text-xs text-gray-500 mt-1">
                {text.length} characters
              </p>
            </div>

            {/* Voice Settings */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Stability: {stability[0].toFixed(2)}
                </Label>
                <Slider
                  value={stability}
                  onValueChange={setStability}
                  max={1}
                  step={0.01}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Voice consistency</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Similarity: {similarity[0].toFixed(2)}
                </Label>
                <Slider
                  value={similarity}
                  onValueChange={setSimilarity}
                  max={1}
                  step={0.01}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Voice clarity</p>
              </div>
              
              <div>
                <Label className="text-sm font-medium text-gray-700">
                  Style: {style[0].toFixed(2)}
                </Label>
                <Slider
                  value={style}
                  onValueChange={setStyle}
                  max={1}
                  step={0.01}
                  className="mt-2"
                />
                <p className="text-xs text-gray-500 mt-1">Speaking style</p>
              </div>
            </div>

            <Button
              onClick={generateSpeech}
              disabled={!text.trim() || isGenerating}
              className="w-full bg-purple-600 hover:bg-purple-700"
            >
              {isGenerating ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Generating Speech...
                </>
              ) : (
                <>
                  <Volume2 className="h-4 w-4 mr-2" />
                  Generate Speech
                </>
              )}
            </Button>
          </div>
        </Card>

        {/* Audio History */}
        {audioHistory.length > 0 && (
          <Card className="p-4 border-purple-200">
            <h3 className="font-medium text-gray-900 mb-4 flex items-center gap-2">
              <FileAudio className="h-4 w-4" />
              Generated Audio ({audioHistory.length})
            </h3>
            
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {audioHistory.map((audio) => (
                <div
                  key={audio.id}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 line-clamp-2 mb-1">
                      {audio.text}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <span>{audio.timestamp.toLocaleString()}</span>
                      <span>S:{audio.settings.stability.toFixed(1)}</span>
                      <span>C:{audio.settings.similarity.toFixed(1)}</span>
                      <span>T:{audio.settings.style.toFixed(1)}</span>
                    </div>
                  </div>
                  
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => 
                        playingId === audio.id 
                          ? pauseAudio() 
                          : playAudio(audio.audioUrl, audio.id)
                      }
                      className="h-8 w-8 p-0"
                    >
                      {playingId === audio.id ? (
                        <Pause className="h-3 w-3" />
                      ) : (
                        <Play className="h-3 w-3" />
                      )}
                    </Button>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => downloadAudio(audio.audioUrl, audio.text)}
                      className="h-8 w-8 p-0"
                    >
                      <Download className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Help Text */}
        {audioHistory.length === 0 && (
          <Card className="p-4 border-purple-200 bg-purple-50">
            <div className="text-center">
              <Volume2 className="h-8 w-8 text-purple-400 mx-auto mb-2" />
              <h3 className="font-medium text-gray-900 mb-1">Convert Text to Speech</h3>
              <p className="text-sm text-gray-600">
                Enter any text and adjust voice settings to generate high-quality speech audio.
                Requires ElevenLabs API key configuration.
              </p>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}