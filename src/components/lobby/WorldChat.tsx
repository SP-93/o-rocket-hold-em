import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorldChat } from '@/hooks/useWorldChat';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Send, MessageCircle, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface WorldChatProps {
  walletAddress: string | null;
  username: string | null;
}

export function WorldChat({ walletAddress, username }: WorldChatProps) {
  const { t } = useTranslation();
  const { messages, isLoading, sendMessage, canSend } = useWorldChat(walletAddress, username);
  const [input, setInput] = useState('');
  const [isSending, setIsSending] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isSending || !canSend) return;

    setIsSending(true);
    const result = await sendMessage(input);
    
    if (result.success) {
      setInput('');
    } else {
      toast.error(result.error);
    }
    
    setIsSending(false);
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const shortenAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  return (
    <div className="flex flex-col h-full bg-card/50 border border-border/50 rounded-xl overflow-hidden">
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-card/80">
        <MessageCircle className="h-4 w-4 text-primary" />
        <h3 className="font-display font-semibold text-sm">World Chat</h3>
        <span className="text-xs text-muted-foreground ml-auto">
          {messages.length} messages
        </span>
      </div>

      {/* Messages */}
      <ScrollArea className="flex-1 p-3" ref={scrollRef}>
        {isLoading ? (
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-muted-foreground">
            <MessageCircle className="h-8 w-8 mb-2 opacity-50" />
            <p className="text-sm">No messages yet</p>
            <p className="text-xs">Be the first to say hello!</p>
          </div>
        ) : (
          <div className="space-y-2">
            {messages.map((msg) => {
              const isOwn = msg.wallet_address === walletAddress?.toLowerCase();
              return (
                <div
                  key={msg.id}
                  className={cn(
                    "group text-sm",
                    isOwn && "text-right"
                  )}
                >
                  <div className={cn(
                    "inline-block max-w-[85%] px-3 py-2 rounded-lg",
                    isOwn 
                      ? "bg-primary/20 text-primary-foreground" 
                      : "bg-muted/50"
                  )}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className={cn(
                        "font-semibold text-xs",
                        isOwn ? "text-primary" : "text-poker-gold"
                      )}>
                        {msg.username}
                      </span>
                      <span className="text-[10px] text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                        {formatTime(msg.created_at)}
                      </span>
                    </div>
                    <p className="text-foreground break-words">{msg.message}</p>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </ScrollArea>

      {/* Input */}
      <form onSubmit={handleSend} className="p-3 border-t border-border/50 bg-card/80">
        {walletAddress && username ? (
          <div className="flex gap-2">
            <Input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Type a message..."
              maxLength={200}
              className="flex-1 h-9 text-sm bg-background/50 border-border/50 text-foreground placeholder:text-muted-foreground"
              disabled={isSending}
            />
            <Button
              type="submit"
              size="sm"
              className="h-9 px-3"
              disabled={!input.trim() || isSending || !canSend}
            >
              {isSending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        ) : (
          <p className="text-xs text-center text-muted-foreground py-2">
            Connect wallet to chat
          </p>
        )}
        {input.length > 0 && (
          <div className="text-right text-[10px] text-muted-foreground mt-1">
            {input.length}/200
          </div>
        )}
      </form>
    </div>
  );
}
