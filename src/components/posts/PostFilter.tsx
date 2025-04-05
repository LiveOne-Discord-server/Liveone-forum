import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { X, Search } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Tag } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { toast } from '@/hooks/use-toast';

interface PostFilterProps {
  onFilterChange: (searchTerm: string, selectedTagId: string | null) => void;
  initialSearchTerm?: string;
  initialTagId?: string | null;
}

const PostFilter = ({ onFilterChange, initialSearchTerm = '', initialTagId = null }: PostFilterProps) => {
  const [searchTerm, setSearchTerm] = useState(initialSearchTerm);
  const [selectedTagId, setSelectedTagId] = useState<string | null>(initialTagId);
  const [availableTags, setAvailableTags] = useState<Tag[]>([]);
  const { t } = useLanguage();

  useEffect(() => {
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
  }, []);

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
              <Badge
                key={tag.id}
                variant={selectedTagId === tag.id ? "default" : "outline"}
                className={`cursor-pointer ${selectedTagId === tag.id ? 'bg-primary' : 'bg-gray-800/50 hover:bg-gray-700/50'}`}
                onClick={() => handleTagSelect(tag.id)}
              >
                {tag.name}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PostFilter;
