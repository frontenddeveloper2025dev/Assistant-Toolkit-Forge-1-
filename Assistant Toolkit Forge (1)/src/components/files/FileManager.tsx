import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useFileStore, formatFileSize, FileItem } from '@/store/file-store';
import { 
  Upload, 
  Search, 
  Filter, 
  Download, 
  Trash2, 
  Edit3,
  Eye,
  FolderOpen,
  Image,
  FileText,
  Music,
  Video,
  File,
  Plus,
  Loader2
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';

const categoryIcons = {
  image: Image,
  document: FileText,
  audio: Music,
  video: Video,
  other: File
};

const categoryColors = {
  image: 'bg-green-100 text-green-800 border-green-200',
  document: 'bg-blue-100 text-blue-800 border-blue-200',
  audio: 'bg-purple-100 text-purple-800 border-purple-200',
  video: 'bg-red-100 text-red-800 border-red-200',
  other: 'bg-gray-100 text-gray-800 border-gray-200'
};

interface FileCardProps {
  file: FileItem;
  onDelete: (id: string) => void;
  onEdit: (file: FileItem) => void;
  onPreview: (file: FileItem) => void;
}

const FileCard: React.FC<FileCardProps> = ({ file, onDelete, onEdit, onPreview }) => {
  const IconComponent = categoryIcons[file.category];
  
  const handleDownload = () => {
    window.open(file.file_url, '_blank');
  };
  
  return (
    <Card className="group hover:shadow-md transition-shadow duration-200 bg-gradient-to-br from-slate-900 to-slate-800 border-slate-700">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <div className="w-12 h-12 rounded-lg bg-slate-800 border border-slate-600 flex items-center justify-center">
              <IconComponent className="w-6 h-6 text-slate-300" />
            </div>
          </div>
          
          <div className="flex-1 min-w-0">
            <h3 className="font-medium text-white truncate text-sm">
              {file.filename}
            </h3>
            
            <div className="flex items-center gap-2 mt-1">
              <Badge className={`text-xs px-2 py-0.5 ${categoryColors[file.category]}`}>
                {file.category}
              </Badge>
              <span className="text-xs text-slate-400">
                {formatFileSize(file.file_size)}
              </span>
            </div>
            
            {file.description && (
              <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                {file.description}
              </p>
            )}
            
            <div className="text-xs text-slate-500 mt-2">
              {new Date(file.upload_date).toLocaleDateString()}
            </div>
          </div>
          
          <div className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
            <div className="flex gap-1">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onPreview(file)}
                className="h-8 w-8 p-0 hover:bg-slate-700"
              >
                <Eye className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onEdit(file)}
                className="h-8 w-8 p-0 hover:bg-slate-700"
              >
                <Edit3 className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={handleDownload}
                className="h-8 w-8 p-0 hover:bg-slate-700"
              >
                <Download className="w-4 h-4" />
              </Button>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => onDelete(file._id)}
                className="h-8 w-8 p-0 hover:bg-red-600 text-red-400"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export const FileManager: React.FC = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editingFile, setEditingFile] = useState<FileItem | null>(null);
  const [previewFile, setPreviewFile] = useState<FileItem | null>(null);
  const [newDescription, setNewDescription] = useState('');
  const { toast } = useToast();
  
  const {
    files,
    isLoading,
    selectedCategory,
    searchQuery,
    loadFiles,
    uploadFile,
    deleteFile,
    updateFileDescription,
    setSelectedCategory,
    setSearchQuery,
    getFilteredFiles,
    getTotalSize,
    getCategoryCounts
  } = useFileStore();
  
  useEffect(() => {
    loadFiles();
  }, [loadFiles]);
  
  const filteredFiles = getFilteredFiles();
  const categoryCounts = getCategoryCounts();
  const totalSize = getTotalSize();
  
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;
    
    try {
      for (const file of Array.from(files)) {
        await uploadFile(file);
      }
      
      toast({
        title: "Upload successful",
        description: `${files.length} file(s) uploaded successfully`,
      });
    } catch (error) {
      toast({
        title: "Upload failed",
        description: error instanceof Error ? error.message : "Failed to upload file",
        variant: "destructive",
      });
    }
    
    // Reset input
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleDelete = async (fileId: string) => {
    try {
      await deleteFile(fileId);
      toast({
        title: "File deleted",
        description: "File has been moved to trash",
      });
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete file",
        variant: "destructive",
      });
    }
  };
  
  const handleEditSave = async () => {
    if (!editingFile) return;
    
    try {
      await updateFileDescription(editingFile._id, newDescription);
      setEditingFile(null);
      setNewDescription('');
      toast({
        title: "Description updated",
        description: "File description has been updated",
      });
    } catch (error) {
      toast({
        title: "Update failed",
        description: "Failed to update description",
        variant: "destructive",
      });
    }
  };
  
  const categories = [
    { id: 'all', label: 'All Files', icon: FolderOpen },
    { id: 'image', label: 'Images', icon: Image },
    { id: 'document', label: 'Documents', icon: FileText },
    { id: 'audio', label: 'Audio', icon: Music },
    { id: 'video', label: 'Videos', icon: Video },
    { id: 'other', label: 'Other', icon: File },
  ];
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">File Manager</h1>
          <p className="text-slate-300">
            Upload, organize, and manage your files
          </p>
        </div>
        
        {/* Stats and Upload */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-3">
            <Card className="bg-gradient-to-r from-slate-800 to-slate-700 border-slate-600">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-white">Storage Overview</h3>
                    <p className="text-slate-300 text-sm">
                      {files.length} files • {formatFileSize(totalSize)} total
                    </p>
                  </div>
                  <Button
                    onClick={() => fileInputRef.current?.click()}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                    disabled={isLoading}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="w-4 h-4 mr-2" />
                    )}
                    Upload Files
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div>
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Upload className="w-5 h-5 text-purple-400" />
                  <span className="text-white font-medium">Quick Upload</span>
                </div>
                <p className="text-xs text-slate-400 mb-3">
                  Drag & drop or click to upload
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full border-slate-600 hover:bg-slate-700"
                  disabled={isLoading}
                >
                  Choose Files
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        
        {/* Filters and Search */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
          <div className="lg:col-span-1">
            <Card className="bg-slate-800 border-slate-700">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Categories
                </CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="space-y-1">
                  {categories.map((category) => {
                    const IconComponent = category.icon;
                    const count = categoryCounts[category.id] || 0;
                    
                    return (
                      <button
                        key={category.id}
                        onClick={() => setSelectedCategory(category.id)}
                        className={`w-full flex items-center justify-between p-2 rounded-lg text-sm transition-colors ${
                          selectedCategory === category.id
                            ? 'bg-purple-600 text-white'
                            : 'text-slate-300 hover:bg-slate-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <IconComponent className="w-4 h-4" />
                          <span>{category.label}</span>
                        </div>
                        <Badge variant="secondary" className="text-xs">
                          {count}
                        </Badge>
                      </button>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
          
          <div className="lg:col-span-3">
            {/* Search */}
            <div className="mb-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input
                  placeholder="Search files by name or description..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10 bg-slate-800 border-slate-600 text-white placeholder-slate-400"
                />
              </div>
            </div>
            
            {/* File Grid */}
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-purple-400" />
              </div>
            ) : filteredFiles.length === 0 ? (
              <Card className="bg-slate-800 border-slate-700">
                <CardContent className="p-12 text-center">
                  <FolderOpen className="w-12 h-12 text-slate-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-white mb-2">No files found</h3>
                  <p className="text-slate-400">
                    {searchQuery || selectedCategory !== 'all' 
                      ? 'Try adjusting your filters or search query'
                      : 'Upload some files to get started'
                    }
                  </p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {filteredFiles.map((file) => (
                  <FileCard
                    key={file._id}
                    file={file}
                    onDelete={handleDelete}
                    onEdit={(file) => {
                      setEditingFile(file);
                      setNewDescription(file.description || '');
                    }}
                    onPreview={setPreviewFile}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
        
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          multiple
          onChange={handleFileUpload}
          className="hidden"
          accept="*/*"
        />
        
        {/* Edit Dialog */}
        <Dialog open={editingFile !== null} onOpenChange={() => setEditingFile(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white">
            <DialogHeader>
              <DialogTitle>Edit File Description</DialogTitle>
              <DialogDescription className="text-slate-400">
                Update the description for "{editingFile?.filename}"
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <Label htmlFor="description" className="text-white">Description</Label>
              <Textarea
                id="description"
                value={newDescription}
                onChange={(e) => setNewDescription(e.target.value)}
                placeholder="Enter a description for this file..."
                className="mt-2 bg-slate-700 border-slate-600 text-white placeholder-slate-400"
                rows={3}
              />
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setEditingFile(null)}>
                Cancel
              </Button>
              <Button onClick={handleEditSave} className="bg-purple-600 hover:bg-purple-700">
                Save Changes
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
        
        {/* Preview Dialog */}
        <Dialog open={previewFile !== null} onOpenChange={() => setPreviewFile(null)}>
          <DialogContent className="bg-slate-800 border-slate-700 text-white max-w-4xl">
            <DialogHeader>
              <DialogTitle>{previewFile?.filename}</DialogTitle>
              <DialogDescription className="text-slate-400">
                {previewFile && formatFileSize(previewFile.file_size)} • {previewFile?.category}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              {previewFile?.category === 'image' && (
                <img 
                  src={previewFile.file_url} 
                  alt={previewFile.filename}
                  className="max-w-full h-auto rounded-lg"
                />
              )}
              
              {previewFile?.category === 'video' && (
                <video 
                  src={previewFile.file_url} 
                  controls 
                  className="max-w-full h-auto rounded-lg"
                />
              )}
              
              {previewFile?.category === 'audio' && (
                <audio 
                  src={previewFile.file_url} 
                  controls 
                  className="w-full"
                />
              )}
              
              {previewFile?.category === 'document' && (
                <div className="text-center py-8">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                  <p className="text-slate-300">Document preview not available</p>
                  <Button 
                    onClick={() => window.open(previewFile.file_url, '_blank')}
                    className="mt-4 bg-purple-600 hover:bg-purple-700"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download to View
                  </Button>
                </div>
              )}
              
              {previewFile?.description && (
                <div className="mt-4 p-3 bg-slate-700 rounded-lg">
                  <h4 className="text-sm font-medium text-white mb-1">Description</h4>
                  <p className="text-sm text-slate-300">{previewFile.description}</p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => window.open(previewFile?.file_url, '_blank')}
              >
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
              <Button onClick={() => setPreviewFile(null)}>
                Close
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
};