import React from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { Eye, Calendar } from 'lucide-react';

interface View {
  id: string;
  name: string;
  zoom_level?: number;
  created_at: string;
}

interface DiagramViewsTooltipProps {
  views: View[];
  children: React.ReactNode;
}

export const DiagramViewsTooltip: React.FC<DiagramViewsTooltipProps> = ({
  views,
  children
}) => {
  if (views.length === 0) {
    return <>{children}</>;
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('it-IT', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatZoom = (zoom?: number) => {
    if (!zoom) return '';
    return `${Math.round(zoom * 100)}%`;
  };

  return (
    <TooltipProvider>
      <Tooltip delayDuration={500}>
        <TooltipTrigger asChild>
          {children}
        </TooltipTrigger>
        <TooltipContent 
          side="bottom" 
          className="max-w-sm p-3"
          sideOffset={5}
          align="end"
          alignOffset={10}
        >
          <div className="space-y-2">
            <div className="flex items-center gap-2 font-medium text-sm">
              <Eye className="h-4 w-4 text-primary" />
              <span>Viste Salvate ({views.length})</span>
            </div>
            
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {views.slice(0, 8).map(view => (
                <div 
                  key={view.id}
                  className="flex items-center justify-between gap-2 p-2 bg-accent/20 rounded border"
                >
                  <div className="min-w-0 flex-1">
                    <div className="font-medium text-xs truncate" title={view.name}>
                      {view.name}
                    </div>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      <Calendar className="h-3 w-3" />
                      <span>{formatDate(view.created_at)}</span>
                    </div>
                  </div>
                  
                  {view.zoom_level && (
                    <Badge variant="outline" className="text-xs h-5">
                      {formatZoom(view.zoom_level)}
                    </Badge>
                  )}
                </div>
              ))}
              
              {views.length > 8 && (
                <div className="text-center text-xs text-muted-foreground py-1">
                  ...e {views.length - 8} altre viste
                </div>
              )}
            </div>
            
            <div className="text-xs text-muted-foreground border-t pt-2">
              Vai al tab "Viste" per gestire le viste salvate
            </div>
          </div>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
};