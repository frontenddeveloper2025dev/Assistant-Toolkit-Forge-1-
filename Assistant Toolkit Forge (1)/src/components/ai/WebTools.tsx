import React, { useState } from 'react';
import { Search, Globe, ExternalLink, Copy, FileText, Loader2, Link } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { webSearch, webReader } from '@devvai/devv-code-backend';

interface SearchResult {
  title: string;
  url: string;
  description: string;
  content: string;
  date?: string;
}

interface WebContent {
  title: string;
  description: string;
  url: string;
  content: string;
  publishedTime?: string;
  metadata?: Record<string, any>;
}

export function WebTools() {
  const [searchQuery, setSearchQuery] = useState('');
  const [extractUrl, setExtractUrl] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [isExtracting, setIsExtracting] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [extractedContent, setExtractedContent] = useState<WebContent | null>(null);
  const { toast } = useToast();

  const handleSearch = async () => {
    if (!searchQuery.trim() || isSearching) return;

    setIsSearching(true);
    try {
      const result = await webSearch.search({
        query: searchQuery.trim()
      });

      if (result.code === 200 && result.status === 20000) {
        setSearchResults(result.data);
        toast({
          title: 'Search Complete',
          description: `Found ${result.data.length} results`
        });
      } else {
        throw new Error('Search request failed');
      }
    } catch (error: any) {
      console.error('Web search error:', error);
      toast({
        title: 'Search Failed',
        description: 'Failed to perform web search. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setIsSearching(false);
    }
  };

  const handleExtract = async () => {
    if (!extractUrl.trim() || isExtracting) return;

    // Basic URL validation
    let url = extractUrl.trim();
    if (!url.startsWith('http://') && !url.startsWith('https://')) {
      url = 'https://' + url;
    }

    try {
      new URL(url); // Validates URL format
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Please enter a valid URL',
        variant: 'destructive'
      });
      return;
    }

    setIsExtracting(true);
    try {
      const result = await webReader.read({ url });

      if (result.code === 200 && result.status === 20000) {
        setExtractedContent(result.data);
        toast({
          title: 'Content Extracted',
          description: `Extracted ${Math.round(result.data.content.length / 1024)}KB of content`
        });
      } else {
        throw new Error('Content extraction failed');
      }
    } catch (error: any) {
      console.error('Web reader error:', error);
      toast({
        title: 'Extraction Failed',
        description: 'Failed to extract content from URL. Please check the URL and try again.',
        variant: 'destructive'
      });
    } finally {
      setIsExtracting(false);
    }
  };

  const copyContent = (content: string, type: string) => {
    navigator.clipboard.writeText(content);
    toast({
      title: 'Copied',
      description: `${type} copied to clipboard`
    });
  };

  const openUrl = (url: string) => {
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleKeyPress = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === 'Enter') {
      action();
    }
  };

  const clearResults = () => {
    setSearchResults([]);
    setSearchQuery('');
  };

  const clearExtracted = () => {
    setExtractedContent(null);
    setExtractUrl('');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <Tabs defaultValue="search" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="search" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <Search className="h-4 w-4 mr-2" />
            Web Search
          </TabsTrigger>
          <TabsTrigger value="extract" className="data-[state=active]:bg-purple-600 data-[state=active]:text-white">
            <FileText className="h-4 w-4 mr-2" />
            Content Extractor
          </TabsTrigger>
        </TabsList>

        {/* Web Search Tab */}
        <TabsContent value="search" className="space-y-4">
          <Card className="p-4 border-purple-200">
            <div className="flex gap-2">
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleSearch)}
                placeholder="Enter your search query..."
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                disabled={isSearching}
              />
              <Button
                onClick={handleSearch}
                disabled={!searchQuery.trim() || isSearching}
                className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
              >
                {isSearching ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Search className="h-4 w-4" />
                )}
              </Button>
              {searchResults.length > 0 && (
                <Button
                  variant="outline"
                  onClick={clearResults}
                  className="flex-shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>
          </Card>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <Card className="border-purple-200">
              <div className="p-4 border-b border-purple-200">
                <h3 className="font-medium text-gray-900">
                  Search Results ({searchResults.length})
                </h3>
              </div>
              <ScrollArea className="max-h-96 p-4">
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-purple-300 transition-colors">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h4 className="font-medium text-gray-900 mb-1 line-clamp-2">
                            {result.title}
                          </h4>
                          <p className="text-sm text-gray-600 mb-2 line-clamp-3">
                            {result.description}
                          </p>
                          <div className="flex items-center gap-2 text-xs text-gray-500">
                            <span className="truncate">{result.url}</span>
                            {result.date && (
                              <>
                                <span>•</span>
                                <span>{result.date}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1 flex-shrink-0">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => copyContent(result.url, 'URL')}
                            className="h-8 w-8 p-0"
                          >
                            <Copy className="h-3 w-3" />
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openUrl(result.url)}
                            className="h-8 w-8 p-0"
                          >
                            <ExternalLink className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Search Help */}
          {searchResults.length === 0 && !isSearching && (
            <Card className="p-6 border-purple-200 bg-purple-50">
              <div className="text-center">
                <Search className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Search the Web</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Find relevant information from across the internet with AI-optimized search results.
                </p>
                <div className="text-xs text-gray-500">
                  <p>• Search for articles, documentation, news, and more</p>
                  <p>• Results are optimized for AI processing</p>
                  <p>• Get clean, structured content summaries</p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>

        {/* Content Extractor Tab */}
        <TabsContent value="extract" className="space-y-4">
          <Card className="p-4 border-purple-200">
            <div className="flex gap-2">
              <Input
                value={extractUrl}
                onChange={(e) => setExtractUrl(e.target.value)}
                onKeyDown={(e) => handleKeyPress(e, handleExtract)}
                placeholder="Enter URL to extract content from..."
                className="border-purple-200 focus:border-purple-400 focus:ring-purple-400"
                disabled={isExtracting}
              />
              <Button
                onClick={handleExtract}
                disabled={!extractUrl.trim() || isExtracting}
                className="bg-purple-600 hover:bg-purple-700 flex-shrink-0"
              >
                {isExtracting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FileText className="h-4 w-4" />
                )}
              </Button>
              {extractedContent && (
                <Button
                  variant="outline"
                  onClick={clearExtracted}
                  className="flex-shrink-0"
                >
                  Clear
                </Button>
              )}
            </div>
          </Card>

          {/* Extracted Content */}
          {extractedContent && (
            <Card className="border-purple-200">
              <div className="p-4 border-b border-purple-200">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-gray-900 line-clamp-2 mb-1">
                      {extractedContent.title}
                    </h3>
                    <p className="text-sm text-gray-600 line-clamp-2 mb-2">
                      {extractedContent.description}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                      <span className="truncate">{extractedContent.url}</span>
                      {extractedContent.publishedTime && (
                        <>
                          <span>•</span>
                          <span>{new Date(extractedContent.publishedTime).toLocaleDateString()}</span>
                        </>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyContent(extractedContent.content, 'Content')}
                    >
                      <Copy className="h-4 w-4 mr-1" />
                      Copy
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openUrl(extractedContent.url)}
                    >
                      <ExternalLink className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <ScrollArea className="max-h-96 p-4">
                <div className="prose prose-sm max-w-none">
                  <div className="whitespace-pre-wrap text-sm leading-relaxed text-gray-700">
                    {extractedContent.content}
                  </div>
                </div>
              </ScrollArea>
            </Card>
          )}

          {/* Extract Help */}
          {!extractedContent && !isExtracting && (
            <Card className="p-6 border-purple-200 bg-purple-50">
              <div className="text-center">
                <FileText className="h-8 w-8 text-purple-400 mx-auto mb-3" />
                <h3 className="font-medium text-gray-900 mb-2">Extract Web Content</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Extract clean, readable content from any web page for analysis or research.
                </p>
                <div className="text-xs text-gray-500">
                  <p>• Get clean, markdown-formatted content</p>
                  <p>• Remove ads, navigation, and clutter</p>
                  <p>• Perfect for research and content analysis</p>
                </div>
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}