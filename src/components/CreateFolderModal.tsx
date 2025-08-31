import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Folder, FolderOpen, FolderX, Archive, Briefcase, BookOpen, Settings, Star, Heart, Lightbulb, Target } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface CreateFolderModalProps {
  onCreateFolder: (name: string, icon?: string, color?: string) => Promise<void>;
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const FOLDER_ICONS = [
  { icon: Folder, name: 'folder', label: 'Cartella' },
  { icon: FolderOpen, name: 'folder-open', label: 'Cartella aperta' },
  { icon: Archive, name: 'archive', label: 'Archivio' },
  { icon: Briefcase, name: 'briefcase', label: 'Lavoro' },
  { icon: BookOpen, name: 'book-open', label: 'Progetto' },
  { icon: Settings, name: 'settings', label: 'Impostazioni' },
  { icon: Star, name: 'star', label: 'Preferiti' },
  { icon: Heart, name: 'heart', label: 'Cuore' },
  { icon: Lightbulb, name: 'lightbulb', label: 'Idee' },
  { icon: Target, name: 'target', label: 'Obiettivi' }
];

const FOLDER_COLORS = [
  '#3B82F6', // Blue
  '#10B981', // Emerald
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Violet
  '#06B6D4', // Cyan
  '#84CC16', // Lime
  '#F97316', // Orange
  '#EC4899', // Pink
  '#6B7280'  // Gray
];

export const CreateFolderModal: React.FC<CreateFolderModalProps> = ({
  onCreateFolder,
  trigger,
  isOpen,
  onOpenChange
}) => {
  const [open, setOpen] = useState(false);
  const [folderName, setFolderName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('folder');
  const [selectedColor, setSelectedColor] = useState('#3B82F6');
  const [isLoading, setIsLoading] = useState(false);

  // Use controlled open state if provided, otherwise use internal state
  const modalOpen = isOpen !== undefined ? isOpen : open;
  const handleOpenChange = (newOpen: boolean) => {
    if (onOpenChange) {
      onOpenChange(newOpen);
    } else {
      setOpen(newOpen);
    }
    
    if (!newOpen) {
      // Reset form when closing
      setFolderName('');
      setSelectedIcon('folder');
      setSelectedColor('#3B82F6');
    }
  };

  const handleCreateFolder = async () => {
    if (!folderName.trim()) {
      toast({
        title: "Nome richiesto",
        description: "Inserisci un nome per la cartella",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await onCreateFolder(folderName.trim(), selectedIcon, selectedColor);
      
      toast({
        title: "Cartella creata",
        description: `Cartella "${folderName}" creata con successo`,
      });
      
      handleOpenChange(false);
    } catch (error) {
      console.error('Error creating folder:', error);
      toast({
        title: "Errore",
        description: "Impossibile creare la cartella",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isLoading) {
      handleCreateFolder();
    }
  };

  const defaultTrigger = (
    <Button variant="outline" size="sm">
      <Folder className="h-4 w-4 mr-2" />
      Nuova Cartella
    </Button>
  );

  return (
    <Dialog open={modalOpen} onOpenChange={handleOpenChange}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Crea Nuova Cartella</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {/* Folder name input */}
          <div className="space-y-2">
            <Label htmlFor="folderName">Nome Cartella</Label>
            <Input
              id="folderName"
              placeholder="Nome della cartella..."
              value={folderName}
              onChange={(e) => setFolderName(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={isLoading}
              autoFocus
            />
          </div>

          {/* Icon selection */}
          <div className="space-y-2">
            <Label>Icona</Label>
            <div className="grid grid-cols-5 gap-2">
              {FOLDER_ICONS.map(({ icon: Icon, name, label }) => (
                <Button
                  key={name}
                  variant={selectedIcon === name ? "default" : "outline"}
                  size="sm"
                  className="p-2 h-10"
                  onClick={() => setSelectedIcon(name)}
                  disabled={isLoading}
                  title={label}
                >
                  <Icon className="h-4 w-4" />
                </Button>
              ))}
            </div>
          </div>

          {/* Color selection */}
          <div className="space-y-2">
            <Label>Colore</Label>
            <div className="flex gap-2 flex-wrap">
              {FOLDER_COLORS.map((color) => (
                <button
                  key={color}
                  className={`w-8 h-8 rounded-full border-2 transition-all ${
                    selectedColor === color 
                      ? 'border-gray-800 scale-110' 
                      : 'border-gray-300 hover:scale-105'
                  }`}
                  style={{ backgroundColor: color }}
                  onClick={() => setSelectedColor(color)}
                  disabled={isLoading}
                  title={color}
                />
              ))}
            </div>
          </div>

          {/* Preview */}
          <div className="space-y-2">
            <Label>Anteprima</Label>
            <div className="flex items-center gap-2 p-3 border rounded-md bg-muted/30">
              {(() => {
                const IconComponent = FOLDER_ICONS.find(i => i.name === selectedIcon)?.icon || Folder;
                return <IconComponent className="h-5 w-5" style={{ color: selectedColor }} />;
              })()}
              <span className="font-medium">
                {folderName || 'Nome cartella'}
              </span>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex justify-end gap-2 pt-2">
            <Button 
              variant="outline" 
              onClick={() => handleOpenChange(false)}
              disabled={isLoading}
            >
              Annulla
            </Button>
            <Button 
              onClick={handleCreateFolder}
              disabled={isLoading || !folderName.trim()}
            >
              {isLoading ? 'Creando...' : 'Crea Cartella'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};