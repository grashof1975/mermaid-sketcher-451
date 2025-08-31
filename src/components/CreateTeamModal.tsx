import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Building, Rocket, Home, AlertCircle, Check, UserPlus } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';

export interface Team {
  id: string;
  name: string;
  description: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

interface CreateTeamModalProps {
  open: boolean;
  onClose: () => void;
  onTeamCreated: (team: Team) => void;
}

const TEAM_TYPES = [
  {
    value: 'personal',
    label: 'Team Personale',
    icon: Home,
    description: 'Un workspace privato per i tuoi progetti',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    borderColor: 'border-blue-200',
    suffix: ' - Personal Team'
  },
  {
    value: 'work',
    label: 'Team Aziendale', 
    icon: Building,
    description: 'Collaborazione con colleghi e progetti aziendali',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    borderColor: 'border-green-200',
    suffix: ' - Work Team'
  },
  {
    value: 'project',
    label: 'Team Progetto',
    icon: Rocket,
    description: 'Team temporaneo per progetti specifici',
    color: 'text-orange-600',
    bgColor: 'bg-orange-50 dark:bg-orange-950/30',
    borderColor: 'border-orange-200',
    suffix: ' - Project Team'
  },
  {
    value: 'shared',
    label: 'Team Condiviso',
    icon: Users,
    description: 'Spazio aperto per collaborazione generale',
    color: 'text-purple-600',
    bgColor: 'bg-purple-50 dark:bg-purple-950/30',
    borderColor: 'border-purple-200',
    suffix: ' - Shared Team'
  }
];

export const CreateTeamModal: React.FC<CreateTeamModalProps> = ({
  open,
  onClose,
  onTeamCreated
}) => {
  const { user } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [teamType, setTeamType] = useState<string>('shared');
  const [isLoading, setIsLoading] = useState(false);
  const [nameError, setNameError] = useState('');

  const selectedTeamType = TEAM_TYPES.find(t => t.value === teamType);

  const validateName = (name: string) => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      return 'Il nome del team è obbligatorio';
    }
    if (trimmedName.length < 3) {
      return 'Il nome deve essere di almeno 3 caratteri';
    }
    if (trimmedName.length > 50) {
      return 'Il nome non può superare i 50 caratteri';
    }
    return '';
  };

  const handleNameChange = (value: string) => {
    setName(value);
    const error = validateName(value);
    setNameError(error);
  };

  const generateTeamName = () => {
    const suffix = selectedTeamType?.suffix || '';
    return name.trim() + suffix;
  };

  const handleCreate = async () => {
    if (!user) {
      toast.error('Devi essere autenticato per creare un team');
      return;
    }

    const nameValidationError = validateName(name);
    if (nameValidationError) {
      setNameError(nameValidationError);
      return;
    }

    setIsLoading(true);
    try {
      // Chiama la RPC function create_team implementata nella Fase 1
      const { data: teamId, error } = await supabase.rpc('create_team', {
        team_name: generateTeamName(),
        team_description: description.trim() || null
      });

      if (error) {
        console.error('Error creating team:', error);
        
        // Handle specific errors
        if (error.message?.includes('already exists') || error.message?.includes('duplicate')) {
          toast.error('Esiste già un team con questo nome. Scegli un nome diverso.');
        } else if (error.message?.includes('empty')) {
          toast.error('Il nome del team non può essere vuoto');
        } else {
          toast.error(`Errore nella creazione del team: ${error.message}`);
        }
        return;
      }

      if (!teamId) {
        toast.error('Errore: nessun ID team ricevuto');
        return;
      }

      // Recupera i dati del team appena creato
      const { data: teamData, error: fetchError } = await supabase
        .from('teams')
        .select('*')
        .eq('id', teamId)
        .single();

      if (fetchError || !teamData) {
        console.error('Error fetching created team:', fetchError);
        toast.error('Team creato ma errore nel recupero dei dati');
        return;
      }

      // Success
      toast.success(`Team "${teamData.name}" creato con successo! 🎉`);
      
      // Callback with new team data
      onTeamCreated(teamData);
      
      // Reset form
      setName('');
      setDescription('');
      setTeamType('shared');
      onClose();
      
    } catch (error) {
      console.error('Unexpected error creating team:', error);
      toast.error('Errore imprevisto nella creazione del team');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <UserPlus className="h-5 w-5" />
            Crea Nuovo Team
          </DialogTitle>
          <DialogDescription>
            Crea un team per collaborare con altri utenti sui diagrammi
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-4">
          {/* Form Section */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="team-name" className="text-sm font-medium">
                Nome Team *
              </Label>
              <Input
                id="team-name"
                type="text"
                placeholder="Il mio team fantastico"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                className={nameError ? 'border-red-500' : ''}
                maxLength={50}
              />
              {nameError && (
                <div className="flex items-center gap-1 text-xs text-red-600">
                  <AlertCircle className="h-3 w-3" />
                  {nameError}
                </div>
              )}
              <div className="text-xs text-muted-foreground text-right">
                {name.length}/50 caratteri
              </div>
            </div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Tipo Team *</Label>
              <div className="space-y-2">
                {TEAM_TYPES.map((type) => (
                  <div
                    key={type.value}
                    className={`p-3 rounded-lg border-2 cursor-pointer transition-all ${
                      teamType === type.value
                        ? `${type.bgColor} ${type.borderColor}`
                        : 'border-gray-200 hover:border-gray-300 dark:border-gray-800 dark:hover:border-gray-700'
                    }`}
                    onClick={() => setTeamType(type.value)}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`p-2 rounded-lg ${type.bgColor}`}>
                        <type.icon className={`h-4 w-4 ${type.color}`} />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <div className="font-medium text-sm">{type.label}</div>
                          {teamType === type.value && (
                            <Check className="h-4 w-4 text-green-600" />
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="team-description" className="text-sm font-medium">
                Descrizione (opzionale)
              </Label>
              <Textarea
                id="team-description"
                placeholder="Descrivi lo scopo e gli obiettivi del team..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="resize-none"
                maxLength={200}
              />
              <div className="text-xs text-muted-foreground text-right">
                {description.length}/200 caratteri
              </div>
            </div>
          </div>

          {/* Preview Section */}
          <div className="space-y-4">
            <div>
              <Label className="text-sm font-medium mb-2 block">Anteprima Team</Label>
              <Card>
                <CardContent className="p-4">
                  <div className="space-y-3">
                    {/* Team Header */}
                    <div className="flex items-start gap-3">
                      {selectedTeamType && (
                        <div className={`p-2 rounded-lg ${selectedTeamType.bgColor}`}>
                          <selectedTeamType.icon className={`h-5 w-5 ${selectedTeamType.color}`} />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm truncate">
                          {name.trim() ? generateTeamName() : 'Nome team apparirà qui...'}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {selectedTeamType?.label || 'Tipo team'}
                        </div>
                      </div>
                    </div>
                    
                    {/* Description */}
                    {description.trim() && (
                      <div className="text-xs text-muted-foreground bg-muted/30 p-2 rounded">
                        {description}
                      </div>
                    )}
                    
                    {/* Membership */}
                    <div className="flex items-center justify-between text-xs pt-2 border-t">
                      <div className="flex items-center gap-1">
                        <Users className="h-3 w-3" />
                        1 membro
                      </div>
                      <Badge variant="outline" className="text-xs px-1 py-0 h-4">
                        👑 Owner
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Info Box */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="font-medium text-sm flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Funzionalità Team
                  </div>
                  <div className="text-xs space-y-1 text-muted-foreground">
                    <div>✅ Condivisione diagrammi</div>
                    <div>✅ Gestione membri e ruoli</div>
                    <div>✅ Collaborazione in tempo reale</div>
                    <div>✅ Sistema di inviti</div>
                    <div>✅ Visibilità team-based</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t">
          <div className="text-xs text-muted-foreground">
            Sarai automaticamente Owner del team creato
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Annulla
            </Button>
            <Button 
              onClick={handleCreate} 
              disabled={!name.trim() || !!nameError || isLoading}
              className="min-w-[100px]"
            >
              {isLoading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Creazione...
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <UserPlus className="h-4 w-4" />
                  Crea Team
                </div>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};