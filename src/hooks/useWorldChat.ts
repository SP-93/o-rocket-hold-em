import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface ChatMessage {
  id: string;
  wallet_address: string;
  username: string;
  message: string;
  created_at: string;
}

interface UseWorldChatResult {
  messages: ChatMessage[];
  isLoading: boolean;
  sendMessage: (message: string) => Promise<{ success: boolean; error?: string }>;
  canSend: boolean;
}

const RATE_LIMIT_MS = 5000; // 5 seconds between messages
const MAX_MESSAGES = 50; // Keep last 50 messages in state

export function useWorldChat(walletAddress: string | null, username: string | null): UseWorldChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [lastSentAt, setLastSentAt] = useState<number>(0);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const canSend = Date.now() - lastSentAt > RATE_LIMIT_MS;

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      setIsLoading(true);
      const { data, error } = await supabase
        .from('world_chat')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(MAX_MESSAGES);

      if (error) {
        console.error('Error fetching world chat:', error);
      } else {
        setMessages(data?.reverse() || []);
      }
      setIsLoading(false);
    };

    fetchMessages();
  }, []);

  // Subscribe to realtime updates
  useEffect(() => {
    channelRef.current = supabase
      .channel('world-chat-realtime')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'world_chat',
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages((prev) => {
            const updated = [...prev, newMessage];
            // Keep only last MAX_MESSAGES
            if (updated.length > MAX_MESSAGES) {
              return updated.slice(-MAX_MESSAGES);
            }
            return updated;
          });
        }
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, []);

  const sendMessage = useCallback(async (message: string): Promise<{ success: boolean; error?: string }> => {
    if (!walletAddress || !username) {
      return { success: false, error: 'Not logged in' };
    }

    if (!canSend) {
      const waitTime = Math.ceil((RATE_LIMIT_MS - (Date.now() - lastSentAt)) / 1000);
      return { success: false, error: `Wait ${waitTime}s before sending again` };
    }

    const trimmedMessage = message.trim();
    if (!trimmedMessage) {
      return { success: false, error: 'Message cannot be empty' };
    }

    if (trimmedMessage.length > 200) {
      return { success: false, error: 'Message too long (max 200 characters)' };
    }

    const { error } = await supabase.from('world_chat').insert({
      wallet_address: walletAddress.toLowerCase(),
      username,
      message: trimmedMessage,
    });

    if (error) {
      console.error('Error sending message:', error);
      return { success: false, error: error.message };
    }

    setLastSentAt(Date.now());
    return { success: true };
  }, [walletAddress, username, canSend, lastSentAt]);

  return {
    messages,
    isLoading,
    sendMessage,
    canSend,
  };
}
