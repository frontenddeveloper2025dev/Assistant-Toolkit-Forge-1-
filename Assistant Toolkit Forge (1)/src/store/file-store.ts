import { create } from 'zustand';
import { table, upload } from '@devvai/devv-code-backend';

export interface FileItem {
  _id: string;
  _uid: string;
  filename: string;
  file_url: string;
  file_size: number;
  file_type: string;
  upload_date: string;
  description?: string;
  category: 'image' | 'document' | 'audio' | 'video' | 'other';
  is_deleted: 'active' | 'deleted';
}

interface FileStore {
  files: FileItem[];
  isLoading: boolean;
  selectedCategory: string;
  searchQuery: string;
  
  // Actions
  loadFiles: () => Promise<void>;
  uploadFile: (file: File, description?: string, category?: string) => Promise<FileItem>;
  deleteFile: (fileId: string) => Promise<void>;
  updateFileDescription: (fileId: string, description: string) => Promise<void>;
  setSelectedCategory: (category: string) => void;
  setSearchQuery: (query: string) => void;
  getFilteredFiles: () => FileItem[];
  getTotalSize: () => number;
  getCategoryCounts: () => Record<string, number>;
}

const TABLE_ID = 'ew3s01t1uiv4';

// Helper function to determine file category
const getFileCategory = (mimeType: string): FileItem['category'] => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType.includes('pdf') || mimeType.includes('document') || 
      mimeType.includes('text') || mimeType.includes('word') || 
      mimeType.includes('excel') || mimeType.includes('powerpoint')) {
    return 'document';
  }
  return 'other';
};

// Helper function to format file size
export const formatFileSize = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

export const useFileStore = create<FileStore>((set, get) => ({
  files: [],
  isLoading: false,
  selectedCategory: 'all',
  searchQuery: '',

  loadFiles: async () => {
    try {
      set({ isLoading: true });
      
      const response = await table.getItems(TABLE_ID, {
        query: { is_deleted: 'active' },
        sort: 'upload_date',
        order: 'desc',
        limit: 100
      });
      
      set({ files: response.items as FileItem[] });
    } catch (error) {
      console.error('Failed to load files:', error);
    } finally {
      set({ isLoading: false });
    }
  },

  uploadFile: async (file: File, description?: string, category?: string) => {
    try {
      set({ isLoading: true });
      
      // Upload file to server
      const uploadResponse = await upload.uploadFile(file);
      
      if (upload.isErrorResponse(uploadResponse)) {
        throw new Error(uploadResponse.errMsg);
      }
      
      // Determine category
      const fileCategory = category || getFileCategory(file.type);
      
      // Create file record in database
      const fileData = {
        filename: file.name,
        file_url: uploadResponse.link || '',
        file_size: file.size,
        file_type: file.type,
        upload_date: new Date().toISOString(),
        description: description || '',
        category: fileCategory,
        is_deleted: 'active'
      };
      
      await table.addItem(TABLE_ID, fileData);
      
      // Reload files to get the new file with system fields
      await get().loadFiles();
      
      // Return the newly created file
      const files = get().files;
      return files.find(f => f.filename === file.name && f.file_url === uploadResponse.link) || files[0];
    } catch (error) {
      console.error('Failed to upload file:', error);
      throw error;
    } finally {
      set({ isLoading: false });
    }
  },

  deleteFile: async (fileId: string) => {
    try {
      const file = get().files.find(f => f._id === fileId);
      if (!file) return;
      
      // Soft delete - mark as deleted
      await table.updateItem(TABLE_ID, {
        _uid: file._uid,
        _id: file._id,
        is_deleted: 'deleted'
      });
      
      // Remove from local state
      set(state => ({
        files: state.files.filter(f => f._id !== fileId)
      }));
    } catch (error) {
      console.error('Failed to delete file:', error);
      throw error;
    }
  },

  updateFileDescription: async (fileId: string, description: string) => {
    try {
      const file = get().files.find(f => f._id === fileId);
      if (!file) return;
      
      // Update in database
      await table.updateItem(TABLE_ID, {
        _uid: file._uid,
        _id: file._id,
        description
      });
      
      // Update local state
      set(state => ({
        files: state.files.map(f => 
          f._id === fileId ? { ...f, description } : f
        )
      }));
    } catch (error) {
      console.error('Failed to update file description:', error);
      throw error;
    }
  },

  setSelectedCategory: (category: string) => {
    set({ selectedCategory: category });
  },

  setSearchQuery: (query: string) => {
    set({ searchQuery: query });
  },

  getFilteredFiles: () => {
    const { files, selectedCategory, searchQuery } = get();
    
    let filtered = files;
    
    // Filter by category
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(f => f.category === selectedCategory);
    }
    
    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(f => 
        f.filename.toLowerCase().includes(query) ||
        (f.description && f.description.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  },

  getTotalSize: () => {
    return get().files.reduce((total, file) => total + file.file_size, 0);
  },

  getCategoryCounts: () => {
    const { files } = get();
    const counts: Record<string, number> = {
      all: files.length,
      image: 0,
      document: 0,
      audio: 0,
      video: 0,
      other: 0
    };
    
    files.forEach(file => {
      counts[file.category]++;
    });
    
    return counts;
  }
}));