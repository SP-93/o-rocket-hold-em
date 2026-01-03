import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Header } from '@/components/Header';
import { useWalletContext } from '@/contexts/WalletContext';
import { PokerCardSVG } from '@/components/poker/PokerCardSVG';
import { Rocket, Coins, Users, Shield, ChevronRight, Sparkles } from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.15 },
  },
};

const floatAnimation = {
  y: [0, -15, 0],
  transition: {
    duration: 4,
    repeat: Infinity,
    ease: "easeInOut",
  },
};

export default function Index() {
  const { t } = useTranslation();
  const { isConnected, openConnectModal } = useWalletContext();

  return (
    <div className="min-h-screen bg-background overflow-hidden">
      <Header />
      
      {/* Hero Section */}
      <section className="relative min-h-[85vh] flex items-center">
        {/* Animated background layers */}
        <div className="absolute inset-0 bg-gradient-to-br from-poker-felt/20 via-background to-background" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.15),transparent_60%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_bottom_right,hsl(var(--poker-gold)/0.1),transparent_60%)]" />
        
        {/* Floating poker card decorations - replacing blur circles */}
        <motion.div 
          className="absolute top-20 left-[8%] w-16 h-24 opacity-60"
          animate={floatAnimation}
        >
          <PokerCardSVG suit="spades" rank="A" className="w-full h-full" />
        </motion.div>
        <motion.div 
          className="absolute top-28 right-[10%] w-14 h-20 -rotate-12 opacity-50"
          animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 1 } }}
        >
          <PokerCardSVG suit="hearts" rank="K" className="w-full h-full" />
        </motion.div>
        <motion.div 
          className="absolute bottom-32 left-[15%] w-12 h-18 rotate-6 opacity-40"
          animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 0.5 } }}
        >
          <PokerCardSVG suit="diamonds" rank="Q" className="w-full h-full" />
        </motion.div>
        <motion.div 
          className="absolute bottom-40 right-[18%] w-10 h-15 -rotate-6 opacity-35"
          animate={{ ...floatAnimation, transition: { ...floatAnimation.transition, delay: 1.5 } }}
        >
          <PokerCardSVG suit="clubs" rank="J" className="w-full h-full" />
        </motion.div>
        
        <div className="container relative z-10 py-16">
          <motion.div 
            className="flex flex-col items-center text-center max-w-5xl mx-auto"
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
          >
            {/* Badge */}
            <motion.div 
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-primary/10 border border-primary/30 mb-10 backdrop-blur-sm"
              variants={fadeInUp}
              transition={{ duration: 0.6 }}
            >
              <Sparkles className="h-4 w-4 text-poker-gold" />
              <span className="text-sm font-semibold text-primary tracking-wide">OverProtocol Blockchain</span>
            </motion.div>
            
            {/* Title */}
            <motion.h1 
              className="font-display text-5xl sm:text-6xl md:text-7xl lg:text-8xl font-black tracking-tighter mb-8"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.1 }}
            >
              <span className="relative inline-block">
                <span className="text-gradient-gold drop-shadow-lg">O'Rocket</span>
                <div className="absolute -inset-4 bg-poker-gold/15 blur-3xl -z-10 rounded-full" />
              </span>
              <br />
              <span className="text-foreground relative">
                Hold'em
                <motion.div 
                  className="absolute -bottom-2 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-primary to-transparent"
                  initial={{ scaleX: 0 }}
                  animate={{ scaleX: 1 }}
                  transition={{ delay: 0.8, duration: 0.8 }}
                />
              </span>
            </motion.h1>
            
            {/* Subtitle */}
            <motion.p 
              className="text-lg md:text-xl lg:text-2xl text-muted-foreground max-w-2xl mb-12 leading-relaxed"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              {t('hero.subtitle')}
            </motion.p>
            
            {/* CTA Buttons */}
            <motion.div 
              className="flex flex-col sm:flex-row gap-4"
              variants={fadeInUp}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              {isConnected ? (
                <Button 
                  asChild 
                  size="lg" 
                  className="h-14 px-10 text-lg gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                >
                  <Link to="/lobby">
                    {t('hero.playNow')}
                    <ChevronRight className="h-5 w-5" />
                  </Link>
                </Button>
              ) : (
                <Button 
                  onClick={openConnectModal} 
                  size="lg" 
                  className="h-14 px-10 text-lg gap-3 bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70 shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/30"
                >
                  {t('wallet.connect')}
                  <ChevronRight className="h-5 w-5" />
                </Button>
              )}
              <Button 
                variant="outline" 
                size="lg" 
                className="h-14 px-10 text-lg gap-3 border-2 border-border/60 bg-background/50 backdrop-blur-sm hover:bg-background/80 hover:border-primary/50 text-foreground transition-all duration-300"
              >
                {t('hero.learnMore')}
              </Button>
            </motion.div>
          </motion.div>
        </div>
        
        {/* Bottom gradient fade */}
        <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent" />
      </section>

      {/* Stats Section */}
      <section className="py-16 border-y border-border/30 bg-card/30 backdrop-blur-sm">
        <div className="container">
          <motion.div 
            className="grid grid-cols-1 md:grid-cols-3 gap-8"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                <Users className="h-6 w-6 text-primary" />
              </div>
              <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">2,847</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">{t('stats.players')}</div>
            </div>
            <div className="text-center p-6 md:border-x border-border/30">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-poker-gold/10 border border-poker-gold/20 mb-4">
                <Rocket className="h-6 w-6 text-poker-gold" />
              </div>
              <div className="text-4xl md:text-5xl font-display font-bold text-poker-gold mb-2">156</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">{t('stats.tables')}</div>
            </div>
            <div className="text-center p-6">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 border border-primary/20 mb-4">
                <Coins className="h-6 w-6 text-primary" />
              </div>
              <div className="text-4xl md:text-5xl font-display font-bold text-primary mb-2">4.2M</div>
              <div className="text-sm text-muted-foreground uppercase tracking-wide">{t('stats.potSize')}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 relative">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,hsl(var(--primary)/0.04),transparent_70%)]" />
        <div className="container relative">
          <motion.div 
            className="grid md:grid-cols-3 gap-6 lg:gap-8"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
          >
            {/* Feature 1 */}
            <motion.div 
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-poker-gold/50 transition-all duration-500"
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-poker-gold/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-poker-gold/20 to-poker-gold/5 border border-poker-gold/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-poker-gold/20 transition-all duration-300">
                  <Coins className="h-8 w-8 text-poker-gold" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-foreground group-hover:text-poker-gold transition-colors">
                  {t('features.woverChips.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {t('features.woverChips.description')}
                </p>
              </div>
            </motion.div>

            {/* Feature 2 */}
            <motion.div 
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-primary/50 transition-all duration-500"
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 border border-primary/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-primary/20 transition-all duration-300">
                  <Users className="h-8 w-8 text-primary" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-foreground group-hover:text-primary transition-colors">
                  {t('features.multiplayer.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {t('features.multiplayer.description')}
                </p>
              </div>
            </motion.div>

            {/* Feature 3 */}
            <motion.div 
              className="group relative p-8 rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 hover:border-chip-blue/50 transition-all duration-500"
              variants={fadeInUp}
              whileHover={{ y: -8, transition: { duration: 0.3 } }}
            >
              <div className="absolute inset-0 rounded-2xl bg-gradient-to-br from-chip-blue/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="relative">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-chip-blue/20 to-chip-blue/5 border border-chip-blue/30 flex items-center justify-center mb-6 group-hover:scale-110 group-hover:shadow-lg group-hover:shadow-chip-blue/20 transition-all duration-300">
                  <Shield className="h-8 w-8 text-chip-blue" />
                </div>
                <h3 className="font-display text-xl font-bold mb-3 text-foreground group-hover:text-chip-blue transition-colors">
                  {t('features.provablyFair.title')}
                </h3>
                <p className="text-muted-foreground leading-relaxed text-sm">
                  {t('features.provablyFair.description')}
                </p>
              </div>
            </motion.div>
          </motion.div>
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
