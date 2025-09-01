import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { table } from '@devvai/devv-code-backend';

const TABLE_ID = 'ewpy47vj7n5s';

export interface UserPreferences {
  // Theme preferences
  theme: {
    mode: 'light' | 'dark' | 'system';
    accentColor: string;
    fontSize: 'small' | 'medium' | 'large';
    compactMode: boolean;
  };
  
  // AI preferences
  ai: {
    defaultModel: 'default' | 'kimi-k2-0711-preview';
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    streamingEnabled: boolean;
    autoSaveConversations: boolean;
  };
  
  // Speech preferences
  speech: {
    defaultVoice: string;
    speed: number;
    pitch: number;
    volume: number;
    autoPlay: boolean;
  };
  
  // Email preferences
  email: {
    defaultTemplate: string;
    signature: string;
    autoSaveDrafts: boolean;
    schedulingEnabled: boolean;
    confirmBeforeSending: boolean;
  };
  
  // File preferences
  files: {
    defaultCategory: 'documents' | 'images' | 'audio' | 'video' | 'other';
    autoPreview: boolean;
    maxUploadSize: number;
    allowedFileTypes: string[];
  };
  
  // General preferences
  general: {
    notifications: boolean;
    soundEffects: boolean;
    keyboardShortcuts: boolean;
    autoUpdate: boolean;
    analytics: boolean;
  };
}

const defaultPreferences: UserPreferences = {
  theme: {
    mode: 'dark',
    accentColor: '#8b5cf6',
    fontSize: 'medium',
    compactMode: false,
  },
  ai: {
    defaultModel: 'default',
    temperature: 0.7,
    maxTokens: 2000,
    systemPrompt: '',
    streamingEnabled: true,
    autoSaveConversations: true,
  },
  speech: {
    defaultVoice: 'alloy',
    speed: 1.0,
    pitch: 1.0,
    volume: 0.8,
    autoPlay: false,
  },
  email: {
    defaultTemplate: 'professional',
    signature: '',
    autoSaveDrafts: true,
    schedulingEnabled: true,
    confirmBeforeSending: true,
  },
  files: {
    defaultCategory: 'documents',
    autoPreview: true,
    maxUploadSize: 10 * 1024 * 1024, // 10MB
    allowedFileTypes: ['image/*', 'text/*', 'application/pdf', 'audio/*', 'video/*'],
  },
  general: {
    notifications: true,
    soundEffects: true,
    keyboardShortcuts: true,
    autoUpdate: true,
    analytics: false,
  },
};

interface SettingsStore {
  preferences: UserPreferences;
  isLoading: boolean;
  lastSynced: string | null;
  
  // Actions
  updatePreference: <T extends keyof UserPreferences>(
    category: T,
    key: keyof UserPreferences[T],
    value: UserPreferences[T][keyof UserPreferences[T]]
  ) => Promise<void>;
  updateCategory: <T extends keyof UserPreferences>(
    category: T,
    updates: Partial<UserPreferences[T]>
  ) => Promise<void>;
  resetCategory: <T extends keyof UserPreferences>(category: T) => Promise<void>;
  resetAllPreferences: () => Promise<void>;
  syncPreferences: () => Promise<void>;
  loadPreferences: () => Promise<void>;
  exportPreferences: () => string;
  importPreferences: (data: string) => Promise<void>;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set, get) => ({
      preferences: defaultPreferences,
      isLoading: false,
      lastSynced: null,

      updatePreference: async (category, key, value) => {
        const { preferences } = get();
        const updatedPreferences = {
          ...preferences,
          [category]: {
            ...preferences[category],
            [key]: value,
          },
        };

        set({ preferences: updatedPreferences });

        try {
          await table.addItem(TABLE_ID, {
            category,
            key: String(key),
            value: JSON.stringify({ value, updatedAt: new Date().toISOString() }),
            updated_at: new Date().toISOString(),
          });
          
          set({ lastSynced: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to sync preference:', error);
          // Revert on error
          set({ preferences });
        }
      },

      updateCategory: async (category, updates) => {
        const { preferences } = get();
        const updatedPreferences = {
          ...preferences,
          [category]: {
            ...preferences[category],
            ...updates,
          },
        };

        set({ preferences: updatedPreferences });

        try {
          // Save each updated preference
          for (const [key, value] of Object.entries(updates)) {
            await table.addItem(TABLE_ID, {
              category,
              key,
              value: JSON.stringify({ value, updatedAt: new Date().toISOString() }),
              updated_at: new Date().toISOString(),
            });
          }
          
          set({ lastSynced: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to sync category:', error);
          // Revert on error
          set({ preferences });
        }
      },

      resetCategory: async (category) => {
        const { preferences } = get();
        const updatedPreferences = {
          ...preferences,
          [category]: defaultPreferences[category],
        };

        set({ preferences: updatedPreferences });

        try {
          // Clear category from database
          const response = await table.getItems(TABLE_ID, {
            indexName: 'category_key_idx',
            query: { category },
          });
          const items = response.items;

          for (const item of items) {
            await table.deleteItem(TABLE_ID, {
              _uid: item._uid,
              _id: item._id,
            });
          }

          // Save default values
          for (const [key, value] of Object.entries(defaultPreferences[category])) {
            await table.addItem(TABLE_ID, {
              category,
              key,
              value: JSON.stringify({ value, updatedAt: new Date().toISOString() }),
              updated_at: new Date().toISOString(),
            });
          }
          
          set({ lastSynced: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to reset category:', error);
          // Revert on error
          set({ preferences });
        }
      },

      resetAllPreferences: async () => {
        set({ preferences: defaultPreferences });

        try {
          // Clear all preferences from database
          const allResponse = await table.getItems(TABLE_ID, {});
          for (const item of allResponse.items) {
            await table.deleteItem(TABLE_ID, {
              _uid: item._uid,
              _id: item._id,
            });
          }

          // Save all default preferences
          for (const [category, categoryPrefs] of Object.entries(defaultPreferences)) {
            for (const [key, value] of Object.entries(categoryPrefs)) {
              await table.addItem(TABLE_ID, {
                category,
                key,
                value: JSON.stringify({ value, updatedAt: new Date().toISOString() }),
                updated_at: new Date().toISOString(),
              });
            }
          }
          
          set({ lastSynced: new Date().toISOString() });
        } catch (error) {
          console.error('Failed to reset all preferences:', error);
        }
      },

      syncPreferences: async () => {
        set({ isLoading: true });

        try {
          const response = await table.getItems(TABLE_ID, {});
          const items = response.items;
          const preferences = { ...defaultPreferences };

          // Organize by category and key
          for (const item of items) {
            const { category, key, value } = item;
            if (preferences[category as keyof UserPreferences] && value) {
              const parsedValue = JSON.parse(value);
              (preferences[category as keyof UserPreferences] as any)[key] = parsedValue.value;
            }
          }

          set({ 
            preferences, 
            lastSynced: new Date().toISOString(),
            isLoading: false 
          });
        } catch (error) {
          console.error('Failed to sync preferences:', error);
          set({ isLoading: false });
        }
      },

      loadPreferences: async () => {
        const { syncPreferences } = get();
        await syncPreferences();
      },

      exportPreferences: () => {
        const { preferences } = get();
        return JSON.stringify({
          preferences,
          exportedAt: new Date().toISOString(),
          version: '1.0',
        }, null, 2);
      },

      importPreferences: async (data) => {
        try {
          const imported = JSON.parse(data);
          if (imported.preferences && imported.version) {
            const { updateCategory } = get();
            
            // Import each category
            for (const [category, categoryPrefs] of Object.entries(imported.preferences)) {
              await updateCategory(category as keyof UserPreferences, categoryPrefs);
            }
          } else {
            throw new Error('Invalid preferences format');
          }
        } catch (error) {
          console.error('Failed to import preferences:', error);
          throw error;
        }
      },
    }),
    {
      name: 'user-settings',
      partialize: (state) => ({ 
        preferences: state.preferences,
        lastSynced: state.lastSynced,
      }),
    }
  )
);