
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import { Badge } from '@/components/ui/badge';
import { formatDate } from '@/lib/utils';

interface BlogPost {
  id: string;
  title: string;
  path: string;
  date: string;
  summary: string;
  tags?: string[];
}

const Updates = () => {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [activeBlog, setActiveBlog] = useState<BlogPost | null>(null);
  const [blogContent, setBlogContent] = useState<string>('');
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBlogs = async () => {
      try {
        const response = await fetch('/blogs.json');
        const data = await response.json();
        setBlogs(data.blogs);
        setIsLoading(false);
      } catch (error) {
        console.error('Failed to fetch blogs:', error);
        setIsLoading(false);
      }
    };
    
    fetchBlogs();
  }, []);

  const fetchBlogContent = async (blog: BlogPost) => {
    try {
      setActiveBlog(blog);
      const response = await fetch(blog.path);
      const content = await response.text();
      setBlogContent(content);
    } catch (error) {
      console.error('Failed to fetch blog content:', error);
      setBlogContent('Failed to load blog content');
    }
  };

  const processMarkdownContent = (content: string) => {
    // Process custom tip, note, warning blocks
    return content
      .replace(/:::tip\s*\n([\s\S]*?)\n:::/g, '<div class="tip-block">$1</div>')
      .replace(/:::note\s*\n([\s\S]*?)\n:::/g, '<div class="note-block">$1</div>')
      .replace(/:::warning\s*\n([\s\S]*?)\n:::/g, '<div class="warning-block">$1</div>');
  };

  return (
    <div className="container max-w-4xl mx-auto py-6">
      <div className="flex flex-col gap-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">Updates & News</h1>
          <Button variant="outline" onClick={() => navigate('/')}>
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Home
          </Button>
        </div>
        
        {isLoading ? (
          <div className="flex justify-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-1 space-y-4">
              <h2 className="text-xl font-semibold mb-4">Latest Updates</h2>
              {blogs.length === 0 ? (
                <Card>
                  <CardContent className="p-6">
                    <p className="text-center text-gray-400">No updates available yet</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {blogs.map(blog => (
                    <Card 
                      key={blog.id}
                      className={`cursor-pointer hover:bg-gray-800/50 transition-colors ${
                        activeBlog?.id === blog.id ? 'border-primary' : ''
                      }`}
                      onClick={() => fetchBlogContent(blog)}
                    >
                      <CardContent className="p-4">
                        <h3 className="font-medium">{blog.title}</h3>
                        <p className="text-sm text-gray-400 mt-1">{formatDate(blog.date)}</p>
                        {blog.tags && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {blog.tags.map(tag => (
                              <Badge key={tag} variant="outline" className="text-xs">
                                {tag}
                              </Badge>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
            
            <div className="md:col-span-2">
              {activeBlog ? (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-2xl">{activeBlog.title}</CardTitle>
                    <div className="flex items-center justify-between">
                      <span className="text-gray-400 text-sm">{formatDate(activeBlog.date)}</span>
                      {activeBlog.tags && (
                        <div className="flex flex-wrap gap-1">
                          {activeBlog.tags.map(tag => (
                            <Badge key={tag} variant="outline" className="text-xs">
                              {tag}
                            </Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="prose prose-invert max-w-none">
                      <ReactMarkdown components={{
                        h1: ({node, ...props}) => <h1 className="text-3xl font-bold my-4" {...props} />,
                        h2: ({node, ...props}) => <h2 className="text-2xl font-bold mt-6 mb-3" {...props} />,
                        h3: ({node, ...props}) => <h3 className="text-xl font-bold mt-5 mb-2" {...props} />,
                        p: ({node, ...props}) => <p className="my-3" {...props} />,
                        strong: ({node, ...props}) => <strong className="font-bold" {...props} />,
                        em: ({node, ...props}) => <em className="italic" {...props} />,
                        blockquote: ({node, ...props}) => (
                          <blockquote className="border-l-4 border-blue-500 pl-4 my-4 italic" {...props} />
                        ),
                        code: ({node, className, children, ...props}) => {
                          const match = /language-(\w+)/.exec(className || '')
                          return !className ? (
                            <code className="bg-gray-800 px-1 py-0.5 rounded text-sm" {...props}>
                              {children}
                            </code>
                          ) : (
                            <pre className="bg-gray-800 p-4 rounded-md overflow-x-auto my-4 text-sm">
                              <code className={className} {...props}>
                                {children}
                              </code>
                            </pre>
                          )
                        },
                        table: ({node, ...props}) => (
                          <div className="overflow-x-auto my-6">
                            <table className="min-w-full border-collapse border border-gray-700" {...props} />
                          </div>
                        ),
                        thead: ({node, ...props}) => <thead className="bg-gray-800" {...props} />,
                        th: ({node, ...props}) => <th className="border border-gray-700 px-4 py-2 text-left" {...props} />,
                        td: ({node, ...props}) => <td className="border border-gray-700 px-4 py-2" {...props} />,
                        tr: ({node, ...props}) => <tr className="border-b border-gray-700" {...props} />,
                        ul: ({node, ...props}) => <ul className="list-disc pl-6 my-4" {...props} />,
                        ol: ({node, ...props}) => <ol className="list-decimal pl-6 my-4" {...props} />,
                        li: ({node, ...props}) => <li className="my-1" {...props} />,
                        a: ({node, href, ...props}) => (
                          <a href={href} target="_blank" rel="noreferrer" className="text-blue-400 hover:underline" {...props} />
                        ),
                        img: ({node, src, alt, ...props}) => (
                          <img src={src} alt={alt || ""} className="max-w-full rounded-md my-4" {...props} />
                        ),
                        div: ({node, className, ...props}) => {
                          if (className === 'tip-block') {
                            return (
                              <div className="bg-green-900/20 border-l-4 border-green-500 p-4 my-4 rounded-r">
                                <div className="flex items-start">
                                  <Info className="h-5 w-5 text-green-500 mr-2 mt-0.5" />
                                  <div {...props} />
                                </div>
                              </div>
                            );
                          } else if (className === 'note-block') {
                            return (
                              <div className="bg-blue-900/20 border-l-4 border-blue-500 p-4 my-4 rounded-r">
                                <div className="flex items-start">
                                  <Info className="h-5 w-5 text-blue-500 mr-2 mt-0.5" />
                                  <div {...props} />
                                </div>
                              </div>
                            );
                          } else if (className === 'warning-block') {
                            return (
                              <div className="bg-amber-900/20 border-l-4 border-amber-500 p-4 my-4 rounded-r">
                                <div className="flex items-start">
                                  <AlertTriangle className="h-5 w-5 text-amber-500 mr-2 mt-0.5" />
                                  <div {...props} />
                                </div>
                              </div>
                            );
                          }
                          return <div className={className} {...props} />
                        }
                      }}>
                        {processMarkdownContent(blogContent)}
                      </ReactMarkdown>
                    </div>
                  </CardContent>
                </Card>
              ) : (
                <Card>
                  <CardContent className="p-12 flex flex-col items-center justify-center">
                    <p className="text-xl text-gray-400 mb-4">Select an update to read</p>
                    <p className="text-gray-500 text-center max-w-md">
                      Choose one of the updates from the list on the left to view its content here
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Updates;
