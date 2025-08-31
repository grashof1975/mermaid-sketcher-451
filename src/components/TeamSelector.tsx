import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Users, ChevronDown, Home, Building, Rocket, Crown, Shield, Edit3, Eye, Settings, UserPlus, Check } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';
import { Team } from './CreateTeamModal';
import { TeamMember } from './TeamManagementModal';

interface UserTeam extends Team {
  user_role: string;
  member_count: number;
  diagram_count: number;
  is_personal: boolean;
}

interface TeamSelectorProps {
  selectedTeam: UserTeam | null;
  onTeamChange: (team: UserTeam | null) => void;
  onCreateTeam: () => void;
  onManageTeam?: (team: UserTeam) => void;
  className?: string;
}

const TEAM_ICONS = {
  'Personal Team': Home,
  'Work Team': Building,
  'Project Team': Rocket,
  'Shared Team': Users,
  'default': Users
};

const ROLE_ICONS = {
  'owner': Crown,
  'admin': Shield,
  'editor': Edit3,
  'viewer': Eye
};

const ROLE_COLORS = {
  'owner': 'text-yellow-600',
  'admin': 'text-red-600',
  'editor': 'text-green-600',
  'viewer': 'text-blue-600'
};

export const TeamSelector: React.FC<TeamSelectorProps> = ({
  selectedTeam,
  onTeamChange,
  onCreateTeam,
  onManageTeam,
  className = ''
}) => {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [teams, setTeams] = useState<UserTeam[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const loadUserTeams = async () => {
    if (!user) {
      setTeams([]);
      return;
    }
    
    setIsLoading(true);
    try {
      // Use the RPC function from Phase 1 to get user teams
      const { data: teamsData, error } = await supabase.rpc('get_user_teams', {
        target_user_id: user.id
      });

      if (error) {
        console.error('Error loading user teams:', error);
        toast.error('Errore nel caricamento dei team');
        return;
      }

      if (teamsData && Array.isArray(teamsData)) {
        setTeams(teamsData);
      }

    } catch (error) {
      console.error('Unexpected error loading teams:', error);
      toast.error('Errore imprevisto nel caricamento dei team');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadUserTeams();
    }
  }, [user]);

  const getTeamIcon = (teamName: string) => {
    const iconKey = Object.keys(TEAM_ICONS).find(key => (teamName || '').includes(key));
    return TEAM_ICONS[iconKey as keyof typeof TEAM_ICONS] || TEAM_ICONS.default;
  };

  const getRoleIcon = (role: string) => {
    return ROLE_ICONS[role as keyof typeof ROLE_ICONS] || Eye;
  };

  const getRoleColor = (role: string) => {
    return ROLE_COLORS[role as keyof typeof ROLE_COLORS] || 'text-blue-600';
  };

  const getTeamTypeColor = (teamName: string) => {
    const name = teamName || '';
    if (name.includes('Personal Team')) return 'bg-blue-50 border-blue-200 dark:bg-blue-950/30';
    if (name.includes('Work Team')) return 'bg-green-50 border-green-200 dark:bg-green-950/30';
    if (name.includes('Project Team')) return 'bg-orange-50 border-orange-200 dark:bg-orange-950/30';
    if (name.includes('Shared Team')) return 'bg-purple-50 border-purple-200 dark:bg-purple-950/30';
    return 'bg-gray-50 border-gray-200 dark:bg-gray-950/30';
  };

  const handleTeamSelect = (team: UserTeam) => {
    onTeamChange(team);
    setIsOpen(false);
    toast.success(`Passato al team: ${team.name}`);
  };

  const handlePersonalMode = () => {
    onTeamChange(null);
    setIsOpen(false);
    toast.success('Passato alla modalità personale');
  };

  // Sort teams: personal first, then by name
  const sortedTeams = [...teams].sort((a, b) => {
    if (a.is_personal && !b.is_personal) return -1;
    if (!a.is_personal && b.is_personal) return 1;
    return (a.name || '').localeCompare(b.name || '');
  });

  const personalTeams = sortedTeams.filter(t => t.is_personal);
  const collaborativeTeams = sortedTeams.filter(t => !t.is_personal);

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className={`${className} min-w-[120px] justify-between glass-button`}
        >
          <div className="flex items-center gap-2 min-w-0">
            {selectedTeam ? (
              <>
                {(() => {
                  const TeamIcon = getTeamIcon(selectedTeam.name);
                  return <TeamIcon className="h-4 w-4 flex-shrink-0" />;
                })()}
                <span className="truncate text-xs">
                  {selectedTeam.is_personal ? 'Personale' : (selectedTeam.name || '').replace(' - Shared Team', '').replace(' - Work Team', '').replace(' - Project Team', '')}
                </span>
              </>
            ) : (
              <>
                <Home className="h-4 w-4 flex-shrink-0" />
                <span className="text-xs">Personale</span>
              </>
            )}
          </div>
          <ChevronDown className="h-3 w-3 flex-shrink-0" />
        </Button>
      </PopoverTrigger>
      
      <PopoverContent className="w-80 p-0" align="start">
        <div className="p-3 border-b">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm">Seleziona Team</h4>
            <Badge variant="secondary" className="text-xs">
              {teams.length} team{teams.length !== 1 ? 's' : ''}
            </Badge>
          </div>
        </div>

        <ScrollArea className="max-h-80">
          <div className="p-2 space-y-3">
            {/* Personal Mode */}
            <div>
              <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                Modalità Personale
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={handlePersonalMode}
                className={`w-full justify-start h-auto p-2 ${
                  !selectedTeam ? 'bg-accent' : ''
                }`}
              >
                <div className="flex items-center gap-3 w-full">
                  <div className="p-1.5 rounded bg-blue-50 dark:bg-blue-950/30">
                    <Home className="h-4 w-4 text-blue-600" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-sm">Modalità Personale</span>
                      {!selectedTeam && (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </div>
                    <div className="text-xs text-muted-foreground">
                      Lavora sui tuoi diagrammi privati
                    </div>
                  </div>
                </div>
              </Button>
            </div>

            {isLoading && (
              <div className="flex items-center justify-center py-4">
                <div className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
                <span className="ml-2 text-sm text-muted-foreground">Caricamento team...</span>
              </div>
            )}

            {!isLoading && teams.length === 0 && (
              <div className="text-center py-4 text-muted-foreground text-sm">
                Nessun team trovato
              </div>
            )}

            {/* Personal Teams */}
            {personalTeams.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Team Personali
                </div>
                <div className="space-y-1">
                  {personalTeams.map((team) => {
                    const TeamIcon = getTeamIcon(team.name);
                    const RoleIcon = getRoleIcon(team.user_role);
                    const isSelected = selectedTeam?.id === team.id;
                    
                    return (
                      <div key={team.id} className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTeamSelect(team)}
                          className={`flex-1 justify-start h-auto p-2 ${
                            isSelected ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`p-1.5 rounded ${getTeamTypeColor(team.name)}`}>
                              <TeamIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {(team.name || '').replace(' - Personal Team', '')}
                                </span>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <RoleIcon className={`h-3 w-3 ${getRoleColor(team.user_role)}`} />
                                <span>{team.user_role}</span>
                                <span>•</span>
                                <span>{team.diagram_count} diagrammi</span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        {onManageTeam && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onManageTeam(team)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                            title="Gestisci team"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {personalTeams.length > 0 && collaborativeTeams.length > 0 && (
              <Separator />
            )}

            {/* Collaborative Teams */}
            {collaborativeTeams.length > 0 && (
              <div>
                <div className="px-2 py-1 text-xs font-medium text-muted-foreground">
                  Team Collaborativi
                </div>
                <div className="space-y-1">
                  {collaborativeTeams.map((team) => {
                    const TeamIcon = getTeamIcon(team.name);
                    const RoleIcon = getRoleIcon(team.user_role);
                    const isSelected = selectedTeam?.id === team.id;
                    
                    return (
                      <div key={team.id} className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleTeamSelect(team)}
                          className={`flex-1 justify-start h-auto p-2 ${
                            isSelected ? 'bg-accent' : ''
                          }`}
                        >
                          <div className="flex items-center gap-3 w-full">
                            <div className={`p-1.5 rounded ${getTeamTypeColor(team.name)}`}>
                              <TeamIcon className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0 text-left">
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-sm truncate">
                                  {(team.name || '').replace(' - Shared Team', '').replace(' - Work Team', '').replace(' - Project Team', '')}
                                </span>
                                {isSelected && (
                                  <Check className="h-4 w-4 text-green-600 flex-shrink-0" />
                                )}
                              </div>
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <RoleIcon className={`h-3 w-3 ${getRoleColor(team.user_role)}`} />
                                <span>{team.user_role}</span>
                                <span>•</span>
                                <span>{team.member_count} membri</span>
                                <span>•</span>
                                <span>{team.diagram_count} diagrammi</span>
                              </div>
                            </div>
                          </div>
                        </Button>
                        
                        {onManageTeam && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onManageTeam(team)}
                            className="h-8 w-8 p-0 flex-shrink-0"
                            title="Gestisci team"
                          >
                            <Settings className="h-3 w-3" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </ScrollArea>

        <Separator />
        
        <div className="p-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              onCreateTeam();
              setIsOpen(false);
            }}
            className="w-full justify-start"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Crea Nuovo Team
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  );
};