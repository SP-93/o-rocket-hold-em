import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Rocket, 
  ExternalLink, 
  MessageCircle, 
  ArrowLeft,
  Coins,
  Shield,
  Users,
  Zap
} from 'lucide-react';

const fadeInUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 },
};

const staggerContainer = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 },
  },
};

export default function About() {
  const { t } = useTranslation();

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container py-12">
        {/* Back Button */}
        <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors mb-8">
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>

        {/* Hero Section */}
        <motion.div 
          className="text-center mb-16"
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
        >
          <motion.div 
            className="inline-flex items-center gap-3 mb-6"
            variants={fadeInUp}
          >
            <div className="relative">
              <Rocket className="h-12 w-12 text-primary" />
              <div className="absolute -bottom-1 -right-1 h-4 w-4 rounded-full bg-poker-gold animate-pulse" />
            </div>
          </motion.div>
          
          <motion.h1 
            className="font-display text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-foreground"
            variants={fadeInUp}
          >
            <span className="text-poker-gold">O'Rocket</span>{' '}
            <span className="text-primary">Hold'em</span>
          </motion.h1>
          
          <motion.p 
            className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8"
            variants={fadeInUp}
          >
            Decentralized Texas Hold'em poker on Over Protocol blockchain. 
            Built by Over Hippo Lab as part of the O'Rocket DEX ecosystem.
          </motion.p>
        </motion.div>

        {/* About Over Hippo Lab */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="border-border/50 bg-card/50 backdrop-blur-sm overflow-hidden">
            <CardContent className="p-8 md:p-12">
              <div className="flex items-center gap-4 mb-6">
                <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-primary/20 to-poker-gold/20 border border-primary/30 flex items-center justify-center">
                  <span className="text-3xl">🦛</span>
                </div>
                <div>
                  <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground">Over Hippo Lab</h2>
                  <p className="text-muted-foreground">Private Development Lab on Over Protocol</p>
                </div>
              </div>
              
              <p className="text-muted-foreground leading-relaxed mb-8">
                Over Hippo Lab is a private development laboratory building innovative DeFi and gaming solutions 
                on the Over Protocol blockchain. Our mission is to create seamless, secure, and entertaining 
                decentralized applications that leverage the power of blockchain technology.
              </p>

              {/* Features Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
                <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                  <Coins className="h-8 w-8 text-poker-gold mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">WOVER Chips</h3>
                  <p className="text-sm text-muted-foreground">1:1 chip conversion with WOVER token</p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                  <Shield className="h-8 w-8 text-primary mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">Provably Fair</h3>
                  <p className="text-sm text-muted-foreground">Blockchain-verified game outcomes</p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                  <Users className="h-8 w-8 text-chip-blue mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">Multiplayer</h3>
                  <p className="text-sm text-muted-foreground">Real-time gameplay with global players</p>
                </div>
                <div className="p-4 rounded-xl bg-background/50 border border-border/30">
                  <Zap className="h-8 w-8 text-poker-gold mb-3" />
                  <h3 className="font-semibold text-foreground mb-1">Micro-Stakes</h3>
                  <p className="text-sm text-muted-foreground">Play from 0.01 chip blinds</p>
                </div>
              </div>

              {/* Social Links */}
              <div className="flex flex-wrap gap-4">
                <Button asChild variant="outline" className="gap-2">
                  <a href="https://x.com/SteeWee_93" target="_blank" rel="noopener noreferrer">
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
                    </svg>
                    Twitter/X
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <a href="https://t.me/OverHippoLab" target="_blank" rel="noopener noreferrer">
                    <MessageCircle className="h-4 w-4" />
                    Telegram
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
                <Button asChild className="gap-2 bg-gradient-to-r from-primary to-primary/80">
                  <a href="https://orocket.lovable.app/" target="_blank" rel="noopener noreferrer">
                    <Rocket className="h-4 w-4" />
                    O'Rocket DEX
                    <ExternalLink className="h-3 w-3" />
                  </a>
                </Button>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Technology Section */}
        <motion.div
          className="mb-16"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-6 text-center">
            Built on Over Protocol
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">⛓️</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Over Protocol</h3>
                <p className="text-sm text-muted-foreground">
                  Fast, secure, and low-cost blockchain for gaming and DeFi applications
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-poker-gold/10 border border-poker-gold/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">🪙</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">WOVER Token</h3>
                <p className="text-sm text-muted-foreground">
                  Wrapped OVER token used for chip purchases with 1:1 conversion rate
                </p>
              </CardContent>
            </Card>
            <Card className="border-border/50 bg-card/50">
              <CardContent className="p-6 text-center">
                <div className="h-12 w-12 rounded-xl bg-chip-blue/10 border border-chip-blue/20 flex items-center justify-center mx-auto mb-4">
                  <span className="text-2xl">📜</span>
                </div>
                <h3 className="font-semibold text-foreground mb-2">Smart Contracts</h3>
                <p className="text-sm text-muted-foreground">
                  Secure chip management and game settlement via on-chain contracts
                </p>
              </CardContent>
            </Card>
          </div>
        </motion.div>

        {/* CTA Section */}
        <motion.div
          className="text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="font-display text-2xl font-bold text-foreground mb-4">
            Ready to Play?
          </h2>
          <p className="text-muted-foreground mb-6">
            Connect your wallet and join the tables!
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button asChild size="lg" className="gap-2">
              <Link to="/lobby">
                Enter Lobby
                <Rocket className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="gap-2">
              <Link to="/chipshop">
                Buy Chips
                <Coins className="h-4 w-4" />
              </Link>
            </Button>
          </div>
        </motion.div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t border-border/30 mt-16">
        <div className="container text-center text-sm text-muted-foreground">
          © 2026 Over Hippo Lab. All rights reserved. Built on Over Protocol.
        </div>
      </footer>
    </div>
  );
}
