import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Settings, UserPlus, Mail, Trash2, Crown, Shield, Edit3, Eye, UserX, Calendar, Activity, AlertTriangle } from 'lucide-react';
import { supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';
import { Team } from './CreateTeamModal';

export interface TeamMember {
  id: string;
  team_id: string;
  user_id: string;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  joined_at: string;
  invited_by: string;
  status: 'active' | 'pending' | 'inactive';
  user?: {
    id: string;
    username?: string;
    full_name?: string;
    email?: string;
    avatar_url?: string;
  };
}

interface TeamManagementModalProps {
  team: Team;
  open: boolean;
  onClose: () => void;
  onTeamUpdated?: (team: Team) => void;
  onTeamDeleted?: (teamId: string) => void;
}

const ROLE_LEVELS = [
  {
    value: 'owner',
    label: 'Proprietario',
    icon: Crown,
    description: 'Controllo completo del team',
    color: 'text-yellow-600',
    bgColor: 'bg-yellow-50 dark:bg-yellow-950/30',
    canInvite: true,
    canManage: true,
    canEdit: true,
    canView: true
  },
  {
    value: 'admin',
    label: 'Amministratore',
    icon: Shield,
    description: 'Può gestire membri e impostazioni',
    color: 'text-red-600',
    bgColor: 'bg-red-50 dark:bg-red-950/30',
    canInvite: true,
    canManage: true,
    canEdit: true,
    canView: true
  },
  {
    value: 'editor',
    label: 'Editor',
    icon: Edit3,
    description: 'Può modificare diagrammi del team',
    color: 'text-green-600',
    bgColor: 'bg-green-50 dark:bg-green-950/30',
    canInvite: false,
    canManage: false,
    canEdit: true,
    canView: true
  },
  {
    value: 'viewer',
    label: 'Visualizzatore',
    icon: Eye,
    description: 'Solo visualizzazione',
    color: 'text-blue-600',
    bgColor: 'bg-blue-50 dark:bg-blue-950/30',
    canInvite: false,
    canManage: false,
    canEdit: false,
    canView: true
  }
];

export const TeamManagementModal: React.FC<TeamManagementModalProps> = ({
  team,
  open,
  onClose,
  onTeamUpdated,
  onTeamDeleted
}) => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('info');
  const [teamName, setTeamName] = useState(team.name);
  const [teamDescription, setTeamDescription] = useState(team.description || '');
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [currentUserRole, setCurrentUserRole] = useState<string>('viewer');
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<string>('editor');
  const [isInviting, setIsInviting] = useState(false);

  // Load team members and current user role
  const loadTeamData = async () => {
    if (!user || !team.id) return;
    
    setIsLoading(true);
    try {
      // Get team members using RPC function
      const { data: membersData, error: membersError } = await supabase.rpc('get_team_members', {
        team_id: team.id
      });

      if (membersError) {
        console.error('Error loading team members:', membersError);
        toast.error('Errore nel caricamento dei membri del team');
        return;
      }

      if (membersData && Array.isArray(membersData)) {
        setMembers(membersData);
        
        // Find current user role
        const currentMember = membersData.find((member: any) => member.user_id === user.id);
        if (currentMember) {
          setCurrentUserRole(currentMember.role);
        }
      }

    } catch (error) {
      console.error('Error loading team data:', error);
      toast.error('Errore nel caricamento dei dati del team');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (open && team.id) {
      loadTeamData();
      setTeamName(team.name);
      setTeamDescription(team.description || '');
    }
  }, [open, team.id, user]);

  const getRoleConfig = (role: string) => {
    return ROLE_LEVELS.find(r => r.value === role) || ROLE_LEVELS[3]; // Default to viewer
  };

  const canManageTeam = () => {
    return currentUserRole === 'owner' || currentUserRole === 'admin';
  };

  const canInviteMembers = () => {
    const roleConfig = getRoleConfig(currentUserRole);
    return roleConfig.canInvite;
  };

  const handleUpdateTeam = async () => {
    if (!canManageTeam()) {
      toast.error('Non hai i permessi per modificare questo team');
      return;
    }

    setIsSaving(true);
    try {
      // Update team using direct table update (teams table is accessible)
      const { data, error } = await supabase
        .from('teams')
        .update({
          name: teamName.trim(),
          description: teamDescription.trim() || null,
          updated_at: new Date().toISOString()
        })
        .eq('id', team.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating team:', error);
        toast.error('Errore nell\'aggiornamento del team');
        return;
      }

      toast.success('Team aggiornato con successo');
      
      if (onTeamUpdated && data) {
        onTeamUpdated(data);
      }

    } catch (error) {
      console.error('Unexpected error updating team:', error);
      toast.error('Errore imprevisto nell\'aggiornamento');
    } finally {
      setIsSaving(false);
    }
  };

  const handleInviteMember = async () => {
    if (!canInviteMembers()) {
      toast.error('Non hai i permessi per invitare membri');
      return;
    }

    if (!inviteEmail.trim()) {
      toast.error('Inserisci un indirizzo email');
      return;
    }

    setIsInviting(true);
    try {
      // Use RPC function to invite user to team
      const { data, error } = await supabase.rpc('invite_user_to_team', {
        team_id: team.id,
        email_input: inviteEmail.trim(),
        role_input: inviteRole
      });

      if (error) {
        console.error('Error inviting user:', error);
        if (error.message?.includes('not found')) {
          toast.error('Utente non trovato. Verifica che l\'email sia corretta e che l\'utente sia registrato.');
        } else if (error.message?.includes('already member')) {
          toast.error('L\'utente è già membro di questo team.');
        } else {
          toast.error(`Errore nell'invito: ${error.message}`);
        }
        return;
      }

      toast.success(`Invito inviato a ${inviteEmail}`);
      
      // Reset form and reload members
      setInviteEmail('');
      setInviteRole('editor');
      loadTeamData();

    } catch (error) {
      console.error('Unexpected error inviting member:', error);
      toast.error('Errore imprevisto nell\'invio dell\'invito');
    } finally {
      setIsInviting(false);
    }
  };

  const handleRemoveMember = async (memberId: string, memberEmail: string) => {
    if (!canManageTeam()) {
      toast.error('Non hai i permessi per rimuovere membri');
      return;
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .delete()
        .eq('id', memberId)
        .eq('team_id', team.id);

      if (error) {
        console.error('Error removing member:', error);
        toast.error('Errore nella rimozione del membro');
        return;
      }

      toast.success(`Membro ${memberEmail} rimosso dal team`);
      loadTeamData();

    } catch (error) {
      console.error('Unexpected error removing member:', error);
      toast.error('Errore imprevisto nella rimozione');
    }
  };

  const handleChangeRole = async (memberId: string, newRole: string, memberEmail: string) => {
    if (!canManageTeam()) {
      toast.error('Non hai i permessi per modificare i ruoli');
      return;
    }

    try {
      const { error } = await supabase
        .from('team_members')
        .update({ role: newRole })
        .eq('id', memberId)
        .eq('team_id', team.id);

      if (error) {
        console.error('Error updating member role:', error);
        toast.error('Errore nella modifica del ruolo');
        return;
      }

      toast.success(`Ruolo di ${memberEmail} aggiornato`);
      loadTeamData();

    } catch (error) {
      console.error('Unexpected error updating role:', error);
      toast.error('Errore imprevisto nella modifica del ruolo');
    }
  };

  const handleDeleteTeam = async () => {
    if (currentUserRole !== 'owner') {
      toast.error('Solo il proprietario può eliminare il team');
      return;
    }

    try {
      // Soft delete - set is_active to false
      const { error } = await supabase
        .from('teams')
        .update({ is_active: false })
        .eq('id', team.id);

      if (error) {
        console.error('Error deleting team:', error);
        toast.error('Errore nell\'eliminazione del team');
        return;
      }

      toast.success('Team eliminato con successo');
      
      if (onTeamDeleted) {
        onTeamDeleted(team.id);
      }
      
      onClose();

    } catch (error) {
      console.error('Unexpected error deleting team:', error);
      toast.error('Errore imprevisto nell\'eliminazione');
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Gestione Team: {team.name}
          </DialogTitle>
          <DialogDescription>
            Gestisci le informazioni del team, i membri e le impostazioni
          </DialogDescription>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="info" className="flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Informazioni
            </TabsTrigger>
            <TabsTrigger value="members" className="flex items-center gap-2">
              <Users className="h-4 w-4" />
              Membri ({members.length})
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Impostazioni
            </TabsTrigger>
          </TabsList>
          
          <div className="flex-1 overflow-hidden">
            <TabsContent value="info" className="space-y-4 h-full">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="team-name">Nome Team</Label>
                    <Input
                      id="team-name"
                      value={teamName}
                      onChange={(e) => setTeamName(e.target.value)}
                      disabled={!canManageTeam()}
                      maxLength={50}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team-description">Descrizione</Label>
                    <Textarea
                      id="team-description"
                      value={teamDescription}
                      onChange={(e) => setTeamDescription(e.target.value)}
                      disabled={!canManageTeam()}
                      rows={4}
                      maxLength={200}
                    />
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Statistiche Team</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Membri totali:</span>
                          <Badge variant="secondary">{members.length}</Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Membri attivi:</span>
                          <Badge variant="outline">
                            {members.filter(m => m.status === 'active').length}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span>Inviti pending:</span>
                          <Badge variant="outline">
                            {members.filter(m => m.status === 'pending').length}
                          </Badge>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm">Il Tuo Ruolo</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center gap-2">
                          {(() => {
                            const role = getRoleConfig(currentUserRole);
                            return (
                              <>
                                <role.icon className={`h-4 w-4 ${role.color}`} />
                                <Badge variant="secondary">{role.label}</Badge>
                              </>
                            );
                          })()}
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">
                          {getRoleConfig(currentUserRole).description}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="text-xs text-muted-foreground space-y-1">
                    <div>Creato: {new Date(team.created_at).toLocaleString('it-IT')}</div>
                    <div>Ultimo aggiornamento: {new Date(team.updated_at).toLocaleString('it-IT')}</div>
                  </div>
                </div>
              </ScrollArea>

              {canManageTeam() && (
                <div className="flex justify-end">
                  <Button 
                    onClick={handleUpdateTeam} 
                    disabled={isSaving}
                    className="min-w-[100px]"
                  >
                    {isSaving ? 'Salvataggio...' : 'Salva Modifiche'}
                  </Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="members" className="space-y-4 h-full">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-4">
                  {/* Invite New Member */}
                  {canInviteMembers() && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-sm flex items-center gap-2">
                          <UserPlus className="h-4 w-4" />
                          Invita Nuovo Membro
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div className="flex gap-2">
                          <Input
                            placeholder="email@esempio.com"
                            value={inviteEmail}
                            onChange={(e) => setInviteEmail(e.target.value)}
                            className="flex-1"
                          />
                          <Select value={inviteRole} onValueChange={setInviteRole}>
                            <SelectTrigger className="w-32">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {ROLE_LEVELS.filter(role => 
                                currentUserRole === 'owner' || role.value !== 'admin'
                              ).map((role) => (
                                <SelectItem key={role.value} value={role.value}>
                                  {role.label}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                          <Button 
                            onClick={handleInviteMember} 
                            disabled={isInviting || !inviteEmail.trim()}
                            size="sm"
                          >
                            {isInviting ? 'Invio...' : 'Invita'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  <Separator />

                  {/* Members List */}
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium">Membri del Team</h4>
                    
                    {isLoading ? (
                      <div className="text-center py-4">
                        <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin mx-auto" />
                        <p className="text-sm text-muted-foreground mt-2">Caricamento membri...</p>
                      </div>
                    ) : members.length === 0 ? (
                      <div className="text-center py-4 text-muted-foreground text-sm">
                        Nessun membro trovato
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {members.map((member) => {
                          const role = getRoleConfig(member.role);
                          const isCurrentUser = member.user_id === user?.id;
                          
                          return (
                            <Card key={member.id}>
                              <CardContent className="p-3">
                                <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-3">
                                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                      {(member.user?.username || member.user?.email || '?').charAt(0).toUpperCase()}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                      <div className="font-medium text-sm flex items-center gap-2">
                                        {member.user?.username || member.user?.full_name || 'Utente Sconosciuto'}
                                        {isCurrentUser && (
                                          <Badge variant="outline" className="text-xs">Tu</Badge>
                                        )}
                                        {member.status === 'pending' && (
                                          <Badge variant="secondary" className="text-xs">Pending</Badge>
                                        )}
                                      </div>
                                      <div className="text-xs text-muted-foreground">
                                        {member.user?.email || 'Email non disponibile'}
                                      </div>
                                      <div className="text-xs text-muted-foreground flex items-center gap-1">
                                        <Calendar className="h-3 w-3" />
                                        Unito: {new Date(member.joined_at).toLocaleDateString('it-IT')}
                                      </div>
                                    </div>
                                  </div>
                                  
                                  <div className="flex items-center gap-2">
                                    {canManageTeam() && !isCurrentUser ? (
                                      <Select 
                                        value={member.role} 
                                        onValueChange={(newRole) => handleChangeRole(member.id, newRole, member.user?.email || 'utente')}
                                      >
                                        <SelectTrigger className="w-32">
                                          <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {ROLE_LEVELS.filter(role => 
                                            currentUserRole === 'owner' || role.value !== 'admin'
                                          ).map((role) => (
                                            <SelectItem key={role.value} value={role.value}>
                                              <div className="flex items-center gap-2">
                                                <role.icon className={`h-3 w-3 ${role.color}`} />
                                                {role.label}
                                              </div>
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    ) : (
                                      <div className="flex items-center gap-1">
                                        <role.icon className={`h-4 w-4 ${role.color}`} />
                                        <Badge variant="outline">{role.label}</Badge>
                                      </div>
                                    )}
                                    
                                    {canManageTeam() && !isCurrentUser && member.role !== 'owner' && (
                                      <AlertDialog>
                                        <AlertDialogTrigger asChild>
                                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-700 h-8 w-8 p-0">
                                            <UserX className="h-4 w-4" />
                                          </Button>
                                        </AlertDialogTrigger>
                                        <AlertDialogContent>
                                          <AlertDialogHeader>
                                            <AlertDialogTitle>Rimuovi Membro</AlertDialogTitle>
                                            <AlertDialogDescription>
                                              Sei sicuro di voler rimuovere {member.user?.email || 'questo utente'} dal team? 
                                              Questa azione non può essere annullata.
                                            </AlertDialogDescription>
                                          </AlertDialogHeader>
                                          <AlertDialogFooter>
                                            <AlertDialogCancel>Annulla</AlertDialogCancel>
                                            <AlertDialogAction 
                                              onClick={() => handleRemoveMember(member.id, member.user?.email || 'utente')}
                                              className="bg-red-600 hover:bg-red-700"
                                            >
                                              Rimuovi
                                            </AlertDialogAction>
                                          </AlertDialogFooter>
                                        </AlertDialogContent>
                                      </AlertDialog>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </ScrollArea>
            </TabsContent>

            <TabsContent value="settings" className="space-y-4 h-full">
              <ScrollArea className="h-[400px] w-full rounded-md border p-4">
                <div className="space-y-6">
                  {/* Danger Zone - Only for Owner */}
                  {currentUserRole === 'owner' && (
                    <Card className="border-red-200 dark:border-red-800">
                      <CardHeader>
                        <CardTitle className="text-sm text-red-600 flex items-center gap-2">
                          <AlertTriangle className="h-4 w-4" />
                          Zona Pericolosa
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-2">
                          <h5 className="text-sm font-medium">Elimina Team</h5>
                          <p className="text-xs text-muted-foreground">
                            Eliminando il team, tutti i membri verranno rimossi e i diagrammi associati 
                            diventeranno privati. Questa azione non può essere annullata.
                          </p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="destructive" size="sm" className="mt-2">
                                <Trash2 className="h-4 w-4 mr-2" />
                                Elimina Team
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Elimina Team</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler eliminare il team "{team.name}"? 
                                  Questa azione eliminerà definitivamente il team e rimuoverà tutti i membri.
                                  I diagrammi associati diventeranno privati.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Annulla</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={handleDeleteTeam}
                                  className="bg-red-600 hover:bg-red-700"
                                >
                                  Elimina Definitivamente
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Leave Team - For non-owners */}
                  {currentUserRole !== 'owner' && (
                    <Card className="border-yellow-200 dark:border-yellow-800">
                      <CardHeader>
                        <CardTitle className="text-sm text-yellow-600 flex items-center gap-2">
                          <UserX className="h-4 w-4" />
                          Abbandona Team
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <p className="text-xs text-muted-foreground">
                            Abbandonando il team perderai l'accesso a tutti i diagrammi condivisi.
                          </p>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm" className="text-yellow-600 border-yellow-200">
                                <UserX className="h-4 w-4 mr-2" />
                                Abbandona Team
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Abbandona Team</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Sei sicuro di voler abbandonare il team "{team.name}"? 
                                  Perderai l'accesso a tutti i diagrammi condivisi del team.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Rimani</AlertDialogCancel>
                                <AlertDialogAction 
                                  onClick={() => user && handleRemoveMember(
                                    members.find(m => m.user_id === user.id)?.id || '',
                                    user.email || 'tu'
                                  )}
                                  className="bg-yellow-600 hover:bg-yellow-700"
                                >
                                  Abbandona
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Permissions Summary */}
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-sm">I Tuoi Permessi</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2 text-xs">
                        {(() => {
                          const role = getRoleConfig(currentUserRole);
                          return (
                            <>
                              <div className="flex justify-between">
                                <span>Visualizzare diagrammi:</span>
                                <span className={role.canView ? 'text-green-600' : 'text-red-600'}>
                                  {role.canView ? '✅ Sì' : '❌ No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Modificare diagrammi:</span>
                                <span className={role.canEdit ? 'text-green-600' : 'text-red-600'}>
                                  {role.canEdit ? '✅ Sì' : '❌ No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Invitare membri:</span>
                                <span className={role.canInvite ? 'text-green-600' : 'text-red-600'}>
                                  {role.canInvite ? '✅ Sì' : '❌ No'}
                                </span>
                              </div>
                              <div className="flex justify-between">
                                <span>Gestire team:</span>
                                <span className={role.canManage ? 'text-green-600' : 'text-red-600'}>
                                  {role.canManage ? '✅ Sì' : '❌ No'}
                                </span>
                              </div>
                            </>
                          );
                        })()}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </ScrollArea>
            </TabsContent>
          </div>
        </Tabs>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};