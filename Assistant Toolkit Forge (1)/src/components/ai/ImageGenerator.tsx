import React, { useState } from 'react';
import { Image, Wand2, Download, Copy, Loader2, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { imageGen } from '@devvai/devv-code-backend';

interface GeneratedImage {
  id: string;
  prompt: string;
  url: string;
  timestamp: Date;
  settings: {
    aspect_ratio: string;
    output_format: string;
    num_outputs: number;
  };
}

const ASPECT_RATIOS = [
  { value: '1:1', label: 'Square (1:1)' },
  { value: '16:9', label: 'Landscape (16:9)' },
  { value: '9:16', label: 'Portrait (9:16)' },
  { value: '4:3', label: 'Standard (4:3)' },
  { value: '3:4', label: 'Portrait (3:4)' },
  { value: '21:9', label: 'Ultra-wide (21:9)' },
];

const OUTPUT_FORMATS = [
  { value: 'webp', label: 'WebP (Recommended)' },
  { value: 'jpg', label: 'JPEG' },
  { value: 'png', label: 'PNG' },
];

const PROMPT_SUGGESTIONS = [
  "A serene mountain landscape at sunset with golden light",
  "Futuristic cityscape with neon lights and flying cars",
  "Ancient library with floating books and magical glow",
  "Abstract geometric patterns in vibrant colors",
  "Cozy coffee shop interior with warm lighting",
  "Underwater coral reef with tropical fish",
  "Space station orbiting a distant planet",
  "Minimalist modern architecture with clean lines"
];

export function ImageGenerator() {
  const [prompt, setPrompt] = useState('');
  const [aspectRatio, setAspectRatio] = useState('1:1');
  const [outputFormat, setOutputFormat] = useState('webp');
  const [numOutputs, setNumOutputs] = useState(1);
  const [isGenerating, setIsGenerating] = useState(false);
  const [imageHistory, setImageHistory] = useState<GeneratedImage[]>([]);
  const { toast } = useToast();

  const generateImages = async () => {
    if (!prompt.trim() || isGenerating) return;

    setIsGenerating(true);
    try {
      const result = await imageGen.textToImage({
        prompt: prompt.trim(),
        aspect_ratio: aspectRatio as any,
        output_format: outputFormat as any,
        num_outputs: numOutputs
      });

      const newImages: GeneratedImage[] = result.images.map((url, index) => ({
        id: `${crypto.randomUUID()}-${index}`,
        prompt: prompt.trim(),
        url,
        timestamp: new Date(),
        settings: {
          aspect_ratio: aspectRatio,
          output_format: outputFormat,
          num_outputs: numOutputs
        }
      }));

      setImageHistory(prev => [...newImages, ...prev.slice(0, 20 - newImages.length)]); // Keep last 20
      setPrompt('');
      
      toast({
        title: 'Success',
        description: `Generated ${result.images.length} image(s)`
      });
    } catch (error: any) {
      console.error('Image generation error:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate images. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const downloadImage = async (url: string, prompt: string, id: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = URL.createObjectURL(blob);
      
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = `generated-image-${id.split('-')[0]}.${outputFormat}`;
      link.click();
      
      URL.revokeObjectURL(downloadUrl);
      
      toast({
        title: 'Downloaded',
        description: 'Image saved to your device'
      });
    } catch (error) {
      toast({
        title: 'Download Error',
        description: 'Failed to download image',
        variant: 'destructive'
      });
    }
  };

  const copyImageUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    toast({
      title: 'Copied',
      description: 'Image URL copied to clipboard'
    });
  };

  const useSuggestion = (suggestion: string) => {
    setPrompt(suggestion);
  };

  const clearHistory = () => {
    setImageHistory([]);
    toast({
      title: 'Cleared',
      description: 'Image history cleared'
    });
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Input Section */}
      <Card className="p-6 border-purple-200">
        <div className="space-y-4">
          <div>
            <Label htmlFor="prompt-input" className="text-sm font-medium text-gray-700">
              Image Description
            </Label>
            <Textarea
              id="prompt-input"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the image you want to generate in detail..."
              className="mt-1 min-h-[100px] border-purple-200 focus:border-purple-400 focus:ring-purple-400"
              disabled={isGenerating}
            />
            <p className="text-xs text-gray-500 mt-1">
              Be specific and descriptive for better results ({prompt.length} characters)
            </p>
          </div>

          {/* Settings Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-700">
                Aspect Ratio
              </Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger className="mt-1 border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ASPECT_RATIOS.map((ratio) => (
                    <SelectItem key={ratio.value} value={ratio.value}>
                      {ratio.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Output Format
              </Label>
              <Select value={outputFormat} onValueChange={setOutputFormat}>
                <SelectTrigger className="mt-1 border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {OUTPUT_FORMATS.map((format) => (
                    <SelectItem key={format.value} value={format.value}>
                      {format.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-sm font-medium text-gray-700">
                Number of Images
              </Label>
              <Select value={numOutputs.toString()} onValueChange={(value) => setNumOutputs(parseInt(value))}>
                <SelectTrigger className="mt-1 border-purple-200">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1">1 image</SelectItem>
                  <SelectItem value="2">2 images</SelectItem>
                  <SelectItem value="3">3 images</SelectItem>
                  <SelectItem value="4">4 images</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={generateImages}
            disabled={!prompt.trim() || isGenerating}
            className="w-full bg-purple-600 hover:bg-purple-700"
          >
            {isGenerating ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Generating Images...
              </>
            ) : (
              <>
                <Wand2 className="h-4 w-4 mr-2" />
                Generate Images
              </>
            )}
          </Button>
        </div>
      </Card>

      {/* Prompt Suggestions */}
      {!isGenerating && imageHistory.length === 0 && (
        <Card className="p-6 border-purple-200">
          <h3 className="font-medium text-gray-900 mb-3">Prompt Suggestions</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            {PROMPT_SUGGESTIONS.map((suggestion, index) => (
              <Button
                key={index}
                variant="outline"
                onClick={() => useSuggestion(suggestion)}
                className="text-left h-auto p-3 text-sm text-gray-600 hover:text-purple-600 hover:border-purple-300"
              >
                {suggestion}
              </Button>
            ))}
          </div>
        </Card>
      )}

      {/* Generated Images */}
      {imageHistory.length > 0 && (
        <Card className="p-6 border-purple-200">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-medium text-gray-900 flex items-center gap-2">
              <Image className="h-4 w-4" />
              Generated Images ({imageHistory.length})
            </h3>
            <Button
              variant="outline"
              size="sm"
              onClick={clearHistory}
              className="text-purple-600 border-purple-200 hover:bg-purple-50"
            >
              Clear History
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {imageHistory.map((image) => (
              <div key={image.id} className="group relative">
                <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
                  <img
                    src={image.url}
                    alt={image.prompt}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    loading="lazy"
                  />
                </div>
                
                {/* Overlay Controls */}
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-60 transition-all duration-300 rounded-lg flex items-center justify-center">
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex gap-2">
                    <Button
                      size="sm"
                      onClick={() => downloadImage(image.url, image.prompt, image.id)}
                      className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <Download className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      onClick={() => copyImageUrl(image.url)}
                      className="bg-white text-gray-900 hover:bg-gray-100"
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Image Info */}
                <div className="mt-2 space-y-1">
                  <p className="text-sm text-gray-900 line-clamp-2">
                    {image.prompt}
                  </p>
                  <div className="flex items-center justify-between text-xs text-gray-500">
                    <span>{image.timestamp.toLocaleDateString()}</span>
                    <span>{image.settings.aspect_ratio}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Help Text */}
      {imageHistory.length === 0 && !isGenerating && (
        <Card className="p-6 border-purple-200 bg-purple-50">
          <div className="text-center">
            <Palette className="h-8 w-8 text-purple-400 mx-auto mb-2" />
            <h3 className="font-medium text-gray-900 mb-1">Create AI-Generated Images</h3>
            <p className="text-sm text-gray-600">
              Describe your vision in detail and let AI bring it to life. 
              More descriptive prompts typically yield better results.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}