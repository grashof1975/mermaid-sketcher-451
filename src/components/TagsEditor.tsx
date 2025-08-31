import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Plus, X } from 'lucide-react';

interface TagsEditorProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
  availableTags?: string[];
  // Filter props
  activeTags?: string[];
  onToggleFilter?: (tagName: string) => void;
  showFilterToggle?: boolean;
}

export const TagsEditor: React.FC<TagsEditorProps> = ({ 
  tags, 
  onChange, 
  maxTags = 5,
  availableTags = [],
  activeTags = [],
  onToggleFilter,
  showFilterToggle = false
}) => {
  const [isEditing, setIsEditing] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedSuggestionIndex, setSelectedSuggestionIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const addTag = () => {
    const trimmedTag = newTag.trim();
    if (!trimmedTag) return;
    
    // Check if there's an exact match in available tags first (case insensitive)
    const exactMatch = availableTags.find(tag => 
      tag.toLowerCase() === trimmedTag.toLowerCase()
    );
    const tagToAdd = exactMatch || trimmedTag;
    
    if (tagToAdd && !tags.includes(tagToAdd) && tags.length < maxTags) {
      onChange([...tags, tagToAdd]);
      setNewTag('');
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(tags.filter(tag => tag !== tagToRemove));
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (selectedSuggestionIndex >= 0 && selectedSuggestionIndex < filteredSuggestions.length) {
        // Select the highlighted suggestion
        selectSuggestion(filteredSuggestions[selectedSuggestionIndex]);
      } else {
        // Add the current typed tag
        addTag();
      }
    } else if (e.key === 'Escape') {
      setIsEditing(false);
      setNewTag('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev < filteredSuggestions.length - 1 ? prev + 1 : 0
        );
      }
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (showSuggestions && filteredSuggestions.length > 0) {
        setSelectedSuggestionIndex(prev => 
          prev > 0 ? prev - 1 : filteredSuggestions.length - 1
        );
      }
    }
  };

  // Get filtered suggestions based on current input
  const filteredSuggestions = availableTags
    .filter(tag => 
      tag.toLowerCase().includes(newTag.toLowerCase()) && 
      !tags.includes(tag) &&
      tag.toLowerCase() !== newTag.trim().toLowerCase()
    )
    .slice(0, 5);
    
  // Debug log
  if (newTag.length > 0) {
    console.log('DEBUG TagsEditor:', { 
      newTag, 
      availableTagsCount: availableTags.length, 
      filteredSuggestions,
      showSuggestions,
      isEditing
    });
  }

  const selectSuggestion = (suggestion: string) => {
    if (!tags.includes(suggestion) && tags.length < maxTags) {
      const newTags = [...tags, suggestion];
      onChange(newTags);
      setNewTag('');
      setShowSuggestions(false);
      setSelectedSuggestionIndex(-1);
      setIsEditing(false);
    }
  };

  const handleTagClick = (tagName: string, e: React.MouseEvent) => {
    if (showFilterToggle && onToggleFilter) {
      e.preventDefault();
      e.stopPropagation();
      onToggleFilter(tagName);
    }
  };

  const isTagActive = (tagName: string) => {
    return showFilterToggle && activeTags.includes(tagName);
  };

  return (
    <div className="flex flex-wrap items-center gap-1">
      {tags.map((tag, index) => (
        <Badge 
          key={index} 
          variant={isTagActive(tag) ? "default" : "secondary"}
          className={`text-xs px-2 py-0.5 group transition-colors ${
            showFilterToggle 
              ? 'cursor-pointer hover:bg-primary/20' 
              : 'hover:bg-destructive/20'
          } ${isTagActive(tag) ? 'bg-primary text-primary-foreground' : ''}`}
          onClick={(e) => handleTagClick(tag, e)}
        >
          {tag}
          {!showFilterToggle && (
            <Button
              onClick={() => removeTag(tag)}
              size="sm"
              variant="ghost"
              className="h-auto p-0 ml-1 text-xs opacity-0 group-hover:opacity-100 hover:bg-transparent"
            >
              <X className="h-3 w-3" />
            </Button>
          )}
        </Badge>
      ))}
      
      {isEditing ? (
        <div className="relative flex items-center gap-1">
          <Input
            ref={inputRef}
            value={newTag}
            onChange={(e) => {
              setNewTag(e.target.value);
              setShowSuggestions(e.target.value.length > 0);
              setSelectedSuggestionIndex(-1); // Reset selection when typing
            }}
            onKeyDown={handleKeyPress}
            onBlur={() => {
              // Delay to allow clicking on suggestions
              setTimeout(() => {
                if (newTag.trim()) addTag();
                setIsEditing(false);
                setShowSuggestions(false);
              }, 200);
            }}
            onFocus={() => {
              setShowSuggestions(newTag.length > 0);
              setSelectedSuggestionIndex(-1);
            }}
            placeholder="Nuovo tag..."
            className="h-6 text-xs px-2 w-24"
            maxLength={20}
          />
          
          {/* Suggestions dropdown */}
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="absolute top-full left-0 mt-1 w-32 bg-popover border rounded-md shadow-md z-50">
              {filteredSuggestions.map((suggestion, index) => (
                <button
                  key={suggestion}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    selectSuggestion(suggestion);
                  }}
                  onClick={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                  }}
                  className={`w-full text-left px-2 py-1 text-xs transition-colors ${
                    selectedSuggestionIndex === index
                      ? 'bg-primary text-primary-foreground'
                      : 'hover:bg-accent hover:text-accent-foreground'
                  }`}
                >
                  <Badge 
                    variant={selectedSuggestionIndex === index ? "default" : "secondary"} 
                    className="text-xs"
                  >
                    {suggestion}
                  </Badge>
                </button>
              ))}
            </div>
          )}
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