import { useState, useRef, useEffect, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import {
  Send,
  Paperclip,
  Loader2,
  Plus,
  MessageSquare,
  Trash2,
  Clock,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const quickActions = [
  { label: 'NIFTY 50 Analysis', prompt: 'Give me a detailed technical and sentiment analysis of NIFTY 50 today. Include key support/resistance levels, FII/DII flow data, India VIX reading, and your outlook for the week.' },
  { label: 'Top Stock Picks', prompt: 'Suggest 3-5 high-conviction stock picks for swing trading this week from NSE. Include entry zone, stop-loss, targets, and the rationale behind each pick.' },
  { label: 'Global Market Impact', prompt: 'How are the US markets (S&P 500, NASDAQ), crude oil prices, and dollar index (DXY) likely to impact Indian markets tomorrow? Include Fed policy context.' },
  { label: 'Sector Analysis', prompt: 'Which Indian market sectors (IT, Banking, Pharma, Auto, FMCG, Metal) look strongest right now? Compare their relative strength and suggest the best sector to invest in.' },
];

/** Reusable chat input bar */
const ChatInputBar = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  placeholder = 'Ask NextBull GPT...',
}: {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
}) => (
  <form onSubmit={onSubmit} className="relative">
    <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3 border border-border">
      <Paperclip className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
      <Input
        value={input}
        onChange={(e) => setInput(e.target.value)}
        placeholder={placeholder}
        className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
      />
      <Button
        type="submit"
        size="icon"
        variant="ghost"
        disabled={isLoading || !input.trim()}
        className="text-muted-foreground hover:text-foreground"
      >
        {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
      </Button>
    </div>
  </form>
);

function timeAgo(dateStr: string): string {
  const s = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (s < 60) return 'now';
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 604800) return `${Math.floor(s / 86400)}d`;
  return new Date(dateStr).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConversationId, setActiveConversationId] = useState<string | null>(null);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => { scrollToBottom(); }, [messages, scrollToBottom]);

  // ── Load conversations ──
  const loadConversations = useCallback(async () => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .select('id, title, created_at, updated_at')
        .eq('user_id', user.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setConversations(data || []);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [user]);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // ── Load messages for a conversation ──
  const loadMessages = useCallback(async (conversationId: string) => {
    if (!user) return;
    try {
      const { data, error } = await supabase
        .from('chat_messages')
        .select('role, content')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

      if (error) throw error;
      setMessages((data || []).map(m => ({ role: m.role as 'user' | 'assistant', content: m.content })));
      setActiveConversationId(conversationId);
    } catch (err) {
      console.error('Failed to load messages:', err);
      toast({ title: 'Error', description: 'Failed to load conversation', variant: 'destructive' });
    }
  }, [user, toast]);

  // ── Create new conversation ──
  const createConversation = useCallback(async (firstMessage: string): Promise<string | null> => {
    if (!user) return null;
    const title = firstMessage.slice(0, 60) + (firstMessage.length > 60 ? '...' : '');
    try {
      const { data, error } = await supabase
        .from('chat_conversations')
        .insert({ user_id: user.id, title })
        .select('id')
        .single();

      if (error) throw error;
      return data.id;
    } catch (err) {
      console.error('Failed to create conversation:', err);
      return null;
    }
  }, [user]);

  // ── Save message to DB ──
  const saveMessage = useCallback(async (conversationId: string, role: string, content: string) => {
    try {
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        role,
        content,
      });
      // Update conversation timestamp
      await supabase
        .from('chat_conversations')
        .update({ updated_at: new Date().toISOString() })
        .eq('id', conversationId);
    } catch (err) {
      console.error('Failed to save message:', err);
    }
  }, []);

  // ── Delete conversation ──
  const deleteConversation = useCallback(async (id: string) => {
    try {
      await supabase.from('chat_conversations').delete().eq('id', id);
      setConversations(prev => prev.filter(c => c.id !== id));
      if (activeConversationId === id) {
        setActiveConversationId(null);
        setMessages([]);
      }
      toast({ title: 'Deleted', description: 'Conversation removed.' });
    } catch {
      toast({ title: 'Error', description: 'Failed to delete', variant: 'destructive' });
    }
  }, [activeConversationId, toast]);

  // ── New chat ──
  const startNewChat = useCallback(() => {
    setActiveConversationId(null);
    setMessages([]);
    setInput('');
  }, []);

  // ── Send message ──
  const sendMessage = useCallback(async (messageText: string) => {
    if (!messageText.trim()) return;

    if (!user) {
      toast({ title: 'Please log in', description: 'You need to be logged in to use NextBull GPT.', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    const userMessage: Message = { role: 'user', content: messageText };
    let convId = activeConversationId;

    // Create conversation if this is the first message
    if (!convId) {
      convId = await createConversation(messageText);
      if (!convId) {
        toast({ title: 'Error', description: 'Failed to create conversation', variant: 'destructive' });
        return;
      }
      setActiveConversationId(convId);
    }

    let currentMessages: Message[] = [];
    setMessages(prev => {
      currentMessages = [...prev, userMessage];
      return currentMessages;
    });
    setInput('');
    setIsLoading(true);

    // Save user message to DB
    await saveMessage(convId, 'user', messageText);

    try {
      const { data, error } = await supabase.functions.invoke('nextbull-chat', {
        body: { messages: currentMessages }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast({ title: 'Rate limit exceeded', description: 'Please wait a moment before sending another message.', variant: 'destructive' });
        } else {
          throw error;
        }
        return;
      }

      if (data?.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
        // Save assistant response to DB
        await saveMessage(convId!, 'assistant', data.response);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({ title: 'Error', description: 'Failed to get response. Please try again.', variant: 'destructive' });
    } finally {
      setIsLoading(false);
      // Reload conversation list to update timestamps/titles
      loadConversations();
    }
  }, [user, toast, navigate, activeConversationId, createConversation, saveMessage, loadConversations]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  return (
    <div className="flex h-[calc(100vh-3.5rem)]">
      {/* ── SIDEBAR: Chat History ── */}
      <div className={`${sidebarOpen ? 'w-72' : 'w-0'} transition-all duration-300 flex-shrink-0 overflow-hidden border-r border-border/50 bg-card/40`}>
        <div className="w-72 h-full flex flex-col">
          {/* Sidebar Header */}
          <div className="p-3 border-b border-border/40 flex items-center justify-between">
            <h2 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Chat History</h2>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground hover:text-foreground"
              onClick={startNewChat}
              title="New Chat"
            >
              <Plus className="w-4 h-4" />
            </Button>
          </div>

          {/* Conversation List */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {loadingConversations ? (
              <div className="space-y-2 p-2">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="h-12 bg-secondary/30 rounded-lg animate-pulse" />
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-8 px-4">
                <MessageSquare className="w-8 h-8 text-muted-foreground/40 mx-auto mb-2" />
                <p className="text-xs text-muted-foreground">No conversations yet</p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">Start chatting to see your history here</p>
              </div>
            ) : (
              conversations.map(conv => (
                <div
                  key={conv.id}
                  className={`group flex items-start gap-2 px-3 py-2.5 rounded-lg cursor-pointer transition-all ${activeConversationId === conv.id
                      ? 'bg-primary/10 border border-primary/20'
                      : 'hover:bg-secondary/50 border border-transparent'
                    }`}
                  onClick={() => loadMessages(conv.id)}
                >
                  <MessageSquare className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${activeConversationId === conv.id ? 'text-primary' : 'text-muted-foreground/60'
                    }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-xs font-medium truncate ${activeConversationId === conv.id ? 'text-foreground' : 'text-foreground/80'
                      }`}>
                      {conv.title}
                    </p>
                    <p className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                      <Clock className="w-2.5 h-2.5" />
                      {timeAgo(conv.updated_at)}
                    </p>
                  </div>
                  <button
                    className="opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-destructive/10"
                    onClick={(e) => { e.stopPropagation(); deleteConversation(conv.id); }}
                    title="Delete"
                  >
                    <Trash2 className="w-3 h-3 text-muted-foreground hover:text-destructive" />
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Sidebar Footer */}
          {conversations.length > 0 && (
            <div className="p-3 border-t border-border/40">
              <p className="text-[10px] text-muted-foreground/60 text-center">
                {conversations.length} conversation{conversations.length !== 1 ? 's' : ''}
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ── SIDEBAR TOGGLE ── */}
      <button
        className="flex-shrink-0 w-5 flex items-center justify-center border-r border-border/30 bg-card/20 hover:bg-secondary/30 transition-colors"
        onClick={() => setSidebarOpen(prev => !prev)}
        title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
      >
        {sidebarOpen ? <ChevronLeft className="w-3 h-3 text-muted-foreground" /> : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
      </button>

      {/* ── MAIN CHAT AREA ── */}
      <div className="flex-1 flex flex-col min-w-0">
        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <h1 className="text-4xl font-bold text-foreground mb-12">
              What can I help with?
            </h1>

            <div className="w-full max-w-2xl mb-6">
              <ChatInputBar
                input={input}
                setInput={setInput}
                onSubmit={handleSubmit}
                isLoading={isLoading}
                placeholder="Ask NextBull GPT about markets, stocks, analysis..."
              />
            </div>

            <div className="flex flex-wrap gap-3 justify-center">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="chat"
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                >
                  {action.label}
                </Button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-auto p-6">
              <div className="max-w-3xl mx-auto space-y-6">
                {messages.map((message, index) => (
                  <div
                    key={index}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === 'user'
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-foreground'
                        }`}
                    >
                      <p className="whitespace-pre-wrap">{message.content}</p>
                    </div>
                  </div>
                ))}
                {isLoading && (
                  <div className="flex justify-start">
                    <div className="bg-secondary rounded-2xl px-4 py-3">
                      <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>
            </div>

            <div className="p-4 border-t border-border">
              <div className="max-w-3xl mx-auto">
                <ChatInputBar
                  input={input}
                  setInput={setInput}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Index;
