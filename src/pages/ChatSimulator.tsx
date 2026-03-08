import { useState, useRef, useEffect, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { classifyMessage, buildResponse, DEFAULT_TEMPLATES } from '@/lib/classification-engine';
import { Send, ShoppingCart, RotateCcw, MessageCircle, UserCheck, ArrowLeft, MoreVertical, Phone, Video, Info, Heart } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

interface ChatMessage {
  id: string;
  text: string;
  sender: 'lead' | 'system';
  category?: string | null;
  showBuyButton?: boolean;
  timestamp: Date;
}

type Platform = 'whatsapp' | 'instagram';

export default function ChatSimulator() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    { id: '0', text: 'Olá! Bem-vinda à Silouete. Como posso ajudar hoje? 👋', sender: 'system', timestamp: new Date() },
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

  useEffect(() => {
    const load = async () => {
      const { data: tpls } = await supabase.from('templates').select('*');
      const { data: kws } = await supabase.from('keyword_dictionaries').select('*');
      if (tpls && tpls.length > 0) setTemplates(tpls);
      if (kws && kws.length > 0) setKeywords(kws.map((k) => ({ category: k.category, keywords: k.keywords })));
    };
    load();
  }, []);

  const dynamicSuggestions = useMemo(() => {
    if (isHandoverActive) return [];
    const tpls = templates.length > 0 ? templates : DEFAULT_TEMPLATES;
    return tpls
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
  }, [templates, isHandoverActive]);

  const sendMessage = async () => {
    if (!input.trim()) return;
    const userMsg = input.trim();
    setInput('');

    const userBubble: ChatMessage = { id: Date.now().toString(), text: userMsg, sender: 'lead', timestamp: new Date() };
    setMessages((prev) => [...prev, userBubble]);

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

    setMessages((prev) => [...prev, {
      id: (Date.now() + 1).toString(),
      text: responseText,
      sender: 'system',
      category: result.category,
      showBuyButton: true,
      timestamp: new Date(),
    }]);
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

    setIsHandoverActive(true);
    const now = new Date();
    setMessages((prev) => [
      ...prev,
      { id: Date.now().toString(), text: '🛒 Quero comprar!', sender: 'lead', timestamp: now },
      { id: (Date.now() + 1).toString(), text: 'Perfeito! Um de nossos atendentes humanos vai finalizar seu pedido agora mesmo. Aguarde um instante enquanto verifico o estoque. 🎉', sender: 'system', timestamp: new Date(now.getTime() + 1000) },
    ]);
    toast({ title: '🔔 Novo lead na fila!', description: `${contactName} clicou em "Quero comprar"` });
  };

  const resetChat = () => {
    if (window.confirm('Limpar conversa atual?')) {
      setMessages([{ id: '0', text: 'Olá! Bem-vinda à Silouete. Como posso ajudar hoje? 👋', sender: 'system', timestamp: new Date() }]);
      setIsHandoverActive(false);
    }
  };

  const formatTime = (date: Date) => date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  return (
    <div className="flex flex-col lg:flex-row gap-6 h-[calc(100vh-10rem)] animate-in fade-in duration-500">
      {/* Left panel */}
      <div className="flex-1 space-y-4 flex flex-col lg:max-w-xs">
        <div>
          <h2 className="text-lg font-bold">Simulador de Chat</h2>
          <p className="text-sm text-muted-foreground mt-1">Teste como o bot responde nos diferentes canais.</p>
        </div>

        {/* Platform Toggle */}
        <div className="flex items-center justify-between">
          <div className="flex bg-muted p-1 rounded-lg w-fit">
            <button
              onClick={() => setPlatform('whatsapp')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${platform === 'whatsapp' ? 'bg-card text-green-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <MessageCircle className="h-4 w-4" /> WhatsApp
            </button>
            <button
              onClick={() => setPlatform('instagram')}
              className={`px-3 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-1.5 ${platform === 'instagram' ? 'bg-card text-pink-600 shadow-sm' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
              </svg>
              Instagram
            </button>
          </div>
          <button onClick={resetChat} className="text-muted-foreground hover:text-destructive transition-colors p-2 rounded-full hover:bg-destructive/10" title="Reiniciar conversa">
            <RotateCcw className="h-5 w-5" />
          </button>
        </div>

        {isHandoverActive && (
          <div className="flex items-center gap-2 p-3 rounded-lg bg-amber-50 border border-amber-200 text-amber-800 text-sm">
            <UserCheck className="h-4 w-4" />
            <span><strong>Modo Humano Ativo:</strong> O bot parou de responder. Reinicie para testar novamente.</span>
          </div>
        )}

        {!isHandoverActive && dynamicSuggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-semibold text-muted-foreground uppercase">Sugestões (Templates Ativos)</p>
            <div className="grid grid-cols-2 gap-2">
              {dynamicSuggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)} className="text-left p-2.5 rounded-lg border bg-card hover:border-primary hover:text-primary transition-colors text-sm">
                  "{s}"
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="bg-muted/50 p-4 rounded-xl border text-sm text-muted-foreground mt-auto">
          <h4 className="font-semibold mb-2 text-foreground">Lógica do Bot:</h4>
          <ul className="list-disc list-inside space-y-1">
            <li>Identifica intenção (Preço, Frete, etc).</li>
            <li>Responde personalizado para <strong>Silouete</strong>.</li>
            <li>Botão "Quero comprar" ativa o <strong>Transbordo</strong>.</li>
          </ul>
        </div>
        <p className="text-xs text-muted-foreground text-center">Ambiente seguro de teste. Nenhuma mensagem real é enviada.</p>
      </div>

      {/* Phone Mockup */}
      <div className="flex-none flex justify-center w-full lg:w-[400px]">
        <div className="w-[350px] h-[700px] bg-gray-900 rounded-[3rem] p-3 shadow-2xl relative border-4 border-gray-800">
          {/* Notch */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-40 h-6 bg-gray-900 rounded-b-xl z-20" />

          {/* Screen */}
          <div className={`w-full h-full rounded-[2.2rem] overflow-hidden flex flex-col relative z-10 ${platform === 'whatsapp' ? 'bg-[#e5ddd5]' : 'bg-white'}`}>

            {/* Header */}
            <div className={`p-4 pt-8 flex items-center justify-between shadow-md transition-colors duration-300 ${platform === 'whatsapp' ? 'bg-[#075E54] text-white' : 'bg-white text-foreground border-b'}`}>
              <div className="flex items-center gap-3">
                <ArrowLeft className={`h-5 w-5 ${platform === 'instagram' ? 'text-foreground' : 'text-white'}`} />
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold ${platform === 'whatsapp' ? 'bg-white/20 text-white' : 'bg-muted text-foreground'}`}>
                  S
                </div>
                <div>
                  <h3 className="text-sm font-bold">Silouete</h3>
                  <p className={`text-[10px] ${platform === 'whatsapp' ? 'text-white/80' : 'text-muted-foreground'}`}>
                    {platform === 'whatsapp' ? 'Online agora' : 'Active now'}
                  </p>
                </div>
              </div>
              <div className="flex gap-3">
                <Phone className={`h-5 w-5 ${platform === 'instagram' ? 'text-foreground' : 'text-white'}`} />
                <Video className={`h-5 w-5 ${platform === 'instagram' ? 'text-foreground' : 'text-white'}`} />
                {platform === 'whatsapp' ? <MoreVertical className="h-5 w-5 text-white" /> : <Info className="h-5 w-5 text-foreground" />}
              </div>
            </div>

            {/* Chat Area */}
            <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${platform === 'whatsapp' ? "bg-[#e5ddd5]" : "bg-white"}`}>
              {platform === 'instagram' && (
                <div className="text-center text-[10px] text-muted-foreground my-2">Hoje {formatTime(new Date())}</div>
              )}

              {messages.map((msg, idx) => (
                <div key={msg.id} className={`flex flex-col ${msg.sender === 'lead' ? 'items-end' : 'items-start'}`}>
                  <div className={`max-w-[80%] p-3 text-[13px] relative shadow-sm ${
                    platform === 'whatsapp'
                      ? (msg.sender === 'lead' ? 'bg-[#E7FFDB] text-gray-800 rounded-lg rounded-tr-none' : 'bg-white text-gray-800 rounded-lg rounded-tl-none')
                      : (msg.sender === 'lead' ? 'bg-[#3797F0] text-white rounded-[22px] rounded-br-sm' : 'bg-[#EFEFEF] text-black rounded-[22px] rounded-bl-sm')
                  }`}>
                    <span className="whitespace-pre-line">{msg.text}</span>
                    {platform === 'whatsapp' && (
                      <div className="text-[9px] text-gray-400 text-right mt-1 flex justify-end gap-1">
                        {formatTime(msg.timestamp)}
                        {msg.sender === 'lead' && <span>✓✓</span>}
                      </div>
                    )}
                  </div>

                  {msg.showBuyButton && !isHandoverActive && (
                    <button
                      onClick={handleBuyClick}
                      className={`mt-2 font-semibold text-[13px] py-2 px-4 rounded-lg shadow-sm w-[80%] border-l-4 active:scale-95 transition-transform animate-pulse ${
                        platform === 'whatsapp'
                          ? 'bg-white text-[#075E54] border-[#25D366] hover:bg-gray-50'
                          : 'bg-gray-100 text-[#3797F0] border-[#3797F0] hover:bg-gray-200'
                      }`}
                    >
                      🛍️ Quero comprar
                    </button>
                  )}

                  {platform === 'instagram' && msg.sender === 'lead' && idx === messages.length - 1 && !isTyping && (
                    <div className="text-[10px] text-muted-foreground mt-1 mr-1">Seen</div>
                  )}
                </div>
              ))}

              {isHandoverActive && (
                <div className="flex justify-center my-3">
                  <span className="bg-muted text-muted-foreground text-[10px] px-3 py-1 rounded-full flex items-center gap-1">
                    <UserCheck className="h-2.5 w-2.5" /> Atendimento humano solicitado
                  </span>
                </div>
              )}

              {isTyping && (
                <div className={`flex items-start`}>
                  <div className={`p-3 w-16 shadow-sm ${platform === 'whatsapp' ? 'bg-white rounded-lg rounded-tl-none' : 'bg-[#EFEFEF] rounded-[22px]'}`}>
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            {/* Input Area */}
            <div className={`p-3 flex items-center gap-2 ${platform === 'whatsapp' ? 'bg-[#f0f2f5]' : 'bg-white border-t'}`}>
              <div className={`flex-1 flex items-center px-4 py-2 rounded-full ${platform === 'whatsapp' ? 'bg-white' : 'bg-gray-100'}`}>
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
                  placeholder={isHandoverActive ? 'Humano ativo...' : platform === 'whatsapp' ? 'Mensagem' : 'Message...'}
                  className="flex-1 bg-transparent text-sm focus:outline-none"
                  disabled={isTyping}
                />
              </div>
              {input.length > 0 ? (
                <button
                  onClick={sendMessage}
                  disabled={isTyping}
                  className={`p-2.5 rounded-full transition-opacity disabled:opacity-50 ${platform === 'whatsapp' ? 'bg-[#00a884] text-white' : ''}`}
                >
                  {platform === 'whatsapp' ? <Send className="h-4 w-4" /> : <span className="text-[#3797F0] font-semibold text-sm">Send</span>}
                </button>
              ) : (
                <>
                  {platform === 'instagram' && <Heart className="h-6 w-6 text-foreground" />}
                  {platform === 'whatsapp' && (
                    <button className="bg-[#00a884] p-2.5 rounded-full text-white" onClick={sendMessage}>
                      <Send className="h-4 w-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
