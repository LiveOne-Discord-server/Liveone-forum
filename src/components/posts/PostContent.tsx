
import React from 'react';
import { formatDate } from '@/lib/utils';
import ReactMarkdown from 'react-markdown';
import { Tag } from '@/types';
import PostMedia from './PostMedia';

interface PostContentProps {
  content: string;
  createdAt: string;
  lastEdited?: string | null;
  mediaUrl?: string | null;
  tags?: Tag[];
}

const PostContent: React.FC<PostContentProps> = ({ 
  content, 
  createdAt, 
  lastEdited,
  mediaUrl,
  tags 
}) => {
  // Function to sanitize content and prepare for markdown rendering
  const sanitizeContent = (text: string) => {
    if (!text) return '';
    
    // First convert common HTML block elements to markdown with proper spacing
    let sanitized = text
      .replace(/<p>(.*?)<\/p>/gi, '$1\n\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<h1>(.*?)<\/h1>/gi, '# $1\n\n')
      .replace(/<h2>(.*?)<\/h2>/gi, '## $1\n\n')
      .replace(/<h3>(.*?)<\/h3>/gi, '### $1\n\n')
      .replace(/<h4>(.*?)<\/h4>/gi, '#### $1\n\n')
      .replace(/<h5>(.*?)<\/h5>/gi, '##### $1\n\n')
      .replace(/<h6>(.*?)<\/h6>/gi, '###### $1\n\n');
    
    // Handle list items
    sanitized = sanitized
      .replace(/<ul>(.*?)<\/ul>/gis, (match, p1) => {
        return p1.replace(/<li>(.*?)<\/li>/gi, '- $1\n');
      })
      .replace(/<ol>(.*?)<\/ol>/gis, (match, p1) => {
        let index = 1;
        return p1.replace(/<li>(.*?)<\/li>/gi, () => {
          return `${index++}. $1\n`;
        });
      });
    
    // Handle inline formatting
    sanitized = sanitized
      .replace(/<strong>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i>(.*?)<\/i>/gi, '*$1*')
      .replace(/<code>(.*?)<\/code>/gi, '`$1`')
      .replace(/<a href="(.*?)".*?>(.*?)<\/a>/gi, '[$2]($1)');
    
    // Remove any remaining HTML tags
    sanitized = sanitized.replace(/<[^>]*>/g, '');
    
    // Fix multiple line breaks
    sanitized = sanitized.replace(/\n{3,}/g, '\n\n');
    
    return sanitized;
  };

  // Process content for rendering
  const processedContent = sanitizeContent(content);

  return (
    <div className="space-y-4">
      {mediaUrl && (
        <div className="mt-2 mb-4">
          <PostMedia urls={[mediaUrl]} />
        </div>
      )}
      
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown>{processedContent}</ReactMarkdown>
      </div>
      
      {tags && tags.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-2">
          {tags.map(tag => (
            <span 
              key={tag.id} 
              className="text-xs px-2 py-1 rounded-full" 
              style={{ backgroundColor: tag.color ? `${tag.color}20` : '#3b82f620', color: tag.color || '#3b82f6' }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}
      
      <div className="text-sm text-gray-400 mt-4">
        <span>Posted {formatDate(createdAt)}</span>
        {lastEdited && (
          <span className="ml-2">• Edited {formatDate(lastEdited)}</span>
        )}
      </div>
    </div>
  );
};

export default PostContent;
export type { PostContentProps };
