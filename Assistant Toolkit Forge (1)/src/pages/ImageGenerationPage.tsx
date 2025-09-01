import React, { useState } from 'react';
import { Image, Download, Copy, Wand2, Settings, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { imageGen } from '@devvai/devv-code-backend';

interface GeneratedImage {
  url: string;
  prompt: string;
  timestamp: Date;
}

export function ImageGenerationPage() {
  const [prompt, setPrompt] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [images, setImages] = useState<GeneratedImage[]>([]);
  const [settings, setSettings] = useState({
    numOutputs: 1,
    aspectRatio: '1:1' as const,
    outputFormat: 'webp' as const
  });
  const { toast } = useToast();

  const promptTemplates = [
    {
      category: "Art & Style",
      prompts: [
        "A majestic mountain landscape at sunset, digital art style",
        "Portrait of a wise old wizard, fantasy art, detailed",
        "Cyberpunk city at night, neon lights, futuristic",
        "Abstract geometric patterns, vibrant colors, modern art"
      ]
    },
    {
      category: "Photography",
      prompts: [
        "Professional headshot of a business person, studio lighting",
        "Nature photography of a serene forest, golden hour lighting",
        "Street photography in a bustling city, black and white",
        "Macro photography of a colorful flower, extreme detail"
      ]
    },
    {
      category: "Creative",
      prompts: [
        "A cute robot companion in a cozy home setting",
        "Floating islands in the sky with waterfalls",
        "Steampunk airship flying through clouds",
        "Magical library with floating books and glowing orbs"
      ]
    }
  ];

  const aspectRatios = [
    { value: '1:1', label: 'Square (1:1)' },
    { value: '16:9', label: 'Landscape (16:9)' },
    { value: '9:16', label: 'Portrait (9:16)' },
    { value: '4:3', label: 'Standard (4:3)' },
    { value: '3:4', label: 'Portrait (3:4)' },
    { value: '21:9', label: 'Ultra Wide (21:9)' }
  ];

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "Error",
        description: "Please enter a prompt to generate images",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const result = await imageGen.textToImage({
        prompt: prompt.trim(),
        num_outputs: settings.numOutputs,
        aspect_ratio: settings.aspectRatio,
        output_format: settings.outputFormat
      });

      const newImages = result.images.map(url => ({
        url,
        prompt: prompt.trim(),
        timestamp: new Date()
      }));

      setImages(prev => [...newImages, ...prev]);

      toast({
        title: "Success",
        description: `Generated ${result.images.length} image${result.images.length > 1 ? 's' : ''} successfully`,
      });

    } catch (error: any) {
      console.error('Image generation error:', error);
      toast({
        title: "Generation Failed",
        description: "Failed to generate images. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (imageUrl: string, index: number) => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `generated-image-${Date.now()}-${index}.${settings.outputFormat}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const copyPrompt = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: "Prompt copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy prompt",
        variant: "destructive"
      });
    }
  };

  const useTemplate = (templatePrompt: string) => {
    setPrompt(templatePrompt);
  };

  const enhancePrompt = () => {
    if (!prompt.trim()) return;
    
    const enhancements = [
      "highly detailed",
      "professional quality",
      "8k resolution",
      "cinematic lighting",
      "award winning"
    ];
    
    const enhancement = enhancements[Math.floor(Math.random() * enhancements.length)];
    setPrompt(prev => `${prev}, ${enhancement}`);
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">AI Image Generation</h1>
        <p className="text-purple-200">Create stunning images from text descriptions</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Prompt Input */}
        <div className="lg:col-span-3">
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Wand2 className="w-5 h-5" />
                Image Prompt
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative">
                <Textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Describe the image you want to create..."
                  className="min-h-[120px] bg-white/10 border-white/20 text-white placeholder:text-purple-300 resize-none pr-12"
                  maxLength={1000}
                />
                <Button
                  onClick={enhancePrompt}
                  size="sm"
                  variant="ghost"
                  className="absolute top-2 right-2 text-purple-300 hover:text-white hover:bg-white/10"
                  title="Enhance prompt"
                >
                  <Sparkles className="w-4 h-4" />
                </Button>
              </div>
              
              <div className="flex items-center justify-between">
                <span className="text-sm text-purple-300">
                  {prompt.length}/1000 characters
                </span>
                <Button
                  onClick={handleGenerate}
                  disabled={!prompt.trim() || isGenerating}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  {isGenerating ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Image className="w-4 h-4 mr-2" />
                      Generate Image{settings.numOutputs > 1 ? 's' : ''}
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Prompt Templates */}
          <Card className="bg-white/5 border-white/10 mt-6">
            <CardHeader>
              <CardTitle className="text-white text-lg">Prompt Templates</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promptTemplates.map((category, categoryIndex) => (
                  <div key={categoryIndex}>
                    <Badge variant="outline" className="mb-3 border-purple-400 text-purple-300">
                      {category.category}
                    </Badge>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {category.prompts.map((templatePrompt, index) => (
                        <Button
                          key={index}
                          variant="outline"
                          size="sm"
                          onClick={() => useTemplate(templatePrompt)}
                          className="text-left text-xs h-auto p-3 border-white/20 text-purple-200 hover:bg-white/10 hover:text-white justify-start"
                        >
                          {templatePrompt}
                        </Button>
                      ))}
                    </div>
                  </div>
                ))}
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
                Generation Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label className="text-purple-200">Number of Images</Label>
                <Select
                  value={settings.numOutputs.toString()}
                  onValueChange={(value) => setSettings(prev => ({ ...prev, numOutputs: parseInt(value) }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">1 Image</SelectItem>
                    <SelectItem value="2">2 Images</SelectItem>
                    <SelectItem value="3">3 Images</SelectItem>
                    <SelectItem value="4">4 Images</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Aspect Ratio</Label>
                <Select
                  value={settings.aspectRatio}
                  onValueChange={(value: any) => setSettings(prev => ({ ...prev, aspectRatio: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {aspectRatios.map((ratio) => (
                      <SelectItem key={ratio.value} value={ratio.value}>
                        {ratio.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label className="text-purple-200">Output Format</Label>
                <Select
                  value={settings.outputFormat}
                  onValueChange={(value: any) => setSettings(prev => ({ ...prev, outputFormat: value }))}
                >
                  <SelectTrigger className="bg-white/10 border-white/20 text-white">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="webp">WebP (Recommended)</SelectItem>
                    <SelectItem value="jpg">JPEG</SelectItem>
                    <SelectItem value="png">PNG</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="pt-4 space-y-2">
                <h4 className="text-purple-200 font-medium">Tips for Better Results:</h4>
                <ul className="text-xs text-purple-300 space-y-1">
                  <li>• Be specific and descriptive</li>
                  <li>• Include style keywords (e.g., "digital art", "realistic")</li>
                  <li>• Mention lighting and mood</li>
                  <li>• Use quality enhancers like "detailed", "high quality"</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Generated Images */}
      {images.length > 0 && (
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Generated Images ({images.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {images.map((image, index) => (
                <div key={index} className="group relative">
                  <div className="aspect-square bg-white/5 rounded-lg overflow-hidden border border-white/10">
                    <img
                      src={image.url}
                      alt={image.prompt}
                      className="w-full h-full object-cover transition-transform group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  
                  <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center gap-2">
                    <Button
                      onClick={() => handleDownload(image.url, index)}
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30"
                    >
                      <Download className="w-4 h-4" />
                    </Button>
                    <Button
                      onClick={() => copyPrompt(image.prompt)}
                      size="sm"
                      variant="secondary"
                      className="bg-white/20 hover:bg-white/30"
                    >
                      <Copy className="w-4 h-4" />
                    </Button>
                  </div>

                  <div className="mt-2 p-2 bg-white/5 rounded text-xs text-purple-200 border border-white/10">
                    <p className="line-clamp-2 mb-1">{image.prompt}</p>
                    <p className="text-purple-300 text-[10px]">
                      {image.timestamp.toLocaleString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}