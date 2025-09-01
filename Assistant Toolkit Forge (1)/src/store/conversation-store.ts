import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { table } from '@devvai/devv-code-backend';

export interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  metadata?: {
    tool_type?: 'chat' | 'tts' | 'image' | 'search';
    audio_url?: string;
    image_urls?: string[];
    search_results?: any[];
    voice_settings?: any;
  };
}

export interface Conversation {
  id: string;
  title: string;
  tool_type: 'chat' | 'tts' | 'image' | 'search';
  messages: Message[];
  created_at: string;
  updated_at: string;
  metadata?: any;
}

interface ConversationState {
  conversations: Conversation[];
  currentConversation: Conversation | null;
  isLoading: boolean;
  error: string | null;
  
  // Actions
  loadConversations: () => Promise<void>;
  createConversation: (toolType: 'chat' | 'tts' | 'image' | 'search', title?: string) => Promise<string>;
  selectConversation: (conversationId: string) => void;
  addMessage: (message: Omit<Message, 'id' | 'timestamp'>) => Promise<void>;
  updateConversation: (conversationId: string, updates: Partial<Conversation>) => Promise<void>;
  deleteConversation: (conversationId: string) => Promise<void>;
  clearError: () => void;
}

const TABLE_ID = 'ew3r9faj0n40'; // conversations table ID

export const useConversationStore = create<ConversationState>()(
  persist(
    (set, get) => ({
      conversations: [],
      currentConversation: null,
      isLoading: false,
      error: null,

      loadConversations: async () => {
        try {
          set({ isLoading: true, error: null });
          
          const response = await table.getItems(TABLE_ID, {
            sort: 'updated_at',
            order: 'desc',
            limit: 50
          });
          
          const conversations: Conversation[] = response.items.map(item => ({
            id: item._id,
            title: item.title,
            tool_type: item.tool_type,
            messages: JSON.parse(item.messages || '[]'),
            created_at: item.created_at,
            updated_at: item.updated_at,
            metadata: item.metadata ? JSON.parse(item.metadata) : undefined
          }));
          
          set({ conversations, isLoading: false });
        } catch (error) {
          console.error('Failed to load conversations:', error);
          set({ error: 'Failed to load conversations', isLoading: false });
        }
      },

      createConversation: async (toolType, title) => {
        try {
          set({ error: null });
          
          const now = new Date().toISOString();
          const conversationTitle = title || `New ${toolType} conversation`;
          
          const conversationData = {
            title: conversationTitle,
            tool_type: toolType,
            messages: JSON.stringify([]),
            created_at: now,
            updated_at: now,
            metadata: JSON.stringify({})
          };
          
          await table.addItem(TABLE_ID, conversationData);
          
          // Reload conversations to get the new one with proper ID
          await get().loadConversations();
          
          // Find and return the newly created conversation ID
          const conversations = get().conversations;
          const newConversation = conversations.find(c => 
            c.created_at === now && c.tool_type === toolType
          );
          
          return newConversation?.id || '';
        } catch (error) {
          console.error('Failed to create conversation:', error);
          set({ error: 'Failed to create conversation' });
          throw error;
        }
      },

      selectConversation: (conversationId) => {
        const conversations = get().conversations;
        const conversation = conversations.find(c => c.id === conversationId);
        set({ currentConversation: conversation || null });
      },

      addMessage: async (message) => {
        try {
          const { currentConversation } = get();
          if (!currentConversation) return;
          
          const newMessage: Message = {
            ...message,
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            timestamp: new Date().toISOString()
          };
          
          const updatedMessages = [...currentConversation.messages, newMessage];
          const updatedConversation = {
            ...currentConversation,
            messages: updatedMessages,
            updated_at: new Date().toISOString()
          };
          
          // Update local state immediately for responsiveness
          set({
            currentConversation: updatedConversation,
            conversations: get().conversations.map(c =>
              c.id === currentConversation.id ? updatedConversation : c
            )
          });
          
          // Persist to database
          await table.updateItem(TABLE_ID, {
            _uid: '', // Will be filled by SDK
            _id: currentConversation.id,
            messages: JSON.stringify(updatedMessages),
            updated_at: updatedConversation.updated_at
          });
          
        } catch (error) {
          console.error('Failed to add message:', error);
          set({ error: 'Failed to save message' });
        }
      },

      updateConversation: async (conversationId, updates) => {
        try {
          const { conversations } = get();
          const conversation = conversations.find(c => c.id === conversationId);
          if (!conversation) return;
          
          const updatedConversation = {
            ...conversation,
            ...updates,
            updated_at: new Date().toISOString()
          };
          
          // Update local state
          set({
            conversations: conversations.map(c =>
              c.id === conversationId ? updatedConversation : c
            ),
            currentConversation: get().currentConversation?.id === conversationId 
              ? updatedConversation 
              : get().currentConversation
          });
          
          // Persist to database
          const updateData: any = {
            _uid: '', // Will be filled by SDK
            _id: conversationId,
            updated_at: updatedConversation.updated_at
          };
          
          if (updates.title) updateData.title = updates.title;
          if (updates.messages) updateData.messages = JSON.stringify(updates.messages);
          if (updates.metadata) updateData.metadata = JSON.stringify(updates.metadata);
          
          await table.updateItem(TABLE_ID, updateData);
          
        } catch (error) {
          console.error('Failed to update conversation:', error);
          set({ error: 'Failed to update conversation' });
        }
      },

      deleteConversation: async (conversationId) => {
        try {
          await table.deleteItem(TABLE_ID, {
            _uid: '', // Will be filled by SDK
            _id: conversationId
          });
          
          const { conversations, currentConversation } = get();
          set({
            conversations: conversations.filter(c => c.id !== conversationId),
            currentConversation: currentConversation?.id === conversationId ? null : currentConversation
          });
          
        } catch (error) {
          console.error('Failed to delete conversation:', error);
          set({ error: 'Failed to delete conversation' });
        }
      },

      clearError: () => set({ error: null })
    }),
    {
      name: 'conversation-store',
      partialize: (state) => ({
        // Only persist non-sensitive data locally
        currentConversation: state.currentConversation
      })
    }
  )
);