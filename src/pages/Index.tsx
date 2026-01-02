import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useWalletContext } from '@/contexts/WalletContext';
import { Rocket, Coins, Users, Shield, ChevronRight, Sparkles } from 'lucide-react';

export default function Index() {
  const { t } = useTranslation();
  const { isConnected, openConnectModal } = useWalletContext();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Animated background */}
        <div className="absolute inset-0 bg-gradient-to-br from-poker-felt/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--poker-gold)/0.1),transparent_50%)]" />
        
        {/* Floating poker elements */}
        <div className="absolute top-20 left-10 w-20 h-28 rounded-lg bg-gradient-to-br from-card-red to-card-red/80 rotate-12 opacity-20 animate-pulse blur-sm" />
        <div className="absolute top-40 right-20 w-16 h-24 rounded-lg bg-gradient-to-br from-card-black to-card-black/80 -rotate-12 opacity-15 animate-pulse blur-sm" style={{ animationDelay: '1s' }} />
        <div className="absolute bottom-32 left-1/4 w-14 h-14 rounded-full bg-gradient-to-br from-chip-red to-chip-red/60 opacity-30 animate-bounce" style={{ animationDuration: '3s' }} />
        <div className="absolute bottom-48 right-1/3 w-12 h-12 rounded-full bg-gradient-to-br from-chip-gold to-chip-gold/60 opacity-25 animate-bounce" style={{ animationDuration: '4s', animationDelay: '0.5s' }} />
        <div className="absolute top-1/3 right-10 w-10 h-10 rounded-full bg-gradient-to-br from-chip-blue to-chip-blue/60 opacity-20 animate-bounce" style={{ animationDuration: '3.5s', animationDelay: '1s' }} />
        
        <div className="container relative z-10 py-16">
          <div className="flex flex-col items-center text-center max-w-5xl mx-auto">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 mb-10 animate-fade-in backdrop-blur-sm">
              <Sparkles className="h-4 w-4 text-poker-gold" />
              <span className="text-sm font-semibold text-primary tracking-wide">OverProtocol Blockchain</span>
            </div>
            
            {/* Title */}
            <h1 className="font-display text-6xl sm:text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter mb-8 animate-fade-in">
              <span className="relative inline-block">
                <span className="text-gradient-gold drop-shadow-lg">O'Rocket</span>
                <div className="absolute -inset-2 bg-poker-gold/20 blur-2xl -z-10 rounded-full" />
              </span>
              <br />
              <span className="text-foreground relative">
                Hold'em
                <div className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent" />
              </span>
            </h1>
            
            {/* Subtitle */}
            <p className="text-xl md:text-2xl lg:text-3xl text-muted-foreground max-w-3xl mb-12 animate-fade-in leading-relaxed">
              {t('hero.subtitle')}
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 animate-fade-in">
              {isConnected ? (
                <Button asChild size="lg" className="h-14 px-10 text-lg gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30">
                  <Link to="/lobby">
                    {t('hero.playNow')}
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button onClick={openConnectModal} size="lg" className="h-14 px-10 text-lg gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30">
                  {t('wallet.connect')}
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
              <Button variant="outline" size="lg" className="h-14 px-10 text-lg gap-3 border-2 border-border/60 bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:border-primary/50 transition-all duration-300">
                {t('hero.learnMore')}
              </Button>
            </div>
          </div>
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="container">
          <div className="grid grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-1">2,847</div>
              <div className="text-sm text-muted-foreground">{t('stats.players')}</div>
            </div>
            <div className="text-center border-x border-border/30">
              <div className="text-3xl md:text-4xl font-display font-bold text-poker-gold mb-1">156</div>
              <div className="text-sm text-muted-foreground">{t('stats.tables')}</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-display font-bold text-primary mb-1">4.2M</div>
              <div className="text-sm text-muted-foreground">{t('stats.potSize')}</div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.05),transparent_70%)]" />
        <div className="container relative">
          <div className="grid md:grid-cols-3 gap-6 lg:gap-8">
            {/* Feature 1 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-chip-gold/20 to-chip-gold/5 border border-chip-gold/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-chip-gold/20 transition-all duration-300">
                  <Coins className="h-8 w-8 text-chip-gold" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {t('features.woverChips.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.woverChips.description')}
                </p>
              </div>
            </div>

            {/* Feature 2 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {t('features.multiplayer.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.multiplayer.description')}
                </p>
              </div>
            </div>

            {/* Feature 3 */}
            <div className="group relative p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-500 hover:-translate-y-2 hover:shadow-2xl hover:shadow-primary/10">
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-chip-blue/20 to-chip-blue/5 border border-chip-blue/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-chip-blue/20 transition-all duration-300">
                  <Shield className="h-8 w-8 text-chip-blue" />
                </div>
                <h3 className="font-display text-2xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {t('features.provablyFair.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed">
                  {t('features.provablyFair.description')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border/30 bg-card/20">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Rocket className="h-6 w-6 text-primary" />
                <div className="absolute -bottom-0.5 -right-0.5 h-2 w-2 rounded-full bg-poker-gold" />
              </div>
              <span className="font-display text-lg font-bold tracking-wide">O'Rocket Hold'em</span>
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