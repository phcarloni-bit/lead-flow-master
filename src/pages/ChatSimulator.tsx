import { useState, useRef, useEffect, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { classifyMessage, buildResponse, DEFAULT_TEMPLATES } from '@/lib/classification-engine';
import { Send, ShoppingCart, RotateCcw, MessageCircle, UserCheck } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'lead' | 'system';
  category?: string | null;
  showBuyButton?: boolean;
}

type Platform = 'whatsapp' | 'instagram';

export default function ChatSimulator() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', text: 'Olá! Bem-vinda à Silouete. Como posso ajudar hoje? 👋', sender: 'system' },
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isHandoverActive, setIsHandoverActive] = useState(false);
  const [platform, setPlatform] = useState<Platform>('whatsapp');
  const [contactName] = useState(`Simulador_${Date.now().toString(36)}`);
  const [templates, setTemplates] = useState<{ category: string; response_text: string; is_active: boolean }[]>([]);
  const [keywords, setKeywords] = useState<{ category: string; keywords: string[] }[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Load templates and keywords once
  useEffect(() => {
    const load = async () => {
      const { data: tpls } = await supabase.from('templates').select('*');
      const { data: kws } = await supabase.from('keyword_dictionaries').select('*');
      if (tpls && tpls.length > 0) setTemplates(tpls);
      if (kws && kws.length > 0) setKeywords(kws.map((k) => ({ category: k.category, keywords: k.keywords })));
    };
    load();
  }, []);

  // Dynamic suggestions based on active templates
  const dynamicSuggestions = useMemo(() => {
    if (isHandoverActive) return [];
    const tpls = templates.length > 0 ? templates : DEFAULT_TEMPLATES;
    const suggestions = tpls
      .filter((t) => t.is_active && t.category !== 'Outro')
      .slice(0, 6)
      .map((t) => {
        switch (t.category) {
          case 'Como Comprar': return 'Como faço pra comprar?';
          case 'Rastreamento': return 'Onde rastreio meu pedido?';
          case 'Preço': return 'Quanto custa?';
          case 'Cores': return 'Quais cores disponíveis?';
          case 'Tamanhos': return 'Qual tamanho devo usar?';
          case 'Pagamento': return 'Aceita pix?';
          case 'Frete': return 'Quanto tempo demora pra chegar?';
          case 'Trocas': return 'Posso trocar se não servir?';
          case 'Segurança': return 'O site é seguro?';
          case 'Uso e Indicações': return 'Posso usar pós lipo?';
          default: return `Sobre ${t.category}?`;
        }
      });
    return suggestions;
  }, [templates, isHandoverActive]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');

    const userBubble: ChatMessage = { id: Date.now().toString(), text: userMsg, sender: 'lead' };
    setMessages((prev) => [...prev, userBubble]);

    // If handover is active, bot doesn't respond
    if (isHandoverActive) return;

    setIsTyping(true);

    const { data: config } = await supabase.from('store_config').select('*').limit(1).maybeSingle();

    const dicts = keywords.length > 0 ? keywords : undefined;
    const result = classifyMessage(userMsg, dicts);

    const tpls = templates.length > 0
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
        channel: platform === 'whatsapp' ? 'simulator_whatsapp' : 'simulator_instagram',
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
        channel: platform === 'whatsapp' ? 'simulator_whatsapp' : 'simulator_instagram',
        category: [...messages].reverse().find((m) => m.category)?.category || null,
        status: 'waiting',
      });

      await supabase.from('interaction_logs').update({ clicked_buy: true }).eq('contact_name', contactName);
    }

    // Activate handover mode
    setIsHandoverActive(true);

    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: '🛒 Quero comprar!', sender: 'lead' },
      {
        id: (Date.now() + 1).toString(),
        text: 'Perfeito! Um de nossos atendentes humanos vai finalizar seu pedido agora mesmo. Aguarde um instante enquanto verifico o estoque. 🎉',
        sender: 'system',
      },
    ]);

    toast({ title: '🔔 Novo lead na fila!', description: `${contactName} clicou em "Quero comprar"` });
  };

  const resetChat = () => {
    setMessages([{ id: '0', text: 'Olá! Bem-vinda à Silouete. Como posso ajudar hoje? 👋', sender: 'system' }]);
    setIsHandoverActive(false);
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)]">
      {/* Left panel - Instructions & Suggestions */}
      <div className="flex-1 space-y-4 flex flex-col lg:max-w-xs">
        <div>
          <h2 className="text-lg font-bold">Simulador de Chat</h2>
          <p className="text-sm text-muted-foreground mt-1">
            Teste como o bot responde nos diferentes canais.
          </p>
        </div>

        {/* Platform Toggle */}
        <div className="flex bg-muted p-1 rounded-lg w-fit">
          <button
            onClick={() => setPlatform('whatsapp')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              platform === 'whatsapp' ? 'bg-card text-green-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <MessageCircle className="h-4 w-4" /> WhatsApp
          </button>
          <button
            onClick={() => setPlatform('instagram')}
            className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${
              platform === 'instagram' ? 'bg-card text-pink-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
            </svg>
            Instagram
          </button>
        </div>

        {/* Handover indicator */}
        {isHandoverActive && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <UserCheck className="h-4 w-4" />
            <span className="font-medium">Atendimento humano ativo</span>
          </div>
        )}

        {/* Dynamic Suggestions */}
        {!isHandoverActive && dynamicSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Sugestões</p>
            <div className="grid grid-cols-1 gap-2">
              {dynamicSuggestions.map((suggestion, i) => (
                <button
                  key={i}
                  onClick={() => setInput(suggestion)}
                  className="text-left p-2.5 rounded-lg border bg-card hover:border-primary hover:text-primary transition-colors text-sm"
                >
                  "{suggestion}"
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Right panel - Chat */}
      <Card className="flex-[2] flex flex-col overflow-hidden">
        <CardHeader className="flex flex-row items-center justify-between pb-3 border-b">
          <div className="flex items-center gap-2">
            <div className={`w-2.5 h-2.5 rounded-full ${platform === 'whatsapp' ? 'bg-green-500' : 'bg-pink-500'}`} />
            <CardTitle className="text-base">
              {platform === 'whatsapp' ? 'WhatsApp' : 'Instagram'} — Silouete
            </CardTitle>
            {isHandoverActive && <Badge variant="outline" className="text-amber-600 border-amber-300">Humano</Badge>}
          </div>
          <Button variant="ghost" size="sm" onClick={resetChat}>
            <RotateCcw className="mr-1 h-4 w-4" /> Reiniciar
          </Button>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div className={`flex-1 space-y-3 overflow-y-auto px-4 py-2 ${
            platform === 'whatsapp' ? 'bg-[#e5ddd5]/30' : 'bg-gradient-to-b from-background to-muted/20'
          }`}>
            {messages.map((msg) => (
              <div key={msg.id}>
                <div className={`flex ${msg.sender === 'lead' ? 'justify-start' : 'justify-end'}`}>
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-line ${
                      msg.sender === 'lead'
                        ? 'rounded-bl-sm bg-muted'
                        : platform === 'whatsapp'
                          ? 'rounded-br-sm bg-[#dcf8c6] text-foreground'
                          : 'rounded-br-sm bg-primary text-primary-foreground'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
                {msg.showBuyButton && !isHandoverActive && (
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
                <div className={`rounded-2xl rounded-br-sm px-4 py-2.5 text-sm ${
                  platform === 'whatsapp' ? 'bg-[#dcf8c6] text-foreground' : 'bg-primary/80 text-primary-foreground'
                }`}>
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
                placeholder={isHandoverActive ? 'Atendimento humano ativo...' : 'Digite uma mensagem...'}
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
    </div>
  );
}
