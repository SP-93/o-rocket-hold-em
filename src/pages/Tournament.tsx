import { useParams, Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useTournament } from '@/hooks/useTournament';
import { useWalletContext } from '@/contexts/WalletContext';
import { usePlayerProfile } from '@/hooks/usePlayerProfile';
import { toast } from '@/hooks/use-toast';
import { 
  ArrowLeft, 
  Loader2, 
  Trophy, 
  Users, 
  Clock, 
  Coins,
  Crown,
  Skull,
  Medal
} from 'lucide-react';

export default function Tournament() {
  const { id } = useParams();
  const { t } = useTranslation();
  const { address, isConnected } = useWalletContext();
  const { profile } = usePlayerProfile(address || null);
  
  const {
    tournament,
    players,
    currentBlindLevel,
    timeToNextLevel,
    loading,
    registerForTournament,
    getCurrentBlinds,
  } = useTournament(id || '');

  const isRegistered = players.some(
    p => p.wallet_address.toLowerCase() === address?.toLowerCase()
  );

  const activePlayers = players.filter(p => !p.is_eliminated);
  const eliminatedPlayers = players.filter(p => p.is_eliminated)
    .sort((a, b) => (a.placement || 999) - (b.placement || 999));

  const handleRegister = async () => {
    if (!address || !profile?.username) {
      toast({
        title: t('common.error'),
        description: 'Please set a username before registering',
        variant: 'destructive',
      });
      return;
    }

    const success = await registerForTournament(address, profile.username);
    if (success) {
      toast({
        title: t('common.success'),
        description: 'Successfully registered for tournament!',
      });
    } else {
      toast({
        title: t('common.error'),
        description: 'Failed to register for tournament',
        variant: 'destructive',
      });
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'registering':
        return <Badge variant="secondary">Registering</Badge>;
      case 'running':
        return <Badge className="bg-green-600">Running</Badge>;
      case 'finished':
        return <Badge variant="outline">Finished</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      default:
        return null;
    }
  };

  const currentBlinds = getCurrentBlinds();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container py-8 text-center">
          <p className="text-destructive mb-4">Tournament not found</p>
          <Button asChild>
            <Link to="/lobby">{t('table.backToLobby')}</Link>
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        {/* Header */}
        <div className="mb-8">
          <Button asChild variant="ghost" size="sm" className="gap-2 mb-4">
            <Link to="/lobby">
              <ArrowLeft className="h-4 w-4" />
              {t('common.back')}
            </Link>
          </Button>

          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Trophy className="h-6 w-6 text-primary" />
                <h1 className="font-display text-2xl font-bold">{tournament.name}</h1>
                {getStatusBadge(tournament.status)}
              </div>
              <p className="text-muted-foreground">
                {tournament.tournament_type.replace('_', ' ')} • {tournament.max_players} players max
              </p>
            </div>

            {tournament.status === 'registering' && !isRegistered && isConnected && (
              <Button onClick={handleRegister} className="gap-2">
                <Coins className="h-4 w-4" />
                Register ({tournament.entry_wover_value} USDT)
              </Button>
            )}

            {isRegistered && tournament.status === 'registering' && (
              <Badge variant="outline" className="text-green-500 border-green-500">
                ✓ Registered
              </Badge>
            )}
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Tournament Info */}
          <div className="lg:col-span-2 space-y-6">
            {/* Blinds Info - Only show when running */}
            {tournament.status === 'running' && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Clock className="h-5 w-5" />
                    Current Blinds - Level {currentBlindLevel + 1}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-4 text-center mb-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Small Blind</p>
                      <p className="text-2xl font-bold text-primary">{currentBlinds.small_blind}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Big Blind</p>
                      <p className="text-2xl font-bold text-primary">{currentBlinds.big_blind}</p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Ante</p>
                      <p className="text-2xl font-bold text-primary">{currentBlinds.ante}</p>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Next level in</span>
                      <span className="font-mono">{formatTime(timeToNextLevel)}</span>
                    </div>
                    <Progress 
                      value={(timeToNextLevel / (tournament.blind_structure[currentBlindLevel]?.duration_minutes * 60 || 1)) * 100} 
                    />
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Prize Pool */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Medal className="h-5 w-5" />
                  Prize Pool
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-primary mb-4">
                  {tournament.prize_pool?.toLocaleString() || 0} USDT
                </div>
                <div className="space-y-2">
                  {tournament.payout_percentages.slice(0, 3).map((pct, i) => (
                    <div key={i} className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        {i === 0 && <Crown className="h-4 w-4 text-yellow-500" />}
                        {i === 1 && <Medal className="h-4 w-4 text-gray-400" />}
                        {i === 2 && <Medal className="h-4 w-4 text-amber-600" />}
                        <span>{i + 1}{i === 0 ? 'st' : i === 1 ? 'nd' : 'rd'} Place</span>
                      </div>
                      <span className="font-medium">
                        {Math.floor((tournament.prize_pool || 0) * (pct / 100))} USDT ({pct}%)
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Blind Structure */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Blind Structure</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="py-2 text-left">Level</th>
                        <th className="py-2 text-right">SB</th>
                        <th className="py-2 text-right">BB</th>
                        <th className="py-2 text-right">Ante</th>
                        <th className="py-2 text-right">Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {tournament.blind_structure.map((level, i) => (
                        <tr 
                          key={i} 
                          className={`border-b ${i === currentBlindLevel && tournament.status === 'running' ? 'bg-primary/10' : ''}`}
                        >
                          <td className="py-2">{level.level}</td>
                          <td className="py-2 text-right">{level.small_blind}</td>
                          <td className="py-2 text-right">{level.big_blind}</td>
                          <td className="py-2 text-right">{level.ante}</td>
                          <td className="py-2 text-right">{level.duration_minutes}m</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Players */}
          <div className="space-y-6">
            {/* Active Players */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Players ({activePlayers.length}/{tournament.max_players})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {activePlayers.length === 0 ? (
                  <p className="text-muted-foreground text-sm">No players yet</p>
                ) : (
                  <div className="space-y-2">
                    {activePlayers.map(player => (
                      <div 
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/50"
                      >
                        <span className="font-medium">{player.username}</span>
                        {player.wallet_address.toLowerCase() === address?.toLowerCase() && (
                          <Badge variant="outline" className="text-xs">You</Badge>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Eliminated Players */}
            {eliminatedPlayers.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Skull className="h-5 w-5" />
                    Eliminated
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {eliminatedPlayers.map(player => (
                      <div 
                        key={player.id}
                        className="flex items-center justify-between p-2 rounded bg-muted/30 opacity-60"
                      >
                        <div className="flex items-center gap-2">
                          <span className="text-muted-foreground">#{player.placement}</span>
                          <span>{player.username}</span>
                        </div>
                        {player.payout_amount > 0 && (
                          <span className="text-green-500 text-sm">
                            +{player.payout_amount} USDT
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tournament Details */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Starting Stack</span>
                  <span>{tournament.starting_stack.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Entry Fee</span>
                  <span>{tournament.entry_wover_value} USDT</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Platform Rake</span>
                  <span>{tournament.platform_rake_percent}%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Payout Structure</span>
                  <span className="capitalize">{tournament.payout_structure.replace('_', ' ')}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
