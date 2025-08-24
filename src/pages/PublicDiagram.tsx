import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { SafeMermaidRenderer } from '@/components/SafeMermaidRenderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Eye, Calendar, User, ArrowLeft, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { db } from '@/utils/supabase';

interface PublicDiagramData {
  diagram: {
    id: string;
    title: string;
    mermaid_code: string;
    description?: string;
    created_at: string;
    updated_at: string;
  };
  owner: {
    id: string;
    username: string;
    avatar_url?: string;
  };
  stats: {
    view_count: number;
    unique_visitors: number;
  };
  access_info: {
    can_comment: boolean;
    password_required: boolean;
  };
}

const PublicDiagram: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [diagramData, setDiagramData] = useState<PublicDiagramData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPublicDiagram = async () => {
      if (!token) {
        setError('Token mancante nell\'URL');
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        
        // Decode URL-encoded token
        const decodedToken = decodeURIComponent(token);
        
        // Real API call to fetch public diagram
        const publicLinkData = await db.publicShareLinks.getByToken(decodedToken);
        
        if (!publicLinkData || !publicLinkData.is_active) {
          setError('Link non più disponibile o scaduto');
          setLoading(false);
          return;
        }

        // Check expiration
        if (publicLinkData.expires_at && new Date(publicLinkData.expires_at) < new Date()) {
          setError('Questo link è scaduto');
          setLoading(false);
          return;
        }

        // Increment view count
        await db.publicShareLinks.incrementViewCount(publicLinkData.id, {});

        // Transform data for component
        const transformedData: PublicDiagramData = {
          diagram: {
            id: publicLinkData.diagrams.id,
            title: publicLinkData.diagrams.title,
            mermaid_code: publicLinkData.diagrams.mermaid_code,
            description: publicLinkData.diagrams.description,
            created_at: publicLinkData.diagrams.created_at,
            updated_at: publicLinkData.diagrams.updated_at
          },
          owner: {
            id: publicLinkData.created_by,
            username: publicLinkData.profiles?.username || 'Utente Anonimo',
            avatar_url: publicLinkData.profiles?.avatar_url
          },
          stats: {
            view_count: publicLinkData.view_count || 0,
            unique_visitors: Array.isArray(publicLinkData.unique_visitors) ? publicLinkData.unique_visitors.length : 0
          },
          access_info: {
            can_comment: publicLinkData.allow_comments,
            password_required: publicLinkData.password_protected
          }
        };

        setDiagramData(transformedData);
        setLoading(false);
        
      } catch (err) {
        console.error('Error fetching public diagram:', err);
        setError('Errore nel caricamento del diagramma');
        setLoading(false);
      }
    };

    fetchPublicDiagram();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="text-gray-600">Caricamento diagramma...</p>
        </div>
      </div>
    );
  }

  if (error || !diagramData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="max-w-md w-full">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 h-12 w-12 bg-red-100 rounded-full flex items-center justify-center">
              <ExternalLink className="h-6 w-6 text-red-600" />
            </div>
            <CardTitle className="text-red-600">Diagramma Non Disponibile</CardTitle>
            <CardDescription>
              {error || 'Il link potrebbe essere scaduto o non più valido.'}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button 
              onClick={() => navigate('/')} 
              className="w-full"
              variant="outline"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Torna alla Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => navigate('/')}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Home
              </Button>
              <div className="h-6 w-px bg-gray-300"></div>
              <Badge variant="secondary" className="text-xs">
                Visualizzazione Pubblica
              </Badge>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2 text-sm text-gray-600">
                <Eye className="h-4 w-4" />
                <span>{diagramData.stats.view_count} visualizzazioni</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto p-4 space-y-6">
        {/* Diagram Info */}
        <Card>
          <CardHeader>
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <CardTitle className="text-2xl">{diagramData.diagram.title}</CardTitle>
                {diagramData.diagram.description && (
                  <CardDescription className="text-base">
                    {diagramData.diagram.description}
                  </CardDescription>
                )}
              </div>
            </div>
            
            {/* Owner Info */}
            <div className="flex items-center space-x-3 pt-4 border-t">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="text-xs">
                  {diagramData.owner.username.charAt(0).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="text-sm">
                <p className="font-medium text-gray-900">
                  Creato da {diagramData.owner.username}
                </p>
                <div className="flex items-center space-x-4 text-gray-500">
                  <span className="flex items-center">
                    <Calendar className="h-3 w-3 mr-1" />
                    {new Date(diagramData.diagram.created_at).toLocaleDateString('it-IT')}
                  </span>
                  <span className="flex items-center">
                    <User className="h-3 w-3 mr-1" />
                    {diagramData.stats.unique_visitors} visitatori unici
                  </span>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Diagram Renderer */}
        <Card>
          <CardContent className="p-6">
            <div className="w-full">
              <SafeMermaidRenderer 
                code={diagramData.diagram.mermaid_code}
                className="w-full min-h-[400px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Comments Section (if enabled) */}
        {diagramData.access_info.can_comment && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Commenti</CardTitle>
              <CardDescription>
                I commenti sono abilitati per questo diagramma pubblico
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-500 text-center py-8">
                Sistema commenti pubblici sarà implementato in Phase 3
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
};

export default PublicDiagram;