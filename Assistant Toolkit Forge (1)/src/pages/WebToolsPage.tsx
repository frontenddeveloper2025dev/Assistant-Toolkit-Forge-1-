import React, { useState } from 'react';
import { Search, Globe, FileText, ExternalLink, Copy, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { webSearch, webReader } from '@devvai/devv-code-backend';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  content: string;
  date?: string;
}

interface ReaderResult {
  title: string;
  description: string;
  url: string;
  content: string;
  publishedTime?: string;
  metadata?: Record<string, any>;
}

export function WebToolsPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [readerUrl, setReaderUrl] = useState('');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [readerResult, setReaderResult] = useState<ReaderResult | null>(null);
  const [isSearching, setIsSearching] = useState(false);
  const [isReading, setIsReading] = useState(false);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      });
      return;
    }

    setIsSearching(true);
    try {
      const result = await webSearch.search({
        query: searchQuery.trim()
      });

      if (result.code === 200 && result.status === 20000) {
        setSearchResults(result.data);
        toast({
          title: "Search Complete",
          description: `Found ${result.data.length} results`,
        });
      } else {
        throw new Error('Search failed');
      }

    } catch (error: any) {
      console.error('Search error:', error);
      toast({
        title: "Search Failed",
        description: "Failed to search the web. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleRead = async () => {
    if (!readerUrl.trim()) {
      toast({
        title: "Error",
        description: "Please enter a URL to read",
        variant: "destructive"
      });
      return;
    }

    // Basic URL validation
    try {
      new URL(readerUrl.trim());
    } catch {
      toast({
        title: "Invalid URL",
        description: "Please enter a valid URL (including https://)",
        variant: "destructive"
      });
      return;
    }

    setIsReading(true);
    try {
      const result = await webReader.read({
        url: readerUrl.trim()
      });

      if (result.code === 200 && result.status === 20000) {
        setReaderResult(result.data);
        toast({
          title: "Content Extracted",
          description: "Successfully extracted content from the webpage",
        });
      } else {
        throw new Error('Content extraction failed');
      }

    } catch (error: any) {
      console.error('Reader error:', error);
      toast({
        title: "Extraction Failed",
        description: "Failed to extract content from the webpage. Please check the URL and try again.",
        variant: "destructive"
      });
    } finally {
      setIsReading(false);
    }
  };

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text);
      toast({
        title: "Copied",
        description: `${type} copied to clipboard`
      });
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to copy ${type.toLowerCase()}`,
        variant: "destructive"
      });
    }
  };

  const downloadContent = (content: string, filename: string) => {
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const quickSearches = [
    "Latest AI technology trends 2024",
    "React best practices",
    "TypeScript advanced features",
    "Web development tutorials",
    "Machine learning basics"
  ];

  const quickUrls = [
    "https://docs.react.dev",
    "https://www.typescriptlang.org/docs",
    "https://tailwindcss.com/docs",
    "https://ui.shadcn.com",
    "https://github.com/trending"
  ];

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="text-center">
        <h1 className="text-3xl font-bold text-white mb-2">Web Tools</h1>
        <p className="text-purple-200">Search the web and extract content from any webpage</p>
      </div>

      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-white/10">
          <TabsTrigger value="search" className="data-[state=active]:bg-purple-500">
            <Search className="w-4 h-4 mr-2" />
            Web Search
          </TabsTrigger>
          <TabsTrigger value="reader" className="data-[state=active]:bg-purple-500">
            <FileText className="w-4 h-4 mr-2" />
            Content Reader
          </TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          {/* Search Input */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <Search className="w-5 h-5" />
                Web Search
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Enter your search query..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                />
                <Button
                  onClick={handleSearch}
                  disabled={!searchQuery.trim() || isSearching}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  {isSearching ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Search className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Quick Searches */}
              <div className="space-y-2">
                <h4 className="text-purple-200 text-sm font-medium">Quick Searches:</h4>
                <div className="flex flex-wrap gap-2">
                  {quickSearches.map((query, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setSearchQuery(query)}
                      className="text-xs border-white/20 text-purple-200 hover:bg-white/10 hover:text-white"
                    >
                      {query}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <CardTitle className="text-white">
                  Search Results ({searchResults.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[600px]">
                  <div className="space-y-4">
                    {searchResults.map((result, index) => (
                      <Card key={index} className="bg-white/5 border-white/10">
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2 mb-2">
                                <Globe className="w-4 h-4 text-purple-400 flex-shrink-0" />
                                <a
                                  href={result.url}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-blue-400 hover:text-blue-300 text-sm truncate"
                                >
                                  {result.url}
                                </a>
                                <ExternalLink className="w-3 h-3 text-purple-400" />
                              </div>
                              
                              <h3 className="text-white font-semibold text-lg mb-2 line-clamp-2">
                                {result.title}
                              </h3>
                              
                              <p className="text-purple-200 text-sm mb-3 line-clamp-3">
                                {result.description}
                              </p>

                              {result.date && (
                                <Badge variant="outline" className="border-purple-400 text-purple-300 mb-2">
                                  {result.date}
                                </Badge>
                              )}
                            </div>

                            <div className="flex flex-col gap-2">
                              <Button
                                onClick={() => copyToClipboard(result.url, 'URL')}
                                size="sm"
                                variant="ghost"
                                className="text-purple-300 hover:text-white hover:bg-white/10"
                              >
                                <Copy className="w-4 h-4" />
                              </Button>
                              <Button
                                onClick={() => setReaderUrl(result.url)}
                                size="sm"
                                variant="ghost"
                                className="text-purple-300 hover:text-white hover:bg-white/10"
                                title="Extract content"
                              >
                                <FileText className="w-4 h-4" />
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="reader" className="space-y-6">
          {/* URL Input */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Content Reader
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Input
                  value={readerUrl}
                  onChange={(e) => setReaderUrl(e.target.value)}
                  placeholder="Enter URL to extract content..."
                  className="flex-1 bg-white/10 border-white/20 text-white placeholder:text-purple-300"
                  onKeyPress={(e) => e.key === 'Enter' && handleRead()}
                />
                <Button
                  onClick={handleRead}
                  disabled={!readerUrl.trim() || isReading}
                  className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
                >
                  {isReading ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <FileText className="w-4 h-4" />
                  )}
                </Button>
              </div>

              {/* Quick URLs */}
              <div className="space-y-2">
                <h4 className="text-purple-200 text-sm font-medium">Quick URLs:</h4>
                <div className="flex flex-wrap gap-2">
                  {quickUrls.map((url, index) => (
                    <Button
                      key={index}
                      variant="outline"
                      size="sm"
                      onClick={() => setReaderUrl(url)}
                      className="text-xs border-white/20 text-purple-200 hover:bg-white/10 hover:text-white"
                    >
                      {url.replace('https://', '')}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reader Result */}
          {readerResult && (
            <Card className="bg-white/5 border-white/10">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-white">Extracted Content</CardTitle>
                  <div className="flex gap-2">
                    <Button
                      onClick={() => copyToClipboard(readerResult.content, 'Content')}
                      size="sm"
                      variant="outline"
                      className="border-purple-400 text-purple-300 hover:bg-purple-500/10"
                    >
                      <Copy className="w-4 h-4 mr-2" />
                      Copy
                    </Button>
                    <Button
                      onClick={() => downloadContent(
                        `Title: ${readerResult.title}\nURL: ${readerResult.url}\nPublished: ${readerResult.publishedTime || 'Unknown'}\n\n${readerResult.content}`,
                        'extracted-content.txt'
                      )}
                      size="sm"
                      variant="outline"
                      className="border-purple-400 text-purple-300 hover:bg-purple-500/10"
                    >
                      <Download className="w-4 h-4 mr-2" />
                      Download
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* Metadata */}
                  <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                    <h3 className="text-white font-semibold text-xl mb-2">
                      {readerResult.title}
                    </h3>
                    <p className="text-purple-200 text-sm mb-3">
                      {readerResult.description}
                    </p>
                    <div className="flex items-center gap-4 text-xs text-purple-300">
                      <div className="flex items-center gap-1">
                        <Globe className="w-3 h-3" />
                        <a 
                          href={readerResult.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-400 hover:text-blue-300"
                        >
                          {readerResult.url}
                        </a>
                      </div>
                      {readerResult.publishedTime && (
                        <Badge variant="outline" className="border-purple-400 text-purple-300">
                          {new Date(readerResult.publishedTime).toLocaleString()}
                        </Badge>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <ScrollArea className="h-[500px]">
                    <div className="p-4 bg-white/5 rounded-lg border border-white/10">
                      <pre className="text-purple-100 text-sm leading-relaxed whitespace-pre-wrap font-sans">
                        {readerResult.content}
                      </pre>
                    </div>
                  </ScrollArea>

                  {/* Stats */}
                  <div className="flex justify-between text-xs text-purple-300 p-3 bg-white/5 rounded-lg border border-white/10">
                    <span>Content length: {readerResult.content.length.toLocaleString()} characters</span>
                    <span>Word count: ~{Math.round(readerResult.content.split(/\s+/).length)}</span>
                    <span>Reading time: ~{Math.ceil(readerResult.content.split(/\s+/).length / 200)} min</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}