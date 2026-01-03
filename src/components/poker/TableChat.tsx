import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Send, MessageCircle, X } from 'lucide-react';
import { ChatMessage } from '@/hooks/useTableChat';

interface TableChatProps {
  messages: ChatMessage[];
  onSendMessage: (message: string) => void;
  currentWallet?: string;
  className?: string;
}

function formatAddress(address: string): string {
  return `${address.slice(0, 4)}...${address.slice(-4)}`;
}

function formatTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

export function TableChat({ messages, onSendMessage, currentWallet, className }: TableChatProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when new messages arrive
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, isOpen]);

  const handleSend = () => {
    if (inputValue.trim()) {
      onSendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        variant="outline"
        size="icon"
        className={cn(
          'fixed bottom-6 right-6 h-12 w-12 rounded-full shadow-lg bg-secondary border-border hover:bg-accent',
          className
        )}
        onClick={() => setIsOpen(true)}
      >
        <MessageCircle className="h-5 w-5" />
        {messages.length > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-poker-red text-[10px] font-bold flex items-center justify-center text-primary-foreground">
            {messages.length > 99 ? '99' : messages.length}
          </span>
        )}
      </Button>
    );
  }

  return (
    <div
      className={cn(
        'fixed bottom-6 right-6 w-80 h-96 bg-card border border-border rounded-lg shadow-xl flex flex-col overflow-hidden',
        className
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-secondary">
        <span className="font-medium text-foreground">Table Chat</span>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={() => setIsOpen(false)}
        >
          <X className="h-4 w-4" />
        </Button>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 ? (
          <p className="text-center text-muted-foreground text-sm py-4">
            No messages yet
          </p>
        ) : (
          messages.map((msg) => {
            const isOwn = currentWallet?.toLowerCase() === msg.player_wallet.toLowerCase();
            return (
              <div
                key={msg.id}
                className={cn(
                  'flex flex-col max-w-[85%]',
                  isOwn ? 'ml-auto items-end' : 'items-start'
                )}
              >
                <div className="flex items-center gap-1 mb-0.5">
                  <span className="text-[10px] text-muted-foreground">
                    {msg.player_name || formatAddress(msg.player_wallet)}
                  </span>
                  <span className="text-[10px] text-muted-foreground">
                    • {formatTime(msg.created_at)}
                  </span>
                </div>
                <div
                  className={cn(
                    'px-3 py-1.5 rounded-lg text-sm',
                    isOwn
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-foreground'
                  )}
                >
                  {msg.message}
                </div>
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-border">
        <div className="flex gap-2">
          <Input
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 text-sm"
            maxLength={200}
          />
          <Button
            size="icon"
            onClick={handleSend}
            disabled={!inputValue.trim()}
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
