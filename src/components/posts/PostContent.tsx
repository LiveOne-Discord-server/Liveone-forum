
import { Badge } from "@/components/ui/badge";
import PostMedia from "./PostMedia";
import { Tag } from "@/types";
import { useLanguage } from "@/hooks/useLanguage";
import TagBadge from "./TagBadge";

interface PostContentProps {
  content: string;
  mediaUrl?: string;
  tags: Tag[];
}

const PostContent: React.FC<PostContentProps> = ({ content, mediaUrl, tags }) => {
  const { t } = useLanguage();
  
  return (
    <div className="pb-3 text-left">
      <div className="whitespace-pre-wrap text-sm text-left">
        <div className="mb-4" dangerouslySetInnerHTML={{ __html: content.replace(/<\/?p>/g, '') }} />
      </div>
      
      {mediaUrl && <PostMedia url={mediaUrl} />}

      <div className="flex flex-wrap gap-2 mt-3">
        {tags.length > 0 ? (
          tags.map((tag) => (
            <TagBadge key={tag.id} tag={tag} />
          ))
        ) : (
          <Badge 
            variant="outline" 
            className="bg-gray-800/50 text-gray-400"
          >
            {t.posts?.noTags || 'No tags'}
          </Badge>
        )}
      </div>
    </div>
  );
};

export default PostContent;
