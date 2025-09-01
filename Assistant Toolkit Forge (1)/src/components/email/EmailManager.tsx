import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useEmailStore, EmailDraft, EmailTemplate, SentEmail } from '@/store/email-store'
import { EmailComposer } from './EmailComposer'
import { 
  Mail, 
  Send, 
  Save, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  FileText, 
  Clock, 
  CheckCircle, 
  XCircle,
  Copy,
  Calendar,
  Users,
  Tag,
  Filter,
  MoreHorizontal,
  Archive,
  Star
} from 'lucide-react'

export function EmailManager() {
  const { toast } = useToast()
  const {
    templates,
    drafts,
    sentEmails,
    loadTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    deleteDraft
  } = useEmailStore()

  const [activeTab, setActiveTab] = useState<'compose' | 'drafts' | 'sent' | 'templates'>('compose')
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedDraft, setSelectedDraft] = useState<string | undefined>()
  const [selectedTemplate, setSelectedTemplate] = useState<string | undefined>()
  const [showComposer, setShowComposer] = useState(false)
  const [showTemplateDialog, setShowTemplateDialog] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<EmailTemplate>>({})

  // Load templates on mount
  useEffect(() => {
    loadTemplates()
  }, [loadTemplates])

  // Filter functions
  const filteredDrafts = drafts.filter(draft =>
    draft.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    draft.to.some(email => email.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredSentEmails = sentEmails.filter(email =>
    email.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
    email.to.some(recipient => recipient.toLowerCase().includes(searchQuery.toLowerCase()))
  )

  const filteredTemplates = templates.filter(template =>
    template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    template.subject.toLowerCase().includes(searchQuery.toLowerCase())
  )

  const handleCreateTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject) {
      toast({
        title: "Invalid Template",
        description: "Please provide a name and subject for the template.",
        variant: "destructive"
      })
      return
    }

    createTemplate({
      name: newTemplate.name,
      subject: newTemplate.subject,
      html: newTemplate.html || '',
      text: newTemplate.text || '',
      category: newTemplate.category || 'business'
    })

    setNewTemplate({})
    setShowTemplateDialog(false)
  }

  const handleComposeFromTemplate = (templateId: string) => {
    setSelectedTemplate(templateId)
    setSelectedDraft(undefined)
    setShowComposer(true)
  }

  const handleEditDraft = (draftId: string) => {
    setSelectedDraft(draftId)
    setSelectedTemplate(undefined)
    setShowComposer(true)
  }

  const handleNewCompose = () => {
    setSelectedDraft(undefined)
    setSelectedTemplate(undefined)
    setShowComposer(true)
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'sent':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'failed':
        return <XCircle className="h-4 w-4 text-red-600" />
      case 'scheduled':
        return <Clock className="h-4 w-4 text-blue-600" />
      default:
        return <Mail className="h-4 w-4 text-gray-400" />
    }
  }

  const getCategoryColor = (category: string) => {
    const colors = {
      business: 'bg-blue-100 text-blue-800',
      personal: 'bg-green-100 text-green-800',
      marketing: 'bg-purple-100 text-purple-800',
      support: 'bg-orange-100 text-orange-800'
    }
    return colors[category as keyof typeof colors] || 'bg-gray-100 text-gray-800'
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-gradient-to-br from-purple-500 to-purple-600">
            <Mail className="h-5 w-5 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold">Email Center</h1>
            <p className="text-sm text-muted-foreground">
              Compose, manage, and track your emails
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search emails..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          {/* New Email Button */}
          <Button 
            onClick={handleNewCompose}
            className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
          >
            <Plus className="h-4 w-4 mr-2" />
            New Email
          </Button>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 p-6">
        <Tabs value={activeTab} onValueChange={(value) => setActiveTab(value as any)}>
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="compose">Compose</TabsTrigger>
            <TabsTrigger value="drafts">
              Drafts ({drafts.length})
            </TabsTrigger>
            <TabsTrigger value="sent">
              Sent ({sentEmails.length})
            </TabsTrigger>
            <TabsTrigger value="templates">
              Templates ({templates.length})
            </TabsTrigger>
          </TabsList>

          {/* Compose Tab */}
          <TabsContent value="compose" className="space-y-6">
            {!showComposer ? (
              <div className="text-center py-12">
                <div className="flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-purple-100 to-purple-200 mx-auto mb-4">
                  <Mail className="h-8 w-8 text-purple-600" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Ready to send an email?</h3>
                <p className="text-muted-foreground mb-6">
                  Start with a template or compose a new message from scratch
                </p>
                <div className="flex items-center justify-center gap-3">
                  <Button onClick={handleNewCompose}>
                    <Plus className="h-4 w-4 mr-2" />
                    New Email
                  </Button>
                  <Button variant="outline" onClick={() => setActiveTab('templates')}>
                    <FileText className="h-4 w-4 mr-2" />
                    Browse Templates
                  </Button>
                </div>
              </div>
            ) : (
              <Card className="h-[calc(100vh-280px)]">
                <EmailComposer
                  draftId={selectedDraft}
                  templateId={selectedTemplate}
                  onClose={() => setShowComposer(false)}
                />
              </Card>
            )}
          </TabsContent>

          {/* Drafts Tab */}
          <TabsContent value="drafts" className="space-y-4">
            {filteredDrafts.length === 0 ? (
              <div className="text-center py-12">
                <Save className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No drafts yet</h3>
                <p className="text-muted-foreground">
                  Start composing an email and save it as a draft
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredDrafts.map((draft) => (
                  <Card key={draft.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-medium">{draft.subject || 'No Subject'}</h3>
                            {draft.scheduledAt && (
                              <Badge variant="outline" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Scheduled
                              </Badge>
                            )}
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>To:</strong> {draft.to.join(', ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            Updated: {formatDate(draft.updatedAt)}
                          </div>
                          {draft.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mt-2">
                              {draft.tags.map((tag, index) => (
                                <Badge key={index} variant="outline" className="text-xs">
                                  {tag.name}: {tag.value}
                                </Badge>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditDraft(draft.id)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => deleteDraft(draft.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Sent Tab */}
          <TabsContent value="sent" className="space-y-4">
            {filteredSentEmails.length === 0 ? (
              <div className="text-center py-12">
                <Send className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No sent emails</h3>
                <p className="text-muted-foreground">
                  Your sent emails will appear here
                </p>
              </div>
            ) : (
              <div className="grid gap-4">
                {filteredSentEmails.map((email) => (
                  <Card key={email.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            {getStatusIcon(email.status)}
                            <h3 className="font-medium">{email.subject}</h3>
                            <Badge
                              variant={email.status === 'sent' ? 'default' : 
                                      email.status === 'failed' ? 'destructive' : 'secondary'}
                              className="text-xs"
                            >
                              {email.status}
                            </Badge>
                          </div>
                          <div className="text-sm text-muted-foreground mb-2">
                            <strong>To:</strong> {email.to.join(', ')}
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {formatDate(email.sentAt)}
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button variant="outline" size="sm">
                            <Copy className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Email Templates</h3>
              <Dialog open={showTemplateDialog} onOpenChange={setShowTemplateDialog}>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Template
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Create Email Template</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <label className="text-sm font-medium">Name</label>
                      <Input
                        value={newTemplate.name || ''}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, name: e.target.value }))}
                        placeholder="Template name"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Subject</label>
                      <Input
                        value={newTemplate.subject || ''}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, subject: e.target.value }))}
                        placeholder="Email subject"
                      />
                    </div>
                    <div>
                      <label className="text-sm font-medium">Category</label>
                      <select
                        value={newTemplate.category || 'business'}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, category: e.target.value as any }))}
                        className="w-full p-2 border rounded-md"
                      >
                        <option value="business">Business</option>
                        <option value="personal">Personal</option>
                        <option value="marketing">Marketing</option>
                        <option value="support">Support</option>
                      </select>
                    </div>
                    <div>
                      <label className="text-sm font-medium">HTML Content</label>
                      <textarea
                        value={newTemplate.html || ''}
                        onChange={(e) => setNewTemplate(prev => ({ ...prev, html: e.target.value }))}
                        placeholder="HTML content"
                        className="w-full p-2 border rounded-md h-32 font-mono text-sm"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button variant="outline" onClick={() => setShowTemplateDialog(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleCreateTemplate}>
                        Create Template
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>

            {filteredTemplates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No templates found</h3>
                <p className="text-muted-foreground">
                  Create your first email template to get started
                </p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {filteredTemplates.map((template) => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium">{template.name}</h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            {template.subject}
                          </p>
                        </div>
                        <Badge className={`text-xs ${getCategoryColor(template.category)}`}>
                          {template.category}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleComposeFromTemplate(template.id)}
                        >
                          <Mail className="h-4 w-4 mr-1" />
                          Use Template
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => deleteTemplate(template.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}