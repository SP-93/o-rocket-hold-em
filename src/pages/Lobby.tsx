import { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Header } from '@/components/Header';
import { TableCard } from '@/components/lobby/TableCard';
import { TableFilters } from '@/components/lobby/TableFilters';
import { CreateTableModal } from '@/components/lobby/CreateTableModal';
import { WorldChat } from '@/components/lobby/WorldChat';
import { Button } from '@/components/ui/button';
import { usePokerLobby } from '@/hooks/usePokerLobby';
import { useWalletContext } from '@/contexts/WalletContext';
import { Plus, RefreshCw, Loader2, Shield } from 'lucide-react';

type FilterType = 'all' | '5' | '6';

export default function Lobby() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('all');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  
  const { tables, loading, refetch, createTable } = usePokerLobby();
  const { address, username, isAdmin } = useWalletContext();

  const filteredTables = useMemo(() => {
    if (filter === 'all') return tables;
    return tables.filter((table) => table.max_players === parseInt(filter));
  }, [filter, tables]);

  const handleRefresh = async () => {
    await refetch();
  };

  const handleCreateTable = async (name: string, maxPlayers: 5 | 6, smallBlind: number, bigBlind: number) => {
    const tableId = await createTable(name, maxPlayers, smallBlind, bigBlind);
    return tableId;
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-8">
        <div className="flex gap-6">
          {/* Main Content */}
          <div className="flex-1 min-w-0">
            {/* Page Header */}
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
              <div>
                <h1 className="font-display text-3xl md:text-4xl font-bold mb-2">
                  {t('lobby.title')}
                </h1>
                <p className="text-muted-foreground">
                  {t('lobby.subtitle')}
                </p>
              </div>

              <div className="flex items-center gap-2">
                {isAdmin && (
                  <Button
                    asChild
                    variant="outline"
                    className="gap-2 border-destructive/50 text-destructive hover:bg-destructive/10"
                  >
                    <Link to="/admin">
                      <Shield className="h-4 w-4" />
                      Admin
                    </Link>
                  </Button>
                )}
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleRefresh}
                  disabled={loading}
                >
                  <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
                </Button>
                {/* Only show Create Table for admins */}
                {isAdmin && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2 glow-primary"
                  >
                    <Plus className="h-4 w-4" />
                    {t('lobby.createTable')}
                  </Button>
                )}
              </div>
            </div>

            {/* Filters */}
            <div className="mb-6">
              <TableFilters
                activeFilter={filter}
                onFilterChange={setFilter}
                tableCount={filteredTables.length}
              />
            </div>

            {/* Loading state */}
            {loading && tables.length === 0 ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : filteredTables.length > 0 ? (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredTables.map((table) => (
                  <TableCard 
                    key={table.id} 
                    table={{
                      id: table.id,
                      name: table.name,
                      maxPlayers: table.max_players as 5 | 6,
                      currentPlayers: table.current_players,
                      smallBlind: table.small_blind,
                      bigBlind: table.big_blind,
                      avgPot: table.avg_pot,
                      status: table.status,
                      createdAt: new Date(table.created_at),
                    }} 
                  />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <p className="text-muted-foreground text-lg mb-4">
                  {t('lobby.noTables')}
                </p>
                {isAdmin && (
                  <Button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="gap-2"
                  >
                    <Plus className="h-4 w-4" />
                    {t('lobby.createTable')}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* World Chat Sidebar */}
          <aside className="hidden lg:block w-80 flex-shrink-0">
            <div className="sticky top-24 h-[calc(100vh-8rem)]">
              <WorldChat walletAddress={address} username={username} />
            </div>
          </aside>
        </div>
      </main>

      {/* Create Table Modal */}
      <CreateTableModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        onCreateTable={handleCreateTable}
      />
    </div>
  );
}
