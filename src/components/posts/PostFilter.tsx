
import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search, Trash2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger
} from '@/components/ui/alert-dialog';

interface PostFilterProps {
  onFilterChange: (searchTerm: string, selectedTagId: string | null) => void;
  initialSearchTerm?: string;
  initialTagId?: string | null;
}

const PostFilter = ({ onFilterChange, initialSearchTerm = '', initialTagId = null }: PostFilterProps) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(initialTagId);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isModerator, setIsModerator] = useState(false);
  const [tagToDelete, setTagToDelete] = useState<Tag | null>(null);
  const { t } = useLanguage();
  const { appUser } = useAuth();

  useEffect(() => {
    // Check if user is admin or moderator
    if (appUser) {
      setIsAdmin(appUser.role === 'admin');
      setIsModerator(appUser.role === 'moderator');
    }
    
    const fetchTags = async () => {
      try {
        const { data: tagsData, error } = await supabase
          .from('tags')
          .select('id, name, color')
          .order('name');
          
        if (error) {
          console.error('Error fetching tags:', error);
          toast.error('Failed to load tags');
          return;
        }
        
        if (tagsData) {
          const formattedTags: Tag[] = tagsData.map(tag => ({
            id: tag.id,
            name: tag.name,
            color: tag.color || '#3b82f6'
          }));
          setAvailableTags(formattedTags);
        }
      } catch (err) {
        console.error('Exception fetching tags:', err);
        toast.error('Failed to load tags');
      }
    };
    
    fetchTags();
  }, [appUser]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onFilterChange(value, selectedTagId);
  };

  const handleTagSelect = (tagId: string) => {
    if (selectedTagId === tagId) {
      setSelectedTagId(null);
      onFilterChange(searchTerm, null);
    } else {
      setSelectedTagId(tagId);
      onFilterChange(searchTerm, tagId);
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedTagId(null);
    onFilterChange('', null);
  };
  
  const handleDeleteTag = async () => {
    if (!tagToDelete || (!isAdmin && !isModerator)) return;
    
    try {
      // First, remove tag from posts
      const { error: postTagError } = await supabase
        .from('post_tags')
        .delete()
        .eq('tag_id', tagToDelete.id);
        
      if (postTagError) {
        throw postTagError;
      }
      
      // Then delete the tag itself
      const { error: tagError } = await supabase
        .from('tags')
        .delete()
        .eq('id', tagToDelete.id);
        
      if (tagError) {
        throw tagError;
      }
      
      // Update local state
      setAvailableTags(prev => prev.filter(tag => tag.id !== tagToDelete.id));
      
      if (selectedTagId === tagToDelete.id) {
        setSelectedTagId(null);
        onFilterChange(searchTerm, null);
      }
      
      toast.success(`Tag "${tagToDelete.name}" deleted successfully`);
      setTagToDelete(null);
    } catch (error) {
      console.error('Error deleting tag:', error);
      toast.error('Failed to delete tag');
    }
  };

  return (
    <div className="space-y-4">
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder={t.posts?.searchPlaceholder || "Search posts..."}
          value={searchTerm}
          onChange={handleSearchChange}
          className="pl-10 bg-gray-900 border-gray-800"
        />
        {(searchTerm || selectedTagId) && (
          <button
            onClick={clearFilters}
            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground"
            aria-label="Clear filters"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {availableTags.length > 0 && (
        <div>
          <h3 className="text-sm font-medium mb-2">{t.posts?.filterByTags || "Filter by tags"}</h3>
          <div className="flex flex-wrap gap-2">
            {availableTags.map((tag) => (
              <div key={tag.id} className="flex items-center">
                <Badge
                  variant={selectedTagId === tag.id ? "default" : "outline"}
                  className={`cursor-pointer ${selectedTagId === tag.id ? 'bg-primary' : 'bg-gray-800/50 hover:bg-gray-700/50'}`}
                  onClick={() => handleTagSelect(tag.id)}
                >
                  {tag.name}
                </Badge>
                
                {(isAdmin || isModerator) && (
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="ml-1 h-5 w-5 p-0 text-red-500 hover:text-red-400 hover:bg-transparent"
                        onClick={(e) => {
                          e.stopPropagation();
                          setTagToDelete(tag);
                        }}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete tag "{tag.name}"?</AlertDialogTitle>
                        <AlertDialogDescription>
                          This will remove the tag from all posts. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction 
                          className="bg-red-500 hover:bg-red-600"
                          onClick={handleDeleteTag}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostFilter;
