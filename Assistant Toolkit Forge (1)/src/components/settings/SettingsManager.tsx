import React, { useState, useEffect } from 'react';
import { useSettingsStore } from '@/store/settings-store';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Settings, 
  Palette, 
  Brain, 
  Volume2, 
  Mail, 
  FolderOpen, 
  Bell,
  Download,
  Upload,
  RotateCcw,
  Save,
  RefreshCw,
  Clock
} from 'lucide-react';

export default function SettingsManager() {
  const { toast } = useToast();
  const {
    preferences,
    isLoading,
    lastSynced,
    updatePreference,
    updateCategory,
    resetCategory,
    resetAllPreferences,
    syncPreferences,
    exportPreferences,
    importPreferences,
  } = useSettingsStore();

  const [activeTab, setActiveTab] = useState('theme');

  useEffect(() => {
    syncPreferences();
  }, []);

  const handleExport = () => {
    try {
      const data = exportPreferences();
      const blob = new Blob([data], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `settings-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      toast({
        title: "Settings Exported",
        description: "Your preferences have been exported successfully.",
      });
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export settings. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (e) => {
      try {
        const data = e.target?.result as string;
        await importPreferences(data);
        toast({
          title: "Settings Imported",
          description: "Your preferences have been imported successfully.",
        });
      } catch (error) {
        toast({
          title: "Import Failed",
          description: "Failed to import settings. Please check the file format.",
          variant: "destructive",
        });
      }
    };
    reader.readAsText(file);
  };

  const handleReset = async (category?: keyof typeof preferences) => {
    try {
      if (category) {
        await resetCategory(category);
        toast({
          title: "Category Reset",
          description: `${category} preferences have been reset to defaults.`,
        });
      } else {
        await resetAllPreferences();
        toast({
          title: "All Settings Reset",
          description: "All preferences have been reset to defaults.",
        });
      }
    } catch (error) {
      toast({
        title: "Reset Failed",
        description: "Failed to reset preferences. Please try again.",
        variant: "destructive",
      });
    }
  };

  const formatLastSynced = (timestamp: string | null) => {
    if (!timestamp) return 'Never';
    const date = new Date(timestamp);
    return date.toLocaleString();
  };

  return (
    <div className="h-full flex flex-col bg-background">
      {/* Header */}
      <div className="flex-shrink-0 p-6 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Settings className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold">Settings</h1>
              <p className="text-sm text-muted-foreground">
                Manage your preferences and customization options
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="w-4 h-4" />
              <span>Last synced: {formatLastSynced(lastSynced)}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={syncPreferences}
              disabled={isLoading}
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
              Sync
            </Button>
          </div>
        </div>
      </div>

      {/* Settings Content */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="theme" className="flex items-center gap-2">
              <Palette className="w-4 h-4" />
              Theme
            </TabsTrigger>
            <TabsTrigger value="ai" className="flex items-center gap-2">
              <Brain className="w-4 h-4" />
              AI
            </TabsTrigger>
            <TabsTrigger value="speech" className="flex items-center gap-2">
              <Volume2 className="w-4 h-4" />
              Speech
            </TabsTrigger>
            <TabsTrigger value="email" className="flex items-center gap-2">
              <Mail className="w-4 h-4" />
              Email
            </TabsTrigger>
            <TabsTrigger value="files" className="flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Files
            </TabsTrigger>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              General
            </TabsTrigger>
          </TabsList>

          {/* Theme Settings */}
          <TabsContent value="theme" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Appearance</CardTitle>
                <CardDescription>
                  Customize the look and feel of your interface
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="theme-mode">Theme Mode</Label>
                  <Select
                    value={preferences.theme.mode}
                    onValueChange={(value) => updatePreference('theme', 'mode', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Light</SelectItem>
                      <SelectItem value="dark">Dark</SelectItem>
                      <SelectItem value="system">System</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="accent-color">Accent Color</Label>
                  <Input
                    type="color"
                    value={preferences.theme.accentColor}
                    onChange={(e) => updatePreference('theme', 'accentColor', e.target.value)}
                    className="w-20 h-10"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="font-size">Font Size</Label>
                  <Select
                    value={preferences.theme.fontSize}
                    onValueChange={(value) => updatePreference('theme', 'fontSize', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="large">Large</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="compact-mode">Compact Mode</Label>
                    <p className="text-sm text-muted-foreground">
                      Use smaller spacing and components
                    </p>
                  </div>
                  <Switch
                    checked={preferences.theme.compactMode}
                    onCheckedChange={(checked) => updatePreference('theme', 'compactMode', checked)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReset('theme')}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Theme
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* AI Settings */}
          <TabsContent value="ai" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI Configuration</CardTitle>
                <CardDescription>
                  Configure AI model behavior and conversation settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="ai-model">Default Model</Label>
                  <Select
                    value={preferences.ai.defaultModel}
                    onValueChange={(value) => updatePreference('ai', 'defaultModel', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default Model</SelectItem>
                      <SelectItem value="kimi-k2-0711-preview">Kimi K2 Preview</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="temperature">Temperature: {preferences.ai.temperature}</Label>
                  <Slider
                    value={[preferences.ai.temperature]}
                    onValueChange={([value]) => updatePreference('ai', 'temperature', value)}
                    max={2}
                    min={0}
                    step={0.1}
                    className="w-full"
                  />
                  <p className="text-xs text-muted-foreground">
                    Higher values make responses more creative, lower values more focused
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-tokens">Max Tokens</Label>
                  <Input
                    type="number"
                    value={preferences.ai.maxTokens}
                    onChange={(e) => updatePreference('ai', 'maxTokens', parseInt(e.target.value))}
                    min={100}
                    max={4000}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="system-prompt">System Prompt</Label>
                  <Textarea
                    value={preferences.ai.systemPrompt}
                    onChange={(e) => updatePreference('ai', 'systemPrompt', e.target.value)}
                    placeholder="Enter a custom system prompt..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="streaming">Streaming Responses</Label>
                    <p className="text-sm text-muted-foreground">
                      Show responses as they are generated
                    </p>
                  </div>
                  <Switch
                    checked={preferences.ai.streamingEnabled}
                    onCheckedChange={(checked) => updatePreference('ai', 'streamingEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save">Auto-save Conversations</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save conversation history
                    </p>
                  </div>
                  <Switch
                    checked={preferences.ai.autoSaveConversations}
                    onCheckedChange={(checked) => updatePreference('ai', 'autoSaveConversations', checked)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReset('ai')}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset AI Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Speech Settings */}
          <TabsContent value="speech" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Speech & Audio</CardTitle>
                <CardDescription>
                  Configure text-to-speech and audio playback settings
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="voice">Default Voice</Label>
                  <Select
                    value={preferences.speech.defaultVoice}
                    onValueChange={(value) => updatePreference('speech', 'defaultVoice', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="alloy">Alloy</SelectItem>
                      <SelectItem value="echo">Echo</SelectItem>
                      <SelectItem value="fable">Fable</SelectItem>
                      <SelectItem value="onyx">Onyx</SelectItem>
                      <SelectItem value="nova">Nova</SelectItem>
                      <SelectItem value="shimmer">Shimmer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="speed">Speed: {preferences.speech.speed}x</Label>
                  <Slider
                    value={[preferences.speech.speed]}
                    onValueChange={([value]) => updatePreference('speech', 'speed', value)}
                    max={2}
                    min={0.5}
                    step={0.1}
                    className="w-full"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="volume">Volume: {Math.round(preferences.speech.volume * 100)}%</Label>
                  <Slider
                    value={[preferences.speech.volume]}
                    onValueChange={([value]) => updatePreference('speech', 'volume', value)}
                    max={1}
                    min={0}
                    step={0.05}
                    className="w-full"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-play">Auto-play Generated Speech</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically play generated audio
                    </p>
                  </div>
                  <Switch
                    checked={preferences.speech.autoPlay}
                    onCheckedChange={(checked) => updatePreference('speech', 'autoPlay', checked)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReset('speech')}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Speech Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Email Settings */}
          <TabsContent value="email" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Email Configuration</CardTitle>
                <CardDescription>
                  Configure email composition and sending preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="email-template">Default Template</Label>
                  <Select
                    value={preferences.email.defaultTemplate}
                    onValueChange={(value) => updatePreference('email', 'defaultTemplate', value)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="professional">Professional</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                      <SelectItem value="marketing">Marketing</SelectItem>
                      <SelectItem value="support">Support</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="signature">Email Signature</Label>
                  <Textarea
                    value={preferences.email.signature}
                    onChange={(e) => updatePreference('email', 'signature', e.target.value)}
                    placeholder="Enter your email signature..."
                    rows={3}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-save-drafts">Auto-save Drafts</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically save email drafts
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email.autoSaveDrafts}
                    onCheckedChange={(checked) => updatePreference('email', 'autoSaveDrafts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="scheduling">Email Scheduling</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable email scheduling features
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email.schedulingEnabled}
                    onCheckedChange={(checked) => updatePreference('email', 'schedulingEnabled', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="confirm-sending">Confirm Before Sending</Label>
                    <p className="text-sm text-muted-foreground">
                      Show confirmation dialog before sending
                    </p>
                  </div>
                  <Switch
                    checked={preferences.email.confirmBeforeSending}
                    onCheckedChange={(checked) => updatePreference('email', 'confirmBeforeSending', checked)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReset('email')}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset Email Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Files Settings */}
          <TabsContent value="files" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>File Management</CardTitle>
                <CardDescription>
                  Configure file upload and management preferences
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="default-category">Default Category</Label>
                  <Select
                    value={preferences.files.defaultCategory}
                    onValueChange={(value) => updatePreference('files', 'defaultCategory', value as any)}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="documents">Documents</SelectItem>
                      <SelectItem value="images">Images</SelectItem>
                      <SelectItem value="audio">Audio</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="max-upload-size">Max Upload Size (MB)</Label>
                  <Input
                    type="number"
                    value={preferences.files.maxUploadSize / (1024 * 1024)}
                    onChange={(e) => updatePreference('files', 'maxUploadSize', parseInt(e.target.value) * 1024 * 1024)}
                    min={1}
                    max={100}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-preview">Auto-preview Files</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically preview files when selected
                    </p>
                  </div>
                  <Switch
                    checked={preferences.files.autoPreview}
                    onCheckedChange={(checked) => updatePreference('files', 'autoPreview', checked)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReset('files')}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset File Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Preferences</CardTitle>
                <CardDescription>
                  Configure general application behavior and features
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="notifications">Notifications</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable system notifications
                    </p>
                  </div>
                  <Switch
                    checked={preferences.general.notifications}
                    onCheckedChange={(checked) => updatePreference('general', 'notifications', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="sound-effects">Sound Effects</Label>
                    <p className="text-sm text-muted-foreground">
                      Play sound effects for interactions
                    </p>
                  </div>
                  <Switch
                    checked={preferences.general.soundEffects}
                    onCheckedChange={(checked) => updatePreference('general', 'soundEffects', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="keyboard-shortcuts">Keyboard Shortcuts</Label>
                    <p className="text-sm text-muted-foreground">
                      Enable keyboard shortcuts
                    </p>
                  </div>
                  <Switch
                    checked={preferences.general.keyboardShortcuts}
                    onCheckedChange={(checked) => updatePreference('general', 'keyboardShortcuts', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="auto-update">Auto-update</Label>
                    <p className="text-sm text-muted-foreground">
                      Automatically update application
                    </p>
                  </div>
                  <Switch
                    checked={preferences.general.autoUpdate}
                    onCheckedChange={(checked) => updatePreference('general', 'autoUpdate', checked)}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label htmlFor="analytics">Usage Analytics</Label>
                    <p className="text-sm text-muted-foreground">
                      Help improve the app by sharing usage data
                    </p>
                  </div>
                  <Switch
                    checked={preferences.general.analytics}
                    onCheckedChange={(checked) => updatePreference('general', 'analytics', checked)}
                  />
                </div>

                <div className="flex justify-end">
                  <Button
                    variant="outline"
                    onClick={() => handleReset('general')}
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Reset General Settings
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Global Actions */}
        <div className="mt-8 p-6 border rounded-lg bg-card">
          <h3 className="text-lg font-semibold mb-4">Backup & Restore</h3>
          <div className="flex flex-wrap gap-4">
            <Button onClick={handleExport} variant="outline">
              <Download className="w-4 h-4 mr-2" />
              Export Settings
            </Button>
            
            <div className="relative">
              <input
                type="file"
                accept=".json"
                onChange={handleImport}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                Import Settings
              </Button>
            </div>
            
            <Button 
              onClick={() => handleReset()} 
              variant="destructive"
            >
              <RotateCcw className="w-4 h-4 mr-2" />
              Reset All Settings
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}