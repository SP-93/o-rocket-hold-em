import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Users, Coins, Clock, ArrowLeft, ChevronRight, Loader2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Tournament {
  id: string;
  name: string;
  status: 'registering' | 'running' | 'finished' | 'cancelled';
  tournament_type: string;
  max_players: number;
  entry_chips: number;
  entry_wover_value: number;
  starting_stack: number;
  prize_pool: number;
  player_count: number;
  created_at: string;
}

export default function Tournaments() {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'registering' | 'running' | 'finished'>('all');

  useEffect(() => {
    fetchTournaments();

    const channel = supabase
      .channel('tournaments-page')
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
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      return;
    }

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

  const filteredTournaments = tournaments.filter((t) => {
    if (filter === 'all') return true;
    return t.status === filter;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'registering':
        return 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30';
      case 'running':
        return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
      case 'finished':
        return 'bg-muted text-muted-foreground';
      case 'cancelled':
        return 'bg-destructive/20 text-destructive border-destructive/30';
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

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <Button asChild variant="ghost" size="sm" className="gap-2 mb-6">
          <Link to="/lobby">
            <ArrowLeft className="h-4 w-4" />
            {t('common.back')}
          </Link>
        </Button>

        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <h1 className="font-display text-3xl md:text-4xl font-bold mb-2 flex items-center gap-3">
              <Trophy className="h-8 w-8 text-primary" />
              {t('tournaments.title')}
            </h1>
            <p className="text-muted-foreground">
              {t('tournaments.subtitle')}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
          {(['all', 'registering', 'running', 'finished'] as const).map((status) => (
            <Button
              key={status}
              variant={filter === status ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilter(status)}
            >
              {status === 'all' ? t('common.all') : t(`tournaments.${status}`)}
            </Button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : filteredTournaments.length > 0 ? (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((tournament) => (
              <Link key={tournament.id} to={`/tournament/${tournament.id}`}>
                <Card className="bg-card/50 border-border/50 hover:border-primary/50 transition-all group h-full">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <h3 className="font-display text-lg font-bold group-hover:text-primary transition-colors">
                          {tournament.name}
                        </h3>
                        <div className="flex items-center gap-2 mt-2">
                          <Badge variant="outline" className="text-xs">
                            {getTypeLabel(tournament.tournament_type)}
                          </Badge>
                          <Badge className={`text-xs ${getStatusColor(tournament.status)}`}>
                            {t(`tournaments.${tournament.status}`)}
                          </Badge>
                        </div>
                      </div>
                      <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Users className="h-4 w-4" />
                          {t('tournaments.players')}
                        </span>
                        <span className="font-medium">
                          {tournament.player_count}/{tournament.max_players}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Coins className="h-4 w-4" />
                          {t('tournaments.buyIn')}
                        </span>
                        <span className="font-medium">
                          {tournament.entry_chips.toLocaleString()} chips
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Trophy className="h-4 w-4 text-amber-400" />
                          {t('tournaments.prizePool')}
                        </span>
                        <span className="font-bold text-amber-400">
                          {(tournament.prize_pool || 0).toLocaleString()} WOVER
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <span className="flex items-center gap-2 text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {t('tournaments.startingStack')}
                        </span>
                        <span className="font-medium">
                          {tournament.starting_stack.toLocaleString()}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        ) : (
          <div className="text-center py-16">
            <Trophy className="h-16 w-16 text-muted-foreground/50 mx-auto mb-4" />
            <p className="text-muted-foreground text-lg">
              {t('tournaments.noTournaments')}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}