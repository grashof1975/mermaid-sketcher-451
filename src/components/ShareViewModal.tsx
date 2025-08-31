import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Users, Mail, MessageSquare, Eye, Edit3, AlertCircle, Send, UserPlus, Share } from 'lucide-react';
import { db, supabase } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';

interface ShareViewModalProps {
  isOpen: boolean;
  onClose: () => void;
  viewId: string;
  viewName: string;
  currentUserName?: string;
  onShareSent?: (shareData: any) => void;
}

const PERMISSION_LEVELS = [
  {
    value: 'viewer',
    label: 'Visualizzatore',
    icon: Eye,
    description: 'Può solo visualizzare la vista',
    color: 'text-gray-600'
  },
  {
    value: 'commenter',
    label: 'Commentatore',
    icon: MessageSquare,
    description: 'Può visualizzare e commentare la vista',
    color: 'text-blue-600'
  },
  {
    value: 'editor',
    label: 'Editor',
    icon: Edit3,
    description: 'Può modificare la vista e i commenti',
    color: 'text-green-600'
  }
];

const EXPIRES_OPTIONS = [
  { value: '1', label: '1 giorno' },
  { value: '3', label: '3 giorni' },
  { value: '7', label: '1 settimana' },
  { value: '14', label: '2 settimane' },
  { value: '30', label: '1 mese' },
  { value: 'never', label: 'Mai' }
];

export const ShareViewModal: React.FC<ShareViewModalProps> = ({
  isOpen,
  onClose,
  viewId,
  viewName,
  currentUserName,
  onShareSent
}) => {
  const { user } = useAuth();
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('viewer');
  const [message, setMessage] = useState('');
  const [expiresIn, setExpiresIn] = useState('7');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'form' | 'preview' | 'success'>('form');

  const handleSubmit = async () => {
    if (!user || !email.trim()) {
      toast.error('Email è richiesta');
      return;
    }

    setIsLoading(true);
    
    try {
      // 1. Verifica che l'utente destinatario esista
      const { data: recipientProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('email', email.trim())
        .single();

      if (profileError || !recipientProfile) {
        toast.error('Utente non trovato. Verifica che l\'email sia corretta e che l\'utente sia registrato.');
        return;
      }

      // 2. Verifica che la vista esista e appartenga all'utente corrente
      const { data: viewData, error: viewError } = await supabase
        .from('saved_views')
        .select('id, name, user_id')
        .eq('id', viewId)
        .eq('user_id', user.id)
        .single();

      if (viewError || !viewData) {
        toast.error('Vista non trovata o non hai i permessi per condividerla.');
        return;
      }

      // 3. Controlla se l'utente è già stato invitato per questa vista
      const { data: existingShare } = await supabase
        .from('saved_views_shares')
        .select('id, status')
        .eq('saved_view_id', viewId)
        .eq('shared_with_id', recipientProfile.id)
        .single();

      if (existingShare) {
        if (existingShare.status === 'pending') {
          toast.error('Invito già inviato a questo utente per questa vista.');
        } else if (existingShare.status === 'accepted') {
          toast.error('Vista già condivisa con questo utente.');
        }
        return;
      }

      // 4. Calcola data di scadenza
      const expiresAt = expiresIn === 'never' 
        ? null 
        : new Date(Date.now() + parseInt(expiresIn) * 24 * 60 * 60 * 1000).toISOString();

      // 5. Crea record di condivisione
      const { error: shareError } = await supabase
        .from('saved_views_shares')
        .insert({
          saved_view_id: viewId,
          owner_id: user.id,
          shared_with_id: recipientProfile.id,
          permission_level: permission,
          invited_by: user.id,
          invitation_message: message.trim() || null,
          expires_at: expiresAt,
          status: 'pending'
        });

      if (shareError) {
        console.error('Error creating view share:', shareError);
        toast.error('Errore durante la creazione della condivisione.');
        return;
      }

      // 6. Successo
      toast.success(`Vista "${viewName}" condivisa con ${recipientProfile.username || email}`);
      setStep('success');
      
      if (onShareSent) {
        onShareSent({
          viewId,
          email: email.trim(),
          permission,
          message: message.trim() || undefined,
          expiresAt,
          recipientId: recipientProfile.id,
          recipientUsername: recipientProfile.username
        });
      }

    } catch (error) {
      console.error('Error sharing view:', error);
      toast.error('Errore durante la condivisione della vista');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setStep('form');
    setEmail('');
    setMessage('');
    setPermission('viewer');
    setExpiresIn('7');
    onClose();
  };

  const selectedPermission = PERMISSION_LEVELS.find(p => p.value === permission);
  const selectedIcon = selectedPermission?.icon || Eye;

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Share className="h-5 w-5 text-blue-600" />
            Condividi Vista
          </DialogTitle>
          <DialogDescription>
            Condividi "{viewName}" con altri utenti
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <div className="space-y-6">
            {/* Email Input */}
            <div className="space-y-2">
              <Label htmlFor="email">Email destinatario</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="utente@esempio.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            {/* Permission Level */}
            <div className="space-y-3">
              <Label>Livello di accesso</Label>
              <Select value={permission} onValueChange={setPermission}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {PERMISSION_LEVELS.map((level) => {
                    const IconComponent = level.icon;
                    return (
                      <SelectItem key={level.value} value={level.value}>
                        <div className="flex items-center gap-3">
                          <IconComponent className={`h-4 w-4 ${level.color}`} />
                          <div>
                            <div className="font-medium">{level.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {level.description}
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Expiry */}
            <div className="space-y-2">
              <Label htmlFor="expires">Scadenza invito</Label>
              <Select value={expiresIn} onValueChange={setExpiresIn}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {EXPIRES_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Optional Message */}
            <div className="space-y-2">
              <Label htmlFor="message">Messaggio personalizzato (opzionale)</Label>
              <Textarea
                id="message"
                placeholder="Aggiungi un messaggio per il destinatario..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                rows={3}
              />
            </div>

            {/* Preview Card */}
            <Card className="bg-muted/30">
              <CardContent className="pt-4">
                <div className="text-sm text-muted-foreground mb-2">Anteprima invito:</div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    <span className="font-medium">{currentUserName || 'Tu'}</span>
                    <span className="text-muted-foreground">ti ha invitato a vedere</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Share className="h-4 w-4 text-blue-600" />
                    <span className="font-medium">Vista: {viewName}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    {React.createElement(selectedIcon, { 
                      className: `h-4 w-4 ${selectedPermission?.color || 'text-gray-600'}` 
                    })}
                    <span className="text-sm">come {selectedPermission?.label}</span>
                  </div>
                  {message.trim() && (
                    <div className="mt-3 p-2 bg-background rounded border-l-2 border-blue-500">
                      <div className="text-xs text-muted-foreground">Messaggio:</div>
                      <div className="text-sm">{message}</div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex gap-2 justify-end">
              <Button variant="outline" onClick={handleClose}>
                Annulla
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={!email.trim() || isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Invio...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" />
                    Invia Invito
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {step === 'success' && (
          <div className="text-center space-y-4">
            <div className="w-16 h-16 mx-auto bg-green-100 rounded-full flex items-center justify-center">
              <UserPlus className="w-8 h-8 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold">Invito Inviato!</h3>
              <p className="text-muted-foreground">
                L'invito è stato inviato a {email}
              </p>
            </div>
            <Button onClick={handleClose} className="w-full">
              Chiudi
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};