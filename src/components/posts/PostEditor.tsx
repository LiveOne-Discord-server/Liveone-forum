
import { useState, useCallback, useEffect } from 'react';
import { Editor, useEditor, EditorContent } from '@tiptap/react';
import StarterKit from '@tiptap/starter-kit';
import Placeholder from '@tiptap/extension-placeholder';
import Link from '@tiptap/extension-link';
import Image from '@tiptap/extension-image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Tag } from '@/types';
import { useLanguage } from '@/hooks/useLanguage';
import { 
  Plus, 
  Tag as TagIcon, 
  Image as ImageIcon, 
  Loader2, 
  Send, 
  X, 
  Trash2,
  Bold,
  Italic,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Link as LinkIcon
} from 'lucide-react';
import TagBadge from './TagBadge';
import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/hooks/use-toast';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/utils/supabase';

interface PostEditorProps {
  initialContent?: string;
  initialTitle?: string;
  initialTags?: Tag[];
  initialMediaUrls?: string[];
  onSave: (content: string, title: string, tags: Tag[], mediaFiles: File[], existingMedia?: string[]) => void;
  onCancel?: () => void;
  isSubmitting?: boolean;
  hideBannerControls?: boolean;
}

const PostEditor = ({ initialContent = '', initialTitle = '', initialTags = [], initialMediaUrls = [], onSave, onCancel, isSubmitting = false }: PostEditorProps) => {
  const [title, setTitle] = useState(initialTitle);
  const [open, setOpen] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [newTagColor, setNewTagColor] = useState('#3b82f6'); // Default blue color
  const [tags, setTags] = useState<Tag[]>(initialTags);
  const [mediaFiles, setMediaFiles] = useState<File[]>([]);
  const [existingMedia, setExistingMedia] = useState<string[]>(initialMediaUrls);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const { t } = useLanguage();
  const { user } = useAuth();
  
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [1, 2, 3] },
        bulletList: {},
        orderedList: {},
        bold: {},
        italic: {},
        strike: {},
      }),
      Placeholder.configure({
        placeholder: ({ node }: { node: any }) => {
          if (node.type.name === 'heading') {
            return t.posts?.headingPlaceholder || 'Heading';
          }

          return t.posts?.writeSomething || "What's on your mind?";
        },
      }),
      Link.configure({
        openOnClick: false,
      }),
      Image,
    ],
    content: initialContent,
    editorProps: {
      attributes: {
        class: 'min-h-[150px] focus:outline-none',
      },
    },
  });

  useEffect(() => {
    if (editor) {
      editor.commands.setContent(initialContent, false);
    }
  }, [editor, initialContent]);

  const handleSubmit = useCallback((event: React.FormEvent) => {
    event.preventDefault();
    if (!editor) return;
    
    if (!title.trim()) {
      toast.error(t.posts?.titleRequired || 'Title is required');
      return;
    }

    if (!editor.getText().trim()) {
      toast.error(t.posts?.contentRequired || 'Content is required');
      return;
    }
    
    onSave(editor.getHTML(), title, tags, mediaFiles, existingMedia);
  }, [editor, title, tags, mediaFiles, existingMedia, onSave, t.posts]);

  const handleTagAdd = () => {
    if (!newTag.trim()) return;
    
    const newTagId = `tag-${uuidv4()}`;
    const tagToAdd: Tag = {
      id: newTagId,
      name: newTag.trim(),
      color: newTagColor
    };
    
    setTags([...tags, tagToAdd]);
    setNewTag('');
  };

  const handleTagRemove = (tagToRemove: Tag) => {
    setTags(tags.filter(tag => tag.id !== tagToRemove.id));
  };

  const handleMedia = () => {
    setUploadError(null);
    const input = document.createElement('input');
    input.type = 'file';
    input.multiple = true;
    input.accept = 'image/*, video/*';
    
    input.onchange = (e: any) => {
      if (e.target.files) {
        const files = Array.from(e.target.files) as File[];
        
        // Check file size (max 100MB)
        const oversizedFiles = files.filter(file => file.size > 100 * 1024 * 1024);
        if (oversizedFiles.length > 0) {
          setUploadError(t.posts?.fileSizeLimitError || 'Files must be smaller than 100MB');
          return;
        }
        
        // Calculate total size including existing files
        const totalSizeMB = [...mediaFiles, ...files].reduce((acc, file) => acc + file.size, 0) / (1024 * 1024);
        if (totalSizeMB > 100) {
          setUploadError(t.posts?.totalFileSizeLimitError || 'Total file size must be smaller than 100MB');
          return;
        }
        
        setMediaFiles([...mediaFiles, ...files]);
      }
    };
    
    input.click();
  };
  
  const handleMediaRemove = (urlToRemove: string) => {
    setExistingMedia(existingMedia.filter(url => url !== urlToRemove));
  };

  const handleMediaFileRemove = (index: number) => {
    setMediaFiles(mediaFiles.filter((_, i) => i !== index));
  };

  // Markdown toolbar functions
  const toggleBold = () => {
    if (!editor) return;
    editor.chain().focus().toggleBold().run();
  };

  const toggleItalic = () => {
    if (!editor) return;
    editor.chain().focus().toggleItalic().run();
  };

  const toggleH1 = () => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level: 1 }).run();
  };

  const toggleH2 = () => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level: 2 }).run();
  };

  const toggleH3 = () => {
    if (!editor) return;
    editor.chain().focus().toggleHeading({ level: 3 }).run();
  };

  const toggleBulletList = () => {
    if (!editor) return;
    editor.chain().focus().toggleBulletList().run();
  };

  const toggleOrderedList = () => {
    if (!editor) return;
    editor.chain().focus().toggleOrderedList().run();
  };

  const setLink = () => {
    if (!editor) return;
    
    const previousUrl = editor.getAttributes('link').href;
    const url = window.prompt('URL', previousUrl);

    // cancelled
    if (url === null) {
      return;
    }

    // empty
    if (url === '') {
      editor.chain().focus().extendMarkRange('link').unsetLink().run();
      return;
    }

    // set link
    editor.chain().focus().extendMarkRange('link').setLink({ href: url }).run();
  };

  return (
    <form onSubmit={handleSubmit}>
      <div>
        <Label htmlFor="title">{t.posts?.title || 'Title'}</Label>
        <Input
          type="text"
          id="title"
          placeholder={t.posts?.enterTitle || 'Enter title'}
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="bg-gray-900 border-gray-800"
        />
      </div>
      
      <div className="mt-4">
        <Label>{t.posts?.content || 'Content'}</Label>
        <div className="bg-gray-900 border border-gray-800 rounded-md mb-2">
          <div className="flex flex-wrap gap-1 p-1 border-b border-gray-800">
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className={`px-2 py-1 ${editor?.isActive('bold') ? 'bg-accent' : ''}`}
              onClick={toggleBold}
              title="Bold"
            >
              <Bold className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className={`px-2 py-1 ${editor?.isActive('italic') ? 'bg-accent' : ''}`}
              onClick={toggleItalic}
              title="Italic"
            >
              <Italic className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className={`px-2 py-1 ${editor?.isActive('heading', { level: 1 }) ? 'bg-accent' : ''}`}
              onClick={toggleH1}
              title="Heading 1"
            >
              <Heading1 className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className={`px-2 py-1 ${editor?.isActive('heading', { level: 2 }) ? 'bg-accent' : ''}`}
              onClick={toggleH2}
              title="Heading 2"
            >
              <Heading2 className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className={`px-2 py-1 ${editor?.isActive('heading', { level: 3 }) ? 'bg-accent' : ''}`}
              onClick={toggleH3}
              title="Heading 3"
            >
              <Heading3 className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className={`px-2 py-1 ${editor?.isActive('bulletList') ? 'bg-accent' : ''}`}
              onClick={toggleBulletList}
              title="Bullet List"
            >
              <List className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className={`px-2 py-1 ${editor?.isActive('orderedList') ? 'bg-accent' : ''}`}
              onClick={toggleOrderedList}
              title="Ordered List"
            >
              <ListOrdered className="h-4 w-4" />
            </Button>
            <Button 
              type="button" 
              size="sm" 
              variant="ghost" 
              className={`px-2 py-1 ${editor?.isActive('link') ? 'bg-accent' : ''}`}
              onClick={setLink}
              title="Add Link"
            >
              <LinkIcon className="h-4 w-4" />
            </Button>
          </div>
          {editor && <EditorContent editor={editor} className="p-2" />}
        </div>
      </div>
      
      {uploadError && (
        <div className="mt-2 text-sm text-red-500">
          {uploadError}
        </div>
      )}
      
      {mediaFiles.length > 0 && (
        <div className="mt-4">
          <Label>{t.posts?.newMedia || 'New Media'}</Label>
          <div className="flex flex-wrap gap-2">
            {mediaFiles.map((file, index) => (
              <div key={index} className="relative">
                {file.type.startsWith('image/') ? (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={t.posts?.mediaFile || 'Media File'}
                    className="max-w-[100px] max-h-[100px] rounded-md object-cover"
                  />
                ) : (
                  <video
                    src={URL.createObjectURL(file)}
                    className="max-w-[100px] max-h-[100px] rounded-md object-cover"
                    controls
                  />
                )}
                <Button 
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 h-5 w-5 rounded-full p-0"
                  onClick={() => handleMediaFileRemove(index)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {existingMedia.length > 0 && (
        <div className="mt-4">
          <Label>{t.posts?.existingMedia || 'Existing Media'}</Label>
          <div className="flex flex-wrap gap-2">
            {existingMedia.map(url => (
              <div key={url} className="relative">
                <img src={url} alt={t.posts?.mediaFile || 'Media File'} className="max-w-[100px] max-h-[100px] rounded-md object-cover" />
                <Button 
                  type="button"
                  variant="destructive"
                  size="icon"
                  className="absolute top-0 right-0 h-5 w-5 rounded-full p-0"
                  onClick={() => handleMediaRemove(url)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[425px] bg-gray-900 border-gray-800">
          <DialogHeader>
            <DialogTitle>{t.posts?.manageTags || 'Manage Tags'}</DialogTitle>
            <DialogDescription>
              {t.posts?.addAndManageTags || 'Add and manage tags for your post here.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="newTag">{t.posts?.tagName || 'Tag Name'}</Label>
              <div className="flex items-center space-x-2 mt-1">
                <Input 
                  id="newTag" 
                  value={newTag} 
                  onChange={(e) => setNewTag(e.target.value)} 
                  className="bg-gray-800 border-gray-700"
                  placeholder={t.posts?.enterTagName || 'Enter tag name'}
                />
                <input
                  type="color"
                  value={newTagColor}
                  onChange={(e) => setNewTagColor(e.target.value)}
                  className="w-10 h-10 border-0 p-0 bg-transparent cursor-pointer"
                  title={t.posts?.selectColor || 'Select color'}
                />
                <Button type="button" onClick={handleTagAdd}><Plus className="h-4 w-4" /></Button>
              </div>
            </div>
            <div>
              <Label>{t.posts?.currentTags || 'Current Tags'}</Label>
              <div className="flex flex-wrap gap-2 mt-1">
                {tags.map(tag => (
                  <TagBadge key={tag.id} tag={tag} onClick={() => handleTagRemove(tag)} />
                ))}
                {tags.length === 0 && (
                  <p className="text-sm text-gray-500">{t.posts?.noTagsYet || 'No tags yet'}</p>
                )}
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
      
      <div className="mt-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={() => setOpen(true)}
            className="flex items-center"
          >
            <TagIcon className="h-4 w-4 mr-1" />
            {tags.length ? `${tags.length} tags` : t.posts?.addTags || 'Add Tags'}
          </Button>
          
          <Button 
            type="button" 
            variant="outline" 
            size="sm"
            onClick={handleMedia}
            className="flex items-center"
            disabled={isSubmitting}
          >
            <ImageIcon className="h-4 w-4 mr-1" />
            {t.posts?.addMedia || 'Add Media'}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={onCancel}
            disabled={isSubmitting}
          >
            {t.common?.cancel || 'Cancel'}
          </Button>
          
          <Button
            type="submit"
            disabled={isSubmitting || !title.trim() || (editor && !editor.getText().trim())}
            className="bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 transition-all duration-200 shadow-md hover:shadow-lg"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t.common?.publishing || 'Publishing...'}
              </>
            ) : (
              <>
                <Send className="mr-2 h-4 w-4" />
                {t.common?.publish || 'Publish'}
              </>
            )}
          </Button>
        </div>
      </div>
    </form>
  );
};

export default PostEditor;
