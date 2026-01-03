import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Coins, Clock, ChevronRight } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Tournament {
  id: string;
  name: string;
  status: 'registering' | 'running' | 'finished' | 'cancelled';
  tournament_type: string;
  max_players: number;
  entry_chips: number;
  starting_stack: number;
  prize_pool: number;
  player_count: number;
}

export function TournamentsList() {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchTournaments();

    const channel = supabase
      .channel('tournaments-list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tournaments' }, fetchTournaments)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchTournaments = async () => {
    const { data: tournamentsData, error } = await supabase
      .from('tournaments')
      .select('*')
      .in('status', ['registering', 'running'])
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return;
    }

    // Get player counts
    const tournamentsWithCounts = await Promise.all(
      (tournamentsData || []).map(async (tournament) => {
        const { count } = await supabase
          .from('tournament_registrations')
          .select('*', { count: 'exact', head: true })
          .eq('tournament_id', tournament.id);

        return {
          ...tournament,
          player_count: count || 0,
        };
      })
    );

    setTournaments(tournamentsWithCounts);
    setLoading(false);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registering':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'running':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'sit_and_go':
        return 'Sit & Go';
      case 'heads_up':
        return 'Heads Up';
      case 'winner_takes_all':
        return 'Winner Takes All';
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {t('tournaments.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-3">
            <div className="h-16 bg-muted rounded" />
            <div className="h-16 bg-muted rounded" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (tournaments.length === 0) {
    return (
      <Card className="bg-card/50 border-border/50">
        <CardHeader className="pb-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-primary" />
            {t('tournaments.title')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-sm text-center py-4">
            {t('tournaments.noTournaments')}
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-card/50 border-border/50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-primary" />
          {t('tournaments.title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {tournaments.slice(0, 3).map((tournament) => (
          <Link
            key={tournament.id}
            to={`/tournament/${tournament.id}`}
            className="block"
          >
            <div className="p-3 rounded-lg bg-background/50 border border-border/30 hover:border-primary/50 transition-colors group">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <h4 className="font-medium group-hover:text-primary transition-colors">
                    {tournament.name}
                  </h4>
                  <div className="flex items-center gap-2 mt-1">
                    <Badge variant="outline" className="text-xs">
                      {getTypeLabel(tournament.tournament_type)}
                    </Badge>
                    <Badge className={`text-xs ${getStatusColor(tournament.status)}`}>
                      {tournament.status === 'registering' ? t('tournaments.registering') : t('tournaments.running')}
                    </Badge>
                  </div>
                </div>
                <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
              </div>

              <div className="flex items-center gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1">
                  <Users className="h-3 w-3" />
                  {tournament.player_count}/{tournament.max_players}
                </span>
                <span className="flex items-center gap-1">
                  <Coins className="h-3 w-3" />
                  {tournament.entry_chips.toLocaleString()}
                </span>
                <span className="flex items-center gap-1">
                  <Trophy className="h-3 w-3 text-amber-400" />
                  {(tournament.prize_pool || 0).toLocaleString()}
                </span>
              </div>
            </div>
          </Link>
        ))}

        {tournaments.length > 3 && (
          <Button variant="ghost" className="w-full text-sm" asChild>
            <Link to="/tournaments">
              {t('tournaments.viewAll')} ({tournaments.length})
              <ChevronRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        )}
      </CardContent>
    </Card>
  );
}