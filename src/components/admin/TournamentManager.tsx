import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Trophy, 
  Plus, 
  Loader2, 
  RefreshCw, 
  Users,
  Coins,
  Clock,
  Play,
  XCircle
} from 'lucide-react';
import { toast } from 'sonner';
import type { Database } from '@/integrations/supabase/types';

type Tournament = Database['public']['Tables']['tournaments']['Row'];
type TournamentType = Database['public']['Enums']['tournament_type'];
type PayoutStructure = Database['public']['Enums']['payout_structure'];
type TournamentStatus = Database['public']['Enums']['tournament_status'];

interface TournamentManagerProps {
  adminWallet: string;
}

export function TournamentManager({ adminWallet }: TournamentManagerProps) {
  const { t } = useTranslation();
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form state
  const [name, setName] = useState('');
  const [tournamentType, setTournamentType] = useState<TournamentType>('sit_and_go');
  const [maxPlayers, setMaxPlayers] = useState(6);
  const [entryChips, setEntryChips] = useState(1000);
  const [entryWoverValue, setEntryWoverValue] = useState(10);
  const [startingStack, setStartingStack] = useState(5000);
  const [payoutStructure, setPayoutStructure] = useState<PayoutStructure>('top_3');

  const fetchTournaments = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('tournaments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching tournaments:', error);
      toast.error('Failed to load tournaments');
    } else {
      setTournaments(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      toast.error('Tournament name is required');
      return;
    }

    setIsCreating(true);

    // Default blind structure based on tournament type
    const blindStructure = [
      { level: 1, smallBlind: 25, bigBlind: 50, duration: 10 },
      { level: 2, smallBlind: 50, bigBlind: 100, duration: 10 },
      { level: 3, smallBlind: 75, bigBlind: 150, duration: 10 },
      { level: 4, smallBlind: 100, bigBlind: 200, duration: 10 },
      { level: 5, smallBlind: 150, bigBlind: 300, duration: 10 },
      { level: 6, smallBlind: 200, bigBlind: 400, duration: 10 },
      { level: 7, smallBlind: 300, bigBlind: 600, duration: 10 },
      { level: 8, smallBlind: 400, bigBlind: 800, duration: 10 },
    ];

    // Default payout percentages based on structure
    const payoutPercentages = payoutStructure === 'winner_takes_all' 
      ? { 1: 100 }
      : payoutStructure === 'top_2'
      ? { 1: 70, 2: 30 }
      : { 1: 50, 2: 30, 3: 20 };

    const { error } = await supabase.from('tournaments').insert({
      name: name.trim(),
      tournament_type: tournamentType,
      max_players: maxPlayers,
      entry_chips: entryChips,
      entry_wover_value: entryWoverValue,
      starting_stack: startingStack,
      payout_structure: payoutStructure,
      payout_percentages: payoutPercentages,
      blind_structure: blindStructure,
      created_by: adminWallet.toLowerCase(),
      status: 'registering' as TournamentStatus,
    });

    if (error) {
      console.error('Error creating tournament:', error);
      toast.error('Failed to create tournament');
    } else {
      toast.success('Tournament created!');
      setName('');
      fetchTournaments();
    }
    setIsCreating(false);
  };

  const handleStartTournament = async (tournamentId: string) => {
    const { error } = await supabase
      .from('tournaments')
      .update({ 
        status: 'running' as TournamentStatus,
        started_at: new Date().toISOString() 
      })
      .eq('id', tournamentId);

    if (error) {
      toast.error('Failed to start tournament');
    } else {
      toast.success('Tournament started!');
      fetchTournaments();
    }
  };

  const handleCancelTournament = async (tournamentId: string) => {
    if (!confirm('Are you sure you want to cancel this tournament?')) return;

    const { error } = await supabase
      .from('tournaments')
      .update({ status: 'cancelled' as TournamentStatus })
      .eq('id', tournamentId);

    if (error) {
      toast.error('Failed to cancel tournament');
    } else {
      toast.success('Tournament cancelled');
      fetchTournaments();
    }
  };

  const getStatusColor = (status: TournamentStatus | null) => {
    switch (status) {
      case 'registering': return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
      case 'running': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'finished': return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'cancelled': return 'bg-red-500/20 text-red-400 border-red-500/30';
      default: return '';
    }
  };

  return (
    <div className="space-y-6">
      {/* Create Tournament Form */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Plus className="h-4 w-4" />
            Create Tournament
          </CardTitle>
          <CardDescription>Set up a new poker tournament</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="tournamentName">Tournament Name</Label>
                <Input
                  id="tournamentName"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Weekend Championship..."
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label>Tournament Type</Label>
                <Select value={tournamentType} onValueChange={(v) => setTournamentType(v as TournamentType)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sit_and_go">Sit & Go</SelectItem>
                    <SelectItem value="heads_up">Heads Up</SelectItem>
                    <SelectItem value="winner_takes_all">Winner Takes All</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Payout Structure</Label>
                <Select value={payoutStructure} onValueChange={(v) => setPayoutStructure(v as PayoutStructure)}>
                  <SelectTrigger className="bg-background/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="winner_takes_all">Winner Takes All (100%)</SelectItem>
                    <SelectItem value="top_2">Top 2 (70/30)</SelectItem>
                    <SelectItem value="top_3">Top 3 (50/30/20)</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="maxPlayers">Max Players</Label>
                <Input
                  id="maxPlayers"
                  type="number"
                  min={2}
                  max={100}
                  value={maxPlayers}
                  onChange={(e) => setMaxPlayers(Number(e.target.value))}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="entryChips">Entry Fee (Chips)</Label>
                <Input
                  id="entryChips"
                  type="number"
                  min={100}
                  value={entryChips}
                  onChange={(e) => setEntryChips(Number(e.target.value))}
                  className="bg-background/50"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="startingStack">Starting Stack</Label>
                <Input
                  id="startingStack"
                  type="number"
                  min={1000}
                  value={startingStack}
                  onChange={(e) => setStartingStack(Number(e.target.value))}
                  className="bg-background/50"
                />
              </div>
            </div>

            <Button type="submit" disabled={isCreating}>
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Trophy className="h-4 w-4 mr-2" />
              )}
              Create Tournament
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Tournaments List */}
      <Card className="border-border/50 bg-card/50">
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle className="text-lg">All Tournaments</CardTitle>
            <CardDescription>{tournaments.length} tournaments</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchTournaments}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : tournaments.length === 0 ? (
            <p className="text-center text-muted-foreground py-8">No tournaments yet</p>
          ) : (
            <div className="space-y-3">
              {tournaments.map((tournament) => (
                <div
                  key={tournament.id}
                  className="p-4 rounded-lg bg-background/50 border border-border/30"
                >
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-poker-gold" />
                      <div>
                        <h4 className="font-semibold">{tournament.name}</h4>
                        <p className="text-xs text-muted-foreground">
                          {tournament.tournament_type.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    <Badge className={getStatusColor(tournament.status)}>
                      {tournament.status}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-4 gap-4 text-sm mb-3">
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Users className="h-4 w-4" />
                      <span>{tournament.max_players} players</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Coins className="h-4 w-4" />
                      <span>{tournament.entry_chips} entry</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Coins className="h-4 w-4 text-poker-gold" />
                      <span>{tournament.starting_stack} stack</span>
                    </div>
                    <div className="flex items-center gap-1 text-muted-foreground">
                      <Clock className="h-4 w-4" />
                      <span>{new Date(tournament.created_at || '').toLocaleDateString()}</span>
                    </div>
                  </div>

                  {tournament.status === 'registering' && (
                    <div className="flex gap-2">
                      <Button 
                        size="sm" 
                        onClick={() => handleStartTournament(tournament.id)}
                        className="gap-1"
                      >
                        <Play className="h-3 w-3" />
                        Start
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={() => handleCancelTournament(tournament.id)}
                        className="gap-1"
                      >
                        <XCircle className="h-3 w-3" />
                        Cancel
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
