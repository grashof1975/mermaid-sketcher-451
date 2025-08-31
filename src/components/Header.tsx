import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Download, Moon, Sun, User, LogOut, Mail } from "lucide-react";
import { useAuth } from '@/contexts/AuthProvider';
import { AuthModal } from './AuthModal';
import { PendingInvitationsModal } from './PendingInvitationsModal';
import { TeamSelector } from './TeamSelector';
import { CreateTeamModal, Team } from './CreateTeamModal';
import { TeamManagementModal } from './TeamManagementModal';
import { db } from '@/utils/supabase';

interface UserTeam extends Team {
  user_role: string;
  member_count: number;
  diagram_count: number;
  is_personal: boolean;
}

interface HeaderProps {
  onExport: () => void;
  toggleTheme: () => void;
  isDarkMode: boolean;
  selectedTeam?: UserTeam | null;
  onTeamChange?: (team: UserTeam | null) => void;
  currentDiagramTitle?: string;
}

const Header: React.FC<HeaderProps> = ({
  onExport,
  toggleTheme,
  isDarkMode,
  selectedTeam,
  onTeamChange,
  currentDiagramTitle
}) => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [showInvitationsModal, setShowInvitationsModal] = useState(false);
  const [showCreateTeamModal, setShowCreateTeamModal] = useState(false);
  const [showTeamManagementModal, setShowTeamManagementModal] = useState(false);
  const [managingTeam, setManagingTeam] = useState<UserTeam | null>(null);
  const [pendingInvitationsCount, setPendingInvitationsCount] = useState(0);
  const { user, signOut, loading } = useAuth();

  const handleSignOut = async () => {
    await signOut();
  };

  const loadPendingInvitationsCount = async () => {
    if (!user) return;
    
    try {
      const invitations = await db.diagramShares.getPendingInvitations(user.id);
      setPendingInvitationsCount(invitations.length);
    } catch (error) {
      console.error('Error loading pending invitations count:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadPendingInvitationsCount();
      
      // Poll for new invitations every 30 seconds
      const interval = setInterval(loadPendingInvitationsCount, 30000);
      return () => clearInterval(interval);
    } else {
      setPendingInvitationsCount(0);
    }
  }, [user]);

  const handleCreateTeam = (team: Team) => {
    // Convert Team to UserTeam format
    const userTeam: UserTeam = {
      ...team,
      user_role: 'owner',
      member_count: 1,
      diagram_count: 0,
      is_personal: team.name.includes('Personal Team')
    };
    
    if (onTeamChange) {
      onTeamChange(userTeam);
    }
    setShowCreateTeamModal(false);
  };

  const handleManageTeam = (team: UserTeam) => {
    setManagingTeam(team);
    setShowTeamManagementModal(true);
  };

  const handleTeamUpdated = (updatedTeam: Team) => {
    if (selectedTeam && selectedTeam.id === updatedTeam.id && onTeamChange) {
      const userTeam: UserTeam = {
        ...updatedTeam,
        user_role: selectedTeam.user_role,
        member_count: selectedTeam.member_count,
        diagram_count: selectedTeam.diagram_count,
        is_personal: selectedTeam.is_personal
      };
      onTeamChange(userTeam);
    }
  };

  const handleTeamDeleted = (teamId: string) => {
    if (selectedTeam && selectedTeam.id === teamId && onTeamChange) {
      onTeamChange(null);
    }
    setShowTeamManagementModal(false);
  };

  return (
    <>
      <header className="w-full py-4 px-6 border-b border-slate-200/80 dark:border-slate-800/80 backdrop-blur-sm bg-white/50 dark:bg-black/30 animate-fade-in">
        <div className="container max-w-full flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="h-8 w-8 rounded-lg bg-primary text-primary-foreground flex items-center justify-center font-semibold">M</div>
            <div className="flex flex-col">
              <h1 className="text-xl font-medium">AI Diagram creator</h1>
              {currentDiagramTitle && (
                <span className="text-sm text-muted-foreground">
                  {currentDiagramTitle}
                </span>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="text-xs px-2 py-1 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">Beta</div>
              <div className="text-xs px-2 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400">Database Enabled</div>
              <div className="text-xs px-2 py-1 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400">Team Mode</div>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            {/* Team Selector - only shown when logged in */}
            {user && onTeamChange && (
              <TeamSelector
                selectedTeam={selectedTeam}
                onTeamChange={onTeamChange}
                onCreateTeam={() => setShowCreateTeamModal(true)}
                onManageTeam={handleManageTeam}
              />
            )}

            <Button variant="outline" size="sm" className="glass-button" onClick={toggleTheme}>
              {isDarkMode ? <Sun size={16} /> : <Moon size={16} />}
            </Button>
            
            {/* Pending Invitations Button - only shown when logged in */}
            {user && (
              <Button 
                variant="outline" 
                size="sm" 
                className="glass-button relative" 
                onClick={() => setShowInvitationsModal(true)}
              >
                <Mail size={16} />
                {pendingInvitationsCount > 0 && (
                  <Badge 
                    className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs bg-red-500 hover:bg-red-500"
                    variant="destructive"
                  >
                    {pendingInvitationsCount > 9 ? '9+' : pendingInvitationsCount}
                  </Badge>
                )}
              </Button>
            )}
            
            <Button variant="outline" size="sm" className="glass-button" onClick={onExport}>
              <Download size={16} className="mr-2" />
              Export
            </Button>
            
            {/* Auth Section */}
            {loading ? (
              <div className="h-9 w-20 bg-muted animate-pulse rounded-md" />
            ) : user ? (
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 px-3 py-1 bg-accent/50 rounded-md">
                  <User size={14} />
                  <span className="text-sm max-w-32 truncate">{user.email}</span>
                </div>
                <Button 
                  onClick={handleSignOut} 
                  variant="outline" 
                  size="sm" 
                  className="glass-button"
                >
                  <LogOut size={16} />
                </Button>
              </div>
            ) : (
              <Button 
                onClick={() => setShowAuthModal(true)} 
                variant="outline" 
                size="sm"
                className="glass-button"
              >
                <User size={16} className="mr-2" />
                Accedi
              </Button>
            )}
          </div>
        </div>
      </header>

      <AuthModal 
        isOpen={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      <PendingInvitationsModal
        isOpen={showInvitationsModal}
        onClose={() => setShowInvitationsModal(false)}
        onInvitationAccepted={() => {
          // Refresh invitations count when an invitation is accepted
          loadPendingInvitationsCount();
          // Here you could also trigger a diagram list refresh if needed
        }}
      />
      
      <CreateTeamModal
        open={showCreateTeamModal}
        onClose={() => setShowCreateTeamModal(false)}
        onTeamCreated={handleCreateTeam}
      />
      
      {managingTeam && (
        <TeamManagementModal
          team={managingTeam}
          open={showTeamManagementModal}
          onClose={() => setShowTeamManagementModal(false)}
          onTeamUpdated={handleTeamUpdated}
          onTeamDeleted={handleTeamDeleted}
        />
      )}
    </>
  );
};
export default Header;