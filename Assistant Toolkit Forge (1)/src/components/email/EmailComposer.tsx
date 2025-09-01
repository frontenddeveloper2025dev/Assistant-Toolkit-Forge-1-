import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Separator } from '@/components/ui/separator'
import { useToast } from '@/hooks/use-toast'
import { useEmailStore, EmailDraft, EmailTemplate, EmailAttachment } from '@/store/email-store'
import { useFileStore, FileItem, formatFileSize } from '@/store/file-store'
import { 
  Send, 
  Save, 
  X, 
  Plus, 
  FileText, 
  Clock, 
  Eye, 
  Code,
  Mail,
  Calendar,
  Paperclip,
  Users,
  Tag,
  Trash2,
  Copy,
  Settings,
  Upload,
  Download,
  Image,
  File,
  Video,
  Music,
  CheckCircle2
} from 'lucide-react'

interface EmailComposerProps {
  draftId?: string
  templateId?: string
  onClose?: () => void
}

export function EmailComposer({ draftId, templateId, onClose }: EmailComposerProps) {
  const { toast } = useToast()
  const {
    templates,
    drafts,
    saveDraft,
    updateDraft,
    sendEmail,
    deleteDraft,
    isLoading,
    loadTemplates,
    validateEmail,
    parseEmailList
  } = useEmailStore()
  
  const { files, loadFiles, uploadFile, getFilteredFiles } = useFileStore()

  const [to, setTo] = useState<string>('')
  const [cc, setCc] = useState<string>('')
  const [bcc, setBcc] = useState<string>('')
  const [subject, setSubject] = useState<string>('')
  const [htmlContent, setHtmlContent] = useState<string>('')
  const [textContent, setTextContent] = useState<string>('')
  const [scheduledAt, setScheduledAt] = useState<string>('')
  const [tags, setTags] = useState<string>('')
  const [showAdvanced, setShowAdvanced] = useState(false)
  const [previewMode, setPreviewMode] = useState<'compose' | 'preview'>('compose')
  const [currentDraftId, setCurrentDraftId] = useState<string | undefined>(draftId)
  const [attachments, setAttachments] = useState<EmailAttachment[]>([])
  const [showFileSelector, setShowFileSelector] = useState(false)
  const [uploadingFile, setUploadingFile] = useState(false)

  // Load templates and files on mount
  useEffect(() => {
    loadTemplates()
    loadFiles()
  }, [loadTemplates, loadFiles])

  // Load draft or template data
  useEffect(() => {
    if (draftId) {
      const draft = drafts.find(d => d.id === draftId)
      if (draft) {
        setTo(draft.to.join(', '))
        setCc(draft.cc.join(', '))
        setBcc(draft.bcc.join(', '))
        setSubject(draft.subject)
        setHtmlContent(draft.html)
        setTextContent(draft.text)
        setScheduledAt(draft.scheduledAt || '')
        setTags(draft.tags.map(tag => `${tag.name}:${tag.value}`).join(', '))
        setAttachments(draft.attachments || [])
      }
    } else if (templateId) {
      const template = templates.find(t => t.id === templateId)
      if (template) {
        setSubject(template.subject)
        setHtmlContent(template.html)
        setTextContent(template.text)
      }
    }
  }, [draftId, templateId, drafts, templates])

  const parsedTo = parseEmailList(to)
  const parsedCc = parseEmailList(cc)
  const parsedBcc = parseEmailList(bcc)
  const parsedTags = tags.split(',').map(tag => {
    const [name, value] = tag.trim().split(':')
    return name && value ? { name: name.trim(), value: value.trim() } : null
  }).filter(Boolean) as { name: string; value: string }[]

  const isValidEmail = (email: string) => validateEmail(email)
  const hasValidRecipients = parsedTo.length > 0 && parsedTo.every(email => isValidEmail(email))
  const hasContent = htmlContent.trim() || textContent.trim()
  const canSend = hasValidRecipients && subject.trim() && hasContent

  const handleSaveDraft = () => {
    const draftData = {
      to: parsedTo,
      cc: parsedCc,
      bcc: parsedBcc,
      subject: subject.trim(),
      html: htmlContent,
      text: textContent,
      attachments: attachments,
      scheduledAt: scheduledAt || undefined,
      tags: parsedTags
    }

    if (currentDraftId) {
      updateDraft(currentDraftId, draftData)
    } else {
      const newDraftId = saveDraft(draftData)
      setCurrentDraftId(newDraftId)
    }
  }

  const handleSendEmail = async () => {
    if (!canSend) {
      toast({
        title: "Invalid Email",
        description: "Please check recipients, subject, and content.",
        variant: "destructive"
      })
      return
    }

    const draftData: EmailDraft = {
      id: currentDraftId || `temp_${Date.now()}`,
      to: parsedTo,
      cc: parsedCc,
      bcc: parsedBcc,
      subject: subject.trim(),
      html: htmlContent,
      text: textContent,
      attachments: attachments,
      scheduledAt: scheduledAt || undefined,
      tags: parsedTags,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    const emailId = await sendEmail(draftData)
    if (emailId) {
      onClose?.()
    }
  }

  const handleLoadTemplate = (template: EmailTemplate) => {
    setSubject(template.subject)
    setHtmlContent(template.html)
    setTextContent(template.text)
    toast({
      title: "Template Loaded",
      description: `"${template.name}" template has been loaded.`
    })
  }

  const handleDeleteDraft = () => {
    if (currentDraftId) {
      deleteDraft(currentDraftId)
      onClose?.()
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

  const handleFileUpload = async (file: File) => {
    try {
      setUploadingFile(true)
      const uploadedFile = await uploadFile(file, `Email attachment: ${file.name}`)
      
      const emailAttachment: EmailAttachment = {
        filename: uploadedFile.filename,
        path: uploadedFile.file_url,
        contentType: uploadedFile.file_type,
        size: uploadedFile.file_size
      }
      
      setAttachments(prev => [...prev, emailAttachment])
      
      toast({
        title: "File Attached",
        description: `${file.name} has been attached to your email.`
      })
    } catch (error) {
      console.error('Failed to upload file:', error)
      toast({
        title: "Upload Failed",
        description: "Failed to attach file. Please try again.",
        variant: "destructive"
      })
    } finally {
      setUploadingFile(false)
    }
  }

  const handleFileSelect = (fileItem: FileItem) => {
    const emailAttachment: EmailAttachment = {
      filename: fileItem.filename,
      path: fileItem.file_url,
      contentType: fileItem.file_type,
      size: fileItem.file_size
    }
    
    setAttachments(prev => [...prev, emailAttachment])
    setShowFileSelector(false)
    
    toast({
      title: "File Attached",
      description: `${fileItem.filename} has been attached to your email.`
    })
  }

  const removeAttachment = (index: number) => {
    setAttachments(prev => prev.filter((_, i) => i !== index))
  }

  const getFileIcon = (contentType: string) => {
    if (contentType.startsWith('image/')) return <Image className="h-4 w-4" />
    if (contentType.startsWith('video/')) return <Video className="h-4 w-4" />
    if (contentType.startsWith('audio/')) return <Music className="h-4 w-4" />
    return <File className="h-4 w-4" />
  }

  const getTotalAttachmentSize = () => {
    return attachments.reduce((total, att) => total + (att.size || 0), 0)
  }

  return (
    <div className="flex h-full">
      {/* Main Composer */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <Mail className="h-5 w-5 text-purple-600" />
            <h2 className="text-lg font-semibold">
              {currentDraftId ? 'Edit Draft' : 'Compose Email'}
            </h2>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPreviewMode(previewMode === 'compose' ? 'preview' : 'compose')}
            >
              {previewMode === 'compose' ? <Eye className="h-4 w-4" /> : <Code className="h-4 w-4" />}
              {previewMode === 'compose' ? 'Preview' : 'Edit'}
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              <Settings className="h-4 w-4" />
              Advanced
            </Button>
            {onClose && (
              <Button variant="ghost" size="sm" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Content */}
        <ScrollArea className="flex-1">
          <div className="p-6 space-y-6">
            {previewMode === 'compose' ? (
              <>
                {/* Recipients */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="to">To *</Label>
                    <Input
                      id="to"
                      value={to}
                      onChange={(e) => setTo(e.target.value)}
                      placeholder="recipient@example.com, another@example.com"
                      className={!hasValidRecipients && to ? 'border-red-500' : ''}
                    />
                    {parsedTo.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {parsedTo.map((email, index) => (
                          <Badge
                            key={index}
                            variant={isValidEmail(email) ? 'default' : 'destructive'}
                            className="text-xs"
                          >
                            {email}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>

                  {showAdvanced && (
                    <>
                      <div>
                        <Label htmlFor="cc">CC</Label>
                        <Input
                          id="cc"
                          value={cc}
                          onChange={(e) => setCc(e.target.value)}
                          placeholder="cc@example.com"
                        />
                        {parsedCc.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {parsedCc.map((email, index) => (
                              <Badge key={index} variant="secondary" className="text-xs">
                                {email}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>

                      <div>
                        <Label htmlFor="bcc">BCC</Label>
                        <Input
                          id="bcc"
                          value={bcc}
                          onChange={(e) => setBcc(e.target.value)}
                          placeholder="bcc@example.com"
                        />
                        {parsedBcc.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {parsedBcc.map((email, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {email}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Subject */}
                <div>
                  <Label htmlFor="subject">Subject *</Label>
                  <Input
                    id="subject"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    placeholder="Enter email subject"
                  />
                </div>

                {/* Content */}
                <Tabs defaultValue="html" className="w-full">
                  <TabsList>
                    <TabsTrigger value="html">HTML Content</TabsTrigger>
                    <TabsTrigger value="text">Plain Text</TabsTrigger>
                  </TabsList>
                  <TabsContent value="html" className="space-y-2">
                    <Label htmlFor="html-content">HTML Content</Label>
                    <Textarea
                      id="html-content"
                      value={htmlContent}
                      onChange={(e) => setHtmlContent(e.target.value)}
                      placeholder="Enter HTML content or use a template..."
                      className="min-h-[300px] font-mono text-sm"
                    />
                  </TabsContent>
                  <TabsContent value="text" className="space-y-2">
                    <Label htmlFor="text-content">Plain Text Content</Label>
                    <Textarea
                      id="text-content"
                      value={textContent}
                      onChange={(e) => setTextContent(e.target.value)}
                      placeholder="Enter plain text content..."
                      className="min-h-[300px]"
                    />
                  </TabsContent>
                </Tabs>

                {/* Attachments Section */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <Label className="flex items-center gap-2">
                      <Paperclip className="h-4 w-4" />
                      Attachments {attachments.length > 0 && `(${attachments.length})`}
                    </Label>
                    <div className="flex items-center gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowFileSelector(true)}
                      >
                        <FileText className="h-4 w-4 mr-2" />
                        From Files
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => document.getElementById('file-upload')?.click()}
                        disabled={uploadingFile}
                      >
                        <Upload className="h-4 w-4 mr-2" />
                        {uploadingFile ? 'Uploading...' : 'Upload New'}
                      </Button>
                      <input
                        id="file-upload"
                        type="file"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0]
                          if (file) {
                            handleFileUpload(file)
                            e.target.value = ''
                          }
                        }}
                      />
                    </div>
                  </div>

                  {attachments.length > 0 && (
                    <div className="space-y-2">
                      {attachments.map((attachment, index) => (
                        <div
                          key={index}
                          className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
                        >
                          <div className="flex items-center gap-3">
                            {getFileIcon(attachment.contentType || '')}
                            <div>
                              <p className="text-sm font-medium">{attachment.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {attachment.size ? formatFileSize(attachment.size) : 'Unknown size'}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            {attachment.path && (
                              <Button
                                type="button"
                                variant="ghost"
                                size="sm"
                                onClick={() => window.open(attachment.path, '_blank')}
                              >
                                <Download className="h-4 w-4" />
                              </Button>
                            )}
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeAttachment(index)}
                            >
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                      {getTotalAttachmentSize() > 0 && (
                        <p className="text-xs text-muted-foreground text-right">
                          Total size: {formatFileSize(getTotalAttachmentSize())}
                        </p>
                      )}
                    </div>
                  )}
                </div>

                {/* Advanced Options */}
                {showAdvanced && (
                  <div className="space-y-4 p-4 bg-muted/50 rounded-lg">
                    <h3 className="text-sm font-medium flex items-center gap-2">
                      <Settings className="h-4 w-4" />
                      Advanced Options
                    </h3>
                    
                    <div>
                      <Label htmlFor="scheduled">Schedule Send</Label>
                      <Input
                        id="scheduled"
                        type="datetime-local"
                        value={scheduledAt}
                        onChange={(e) => setScheduledAt(e.target.value)}
                      />
                    </div>

                    <div>
                      <Label htmlFor="tags">Tags (name:value, separated by commas)</Label>
                      <Input
                        id="tags"
                        value={tags}
                        onChange={(e) => setTags(e.target.value)}
                        placeholder="campaign:newsletter, type:marketing"
                      />
                      {parsedTags.length > 0 && (
                        <div className="flex flex-wrap gap-1 mt-2">
                          {parsedTags.map((tag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              <Tag className="h-3 w-3 mr-1" />
                              {tag.name}: {tag.value}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </>
            ) : (
              /* Preview Mode */
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <div className="text-sm text-muted-foreground space-y-1">
                    <div><strong>To:</strong> {parsedTo.join(', ')}</div>
                    {parsedCc.length > 0 && (
                      <div><strong>CC:</strong> {parsedCc.join(', ')}</div>
                    )}
                    {parsedBcc.length > 0 && (
                      <div><strong>BCC:</strong> {parsedBcc.join(', ')}</div>
                    )}
                    <div><strong>Subject:</strong> {subject}</div>
                    {scheduledAt && (
                      <div><strong>Scheduled:</strong> {new Date(scheduledAt).toLocaleString()}</div>
                    )}
                    {attachments.length > 0 && (
                      <div><strong>Attachments:</strong> {attachments.length} file(s) ({formatFileSize(getTotalAttachmentSize())})</div>
                    )}
                  </div>
                </div>
                
                <Separator />
                
                <div className="border rounded-lg">
                  {htmlContent ? (
                    <div
                      dangerouslySetInnerHTML={{ __html: htmlContent }}
                      className="p-4"
                    />
                  ) : (
                    <div className="p-4 whitespace-pre-wrap">
                      {textContent || 'No content to preview'}
                    </div>
                  )}
                </div>

                {/* Attachment Preview */}
                {attachments.length > 0 && (
                  <>
                    <Separator />
                    <div className="space-y-2">
                      <h4 className="text-sm font-medium flex items-center gap-2">
                        <Paperclip className="h-4 w-4" />
                        Attachments ({attachments.length})
                      </h4>
                      <div className="grid gap-2">
                        {attachments.map((attachment, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-3 p-2 bg-muted/30 rounded"
                          >
                            {getFileIcon(attachment.contentType || '')}
                            <div className="flex-1">
                              <p className="text-sm font-medium">{attachment.filename}</p>
                              <p className="text-xs text-muted-foreground">
                                {attachment.size ? formatFileSize(attachment.size) : 'Unknown size'}
                              </p>
                            </div>
                            <CheckCircle2 className="h-4 w-4 text-green-600" />
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>
        </ScrollArea>

        {/* Footer Actions */}
        <div className="flex items-center justify-between p-4 border-t bg-background">
          <div className="flex items-center gap-2">
            {currentDraftId && (
              <Button
                variant="outline"
                size="sm"
                onClick={handleDeleteDraft}
              >
                <Trash2 className="h-4 w-4" />
                Delete Draft
              </Button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={handleSaveDraft}
              disabled={!subject.trim() && !hasContent}
            >
              <Save className="h-4 w-4 mr-2" />
              Save Draft
            </Button>
            <Button
              onClick={handleSendEmail}
              disabled={!canSend || isLoading}
              className="bg-gradient-to-r from-purple-600 to-purple-700 hover:from-purple-700 hover:to-purple-800"
            >
              {isLoading ? (
                <>Loading...</>
              ) : (
                <>
                  {scheduledAt ? <Clock className="h-4 w-4 mr-2" /> : <Send className="h-4 w-4 mr-2" />}
                  {scheduledAt ? 'Schedule' : 'Send'}
                </>
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Templates Sidebar */}
      <div className="w-80 border-l bg-muted/20">
        <div className="p-4 border-b">
          <h3 className="font-medium flex items-center gap-2">
            <FileText className="h-4 w-4" />
            Email Templates
          </h3>
        </div>
        <ScrollArea className="h-full">
          <div className="p-4 space-y-3">
            {templates.map((template) => (
              <Card
                key={template.id}
                className="cursor-pointer hover:bg-muted/50 transition-colors"
                onClick={() => handleLoadTemplate(template)}
              >
                <CardContent className="p-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{template.name}</h4>
                      <p className="text-xs text-muted-foreground mt-1">
                        {template.subject}
                      </p>
                    </div>
                    <Badge className={`text-xs ${getCategoryColor(template.category)}`}>
                      {template.category}
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* File Selector Dialog */}
      <Dialog open={showFileSelector} onOpenChange={setShowFileSelector}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Select File to Attach
            </DialogTitle>
          </DialogHeader>
          <ScrollArea className="h-[60vh]">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 p-4">
              {getFilteredFiles().map((file) => (
                <Card
                  key={file._id}
                  className="cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() => handleFileSelect(file)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0">
                        {getFileIcon(file.file_type)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm truncate">{file.filename}</h4>
                        <p className="text-xs text-muted-foreground mt-1">
                          {formatFileSize(file.file_size)}
                        </p>
                        {file.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                            {file.description}
                          </p>
                        )}
                        <Badge className="mt-2 text-xs" variant="secondary">
                          {file.category}
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {getFilteredFiles().length === 0 && (
                <div className="col-span-full text-center py-8 text-muted-foreground">
                  <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                  <p>No files available to attach</p>
                </div>
              )}
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </div>
  )
}