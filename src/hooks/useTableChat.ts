import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface ChatMessage {
  id: string;
  table_id: string;
  player_wallet: string;
  player_name: string | null;
  message: string;
  created_at: string;
}

interface UseTableChatResult {
  messages: ChatMessage[];
  sendMessage: (message: string, playerWallet: string, playerName?: string) => Promise<boolean>;
  loading: boolean;
}

export function useTableChat(tableId: string): UseTableChatResult {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);

  // Fetch initial messages
  useEffect(() => {
    const fetchMessages = async () => {
      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('table_chat')
          .select('*')
          .eq('table_id', tableId)
          .order('created_at', { ascending: true })
          .limit(100);

        if (error) throw error;
        setMessages(data || []);
      } catch (err) {
        console.error('Error fetching chat messages:', err);
      } finally {
        setLoading(false);
      }
    };

    if (tableId) {
      fetchMessages();
    }
  }, [tableId]);

  // Subscribe to realtime updates
  useEffect(() => {
    if (!tableId) return;

    const channel = supabase
      .channel(`table-chat-${tableId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'table_chat',
          filter: `table_id=eq.${tableId}`,
        },
        (payload) => {
          const newMessage = payload.new as ChatMessage;
          setMessages(prev => [...prev, newMessage]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [tableId]);

  // Send message
  const sendMessage = useCallback(async (
    message: string,
    playerWallet: string,
    playerName?: string
  ): Promise<boolean> => {
    if (!message.trim()) return false;

    try {
      const { error } = await supabase
        .from('table_chat')
        .insert({
          table_id: tableId,
          player_wallet: playerWallet,
          player_name: playerName || null,
          message: message.trim(),
        });

      if (error) throw error;
      return true;
    } catch (err) {
      console.error('Error sending message:', err);
      return false;
    }
  }, [tableId]);

  return {
    messages,
    sendMessage,
    loading,
  };
}
