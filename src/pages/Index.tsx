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
  Save,
  LineChart,
  Mic,
  X,
  Image as ImageIcon,
  Terminal,
  Search,
  Maximize2,
  Minimize2,
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { StockSearchModal } from '@/components/dashboard/StockSearchModal';
import { StockSearchBar } from '@/components/dashboard/StockSearchBar';
import { BuiltInTerminal } from '@/components/terminal/BuiltInTerminal';
import { NextBullLogo } from '@/components/NextBullLogo';
import MarkdownMessage from '@/components/chat/MarkdownMessage';
import { extractTickers } from '@/lib/extractTickers';

interface ContentPart {
  type: 'text' | 'image_url';
  text?: string;
  image_url?: { url: string };
}

interface Message {
  role: 'user' | 'assistant';
  content: string | ContentPart[];
}

/** Convert a File to a base64 data-URI */
function fileToDataURI(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

/** Read a text-based file */
function fileToText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp'];
const TEXT_TYPES = ['text/', 'application/json', 'application/xml', 'application/csv', 'text/csv'];

/** Get display text from a message (handles string or ContentPart[]) */
function getMessageText(content: string | ContentPart[]): string {
  if (typeof content === 'string') return content;
  return content
    .filter(p => p.type === 'text' && p.text)
    .map(p => p.text!)
    .join('\n');
}

interface Conversation {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
}

const quickActions = [
  { label: 'NIFTY 50 Analysis', prompt: 'Give me a detailed technical and sentiment analysis of NIFTY 50 today. Include key support/resistance levels, FII/DII flow data, India VIX reading, and your outlook for the week.' },
  { label: 'Top Stock Picks', prompt: 'From the live stock prices you have, suggest 3-5 high-conviction stock picks for swing trading this week. Include entry zone, stop-loss, targets, and the rationale behind each pick based on current data.' },
  { label: 'Global Market Impact', prompt: 'Analyze how the current US markets (S&P 500, NASDAQ, Dow), crude oil, gold, DXY, and treasury yields are likely to impact Indian markets. Include crypto and forex context.' },
  { label: 'Sector Analysis', prompt: 'Which Indian market sectors (IT, Banking, Pharma, Auto, FMCG, Metal) look strongest right now? Compare their relative strength using the live stock prices and suggest the best sector to invest in.' },
  { label: 'Crypto Overview', prompt: 'Give me a comprehensive overview of the crypto market right now. Analyze Bitcoin, Ethereum, Solana and other top coins. Include price action, market cap trends, and trading opportunities.' },
  { label: 'My Portfolio', prompt: 'Analyze my current portfolio positions and wallet balances from my connected broker account. Give me risk assessment, suggestions to optimize, and any positions I should consider closing or adding to.' },
];

/** Reusable chat input bar */
const ChatInputBar = ({
  input,
  setInput,
  onSubmit,
  isLoading,
  placeholder = 'Ask NextBull GPT...',
  isListening,
  startListening,
  attachments,
  setAttachments,
}: {
  input: string;
  setInput: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  isLoading: boolean;
  placeholder?: string;
  isListening: boolean;
  startListening: () => void;
  attachments: File[];
  setAttachments: (files: File[]) => void;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setAttachments([...attachments, ...Array.from(e.target.files)]);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments(attachments.filter((_, i) => i !== index));
  };

  return (
    <div className="flex flex-col gap-2">
      {attachments.length > 0 && (
        <div className="flex gap-2 flex-wrap px-2">
          {attachments.map((file, i) => (
            <div key={i} className="flex items-center gap-2 bg-secondary/80 rounded-lg px-3 py-1.5 text-xs text-muted-foreground border border-border shadow-sm">
              {file.type.startsWith('image/') ? <ImageIcon className="w-3.5 h-3.5 text-emerald-500" /> : <Paperclip className="w-3.5 h-3.5 text-blue-500" />}
              <span className="truncate max-w-[150px] font-medium text-foreground">{file.name}</span>
              <button type="button" onClick={() => removeAttachment(i)} className="hover:text-rose-500 transition-colors">
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}
      <form onSubmit={onSubmit} className="relative">
        <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3 border border-border shadow-sm">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            multiple
            accept="image/*,.pdf,.doc,.docx,.txt"
          />
          <button type="button" onClick={() => fileInputRef.current?.click()} className="text-muted-foreground hover:text-foreground transition-colors">
            <Paperclip className="w-5 h-5" />
          </button>
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={isListening ? "Listening... Speak now" : placeholder}
            className="flex-1 border-0 bg-transparent focus-visible:ring-0 focus-visible:ring-offset-0 text-foreground placeholder:text-muted-foreground"
          />
          <button
            type="button"
            onClick={startListening}
            className={`transition-colors ${isListening ? 'text-rose-500 animate-pulse' : 'text-muted-foreground hover:text-foreground'}`}
            title="Voice Input"
          >
            <Mic className="w-5 h-5" />
          </button>
          <Button
            type="submit"
            size="icon"
            variant="ghost"
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="text-emerald-500 hover:text-emerald-400 hover:bg-emerald-500/10 transition-colors ml-1"
          >
            {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
          </Button>
        </div>
      </form>
    </div>
  );
};

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
  const [chartSymbol, setChartSymbol] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [attachments, setAttachments] = useState<File[]>([]);
  const [showTerminal, setShowTerminal] = useState(false);
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
  const saveMessage = useCallback(async (conversationId: string, role: string, content: string | ContentPart[]) => {
    try {
      // Store as text in DB for history (extract text from multimodal content)
      const textContent = typeof content === 'string' ? content : getMessageText(content);
      await supabase.from('chat_messages').insert({
        conversation_id: conversationId,
        role,
        content: textContent,
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

  // ── Save as Report ──
  const saveAsReport = useCallback(async (content: string) => {
    if (!user) {
      toast({ title: 'Please log in', description: 'You need to be logged in to save reports.', variant: 'destructive' });
      return;
    }
    try {
      // Basic title generation from first line or generic
      let title = "NextBull Financial Report";
      const firstLine = content.split('\n')[0].replace(/[#*]/g, '').trim();
      if (firstLine.length > 5 && firstLine.length < 50) {
        title = firstLine;
      }

      const { error } = await supabase.from('saved_reports').insert({
        user_id: user.id,
        title,
        content
      });

      if (error) throw error;
      toast({ title: 'Report Saved', description: 'View it in the Reports section.' });
    } catch (err: any) {
      console.error('Failed to save report:', err);
      toast({ title: 'Error', description: err.message || 'Failed to save report', variant: 'destructive' });
    }
  }, [user, toast]);

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
    if (!messageText.trim() && attachments.length === 0) return;

    if (!user) {
      toast({ title: 'Please log in', description: 'You need to be logged in to use NextBull GPT.', variant: 'destructive' });
      navigate('/auth');
      return;
    }

    // Build multimodal content if files are attached
    let userMessageContent: string | ContentPart[];
    const currentAttachments = [...attachments]; // snapshot before clearing

    if (currentAttachments.length > 0) {
      const parts: ContentPart[] = [];

      // Add text part
      if (messageText.trim()) {
        parts.push({ type: 'text', text: messageText.trim() });
      }

      // Convert each file
      for (const file of currentAttachments) {
        try {
          if (IMAGE_TYPES.includes(file.type)) {
            // Image → base64 data URI for GPT-4o vision
            const dataUri = await fileToDataURI(file);
            parts.push({ type: 'image_url', image_url: { url: dataUri } });
            // Add a text label so we know what file it was
            parts.push({ type: 'text', text: `[Attached image: ${file.name}]` });
          } else if (TEXT_TYPES.some(t => file.type.startsWith(t)) || file.name.match(/\.(txt|csv|json|xml|md|log|py|js|ts|html|css|sql|yaml|yml|toml|ini|cfg)$/i)) {
            // Text file → read content directly
            const text = await fileToText(file);
            parts.push({ type: 'text', text: `--- Content of attached file: ${file.name} ---\n${text}\n--- End of ${file.name} ---` });
          } else {
            // Unsupported file type — just note it
            parts.push({ type: 'text', text: `[Attached file: ${file.name} (${file.type || 'unknown type'}, ${(file.size / 1024).toFixed(1)} KB) — file type not supported for inline analysis]` });
          }
        } catch (err) {
          console.error(`Failed to process attachment ${file.name}:`, err);
          parts.push({ type: 'text', text: `[Attached file: ${file.name} — failed to read]` });
        }
      }

      userMessageContent = parts.length === 1 && parts[0].type === 'text' ? parts[0].text! : parts;
    } else {
      userMessageContent = messageText.trim();
    }

    const userMessage: Message = { role: 'user', content: userMessageContent };
    let convId = activeConversationId;

    // Create conversation if this is the first message
    if (!convId) {
      convId = await createConversation(messageText || "New conversation with files");
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
    setAttachments([]); // Clear visually
    setIsLoading(true);

    // Save user message to DB
    await saveMessage(convId, 'user', userMessageContent);

    // Retry logic — up to 2 attempts
    const MAX_RETRIES = 2;

    // ── Build Delta portfolio context if user has connected broker ──
    let deltaPortfolio = "";
    try {
      const deltaApiKey = localStorage.getItem('delta_api_key');
      const deltaApiSecret = localStorage.getItem('delta_api_secret');
      const deltaEnv = localStorage.getItem('delta_environment') || 'india';
      if (deltaApiKey && deltaApiSecret) {
        const url = import.meta.env.VITE_DELTA_SUPABASE_URL || import.meta.env.VITE_SUPABASE_URL;
        const anon = import.meta.env.VITE_DELTA_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
        const dRes = await fetch(`${String(url).replace(/\/$/, '')}/functions/v1/delta-account`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', apikey: anon, Authorization: `Bearer ${anon}` },
          body: JSON.stringify({ api_key: deltaApiKey, api_secret: deltaApiSecret, environment: deltaEnv }),
        });
        if (dRes.ok) {
          const dData = await dRes.json();
          if (dData.success) {
            const balLines = (dData.balances || [])
              .filter((b: any) => parseFloat(b.balance) > 0)
              .map((b: any) => `   ${b.asset_symbol}: ${parseFloat(b.balance).toFixed(4)} (Avail: ${parseFloat(b.available_balance).toFixed(4)})`);
            const posLines = (dData.positions || [])
              .filter((p: any) => p.size !== 0)
              .map((p: any) => `   ${p.product_symbol}: ${p.size > 0 ? 'LONG' : 'SHORT'} ×${Math.abs(p.size)} @ ₹${parseFloat(p.entry_price).toFixed(2)} | Unrealized P&L: ${parseFloat(p.unrealized_pnl).toFixed(2)}`);
            if (balLines.length || posLines.length) {
              deltaPortfolio = `Wallet Balances:\n${balLines.join('\n') || '   (empty)'}\nOpen Positions:\n${posLines.join('\n') || '   (none)'}`;
            }
          }
        }
      }
    } catch (e) { console.warn("Delta portfolio fetch for GPT skipped:", e); }

    // ── Build Dhan portfolio context if user has connected Dhan broker ──
    let dhanPortfolio = "";
    try {
      const { data: dhanData, error: dhanErr } = await supabase.functions.invoke('dhan-account');
      if (!dhanErr && dhanData?.success && dhanData?.connected) {
        const holdLines = (dhanData.holdings || [])
          .map((h: any) => `   ${h.tradingSymbol || h.symbol}: Qty ${h.totalQty || h.quantity || 0} @ Avg ₹${h.avgCostPrice || h.averagePrice || 0}`);
        const posLines = (dhanData.positions || [])
          .filter((p: any) => (p.netQty || p.quantity || 0) !== 0)
          .map((p: any) => `   ${p.tradingSymbol || p.symbol}: ${(p.netQty || p.quantity || 0) > 0 ? 'LONG' : 'SHORT'} ×${Math.abs(p.netQty || p.quantity || 0)} | P&L: ₹${p.realizedProfit || p.pnl || 0}`);
        const fundInfo = dhanData.funds?.availabelBalance != null
          ? `Available Funds: ₹${dhanData.funds.availabelBalance}`
          : '';
        if (holdLines.length || posLines.length || fundInfo) {
          dhanPortfolio = `[Dhan Account]\n${fundInfo ? fundInfo + '\n' : ''}Holdings:\n${holdLines.join('\n') || '   (none)'}\nPositions:\n${posLines.join('\n') || '   (none)'}`;
        }
      }
    } catch (e) { console.warn("Dhan portfolio fetch for GPT skipped:", e); }

    // Combine all broker portfolio context
    const brokerPortfolio = [deltaPortfolio, dhanPortfolio].filter(Boolean).join('\n\n');

    for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      try {
        const { data, error } = await supabase.functions.invoke('nextbull-chat', {
          body: { messages: currentMessages, deltaPortfolio: brokerPortfolio }
        });

        if (error) {
          // Try to extract the actual error body from a FunctionsHttpError
          let errorMsg = error.message || 'Unknown error';
          try {
            if ('context' in error && (error as any).context?.body) {
              const body = await (error as any).context.json();
              if (body?.error) errorMsg = body.error;
            }
          } catch { /* ignore parse errors */ }

          if (errorMsg.includes('429') || error.message?.includes('429')) {
            toast({ title: 'Rate limit exceeded', description: 'Please wait a moment before sending another message.', variant: 'destructive' });
            break;
          }
          throw new Error(errorMsg);
        }

        // Handle edge case where function returns 200 but with an error field
        if (data?.error) {
          throw new Error(data.error);
        }

        if (data?.response) {
          setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
          await saveMessage(convId!, 'assistant', data.response);
          break; // Success — exit retry loop
        } else {
          throw new Error('Empty response from AI');
        }
      } catch (error: any) {
        console.error(`Attempt ${attempt}/${MAX_RETRIES} failed:`, error);
        if (attempt < MAX_RETRIES) {
          // Wait before retrying (exponential backoff)
          await new Promise(r => setTimeout(r, attempt * 2000));
          continue;
        }
        // Final attempt failed — show error to user
        const desc = error?.message && error.message !== 'Unknown error'
          ? error.message
          : 'Failed to get response. Please try again.';
        toast({ title: 'Error', description: desc, variant: 'destructive' });
      }
    }

    setIsLoading(false);
    loadConversations();
  }, [user, toast, navigate, activeConversationId, attachments, createConversation, saveMessage, loadConversations]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  }, [input, sendMessage]);

  const startListening = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      toast({ title: 'Not Supported', description: 'Speech recognition is not supported in this browser.', variant: 'destructive' });
      return;
    }
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = true;

    recognition.onstart = () => setIsListening(true);
    recognition.onresult = (event: any) => {
      const transcript = Array.from(event.results)
        .map((result: any) => result[0])
        .map((result: any) => result.transcript)
        .join('');
      setInput(transcript);
    };
    recognition.onerror = (event: any) => {
      console.error('Speech recognition error', event.error);
      setIsListening(false);
    };
    recognition.onend = () => {
      setIsListening(false);
    };
    recognition.start();
  }, [toast]);

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
        {/* ── Top Action Bar ── */}
        <div className="shrink-0 relative border-b border-white/[0.06]">
          {/* Gradient background */}
          <div className="absolute inset-0 bg-gradient-to-r from-[#0a0c12] via-[#0e1117] to-[#0a0c12]" />
          {/* Subtle top-edge highlight */}
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />
          {/* Bottom glow line */}
          <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

          <div className="relative flex items-center gap-3 px-4 py-2">
            {/* Brand mark */}
            <div className="flex items-center gap-2.5 shrink-0 pr-3 border-r border-white/[0.06] mr-1">
              <NextBullLogo size="xs" glow={false} showText={false} animated={false} />
              <div className="hidden md:flex flex-col">
                <span className="text-[11px] font-bold tracking-wide text-white/90 leading-none">NEXTBULL</span>
                <span className="text-[9px] font-medium text-blue-400/70 tracking-widest leading-none mt-0.5">TERMINAL</span>
              </div>
            </div>

            {/* Stock Search */}
            <StockSearchBar onSelect={symbol => setChartSymbol(symbol)} />

            {/* Action buttons */}
            <div className="flex items-center gap-1.5 shrink-0">
              {/* Terminal Button */}
              <button
                onClick={() => setShowTerminal(prev => !prev)}
                className={`group relative flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold tracking-wide uppercase transition-all duration-200 shrink-0 ${
                  showTerminal
                    ? 'text-emerald-400'
                    : 'text-gray-500 hover:text-gray-200'
                }`}
              >
                {/* Active bg glow */}
                {showTerminal && (
                  <div className="absolute inset-0 rounded-lg bg-emerald-500/10 border border-emerald-500/25 shadow-[0_0_12px_rgba(16,185,129,0.15)]" />
                )}
                {/* Hover bg */}
                <div className={`absolute inset-0 rounded-lg transition-all duration-200 ${
                  showTerminal ? '' : 'bg-transparent group-hover:bg-white/[0.05] border border-transparent group-hover:border-white/[0.08]'
                }`} />
                <Terminal className="w-3.5 h-3.5 relative z-10" />
                <span className="relative z-10 hidden sm:inline">Terminal</span>
                {/* Live dot when active */}
                {showTerminal && (
                  <span className="relative z-10 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                )}
              </button>
            </div>
          </div>
        </div>

        {messages.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8">
            <div className="mb-10 text-center flex flex-col items-center">
              <div className="relative mb-6">
                <NextBullLogo size="xl" glow animated />
              </div>
              <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-3 font-mono">
                <span className="bg-gradient-to-r from-blue-400 via-white to-blue-400 bg-clip-text text-transparent drop-shadow-[0_0_20px_rgba(59,130,246,0.5)]">NextBull</span>{' '}
                <span className="bg-gradient-to-r from-blue-300 via-indigo-400 to-blue-500 bg-clip-text text-transparent drop-shadow-[0_0_24px_rgba(99,102,241,0.6)]">GPT</span>
              </h1>
              <p className="text-gray-500 text-sm font-mono tracking-wider">YOUR AI-POWERED MARKET INTELLIGENCE</p>
            </div>

            <div className="w-full max-w-2xl mb-8 relative">
              <div className="absolute -inset-1 bg-gradient-to-r from-blue-500/20 via-indigo-500/20 to-blue-500/20 rounded-3xl blur opacity-50" />
              <div className="relative">
                <ChatInputBar
                  input={input}
                  setInput={setInput}
                  onSubmit={handleSubmit}
                  isLoading={isLoading}
                  placeholder="Ask NextBull GPT about markets, stocks, analysis..."
                  isListening={isListening}
                  startListening={startListening}
                  attachments={attachments}
                  setAttachments={setAttachments}
                />
              </div>
            </div>

            <div className="flex flex-wrap gap-3 justify-center max-w-3xl">
              {quickActions.map((action) => (
                <Button
                  key={action.label}
                  variant="chat"
                  onClick={() => sendMessage(action.prompt)}
                  disabled={isLoading}
                  className="bg-secondary/40 border border-border/50 hover:border-blue-500/50 hover:bg-blue-500/10 hover:text-blue-400 transition-all rounded-xl"
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
                {messages.map((message, index) => {
                  // Normalise content to plain text for display & chart extraction
                  let cleanContent = getMessageText(message.content);
                  let chartPayload: { symbol: string; name: string } | null = null;

                  // Check if user message has images attached (for rendering thumbnails)
                  const attachedImages: string[] = [];
                  if (message.role === 'user' && Array.isArray(message.content)) {
                    message.content.forEach(p => {
                      if (p.type === 'image_url' && p.image_url?.url) attachedImages.push(p.image_url.url);
                    });
                  }

                  if (message.role === 'assistant') {
                    const match = cleanContent.match(/\[CHART_ACTION:\s*({[^}]+})\s*\]/);
                    if (match) {
                      try {
                        chartPayload = JSON.parse(match[1]);
                        cleanContent = cleanContent.replace(match[0], '').trim();
                      } catch (e) {
                        console.error("Failed to parse CHART_ACTION", e);
                      }
                    }
                  }

                  // Extract all mentioned tickers from the response text
                  const detectedTickers = message.role === 'assistant'
                    ? extractTickers(cleanContent, chartPayload?.symbol)
                    : [];

                  return (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.role === 'user' ? (
                        /* ── USER MESSAGE ── */
                        <div className="max-w-[75%] rounded-2xl px-4 py-3 bg-blue-600 text-white shadow-lg shadow-blue-500/10">
                          <p className="whitespace-pre-wrap text-[13px] leading-relaxed">{cleanContent}</p>
                          {attachedImages.length > 0 && (
                            <div className="flex flex-wrap gap-2 mt-2">
                              {attachedImages.map((src, i) => (
                                <img key={i} src={src} alt="attached" className="max-h-40 rounded-lg border border-white/20" />
                              ))}
                            </div>
                          )}
                        </div>
                      ) : (
                        /* ── ASSISTANT MESSAGE ── */
                        <div className="max-w-[85%] w-full">
                          {/* Header bar */}
                          <div className="flex items-center gap-2 mb-1.5 px-1">
                            <div className="w-5 h-5 rounded-md bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
                              <span className="text-[9px] font-bold text-white">NB</span>
                            </div>
                            <span className="text-[11px] font-semibold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">NextBull GPT</span>
                          </div>
                          {/* Message body */}
                          <div className="rounded-2xl bg-[#1a1d29] border border-white/[0.06] px-5 py-4 shadow-xl shadow-black/20">
                            <MarkdownMessage content={cleanContent} />
                            {/* Chart chips for mentioned tickers */}
                            {(chartPayload || detectedTickers.length > 0) && (
                              <div className="mt-3 pt-2.5 border-t border-white/[0.06]">
                                <p className="text-[10px] text-gray-500 mb-1.5 flex items-center gap-1">
                                  <LineChart className="w-3 h-3" />
                                  Open Charts
                                </p>
                                <div className="flex flex-wrap gap-1.5">
                                  {chartPayload && (
                                    <button
                                      key={chartPayload.symbol}
                                      onClick={() => setChartSymbol(chartPayload!.symbol)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-semibold bg-emerald-500/15 border border-emerald-500/25 text-emerald-400 hover:bg-emerald-500/25 hover:border-emerald-500/50 transition-all cursor-pointer"
                                    >
                                      <LineChart className="w-3 h-3" />
                                      {chartPayload.name}
                                    </button>
                                  )}
                                  {detectedTickers.map(t => (
                                    <button
                                      key={t.symbol}
                                      onClick={() => setChartSymbol(t.symbol)}
                                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[10px] font-medium bg-white/[0.04] border border-white/[0.08] text-gray-400 hover:bg-blue-500/10 hover:border-blue-500/30 hover:text-blue-400 transition-all cursor-pointer"
                                    >
                                      <LineChart className="w-2.5 h-2.5" />
                                      {t.name}
                                    </button>
                                  ))}
                                </div>
                              </div>
                            )}
                            {/* Copy / Save actions */}
                            <div className="mt-2 pt-2 border-t border-white/[0.06] flex items-center justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigator.clipboard.writeText(cleanContent)}
                                className="h-7 text-[10px] gap-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5"
                              >
                                <svg xmlns="http://www.w3.org/2000/svg" className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="14" height="14" x="8" y="8" rx="2" ry="2"/><path d="M4 16c-1.1 0-2-.9-2-2V4c0-1.1.9-2 2-2h10c1.1 0 2 .9 2 2"/></svg>
                                Copy
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => saveAsReport(cleanContent)}
                                className="h-7 text-[10px] gap-1.5 text-emerald-500/70 hover:text-emerald-400 hover:bg-emerald-500/10"
                              >
                                <Save className="w-3 h-3" />
                                Save as Report
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isLoading && (
                  <div className="flex justify-start">
                      <div className="bg-secondary rounded-2xl px-5 py-4 min-w-[300px] border border-blue-500/20 shadow-sm relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-blue-500/5 to-transparent flex translate-x-[-100%] animate-[shimmer_2s_infinite]" />
                      <div className="flex flex-col gap-3 relative z-10">
                        <div className="flex items-center gap-2.5">
                          <Loader2 className="w-4 h-4 animate-spin text-blue-400" />
                          <span className="text-sm font-semibold text-foreground"><span className="bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">NextBull GPT</span> is analyzing...</span>
                        </div>
                        <div className="space-y-2 pl-6">
                          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            Fetching live stocks, crypto, forex, commodities & portfolio...
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse" style={{ animationDelay: '1s' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
                            Querying GPT-4o with 20+ live data feeds...
                          </div>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground animate-pulse" style={{ animationDelay: '2.5s' }}>
                            <span className="w-1.5 h-1.5 rounded-full bg-cyan-500"></span>
                            Synthesizing master response...
                          </div>
                        </div>
                      </div>
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
                  isListening={isListening}
                  startListening={startListening}
                  attachments={attachments}
                  setAttachments={setAttachments}
                />
              </div>
            </div>
          </>
        )}

        {/* ── Terminal Panel (slides in from bottom) ── */}
        {showTerminal && (
          <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm">
            <div
              className="bg-[#0d0f14] rounded-t-2xl shadow-2xl shadow-black/60 w-full max-w-5xl flex flex-col overflow-hidden border border-white/[0.08] border-b-0"
              style={{ height: '75vh' }}
            >
              {/* Terminal Header */}
              <div className="flex items-center justify-between px-5 py-3 border-b border-white/[0.06] bg-[#12141b]/90">
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-500/80" />
                    <span className="w-3 h-3 rounded-full bg-yellow-500/80" />
                    <span className="w-3 h-3 rounded-full bg-green-500/80" />
                  </div>
                  <div className="flex items-center gap-2 ml-2">
                    <Terminal className="w-4 h-4 text-emerald-400" />
                    <span className="font-semibold text-sm text-emerald-400">NextBull Terminal</span>
                    <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-500 font-medium">Beta</span>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowTerminal(false)}
                    className="p-1.5 rounded-lg hover:bg-white/10 text-gray-400 hover:text-white transition-all"
                    title="Close terminal"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Terminal Body */}
              <BuiltInTerminal onOpenChart={(sym) => { setChartSymbol(sym); setShowTerminal(false); }} />
            </div>
          </div>
        )}
      </div>

      {/* ── Full-screen Chart Modal ── */}
      <StockSearchModal
        isOpen={!!chartSymbol}
        onClose={() => setChartSymbol(null)}
        symbol={chartSymbol}
      />
    </div>
  );
};

export default Index;
