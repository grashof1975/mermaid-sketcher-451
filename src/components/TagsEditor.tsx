import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface TagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export const TagsEditor: React.FC<TagsEditorProps> = ({ 
  tags, 
  onChange, 
  maxTags = 5 
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const addTag = () => {
    const trimmedTag = newTag.trim().toLowerCase();
    if (trimmedTag && !tags.includes(trimmedTag) && tags.length < maxTags) {
      onChange([...tags, trimmedTag]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      addTag();
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setNewTag('');
    }
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag, index) => (
        <Badge 
          key={index} 
          variant="secondary" 
          className="text-xs px-2 py-0.5 group hover:bg-destructive/20"
        >
          {tag}
          <Button
            onClick={() => removeTag(tag)}
            size="sm"
            variant="ghost"
            className="h-auto p-0 ml-1 text-xs opacity-0 group-hover:opacity-100 hover:bg-transparent"
          >
            <X className="h-3 w-3" />
          </Button>
        </Badge>
      ))}
      
      {isEditing ? (
        <div className="flex items-center gap-1">
          <Input
            ref={inputRef}
            value={newTag}
            onChange={(e) => setNewTag(e.target.value)}
            onKeyDown={handleKeyPress}
            onBlur={() => {
              if (newTag.trim()) addTag();
              setIsEditing(false);
            }}
            placeholder="Nuovo tag..."
            className="h-6 text-xs px-2 w-20"
            maxLength={20}
          />
        </div>
      ) : (
        tags.length < maxTags && (
          <Button
            onClick={() => setIsEditing(true)}
            size="sm"
            variant="ghost"
            className="h-5 w-5 p-0 rounded-full border border-dashed border-muted-foreground/50 hover:border-muted-foreground"
          >
            <Plus className="h-3 w-3" />
          </Button>
        )
      )}
    </div>
  );
};