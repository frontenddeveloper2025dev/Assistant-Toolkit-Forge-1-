import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { email } from '@devvai/devv-code-backend'
import { toast } from '@/hooks/use-toast'

export interface EmailTemplate {
  id: string
  name: string
  subject: string
  html: string
  text: string
  category: 'business' | 'personal' | 'marketing' | 'support'
}

export interface EmailDraft {
  id: string
  to: string[]
  cc: string[]
  bcc: string[]
  subject: string
  html: string 
  text: string
  attachments: EmailAttachment[]
  scheduledAt?: string
  tags: EmailTag[]
  createdAt: string
  updatedAt: string
}

export interface EmailAttachment {
  filename: string
  content?: number[]
  path?: string
  contentType?: string
  size?: number
}

export interface EmailTag {
  name: string
  value: string
}

export interface SentEmail {
  id: string
  emailId: string
  to: string[]
  subject: string
  sentAt: string
  status: 'sent' | 'failed' | 'scheduled'
}

interface EmailStore {
  // State
  templates: EmailTemplate[]
  drafts: EmailDraft[]
  sentEmails: SentEmail[]
  isLoading: boolean
  
  // Actions
  loadTemplates: () => void
  createTemplate: (template: Omit<EmailTemplate, 'id'>) => void
  updateTemplate: (id: string, updates: Partial<EmailTemplate>) => void
  deleteTemplate: (id: string) => void
  
  saveDraft: (draft: Omit<EmailDraft, 'id' | 'createdAt' | 'updatedAt'>) => string
  updateDraft: (id: string, updates: Partial<EmailDraft>) => void
  deleteDraft: (id: string) => void
  
  sendEmail: (draft: EmailDraft) => Promise<string | null>
  
  // Utility functions
  getDefaultTemplates: () => EmailTemplate[]
  validateEmail: (email: string) => boolean
  parseEmailList: (emails: string) => string[]
}

const defaultTemplates: EmailTemplate[] = [
  {
    id: 'welcome',
    name: 'Welcome Email',
    subject: 'Welcome to Our Platform!',
    category: 'business',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #8B5CF6 0%, #A855F7 100%); color: white; padding: 30px; text-align: center; border-radius: 8px 8px 0 0;">
          <h1 style="margin: 0; font-size: 28px;">Welcome!</h1>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 0 0 8px 8px;">
          <p style="font-size: 16px; line-height: 1.6; color: #334155;">We're thrilled to have you join our community.</p>
          <p style="font-size: 16px; line-height: 1.6; color: #334155;">Here's what you can do next:</p>
          <ul style="color: #334155; line-height: 1.8;">
            <li>Complete your profile setup</li>
            <li>Explore our powerful features</li>
            <li>Connect with other users</li>
          </ul>
          <div style="text-align: center; margin-top: 30px;">
            <a href="#" style="display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 500;">Get Started</a>
          </div>
        </div>
      </div>
    `,
    text: 'Welcome! We\'re thrilled to have you join our community. Complete your profile, explore our features, and connect with other users.'
  },
  {
    id: 'newsletter',
    name: 'Newsletter Template',
    subject: 'Your Weekly Update',
    category: 'marketing',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background: #1e293b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0;">Weekly Newsletter</h1>
        </div>
        <div style="padding: 30px; background: white;">
          <h2 style="color: #1e293b;">This Week's Highlights</h2>
          <p style="line-height: 1.6; color: #475569;">Add your content here...</p>
          
          <div style="background: #f1f5f9; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #1e293b;">Featured Article</h3>
            <p style="color: #64748b; margin-bottom: 0;">Your featured content goes here.</p>
          </div>
        </div>
      </div>
    `,
    text: 'Weekly Newsletter - This week\'s highlights and featured content.'
  },
  {
    id: 'support',
    name: 'Support Response',
    subject: 'Re: Your Support Request',
    category: 'support',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="border-left: 4px solid #10b981; padding-left: 20px; margin-bottom: 20px;">
          <h2 style="color: #059669; margin: 0;">Support Team Response</h2>
        </div>
        <p style="line-height: 1.6; color: #374151;">Thank you for contacting our support team.</p>
        <p style="line-height: 1.6; color: #374151;">We've reviewed your request and here's our response:</p>
        <div style="background: #f9fafb; border: 1px solid #e5e7eb; padding: 20px; border-radius: 6px; margin: 20px 0;">
          <p style="margin: 0; color: #6b7280;">[Your response content here]</p>
        </div>
        <p style="line-height: 1.6; color: #374151;">If you need further assistance, please don't hesitate to reach out.</p>
        <p style="color: #6b7280; font-size: 14px;">Best regards,<br>The Support Team</p>
      </div>
    `,
    text: 'Thank you for contacting our support team. We\'ve reviewed your request and provided our response.'
  },
  {
    id: 'meeting',
    name: 'Meeting Invitation',
    subject: 'Meeting Invitation - [Meeting Title]',
    category: 'business',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: #3b82f6; color: white; padding: 20px; text-align: center; border-radius: 6px;">
          <h1 style="margin: 0;">Meeting Invitation</h1>
        </div>
        <div style="padding: 30px; background: #fefefe; border: 1px solid #e5e7eb;">
          <p style="font-size: 16px; color: #374151;">You're invited to join our meeting:</p>
          <div style="background: #f8fafc; padding: 20px; border-radius: 6px; margin: 20px 0;">
            <p style="margin: 5px 0; color: #1f2937;"><strong>Title:</strong> [Meeting Title]</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>Date:</strong> [Date]</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>Time:</strong> [Time]</p>
            <p style="margin: 5px 0; color: #1f2937;"><strong>Location:</strong> [Location/Link]</p>
          </div>
          <p style="color: #374151; line-height: 1.6;">[Meeting agenda or additional details]</p>
          <div style="text-align: center; margin-top: 20px;">
            <a href="#" style="background: #3b82f6; color: white; padding: 10px 20px; text-decoration: none; border-radius: 4px;">Join Meeting</a>
          </div>
        </div>
      </div>
    `,
    text: 'Meeting Invitation - You\'re invited to join our meeting. Details: [Meeting Title] on [Date] at [Time].'
  }
]

export const useEmailStore = create<EmailStore>()(
  persist(
    (set, get) => ({
      templates: [],
      drafts: [],
      sentEmails: [],
      isLoading: false,

      loadTemplates: () => {
        const { templates } = get()
        if (templates.length === 0) {
          set({ templates: defaultTemplates })
        }
      },

      createTemplate: (template) => {
        const newTemplate: EmailTemplate = {
          ...template,
          id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
        }
        set(state => ({
          templates: [...state.templates, newTemplate]
        }))
        toast({
          title: "Template Created",
          description: "Email template has been saved successfully."
        })
      },

      updateTemplate: (id, updates) => {
        set(state => ({
          templates: state.templates.map(template =>
            template.id === id ? { ...template, ...updates } : template
          )
        }))
        toast({
          title: "Template Updated",
          description: "Email template has been updated successfully."
        })
      },

      deleteTemplate: (id) => {
        set(state => ({
          templates: state.templates.filter(template => template.id !== id)
        }))
        toast({
          title: "Template Deleted",
          description: "Email template has been removed."
        })
      },

      saveDraft: (draft) => {
        const newDraft: EmailDraft = {
          ...draft,
          id: `draft_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        }
        set(state => ({
          drafts: [...state.drafts, newDraft]
        }))
        toast({
          title: "Draft Saved",
          description: "Email draft has been saved successfully."
        })
        return newDraft.id
      },

      updateDraft: (id, updates) => {
        set(state => ({
          drafts: state.drafts.map(draft =>
            draft.id === id 
              ? { ...draft, ...updates, updatedAt: new Date().toISOString() }
              : draft
          )
        }))
      },

      deleteDraft: (id) => {
        set(state => ({
          drafts: state.drafts.filter(draft => draft.id !== id)
        }))
        toast({
          title: "Draft Deleted",
          description: "Email draft has been removed."
        })
      },

      sendEmail: async (draft) => {
        set({ isLoading: true })
        try {
          const emailOptions = {
            from: 'noreply@interactiveassistant.com', // This would need to be configured
            to: draft.to,
            cc: draft.cc.length > 0 ? draft.cc : undefined,
            bcc: draft.bcc.length > 0 ? draft.bcc : undefined,
            subject: draft.subject,
            html: draft.html || undefined,
            text: draft.text || undefined,
            attachments: draft.attachments.length > 0 ? draft.attachments.map(att => ({
              filename: att.filename,
              content: att.content,
              path: att.path,
              content_type: att.contentType
            })) : undefined,
            tags: draft.tags.length > 0 ? draft.tags : undefined,
            scheduled_at: draft.scheduledAt
          }

          const result = await email.sendEmail(emailOptions)
          
          const sentEmail: SentEmail = {
            id: `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            emailId: result.id,
            to: draft.to,
            subject: draft.subject,
            sentAt: new Date().toISOString(),
            status: draft.scheduledAt ? 'scheduled' : 'sent'
          }

          set(state => ({
            sentEmails: [sentEmail, ...state.sentEmails],
            drafts: state.drafts.filter(d => d.id !== draft.id)
          }))

          toast({
            title: "Email Sent",
            description: draft.scheduledAt ? "Email has been scheduled successfully." : "Email has been sent successfully."
          })

          return result.id
        } catch (error) {
          const sentEmail: SentEmail = {
            id: `sent_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            emailId: '',
            to: draft.to,
            subject: draft.subject,
            sentAt: new Date().toISOString(),
            status: 'failed'
          }

          set(state => ({
            sentEmails: [sentEmail, ...state.sentEmails]
          }))

          toast({
            title: "Email Failed",
            description: error instanceof Error ? error.message : "Failed to send email. Please try again.",
            variant: "destructive"
          })
          return null
        } finally {
          set({ isLoading: false })
        }
      },

      getDefaultTemplates: () => defaultTemplates,

      validateEmail: (email: string) => {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
        return emailRegex.test(email.trim())
      },

      parseEmailList: (emails: string) => {
        return emails
          .split(/[,;\n]/)
          .map(email => email.trim())
          .filter(email => email.length > 0)
          .filter((email, index, arr) => arr.indexOf(email) === index) // Remove duplicates
      }
    }),
    {
      name: 'email-store',
      partialize: (state) => ({
        templates: state.templates,
        drafts: state.drafts,
        sentEmails: state.sentEmails
      })
    }
  )
)