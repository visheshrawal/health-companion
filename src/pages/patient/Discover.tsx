import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { PatientLayout } from "@/components/PatientNav";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Play, Lightbulb, Heart, Bookmark, Share2, ExternalLink, Search, MessageCircle, Facebook, Twitter, Mail, Link as LinkIcon } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

export default function Discover() {
  // Generate a random seed on mount to refresh the feed
  const [seed] = useState(() => Math.floor(Date.now()));
  const feed = useQuery(api.content.getFeed, { seed });
  const toggleSave = useMutation(api.content.toggleSave);
  const toggleLike = useMutation(api.content.toggleLike);
  const seedContent = useMutation(api.content.seedContent);
  
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState("all");
  const [viewContent, setViewContent] = useState<any>(null);
  const [shareContent, setShareContent] = useState<any>(null);

  // Auto-seed content if empty (for demo purposes)
  useEffect(() => {
    if (feed && feed.length === 0) {
      seedContent();
    }
  }, [feed, seedContent]);

  const handleSave = async (id: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const isSaved = await toggleSave({ contentId: id });
      toast.success(isSaved ? "Saved to bookmarks" : "Removed from bookmarks");
    } catch (error) {
      toast.error("Failed to update bookmark");
    }
  };

  const handleLike = async (id: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      await toggleLike({ contentId: id });
    } catch (error) {
      toast.error("Failed to like content");
    }
  };

  const openShareDialog = (item: any, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setShareContent(item);
  };

  const handleCardClick = (item: any) => {
    // Always open the dialog to view details/summary first, allowing user to choose to read full article
    setViewContent(item);
  };

  const filteredFeed = feed?.filter(item => {
    const matchesSearch = item.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          item.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.tags.some((t: string) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesTab = activeTab === "all" || 
                       (activeTab === "saved" && item.isSaved) ||
                       item.type === activeTab;

    return matchesSearch && matchesTab;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "article": return <BookOpen className="h-4 w-4" />;
      case "video": return <Play className="h-4 w-4" />;
      case "tip": return <Lightbulb className="h-4 w-4" />;
      default: return <BookOpen className="h-4 w-4" />;
    }
  };

  return (
    <PatientLayout>
      <div className="space-y-8 max-w-4xl mx-auto">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Discover</h1>
            <p className="text-muted-foreground">Personalized health insights and daily tips for you.</p>
          </div>
          <div className="relative w-full md:w-64">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input 
              placeholder="Search topics..." 
              className="pl-8" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="w-full md:w-auto grid grid-cols-5 md:flex md:gap-2">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="article">Articles</TabsTrigger>
            <TabsTrigger value="video">Videos</TabsTrigger>
            <TabsTrigger value="tip">Tips</TabsTrigger>
            <TabsTrigger value="saved">Saved</TabsTrigger>
          </TabsList>

          <TabsContent value={activeTab} className="mt-6 space-y-6">
            {filteredFeed?.map((item) => (
              <Card 
                key={item._id} 
                className="overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => handleCardClick(item)}
              >
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1/3 h-48 md:h-auto relative overflow-hidden bg-muted">
                    <img 
                      src={item.imageUrl || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"} 
                      alt={item.title} 
                      className="w-full h-full object-cover transition-transform group-hover:scale-105 duration-500"
                      onError={(e) => {
                        e.currentTarget.src = "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000";
                      }}
                    />
                    {item.type === "video" && (
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20 group-hover:bg-black/10 transition-colors">
                        <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
                          <Play className="h-5 w-5 text-primary ml-1" />
                        </div>
                      </div>
                    )}
                  </div>
                  <div className={`flex-1 flex flex-col`}>
                    <CardHeader>
                      <div className="flex justify-between items-start gap-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                            <Badge variant="secondary" className="flex items-center gap-1 capitalize">
                              {getTypeIcon(item.type)} {item.type}
                            </Badge>
                            <span>•</span>
                            <span>{item.source || "Health Companion"}</span>
                            <span>•</span>
                            <span>{formatDistanceToNow(item.publishedAt, { addSuffix: true })}</span>
                          </div>
                          <CardTitle className="text-xl group-hover:text-primary transition-colors">
                            {item.title}
                          </CardTitle>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="flex-1">
                      <p className="text-muted-foreground line-clamp-3">
                        {item.body}
                      </p>
                      <div className="flex flex-wrap gap-2 mt-4">
                        {item.tags.map((tag: string) => (
                          <Badge key={tag} variant="outline" className="text-xs">
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </CardContent>
                    <CardFooter className="border-t bg-muted/20 p-4 flex justify-between items-center">
                      <div className="flex gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className={`gap-2 ${item.isLiked ? 'text-red-500 hover:text-red-600' : 'text-muted-foreground'}`}
                          onClick={(e) => handleLike(item._id, e)}
                        >
                          <Heart className={`h-4 w-4 ${item.isLiked ? 'fill-current' : ''}`} />
                          <span className="hidden sm:inline">{item.isLiked ? 'Helpful' : 'Mark Helpful'}</span>
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="gap-2 text-muted-foreground"
                          onClick={(e) => openShareDialog(item, e)}
                        >
                          <Share2 className="h-4 w-4" />
                          <span className="hidden sm:inline">Share</span>
                        </Button>
                      </div>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className={`gap-2 ${item.isSaved ? 'text-primary' : 'text-muted-foreground'}`}
                        onClick={(e) => handleSave(item._id, e)}
                      >
                        <Bookmark className={`h-4 w-4 ${item.isSaved ? 'fill-current' : ''}`} />
                        <span className="hidden sm:inline">{item.isSaved ? 'Saved' : 'Save'}</span>
                      </Button>
                    </CardFooter>
                  </div>
                </div>
              </Card>
            ))}
            
            {filteredFeed?.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Lightbulb className="h-12 w-12 mx-auto mb-4 opacity-20" />
                <p>No content found matching your criteria.</p>
              </div>
            )}
          </TabsContent>
        </Tabs>

        {/* View Content Dialog */}
        <Dialog open={!!viewContent} onOpenChange={(open) => !open && setViewContent(null)}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                <Badge variant="secondary" className="capitalize">
                  {viewContent?.type}
                </Badge>
                <span>•</span>
                <span>{viewContent?.source || "Health Companion"}</span>
                <span>•</span>
                <span>{viewContent && formatDistanceToNow(viewContent.publishedAt, { addSuffix: true })}</span>
              </div>
              <DialogTitle className="text-2xl">{viewContent?.title}</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <img 
                src={viewContent?.imageUrl || "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000"} 
                alt={viewContent?.title} 
                className="w-full h-64 object-cover rounded-lg"
                onError={(e) => {
                  e.currentTarget.src = "https://images.unsplash.com/photo-1505751172876-fa1923c5c528?auto=format&fit=crop&q=80&w=1000";
                }}
              />
              
              <div className="prose dark:prose-invert max-w-none">
                <p className="whitespace-pre-wrap text-lg leading-relaxed">{viewContent?.body}</p>
              </div>

              {viewContent?.type === "video" && viewContent?.url && (
                <div className="pt-4">
                  <Button className="w-full" size="lg" asChild>
                    <a href={viewContent.url} target="_blank" rel="noopener noreferrer">
                      <Play className="mr-2 h-5 w-5" /> Watch Video
                    </a>
                  </Button>
                </div>
              )}
               
               {viewContent?.type === "article" && viewContent?.url && (
                 <div className="pt-4">
                   <Button variant="outline" className="w-full" size="lg" asChild>
                     <a href={viewContent.url} target="_blank" rel="noopener noreferrer">
                       <ExternalLink className="mr-2 h-5 w-5" /> Read Full Article
                     </a>
                   </Button>
                 </div>
               )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Share Dialog */}
        <Dialog open={!!shareContent} onOpenChange={(open) => !open && setShareContent(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Share Content</DialogTitle>
              <DialogDescription>
                Share "{shareContent?.title}" with your friends and family.
              </DialogDescription>
            </DialogHeader>
            <div className="grid grid-cols-3 gap-4 py-4">
               <Button variant="outline" className="flex flex-col items-center h-auto py-4 gap-2 hover:bg-green-50 hover:text-green-600 dark:hover:bg-green-900/20" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(shareContent?.title + ' ' + (shareContent?.url || window.location.href))}`, '_blank')}>
                  <MessageCircle className="h-6 w-6 text-green-500" />
                  <span className="text-xs">WhatsApp</span>
               </Button>
               <Button variant="outline" className="flex flex-col items-center h-auto py-4 gap-2 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20" onClick={() => window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(shareContent?.url || window.location.href)}`, '_blank')}>
                  <Facebook className="h-6 w-6 text-blue-600" />
                  <span className="text-xs">Facebook</span>
               </Button>
               <Button variant="outline" className="flex flex-col items-center h-auto py-4 gap-2 hover:bg-sky-50 hover:text-sky-600 dark:hover:bg-sky-900/20" onClick={() => window.open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(shareContent?.title)}&url=${encodeURIComponent(shareContent?.url || window.location.href)}`, '_blank')}>
                  <Twitter className="h-6 w-6 text-sky-500" />
                  <span className="text-xs">Twitter</span>
               </Button>
               <Button variant="outline" className="flex flex-col items-center h-auto py-4 gap-2" onClick={() => window.open(`mailto:?subject=${encodeURIComponent(shareContent?.title)}&body=${encodeURIComponent('Check this out: ' + (shareContent?.url || window.location.href))}`)}>
                  <Mail className="h-6 w-6 text-gray-500" />
                  <span className="text-xs">Email</span>
               </Button>
               <Button variant="outline" className="flex flex-col items-center h-auto py-4 gap-2" onClick={() => {
                 navigator.clipboard.writeText(shareContent?.url || window.location.href);
                 toast.success("Link copied!");
                 setShareContent(null);
               }}>
                  <LinkIcon className="h-6 w-6" />
                  <span className="text-xs">Copy Link</span>
               </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </PatientLayout>
  );
}