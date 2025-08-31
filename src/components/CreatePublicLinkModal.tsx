import React, { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Link, Lock, MessageSquare, Users, Calendar, Copy, Check, Eye, Globe } from 'lucide-react';
import { db } from '@/utils/supabase';
import { useAuth } from '@/contexts/AuthProvider';
import { toast } from 'sonner';

interface CreatePublicLinkModalProps {
  isOpen: boolean;
  onClose: () => void;
  diagramId: string;
  diagramTitle: string;
  onLinkCreated?: (linkData: any) => void;
}

const EXPIRY_OPTIONS = [
  { value: 'never', label: 'Mai' },
  { value: '1', label: '1 giorno' },
  { value: '7', label: '1 settimana' },
  { value: '30', label: '1 mese' },
  { value: '90', label: '3 mesi' },
  { value: '365', label: '1 anno' }
];

export const CreatePublicLinkModal: React.FC<CreatePublicLinkModalProps> = ({
  isOpen,
  onClose,
  diagramId,
  diagramTitle,
  onLinkCreated
}) => {
  const { user } = useAuth();
  const [allowComments, setAllowComments] = useState(false);
  const [passwordProtected, setPasswordProtected] = useState(false);
  const [accessPassword, setAccessPassword] = useState('');
  const [expiryDays, setExpiryDays] = useState('never');
  const [isLoading, setIsLoading] = useState(false);
  const [createdLink, setCreatedLink] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

  const generatePublicLink = async () => {
    setIsLoading(true);
    try {
      const expiresAt = expiryDays === 'never' 
        ? null 
        : new Date(Date.now() + parseInt(expiryDays) * 24 * 60 * 60 * 1000).toISOString();

      const linkData = {
        diagram_id: diagramId,
        allow_comments: allowComments,
        password_protected: passwordProtected,
        access_password: passwordProtected ? accessPassword : null,
        expires_at: expiresAt,
        is_active: true
      };

      // Add user ID to linkData
      const linkDataWithUser = {
        ...linkData,
        shared_by: user.id  // Changed from created_by to shared_by
      };
      
      console.log('Creating public link:', linkDataWithUser);
      
      // Real API call to Supabase
      const createdLinkData = await db.publicShareLinks.create(linkDataWithUser);
      
      const publicUrl = `${window.location.origin}/public/${createdLinkData.share_token}`;
      
      setCreatedLink(publicUrl);
      
      if (onLinkCreated) {
        onLinkCreated({
          ...createdLinkData,
          public_url: publicUrl
        });
      }

      toast.success('Link pubblico creato con successo!');
      
    } catch (error) {
      console.error('Error creating public link:', error);
      toast.error('Errore nella creazione del link pubblico');
    } finally {
      setIsLoading(false);
    }
  };

  const copyLinkToClipboard = async () => {
    if (createdLink) {
      await navigator.clipboard.writeText(createdLink);
      setLinkCopied(true);
      setTimeout(() => setLinkCopied(false), 2000);
    }
  };

  const handleClose = () => {
    setAllowComments(false);
    setPasswordProtected(false);
    setAccessPassword('');
    setExpiryDays('never');
    setCreatedLink(null);
    setLinkCopied(false);
    onClose();
  };

  const getExpiryLabel = () => {
    return EXPIRY_OPTIONS.find(o => o.value === expiryDays)?.label || 'Mai';
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Globe className="h-5 w-5" />
            Crea Link Pubblico
          </DialogTitle>
          <DialogDescription>
            Crea un link per condividere "{diagramTitle}" pubblicamente
          </DialogDescription>
        </DialogHeader>

        {!createdLink ? (
          <div className="space-y-6 mt-4">
            {/* Configuration Options */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Consenti Commenti</Label>
                  <div className="text-xs text-muted-foreground">
                    Gli utenti non registrati potranno aggiungere commenti
                  </div>
                </div>
                <Switch
                  checked={allowComments}
                  onCheckedChange={setAllowComments}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <Label className="text-sm font-medium">Protetto da Password</Label>
                  <div className="text-xs text-muted-foreground">
                    Richiedi una password per accedere
                  </div>
                </div>
                <Switch
                  checked={passwordProtected}
                  onCheckedChange={setPasswordProtected}
                />
              </div>

              {passwordProtected && (
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-sm font-medium">
                    Password di Accesso
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="password"
                      type="password"
                      placeholder="Inserisci password..."
                      value={accessPassword}
                      onChange={(e) => setAccessPassword(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}

              <div className="space-y-2">
                <Label className="text-sm font-medium">Scadenza</Label>
                <Select value={expiryDays} onValueChange={setExpiryDays}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Preview */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Anteprima Accesso
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="text-xs space-y-1">
                  <div className="flex items-center gap-2">
                    <Globe className="h-3 w-3 text-green-500" />
                    <span>Link pubblico - chiunque può accedere</span>
                  </div>
                  {allowComments && (
                    <div className="flex items-center gap-2">
                      <MessageSquare className="h-3 w-3 text-blue-500" />
                      <span>Commenti abilitati per tutti</span>
                    </div>
                  )}
                  {passwordProtected && (
                    <div className="flex items-center gap-2">
                      <Lock className="h-3 w-3 text-orange-500" />
                      <span>Protetto da password</span>
                    </div>
                  )}
                  {expiryDays !== 'never' && (
                    <div className="flex items-center gap-2">
                      <Calendar className="h-3 w-3 text-purple-500" />
                      <span>Scade tra {getExpiryLabel().toLowerCase()}</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                Potrai sempre revocare il link in seguito
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleClose} disabled={isLoading}>
                  Annulla
                </Button>
                <Button 
                  onClick={generatePublicLink}
                  disabled={isLoading || (passwordProtected && !accessPassword)}
                  className="min-w-[120px]"
                >
                  {isLoading ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Creazione...
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <Link className="h-4 w-4" />
                      Crea Link
                    </div>
                  )}
                </Button>
              </div>
            </div>
          </div>
        ) : (
          /* Link Created - Success State */
          <div className="space-y-6 mt-4">
            <div className="text-center space-y-2">
              <div className="w-16 h-16 mx-auto bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <Check className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-lg font-semibold">Link Pubblico Creato!</h3>
              <p className="text-sm text-muted-foreground">
                Il tuo diagramma è ora accessibile pubblicamente
              </p>
            </div>

            {/* Link Display */}
            <Card>
              <CardContent className="p-4">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <Label className="text-sm font-medium">Link Pubblico</Label>
                    <Badge variant="outline" className="text-xs">
                      {linkCopied ? 'Copiato!' : 'Clicca per copiare'}
                    </Badge>
                  </div>
                  
                  <div 
                    className="p-3 bg-accent/30 rounded border cursor-pointer hover:bg-accent/50 transition-colors"
                    onClick={copyLinkToClipboard}
                  >
                    <div className="flex items-center justify-between">
                      <div className="font-mono text-sm truncate mr-2">
                        {createdLink}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-6 w-6 p-0 flex-shrink-0"
                      >
                        {linkCopied ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                  </div>

                  {/* Configuration Summary */}
                  <div className="pt-2 border-t space-y-1 text-xs">
                    <div className="font-medium">Configurazione:</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-1">
                        <MessageSquare className="h-3 w-3" />
                        <span>Commenti: {allowComments ? 'Sì' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        <span>Password: {passwordProtected ? 'Sì' : 'No'}</span>
                      </div>
                      <div className="flex items-center gap-1 col-span-2">
                        <Calendar className="h-3 w-3" />
                        <span>Scadenza: {getExpiryLabel()}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <div className="flex items-center justify-between pt-4 border-t">
              <div className="text-xs text-muted-foreground">
                Puoi gestire tutti i link dal tab Condivisione
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  onClick={copyLinkToClipboard}
                  className="flex items-center gap-2"
                >
                  <Copy className="h-4 w-4" />
                  Copia Link
                </Button>
                <Button onClick={handleClose}>
                  Chiudi
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};