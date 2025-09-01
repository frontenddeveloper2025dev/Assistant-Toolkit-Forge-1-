import React, { useEffect, useState } from 'react';
import { MessageSquare, Plus, Search, Image, Volume2, Trash2, Edit3, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { useConversationStore, Conversation } from '@/store/conversation-store';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';

interface ConversationSidebarProps {
  currentTool: 'chat' | 'tts' | 'image' | 'search';
  onConversationSelect: (conversationId: string) => void;
  onNewConversation: () => void;
}

const toolIcons = {
  chat: MessageSquare,
  tts: Volume2,
  image: Image,
  search: Search
};

const toolColors = {
  chat: 'bg-blue-500/20 text-blue-400',
  tts: 'bg-green-500/20 text-green-400',
  image: 'bg-purple-500/20 text-purple-400',
  search: 'bg-orange-500/20 text-orange-400'
};

export function ConversationSidebar({ currentTool, onConversationSelect, onNewConversation }: ConversationSidebarProps) {
  const { 
    conversations, 
    currentConversation, 
    isLoading, 
    error, 
    loadConversations, 
    deleteConversation,
    updateConversation,
    clearError 
  } = useConversationStore();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    if (error) {
      toast({
        title: "Error",
        description: error,
        variant: "destructive"
      });
      clearError();
    }
  }, [error, toast, clearError]);

  const filteredConversations = conversations.filter(conv => {
    const matchesSearch = conv.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         conv.messages.some(msg => msg.content.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesTool = conv.tool_type === currentTool;
    return matchesSearch && matchesTool;
  });

  const handleDelete = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteConversation(conversationId);
      toast({
        title: "Success",
        description: "Conversation deleted successfully"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete conversation",
        variant: "destructive"
      });
    }
  };

  const handleEdit = async (conversationId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (editingId === conversationId) {
      // Save edit
      try {
        await updateConversation(conversationId, { title: editTitle });
        setEditingId(null);
        setEditTitle('');
        toast({
          title: "Success",
          description: "Conversation title updated"
        });
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to update title",
          variant: "destructive"
        });
      }
    } else {
      // Start editing
      const conversation = conversations.find(c => c.id === conversationId);
      if (conversation) {
        setEditingId(conversationId);
        setEditTitle(conversation.title);
      }
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return `${diffDays} days ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  const ToolIcon = toolIcons[currentTool];

  return (
    <div className="w-80 bg-gray-900/50 backdrop-blur-xl border-r border-gray-800 flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-gray-800">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <ToolIcon className="w-5 h-5 text-purple-400" />
            <h2 className="font-semibold text-white capitalize">{currentTool} History</h2>
          </div>
          <Button
            size="sm"
            onClick={onNewConversation}
            className="bg-purple-600 hover:bg-purple-700 text-white"
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
        
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search conversations..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-gray-800/50 border-gray-700 text-white placeholder-gray-400"
          />
        </div>
      </div>

      {/* Conversations List */}
      <ScrollArea className="flex-1">
        <div className="p-2">
          {isLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-2 border-purple-500 border-t-transparent"></div>
            </div>
          ) : filteredConversations.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <MessageSquare className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p className="text-sm">No conversations yet</p>
              <p className="text-xs mt-1">Start a new conversation to see it here</p>
            </div>
          ) : (
            <div className="space-y-2">
              {filteredConversations.map((conversation) => (
                <div
                  key={conversation.id}
                  onClick={() => onConversationSelect(conversation.id)}
                  className={`p-3 rounded-lg cursor-pointer transition-all duration-200 border ${
                    currentConversation?.id === conversation.id
                      ? 'bg-purple-600/20 border-purple-500/50'
                      : 'bg-gray-800/30 border-gray-700/50 hover:bg-gray-800/50 hover:border-gray-600/50'
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    {editingId === conversation.id ? (
                      <Input
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        onBlur={() => handleEdit(conversation.id, {} as React.MouseEvent)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            handleEdit(conversation.id, {} as React.MouseEvent);
                          } else if (e.key === 'Escape') {
                            setEditingId(null);
                            setEditTitle('');
                          }
                        }}
                        className="text-sm bg-gray-800 border-gray-600 text-white"
                        autoFocus
                        onClick={(e) => e.stopPropagation()}
                      />
                    ) : (
                      <h3 className="font-medium text-white text-sm truncate pr-2">
                        {conversation.title}
                      </h3>
                    )}
                    
                    <div className="flex items-center gap-1 ml-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => handleEdit(conversation.id, e)}
                        className="h-6 w-6 p-0 text-gray-400 hover:text-white"
                      >
                        <Edit3 className="w-3 h-3" />
                      </Button>
                      
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={(e) => e.stopPropagation()}
                            className="h-6 w-6 p-0 text-gray-400 hover:text-red-400"
                          >
                            <Trash2 className="w-3 h-3" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-gray-900 border-gray-800">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-white">Delete Conversation</AlertDialogTitle>
                            <AlertDialogDescription className="text-gray-400">
                              Are you sure you want to delete this conversation? This action cannot be undone.
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              onClick={(e) => handleDelete(conversation.id, e)}
                              className="bg-red-600 text-white hover:bg-red-700"
                            >
                              Delete
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <Badge className={`text-xs ${toolColors[conversation.tool_type]}`}>
                      <ToolIcon className="w-3 h-3 mr-1" />
                      {conversation.tool_type}
                    </Badge>
                    
                    <div className="flex items-center gap-1 text-xs text-gray-400">
                      <Clock className="w-3 h-3" />
                      {formatTimestamp(conversation.updated_at)}
                    </div>
                  </div>
                  
                  {conversation.messages.length > 0 && (
                    <p className="text-xs text-gray-400 mt-2 truncate">
                      Last: {conversation.messages[conversation.messages.length - 1].content}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
}