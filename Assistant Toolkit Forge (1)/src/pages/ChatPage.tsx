import React, { useState, useRef, useEffect } from 'react';
import { Send, Bot, User, Copy, Download, History, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { DevvAI } from '@devvai/devv-code-backend';
import { useConversationStore, Message } from '@/store/conversation-store';
import { ConversationSidebar } from '@/components/conversation/ConversationSidebar';

export function ChatPage() {
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [showSidebar, setShowSidebar] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  
  const {
    currentConversation,
    createConversation,
    selectConversation,
    addMessage,
    loadConversations
  } = useConversationStore();
  
  const messages = currentConversation?.messages || [];

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  };

  useEffect(() => {
    // Load conversations on component mount
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleNewConversation = async () => {
    try {
      const conversationId = await createConversation('chat', 'New Chat');
      selectConversation(conversationId);
      setShowSidebar(false);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create new conversation",
        variant: "destructive"
      });
    }
  };

  const handleConversationSelect = (conversationId: string) => {
    selectConversation(conversationId);
    setShowSidebar(false);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    // Create conversation if none exists
    if (!currentConversation) {
      try {
        const conversationId = await createConversation('chat', 'New Chat');
        selectConversation(conversationId);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive"
        });
        return;
      }
    }

    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      role: 'user',
      content: input.trim(),
      metadata: { tool_type: 'chat' }
    };

    // Add user message
    await addMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const ai = new DevvAI();
      
      // Get conversation context
      const conversationMessages = currentConversation?.messages || [];
      const contextMessages = conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await ai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.' },
          ...contextMessages,
          { role: 'user', content: userMessage.content }
        ],
        stream: false
      });

      const assistantMessage: Omit<Message, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: response.choices[0]?.message?.content || 'I apologize, but I couldn\'t generate a response.',
        metadata: { tool_type: 'chat' }
      };

      await addMessage(assistantMessage);
    } catch (error) {
      console.error('Chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get AI response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStreamingChat = async () => {
    if (!input.trim() || isLoading || isStreaming) return;

    // Create conversation if none exists
    if (!currentConversation) {
      try {
        const conversationId = await createConversation('chat', 'New Chat');
        selectConversation(conversationId);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to create conversation",
          variant: "destructive"
        });
        return;
      }
    }

    const userMessage: Omit<Message, 'id' | 'timestamp'> = {
      role: 'user',
      content: input.trim(),
      metadata: { tool_type: 'chat' }
    };

    // Add user message
    await addMessage(userMessage);
    const inputContent = input.trim();
    setInput('');
    setIsStreaming(true);

    try {
      const ai = new DevvAI();
      
      // Get conversation context
      const conversationMessages = currentConversation?.messages || [];
      const contextMessages = conversationMessages.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const stream = await ai.chat.completions.create({
        model: 'gpt-3.5-turbo',
        messages: [
          { role: 'system', content: 'You are a helpful AI assistant. Provide clear, concise, and helpful responses.' },
          ...contextMessages,
          { role: 'user', content: inputContent }
        ],
        stream: true
      });

      let fullContent = '';
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || '';
        if (content) {
          fullContent += content;
        }
      }

      // Add the complete streamed response
      const assistantMessage: Omit<Message, 'id' | 'timestamp'> = {
        role: 'assistant',
        content: fullContent || 'I apologize, but I couldn\'t generate a response.',
        metadata: { tool_type: 'chat' }
      };

      await addMessage(assistantMessage);
    } catch (error) {
      console.error('Streaming chat error:', error);
      toast({
        title: "Error",
        description: "Failed to get streaming response. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsStreaming(false);
    }
  };

  const copyMessage = async (content: string) => {
    try {
      await navigator.clipboard.writeText(content);
      toast({
        title: "Copied",
        description: "Message copied to clipboard"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to copy message",
        variant: "destructive"
      });
    }
  };

  const downloadChat = () => {
    if (!currentConversation) return;
    
    const chatText = currentConversation.messages.map(msg => 
      `${msg.role.toUpperCase()} (${new Date(msg.timestamp).toLocaleString()}):\n${msg.content}\n\n`
    ).join('');
    
    const blob = new Blob([chatText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `chat-${currentConversation.title}-${new Date().toISOString().split('T')[0]}.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex h-full">
      {/* Conversation Sidebar */}
      {showSidebar && (
        <ConversationSidebar
          currentTool="chat"
          onConversationSelect={handleConversationSelect}
          onNewConversation={handleNewConversation}
        />
      )}

      {/* Main Chat Interface */}
      <div className="flex-1 flex flex-col max-w-4xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-white/10">
          <div className="flex items-center gap-3">
            <Button
              onClick={() => setShowSidebar(!showSidebar)}
              size="sm"
              variant="outline"
              className="border-purple-400 text-purple-300 hover:bg-purple-500/10"
            >
              <History className="w-4 h-4" />
            </Button>
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-semibold text-white">
                {currentConversation?.title || 'AI Chat Assistant'}
              </h1>
              <p className="text-sm text-purple-200">Powered by DevvAI</p>
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <Button
                variant="ghost"
                size="sm"
                onClick={downloadChat}
                className="text-purple-200 hover:text-white hover:bg-white/10"
              >
                <Download className="w-4 h-4" />
              </Button>
            )}
            <Button
              onClick={handleNewConversation}
              size="sm"
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Chat
            </Button>
          </div>
        </div>

        {/* Messages */}
        <ScrollArea ref={scrollAreaRef} className="flex-1 p-4">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full text-gray-400">
              <div className="text-center">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p className="text-lg mb-2 text-white">Start a conversation</p>
                <p className="text-sm text-purple-200">Ask me anything and I'll do my best to help!</p>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex gap-3 ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  {message.role === 'assistant' && (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center flex-shrink-0">
                      <Bot className="w-4 h-4 text-white" />
                    </div>
                  )}
                  
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-first' : ''}`}>
                    <Card className={`p-3 group ${
                      message.role === 'user' 
                        ? 'bg-white/10 border-white/20 ml-auto' 
                        : 'bg-white/5 border-white/10'
                    }`}>
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-white whitespace-pre-wrap leading-relaxed">
                          {message.content}
                        </p>
                        {message.role === 'assistant' && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => copyMessage(message.content)}
                            className="text-purple-300 hover:text-white hover:bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity flex-shrink-0"
                          >
                            <Copy className="w-3 h-3" />
                          </Button>
                        )}
                      </div>
                    </Card>
                    <p className="text-xs text-purple-300 mt-1 px-3">
                      {new Date(message.timestamp).toLocaleTimeString()}
                    </p>
                  </div>

                  {message.role === 'user' && (
                    <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center flex-shrink-0">
                      <User className="w-4 h-4 text-purple-200" />
                    </div>
                  )}
                </div>
              ))}
              
              {(isLoading || isStreaming) && (
                <div className="flex gap-3 justify-start">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-purple-600 flex items-center justify-center">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                  <Card className="p-3 bg-white/5 border-white/10">
                    <div className="flex items-center gap-2">
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.3s]"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
                        <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      </div>
                      <span className="text-purple-200 text-sm">
                        {isStreaming ? 'Streaming...' : 'Thinking...'}
                      </span>
                    </div>
                  </Card>
                </div>
              )}
            </div>
          )}
        </ScrollArea>

        {/* Input */}
        <div className="p-4 border-t border-white/10">
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type your message..."
              className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-purple-300"
              onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              disabled={isLoading || isStreaming}
            />
            <Button
              onClick={handleSend}
              disabled={!input.trim() || isLoading || isStreaming}
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
            >
              <Send className="w-4 h-4" />
            </Button>
            <Button
              onClick={handleStreamingChat}
              disabled={!input.trim() || isLoading || isStreaming}
              variant="outline"
              className="border-purple-400 text-purple-300 hover:bg-purple-500/10"
            >
              Stream
            </Button>
          </div>
          <p className="text-xs text-purple-300 mt-2 text-center">
            Press Enter to send • Shift+Enter for new line • Use "Stream" for real-time responses
          </p>
        </div>
      </div>
    </div>
  );
}