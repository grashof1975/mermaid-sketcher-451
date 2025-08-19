
import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { 
  Plus, 
  Search, 
  Edit, 
  Trash2, 
  Copy, 
  Eye, 
  Calendar,
  Tag,
  Loader2,
  FileText
} from "lucide-react";
import { useDiagrams } from "@/hooks/useDiagrams";
import { Diagram } from "@/types/database";
import { toast } from "@/components/ui/use-toast";
import { formatDistanceToNow } from 'date-fns';

interface DiagramGridProps {
  onSelectDiagram: (diagram: Diagram) => void;
}

const DiagramGrid: React.FC<DiagramGridProps> = ({ onSelectDiagram }) => {
  const { diagrams, loading, createDiagram, updateDiagram, deleteDiagram, duplicateDiagram } = useDiagrams();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string>('');
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [editingDiagram, setEditingDiagram] = useState<Diagram | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    mermaid_code: 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]',
    is_public: false,
    tags: [] as string[],
    newTag: '',
  });

  // Get all unique tags
  const allTags = Array.from(new Set(diagrams.flatMap(d => d.tags)));

  // Filter diagrams
  const filteredDiagrams = diagrams.filter(diagram => {
    const matchesSearch = diagram.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         (diagram.description || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesTag = !selectedTag || diagram.tags.includes(selectedTag);
    return matchesSearch && matchesTag;
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      mermaid_code: 'graph TD\n    A[Start] --> B[Process]\n    B --> C[End]',
      is_public: false,
      tags: [],
      newTag: '',
    });
    setEditingDiagram(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title.trim()) {
      toast({
        title: "Title required",
        description: "Please enter a title for your diagram",
        variant: "destructive",
      });
      return;
    }

    setFormLoading(true);
    try {
      if (editingDiagram) {
        await updateDiagram(editingDiagram.id, {
          title: formData.title,
          description: formData.description || null,
          mermaid_code: formData.mermaid_code,
          is_public: formData.is_public,
          tags: formData.tags,
        });
      } else {
        const newDiagram = await createDiagram({
          title: formData.title,
          description: formData.description || null,
          mermaid_code: formData.mermaid_code,
          is_public: formData.is_public,
          tags: formData.tags,
        });
        onSelectDiagram(newDiagram as unknown as Diagram);
      }
      
      setCreateModalOpen(false);
      resetForm();
    } catch (error) {
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to save diagram",
        variant: "destructive",
      });
    } finally {
      setFormLoading(false);
    }
  };

  const handleEdit = (diagram: Diagram) => {
    setFormData({
      title: diagram.title,
      description: diagram.description || '',
      mermaid_code: diagram.mermaid_code,
      is_public: diagram.is_public,
      tags: diagram.tags,
      newTag: '',
    });
    setEditingDiagram(diagram);
    setCreateModalOpen(true);
  };

  const handleDelete = async (diagram: Diagram) => {
    if (window.confirm(`Are you sure you want to delete "${diagram.title}"?`)) {
      try {
        await deleteDiagram(diagram.id);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to delete diagram",
          variant: "destructive",
        });
      }
    }
  };

  const handleDuplicate = async (diagram: Diagram) => {
    try {
      await duplicateDiagram(diagram.id);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to duplicate diagram",
        variant: "destructive",
      });
    }
  };

  const addTag = () => {
    if (formData.newTag.trim() && !formData.tags.includes(formData.newTag.trim())) {
      setFormData({
        ...formData,
        tags: [...formData.tags, formData.newTag.trim()],
        newTag: '',
      });
    }
  };

  const removeTag = (tag: string) => {
    setFormData({
      ...formData,
      tags: formData.tags.filter(t => t !== tag),
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Your Diagrams</h2>
          <p className="text-muted-foreground">
            {diagrams.length} diagram{diagrams.length !== 1 ? 's' : ''} total
          </p>
        </div>

        <Dialog open={createModalOpen} onOpenChange={(open) => {
          setCreateModalOpen(open);
          if (!open) resetForm();
        }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Diagram
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingDiagram ? 'Edit Diagram' : 'Create New Diagram'}
              </DialogTitle>
            </DialogHeader>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="My Awesome Diagram"
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this diagram shows..."
                  disabled={formLoading}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mermaid_code">Mermaid Code</Label>
                <Textarea
                  id="mermaid_code"
                  value={formData.mermaid_code}
                  onChange={(e) => setFormData({ ...formData, mermaid_code: e.target.value })}
                  placeholder="graph TD..."
                  rows={8}
                  disabled={formLoading}
                  className="font-mono text-sm"
                />
              </div>

              <div className="space-y-2">
                <Label>Tags</Label>
                <div className="flex items-center space-x-2">
                  <Input
                    value={formData.newTag}
                    onChange={(e) => setFormData({ ...formData, newTag: e.target.value })}
                    placeholder="Add a tag..."
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                    disabled={formLoading}
                  />
                  <Button type="button" onClick={addTag} size="sm" disabled={formLoading}>
                    Add
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2 mt-2">
                  {formData.tags.map(tag => (
                    <Badge key={tag} variant="secondary" className="cursor-pointer" onClick={() => removeTag(tag)}>
                      {tag} ×
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="is_public"
                  checked={formData.is_public}
                  onCheckedChange={(checked) => setFormData({ ...formData, is_public: checked })}
                  disabled={formLoading}
                />
                <Label htmlFor="is_public">Make this diagram public</Label>
              </div>

              <div className="flex space-x-2 pt-4">
                <Button type="submit" disabled={formLoading}>
                  {formLoading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {editingDiagram ? 'Updating...' : 'Creating...'}
                    </>
                  ) : (
                    editingDiagram ? 'Update Diagram' : 'Create Diagram'
                  )}
                </Button>
                <Button type="button" variant="outline" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex items-center space-x-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search diagrams..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>

        {allTags.length > 0 && (
          <div className="flex items-center space-x-2">
            <Label className="text-sm text-muted-foreground">Filter by tag:</Label>
            <Button
              variant={selectedTag === '' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedTag('')}
            >
              All
            </Button>
            {allTags.slice(0, 5).map(tag => (
              <Button
                key={tag}
                variant={selectedTag === tag ? 'default' : 'outline'}
                size="sm"
                onClick={() => setSelectedTag(tag)}
              >
                {tag}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Diagrams Grid */}
      {filteredDiagrams.length === 0 ? (
        <Card className="p-8 text-center">
          <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-medium mb-2">
            {diagrams.length === 0 ? 'No diagrams yet' : 'No matching diagrams'}
          </h3>
          <p className="text-muted-foreground mb-4">
            {diagrams.length === 0 
              ? 'Create your first diagram to get started'
              : 'Try adjusting your search or filters'
            }
          </p>
          {diagrams.length === 0 && (
            <Button onClick={() => setCreateModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create Your First Diagram
            </Button>
          )}
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredDiagrams.map(diagram => (
            <Card key={diagram.id} className="hover:shadow-lg transition-shadow cursor-pointer group">
              <CardHeader onClick={() => onSelectDiagram(diagram)}>
                <div className="flex items-start justify-between">
                  <div className="space-y-1 flex-1">
                    <CardTitle className="line-clamp-1">{diagram.title}</CardTitle>
                    <CardDescription className="line-clamp-2">
                      {diagram.description || 'No description'}
                    </CardDescription>
                  </div>
                  {diagram.is_public && (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </div>
                
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Calendar className="h-3 w-3" />
                    <span>{formatDistanceToNow(new Date(diagram.updated_at))} ago</span>
                  </div>
                  {diagram.tags.length > 0 && (
                    <div className="flex items-center space-x-1">
                      <Tag className="h-3 w-3" />
                      <span>{diagram.tags.length}</span>
                    </div>
                  )}
                </div>

                {diagram.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2">
                    {diagram.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="outline" className="text-xs">
                        {tag}
                      </Badge>
                    ))}
                    {diagram.tags.length > 3 && (
                      <Badge variant="outline" className="text-xs">
                        +{diagram.tags.length - 3}
                      </Badge>
                    )}
                  </div>
                )}
              </CardHeader>

              <CardContent className="pt-0">
                <div className="flex items-center justify-between opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="flex space-x-1">
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(diagram);
                      }}
                    >
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDuplicate(diagram);
                      }}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(diagram);
                      }}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button 
                    size="sm" 
                    onClick={() => onSelectDiagram(diagram)}
                  >
                    Open
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default DiagramGrid;
