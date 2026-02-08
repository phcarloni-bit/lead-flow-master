import { useState, useRef, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { classifyMessage, buildResponse, DEFAULT_TEMPLATES } from '@/lib/classification-engine';
import { Send, ShoppingCart, RotateCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'lead' | 'system';
  category?: string | null;
  showBuyButton?: boolean;
}

export default function ChatSimulator() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', text: 'Olá! 👋 Sou o assistente virtual. Como posso te ajudar?', sender: 'system' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [contactName] = useState(`Simulador_${Date.now().toString(36)}`);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');

    const userBubble: ChatMessage = { id: Date.now().toString(), text: userMsg, sender: 'lead' };
    setMessages((prev) => [...prev, userBubble]);

    setIsTyping(true);

    // Fetch templates & keywords from DB, fallback to defaults
    const { data: templates } = await supabase.from('templates').select('*');
    const { data: keywords } = await supabase.from('keyword_dictionaries').select('*');
    const { data: config } = await supabase.from('store_config').select('*').limit(1).maybeSingle();

    const dicts = keywords && keywords.length > 0
      ? keywords.map((k) => ({ category: k.category, keywords: k.keywords }))
      : undefined;

    const result = classifyMessage(userMsg, dicts);

    const tpls = templates && templates.length > 0
      ? templates
      : DEFAULT_TEMPLATES.map((t) => ({ ...t, id: t.category, user_id: '' }));

    const responseText = buildResponse(
      result.category,
      tpls,
      config ? { default_price: config.default_price, available_colors: config.available_colors, product_link: config.product_link } : undefined
    );

    // Log to DB
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('interaction_logs').insert({
        user_id: user.id,
        contact_name: contactName,
        channel: 'simulator',
        message_received: userMsg,
        category_assigned: result.category,
        response_sent: responseText,
        status: 'auto_replied',
      });
    }

    await new Promise((r) => setTimeout(r, 800 + Math.random() * 700));
    setIsTyping(false);

    const systemBubble: ChatMessage = {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: 'system',
      category: result.category,
      showBuyButton: true,
    };
    setMessages((prev) => [...prev, systemBubble]);
  };

  const handleBuyClick = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('qualified_leads').insert({
        user_id: user.id,
        contact_name: contactName,
        channel: 'simulator',
        category: [...messages].reverse().find((m) => m.category)?.category || null,
        status: 'waiting',
      });

      await supabase.from('interaction_logs').update({ clicked_buy: true }).eq('contact_name', contactName);
    }

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: '🛒 Quero comprar!', sender: 'lead' },
      { id: (Date.now() + 1).toString(), text: 'Ótimo! Um atendente vai entrar em contato com você em breve! 🎉', sender: 'system' },
    ]);

    toast({ title: '🔔 Novo lead na fila!', description: `${contactName} clicou em "Quero comprar"` });
  };

  const resetChat = () => {
    setMessages([{ id: '0', text: 'Olá! 👋 Sou o assistente virtual. Como posso te ajudar?', sender: 'system' }]);
  };

  return (
    <Card className="mx-auto flex h-[calc(100vh-10rem)] max-w-2xl flex-col">
      <CardHeader className="flex flex-row items-center justify-between pb-3">
        <CardTitle className="text-base">Simulador de Chat</CardTitle>
        <Button variant="ghost" size="sm" onClick={resetChat}>
          <RotateCcw className="mr-1 h-4 w-4" /> Reiniciar
        </Button>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
        <div className="flex-1 space-y-3 overflow-y-auto px-4 py-2">
          {messages.map((msg) => (
            <div key={msg.id}>
              <div className={`flex ${msg.sender === 'lead' ? 'justify-start' : 'justify-end'}`}>
                <div
                  className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                    msg.sender === 'lead'
                      ? 'rounded-bl-sm bg-muted'
                      : 'rounded-br-sm bg-primary text-primary-foreground'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
              {msg.showBuyButton && (
                <div className="mt-2 flex justify-end">
                  <Button
                    size="sm"
                    className="bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={handleBuyClick}
                  >
                    <ShoppingCart className="mr-1 h-4 w-4" /> Quero comprar!
                  </Button>
                </div>
              )}
            </div>
          ))}
          {isTyping && (
            <div className="flex justify-end">
              <div className="rounded-2xl rounded-br-sm bg-primary/80 px-4 py-2.5 text-sm text-primary-foreground">
                <span className="animate-pulse">digitando...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        <div className="border-t p-4">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              sendMessage();
            }}
            className="flex gap-2"
          >
            <Input
              placeholder="Digite uma mensagem..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isTyping}
            />
            <Button type="submit" disabled={isTyping || !input.trim()}>
              <Send className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </CardContent>
    </Card>
  );
}
