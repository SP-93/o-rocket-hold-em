import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useWalletContext } from '@/contexts/WalletContext';
import { Rocket, Coins, Users, Shield, ChevronRight } from 'lucide-react';

export default function Index() {
  const { t } = useTranslation();
  const { isConnected, connect } = useWalletContext();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/10 rounded-full blur-3xl" />
        
        <div className="container relative z-10 py-24 md:py-32">
          <div className="flex flex-col items-center text-center max-w-4xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 mb-8 animate-fade-in">
              <Rocket className="h-4 w-4 text-primary" />
              <span className="text-sm font-medium text-primary">OverProtocol Blockchain</span>
            </div>
            
            {/* Title */}
            <h1 className="font-display text-5xl md:text-7xl font-black tracking-tight mb-6 animate-fade-in">
              <span className="text-gradient-gold">O'Rocket</span>
              <br />
              <span className="text-foreground">Hold'em</span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mb-10 animate-fade-in">
              {t('hero.subtitle')}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              {isConnected ? (
                <Button asChild size="lg" className="gap-2 glow-primary">
                  <Link to="/lobby">
                    {t('hero.playNow')}
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button onClick={connect} size="lg" className="gap-2 glow-primary">
                  {t('wallet.connect')}
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
              <Button variant="outline" size="lg" className="gap-2">
                {t('hero.learnMore')}
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 border-t border-border/40">
        <div className="container">
          <div className="grid md:grid-cols-3 gap-8">
            {/* Feature 1 */}
            <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">WOVER Čipovi</h3>
              <p className="text-muted-foreground">
                Kupi čipove sa WOVER tokenima. Isplati dobitak direktno u svoj novčanik.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Real-Time Multiplayer</h3>
              <p className="text-muted-foreground">
                Igraj protiv pravih igrača u realnom vremenu. Bez botova, samo pravi poker.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="group p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/50 transition-all duration-300">
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                <Shield className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-display text-xl font-bold mb-2">Provably Fair</h3>
              <p className="text-muted-foreground">
                Sve transakcije su transparentne na blockchain-u. Svaka ruka je verifikovana.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 border-t border-border/40">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-2">
              <Rocket className="h-5 w-5 text-primary" />
              <span className="font-display font-bold">O'Rocket Hold'em</span>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('footer.poweredBy')} • © 2026 {t('footer.rights')}
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
