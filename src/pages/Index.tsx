import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Send, Paperclip, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

const quickActions = [
  { label: 'Analyse the market', prompt: 'Analyse the current market conditions and provide insights.' },
  { label: 'Sentimental analysis', prompt: 'Do a sentiment analysis of the current market trends.' },
  { label: 'Fundamental news', prompt: 'What are the latest fundamental news affecting the markets?' },
  { label: 'More', prompt: 'What other analyses can you help me with?' },
];

const Index = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const sendMessage = async (messageText: string) => {
    if (!messageText.trim()) return;
    
    if (!user) {
      toast({
        title: "Please log in",
        description: "You need to be logged in to use NextBull GPT.",
        variant: "destructive",
      });
      navigate('/auth');
      return;
    }

    const userMessage: Message = { role: 'user', content: messageText };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke('nextbull-chat', {
        body: { messages: [...messages, userMessage] }
      });

      if (error) {
        if (error.message?.includes('429')) {
          toast({
            title: "Rate limit exceeded",
            description: "Please wait a moment before sending another message.",
            variant: "destructive",
          });
        } else {
          throw error;
        }
        return;
      }

      if (data?.response) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: "Failed to get response. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    sendMessage(input);
  };

  return (
    <div className="flex-1 flex flex-col h-[calc(100vh-3.5rem)]">
      {messages.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <h1 className="text-4xl font-bold text-foreground mb-12">
            What can I help with?
          </h1>
          
          <div className="w-full max-w-2xl mb-6">
            <form onSubmit={handleSubmit} className="relative">
              <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3 border border-border">
                <Paperclip className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Create a financial report for a particular company."
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
                    className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                      message.role === 'user'
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
            <form onSubmit={handleSubmit} className="max-w-3xl mx-auto">
              <div className="flex items-center gap-2 bg-secondary rounded-2xl px-4 py-3 border border-border">
                <Paperclip className="w-5 h-5 text-muted-foreground cursor-pointer hover:text-foreground transition-colors" />
                <Input
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask NextBull GPT..."
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
          </div>
        </>
      )}
    </div>
  );
};

export default Index;
