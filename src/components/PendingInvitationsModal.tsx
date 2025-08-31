import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthProvider';
import { db } from '@/utils/supabase';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Mail, Clock, CheckCircle, XCircle, Eye, Edit3, MessageSquare, User } from 'lucide-react';

interface PendingInvitation {
  id: string;
  permission_level: 'viewer' | 'commenter' | 'editor';
  invitation_message?: string;
  created_at: string;
  expires_at?: string;
  diagrams: {
    id: string;
    title: string;
    description?: string;
    user_id: string;
  };
  owner: {
    username: string;
    email: string;
    avatar_url?: string;
  };
  invited_by: {
    username: string;
    email: string;
    avatar_url?: string;
  };
}

interface PendingInvitationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInvitationAccepted?: () => void;
}

const PERMISSION_INFO = {
  viewer: {
    icon: Eye,
    label: 'Visualizzatore',
    color: 'text-gray-600',
    description: 'Può solo visualizzare il diagramma'
  },
  commenter: {
    icon: MessageSquare,
    label: 'Commentatore',
    color: 'text-blue-600',
    description: 'Può visualizzare e aggiungere commenti'
  },
  editor: {
    icon: Edit3,
    label: 'Editor',
    color: 'text-green-600',
    description: 'Può visualizzare, commentare e modificare'
  }
};

export const PendingInvitationsModal: React.FC<PendingInvitationsModalProps> = ({
  isOpen,
  onClose,
  onInvitationAccepted
}) => {
  const { user } = useAuth();
  const [invitations, setInvitations] = useState<PendingInvitation[]>([]);
  const [loading, setLoading] = useState(false);
  const [processingInvitation, setProcessingInvitation] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && user) {
      loadPendingInvitations();
    }
  }, [isOpen, user]);

  const loadPendingInvitations = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const pendingInvitations = await db.diagramShares.getPendingInvitations(user.id);
      setInvitations(pendingInvitations);
    } catch (error) {
      console.error('Error loading pending invitations:', error);
      toast.error('Errore nel caricamento degli inviti');
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationResponse = async (invitationId: string, action: 'accepted' | 'declined') => {
    console.log('🎯 DEBUG: handleInvitationResponse called', { invitationId, action });
    setProcessingInvitation(invitationId);
    
    try {
      console.log('📞 DEBUG: Calling respondToInvite...');
      await db.diagramShares.respondToInvite(invitationId, action);
      
      // Remove invitation from list
      console.log('🗑️ DEBUG: Removing invitation from list', invitationId);
      setInvitations(prev => {
        console.log('📋 DEBUG: Current invitations:', prev.length);
        const filtered = prev.filter(inv => inv.id !== invitationId);
        console.log('📋 DEBUG: After filtering:', filtered.length);
        return filtered;
      });
      
      const actionText = action === 'accepted' ? 'accettato' : 'rifiutato';
      toast.success(`Invito ${actionText} con successo`);
      
      if (action === 'accepted' && onInvitationAccepted) {
        onInvitationAccepted();
      }
    } catch (error) {
      console.error(`Error ${action} invitation:`, error);
      toast.error(`Errore nell'${action === 'accepted' ? 'accettare' : 'rifiutare'} l'invito`);
    } finally {
      setProcessingInvitation(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isExpired = (expiresAt?: string) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Inviti in Sospeso
          </DialogTitle>
          <DialogDescription>
            Gestisci gli inviti di collaborazione ricevuti per i diagrammi
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <div className="w-6 h-6 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
              <span className="ml-2">Caricamento inviti...</span>
            </div>
          ) : invitations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <div className="text-lg font-medium">Nessun invito in sospeso</div>
              <div className="text-sm">Gli inviti di collaborazione appariranno qui</div>
            </div>
          ) : (
            <ScrollArea className="max-h-96">
              <div className="space-y-3">
                {invitations.map((invitation) => {
                  const permission = PERMISSION_INFO[invitation.permission_level];
                  const PermissionIcon = permission.icon;
                  const expired = isExpired(invitation.expires_at);
                  
                  return (
                    <Card key={invitation.id} className={expired ? 'opacity-60' : ''}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div>"{invitation.diagrams.title}"</div>
                            {expired && (
                              <Badge variant="destructive" className="text-xs">
                                <Clock className="h-3 w-3 mr-1" />
                                Scaduto
                              </Badge>
                            )}
                          </div>
                          <div className="flex items-center gap-1">
                            <PermissionIcon className={`h-4 w-4 ${permission.color}`} />
                            <Badge variant="secondary" className="text-xs">
                              {permission.label}
                            </Badge>
                          </div>
                        </CardTitle>
                      </CardHeader>
                      
                      <CardContent className="space-y-3">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          <span>
                            Invitato da <strong>{invitation.invited_by.username}</strong>
                          </span>
                          <Separator orientation="vertical" className="h-4" />
                          <span>{formatDate(invitation.created_at)}</span>
                        </div>

                        {invitation.invitation_message && (
                          <div className="bg-blue-50 dark:bg-blue-950/30 p-3 rounded border-l-2 border-blue-200 dark:border-blue-800">
                            <div className="text-sm italic">
                              "{invitation.invitation_message}"
                            </div>
                          </div>
                        )}

                        <div className="text-xs text-muted-foreground">
                          <div>Permesso: {permission.description}</div>
                          {invitation.expires_at && !expired && (
                            <div>Scade il: {formatDate(invitation.expires_at)}</div>
                          )}
                        </div>

                        {!expired && (
                          <div className="flex gap-2 pt-2">
                            <Button
                              onClick={() => handleInvitationResponse(invitation.id, 'accepted')}
                              disabled={processingInvitation === invitation.id}
                              className="flex-1"
                              size="sm"
                            >
                              <CheckCircle className="h-4 w-4 mr-2" />
                              {processingInvitation === invitation.id ? 'Accettando...' : 'Accetta'}
                            </Button>
                            <Button
                              onClick={() => handleInvitationResponse(invitation.id, 'declined')}
                              disabled={processingInvitation === invitation.id}
                              variant="outline"
                              className="flex-1"
                              size="sm"
                            >
                              <XCircle className="h-4 w-4 mr-2" />
                              {processingInvitation === invitation.id ? 'Rifiutando...' : 'Rifiuta'}
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t">
          <Button variant="outline" onClick={onClose}>
            Chiudi
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};