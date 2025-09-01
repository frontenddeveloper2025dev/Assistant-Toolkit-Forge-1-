import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { 
  Brain, 
  MessageSquare, 
  Image, 
  Search, 
  Volume2, 
  Mail, 
  Upload, 
  Settings,
  Sparkles,
  User,
  LogOut,
  ArrowLeft,
  Users,
  Zap
} from 'lucide-react'
import { useAuthStore } from '@/store/auth-store'
import { useToast } from '@/hooks/use-toast'
import { AIChat } from '@/components/ai/AIChat'
import { ImageGenerator } from '@/components/ai/ImageGenerator'
import { WebTools } from '@/components/ai/WebTools'
import { TextToSpeech } from '@/components/ai/TextToSpeech'
import { FileManager } from '@/components/files/FileManager'
import { EmailManager } from '@/components/email/EmailManager'
import SettingsManager from '@/components/settings/SettingsManager'

export function AssistantPage() {
  const { user, logout } = useAuthStore()
  const { toast } = useToast()
  const [selectedTool, setSelectedTool] = useState<string | null>(null)

  const handleLogout = async () => {
    try {
      await logout()
      toast({
        title: 'Signed Out',
        description: 'You have been successfully signed out'
      })
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to sign out',
        variant: 'destructive'
      })
    }
  }

  const handleToolClick = (toolId: string) => {
    const availableTools = ['ai-chat', 'text-to-speech', 'image-generation', 'web-search', 'file-upload', 'email', 'settings']
    
    if (availableTools.includes(toolId)) {
      setSelectedTool(toolId)
    } else {
      toast({
        title: 'Coming Soon',
        description: `This tool will be available in a later phase`,
      })
    }
  }

  const handleBackToTools = () => {
    setSelectedTool(null)
  }

  const renderToolComponent = () => {
    switch (selectedTool) {
      case 'ai-chat':
        return <AIChat />
      case 'image-generation':
        return <ImageGenerator />
      case 'web-search':
        return <WebTools />
      case 'text-to-speech':
        return <TextToSpeech />
      case 'file-upload':
        return <FileManager />
      case 'email':
        return <EmailManager />
      case 'settings':
        return <SettingsManager />
      default:
        return null
    }
  }

  const getToolTitle = () => {
    switch (selectedTool) {
      case 'ai-chat':
        return 'AI Chat Assistant'
      case 'image-generation':
        return 'Image Generation'
      case 'web-search':
        return 'Web Search & Extract'
      case 'text-to-speech':
        return 'Text-to-Speech'
      case 'file-upload':
        return 'File Manager'
      case 'email':
        return 'Email Center'
      case 'settings':
        return 'Settings & Preferences'
      default:
        return ''
    }
  }

  const tools = [
    {
      id: 'ai-chat',
      title: 'AI Chat Assistant',
      description: 'Intelligent conversations with advanced AI models',
      icon: Brain,
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      category: 'AI Core',
      available: true
    },
    {
      id: 'image-generation',
      title: 'Image Generation',
      description: 'Create stunning images from text descriptions',
      icon: Image,
      color: 'text-pink-600',
      bgColor: 'bg-pink-50',
      category: 'Creative',
      available: true
    },
    {
      id: 'text-to-speech',
      title: 'Text-to-Speech',
      description: 'Convert text to natural-sounding speech',
      icon: Volume2,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      category: 'Audio',
      available: true
    },
    {
      id: 'web-search',
      title: 'Web Search & Extract',
      description: 'Search the web and extract content from pages',
      icon: Search,
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      category: 'Research',
      available: true
    },
    {
      id: 'email',
      title: 'Email Center',
      description: 'Compose, send, and manage professional emails',
      icon: Mail,
      color: 'text-red-600',
      bgColor: 'bg-red-50',
      category: 'Communication',
      available: true
    },
    {
      id: 'file-upload',
      title: 'File Management',
      description: 'Upload and manage your files securely',
      icon: Upload,
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      category: 'Storage',
      available: true
    },
    {
      id: 'settings',
      title: 'Settings & Preferences',
      description: 'Customize your experience and manage preferences',
      icon: Settings,
      color: 'text-gray-600',
      bgColor: 'bg-gray-50',
      category: 'System',
      available: true
    }
  ]

  const groupedTools = tools.reduce((acc, tool) => {
    if (!acc[tool.category]) {
      acc[tool.category] = []
    }
    acc[tool.category].push(tool)
    return acc
  }, {} as Record<string, typeof tools>)

  // If a tool is selected, render the tool interface
  if (selectedTool) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
        {/* Tool Header */}
        <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <Button variant="ghost" size="sm" onClick={handleBackToTools}>
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Tools
                </Button>
                <div className="h-6 w-px bg-gray-300" />
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center">
                    <Brain className="h-4 w-4 text-white" />
                  </div>
                  <h1 className="text-lg font-semibold text-gray-900">{getToolTitle()}</h1>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right hidden sm:block">
                  <p className="text-sm font-medium text-gray-900">{user?.name || user?.email}</p>
                </div>
                <Button variant="outline" size="sm" onClick={handleLogout}>
                  <LogOut className="h-4 w-4 mr-2" />
                  Logout
                </Button>
              </div>
            </div>
          </div>
        </header>

        {/* Tool Content */}
        <main className="container mx-auto px-4 py-8">
          {renderToolComponent()}
        </main>
      </div>
    )
  }

  // Default home view
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-indigo-50">
      {/* Header */}
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg">
                <Brain className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Interactive Assistant Toolkit</h1>
                <p className="text-sm text-gray-600">AI-powered tools for modern productivity</p>
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">Welcome, {user?.name || user?.email}</p>
                <p className="text-xs text-gray-500">Premium Member</p>
              </div>
              <Button variant="outline" size="sm" onClick={handleLogout}>
                <LogOut className="h-4 w-4 mr-2" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Welcome Section */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-purple-100 text-purple-700 px-4 py-2 rounded-full text-sm font-medium mb-4">
            <Sparkles className="h-4 w-4" />
            Your AI-Powered Assistant
          </div>
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            Transform Your Workflow with <span className="text-purple-600">AI Tools</span>
          </h2>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Access cutting-edge AI capabilities in one unified platform. From intelligent conversations 
            to creative content generation, we've got everything you need.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-purple-100 text-purple-600 mb-4">
                <Brain className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">7 AI Tools</h3>
              <p className="text-gray-600">Ready to use now</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-indigo-100 text-indigo-600 mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Lightning Fast</h3>
              <p className="text-gray-600">Optimized for performance</p>
            </CardContent>
          </Card>
          
          <Card className="text-center">
            <CardContent className="pt-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-green-100 text-green-600 mb-4">
                <Users className="h-6 w-6" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">Secure & Private</h3>
              <p className="text-gray-600">Your data stays protected</p>
            </CardContent>
          </Card>
        </div>

        {/* Tools Grid */}
        <div className="space-y-8">
          {Object.entries(groupedTools).map(([category, categoryTools]) => (
            <div key={category} className="space-y-4">
              <div className="flex items-center gap-3">
                <h3 className="text-2xl font-bold text-gray-900">{category}</h3>
                <Badge variant="secondary">{categoryTools.length}</Badge>
                {categoryTools.some(tool => !tool.available) && (
                  <Badge variant="outline" className="text-xs">Some features in Phase 3</Badge>
                )}
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {categoryTools.map((tool) => {
                  const Icon = tool.icon
                  return (
                    <Card 
                      key={tool.id} 
                      className={`group transition-shadow cursor-pointer border-2 ${
                        tool.available 
                          ? 'hover:shadow-lg hover:border-purple-200' 
                          : 'opacity-75 hover:border-gray-200'
                      }`}
                      onClick={() => handleToolClick(tool.id)}
                    >
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between mb-2">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center transition-colors ${
                            tool.available 
                              ? `${tool.bgColor} group-hover:opacity-80` 
                              : 'bg-gray-100'
                          }`}>
                            <Icon className={`h-5 w-5 ${
                              tool.available ? tool.color : 'text-gray-400'
                            }`} />
                          </div>
                          <Badge variant={tool.available ? "secondary" : "outline"} className="text-xs">
                            {tool.available ? "Available" : "Phase 3"}
                          </Badge>
                        </div>
                        <CardTitle className="text-lg">{tool.title}</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <CardDescription className="text-sm mb-4">
                          {tool.description}
                        </CardDescription>
                        <Button variant="outline" className="w-full">
                          <MessageSquare className="w-4 h-4 mr-2" />
                          {tool.available ? "Open Tool" : "Coming Soon"}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Quick Actions */}
        <Card className="mt-12 bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-purple-600" />
              Quick Actions
            </CardTitle>
            <CardDescription>
              Jump straight into your most-used tools
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <Button variant="outline" onClick={() => handleToolClick('ai-chat')}>
                <Brain className="w-4 h-4 mr-2" />
                Start Chat
              </Button>
              <Button variant="outline" onClick={() => handleToolClick('image-generation')}>
                <Image className="w-4 h-4 mr-2" />
                Generate Image
              </Button>
              <Button variant="outline" onClick={() => handleToolClick('web-search')}>
                <Search className="w-4 h-4 mr-2" />
                Search Web
              </Button>
              <Button variant="outline" onClick={() => handleToolClick('text-to-speech')}>
                <Volume2 className="w-4 h-4 mr-2" />
                Text to Speech
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>

      {/* Footer */}
      <footer className="border-t bg-white/50 backdrop-blur-sm mt-16">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>&copy; 2024 Interactive Assistant Toolkit. Powered by AI.</p>
          </div>
        </div>
      </footer>
    </div>
  )
}