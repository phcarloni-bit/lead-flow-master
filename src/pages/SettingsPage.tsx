import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import { Save, Wifi, WifiOff } from 'lucide-react';

const CATEGORIES = ['Preço', 'Cores', 'Tamanhos', 'Pagamento', 'Frete', 'Outro'];

const DEFAULT_KEYWORDS: Record<string, string[]> = {
  Preço: ['preço', 'quanto custa', 'valor', 'quanto é', 'desconto', 'promoção', 'oferta'],
  Cores: ['cor', 'cores', 'colorido', 'preto', 'branco', 'azul', 'vermelho', 'rosa'],
  Tamanhos: ['tamanho', 'tamanhos', 'número', 'medida', 'grande', 'pequeno'],
  Pagamento: ['pagamento', 'pagar', 'parcela', 'pix', 'cartão', 'boleto'],
  Frete: ['frete', 'entrega', 'envio', 'prazo', 'correios', 'sedex'],
  Outro: [],
};

export default function SettingsPage() {
  const [storeName, setStoreName] = useState('');
  const [products, setProducts] = useState('');
  const [defaultPrice, setDefaultPrice] = useState('');
  const [availableColors, setAvailableColors] = useState('');
  const [productLink, setProductLink] = useState('');
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [keywords, setKeywords] = useState<Record<string, string>>(
    Object.fromEntries(CATEGORIES.map((c) => [c, (DEFAULT_KEYWORDS[c] || []).join(', ')]))
  );

  useEffect(() => {
    const load = async () => {
      const { data: config } = await supabase.from('store_config').select('*').limit(1).maybeSingle();
      if (config) {
        setStoreName(config.store_name);
        setProducts(config.products);
        setDefaultPrice(config.default_price);
        setAvailableColors(config.available_colors);
        setProductLink(config.product_link);
        setWhatsappToken(config.whatsapp_token || '');
        setWhatsappPhoneId(config.whatsapp_phone_id || '');
        setWhatsappConnected(config.whatsapp_connected);
        setNotificationsEnabled(config.notifications_enabled);
      }

      const { data: kws } = await supabase.from('keyword_dictionaries').select('*');
      if (kws && kws.length > 0) {
        const map: Record<string, string> = {};
        kws.forEach((k) => { map[k.category] = k.keywords.join(', '); });
        setKeywords((prev) => ({ ...prev, ...map }));
      }
    };
    load();
  }, []);

  const saveStore = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const payload = {
      user_id: user.id,
      store_name: storeName,
      products,
      default_price: defaultPrice,
      available_colors: availableColors,
      product_link: productLink,
      whatsapp_token: whatsappToken || null,
      whatsapp_phone_id: whatsappPhoneId || null,
      whatsapp_connected: whatsappConnected,
      notifications_enabled: notificationsEnabled,
    };

    const { data: existing } = await supabase.from('store_config').select('id').eq('user_id', user.id).maybeSingle();
    if (existing) {
      await supabase.from('store_config').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('store_config').insert(payload);
    }
    toast({ title: 'Configurações salvas!' });
  };

  const saveKeywords = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('keyword_dictionaries').delete().eq('user_id', user.id);
    const rows = CATEGORIES.map((cat) => ({
      user_id: user.id,
      category: cat,
      keywords: keywords[cat]?.split(',').map((k) => k.trim()).filter(Boolean) || [],
    }));
    await supabase.from('keyword_dictionaries').insert(rows);
    toast({ title: 'Palavras-chave salvas!' });
  };

  return (
    <Tabs defaultValue="store" className="space-y-4">
      <TabsList>
        <TabsTrigger value="store">Loja</TabsTrigger>
        <TabsTrigger value="keywords">Palavras-chave</TabsTrigger>
        <TabsTrigger value="whatsapp">WhatsApp</TabsTrigger>
        <TabsTrigger value="notifications">Notificações</TabsTrigger>
      </TabsList>

      <TabsContent value="store">
        <Card>
          <CardHeader>
            <CardTitle>Informações da Loja</CardTitle>
            <CardDescription>Esses dados são usados nos templates de resposta automática</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Nome da loja</Label>
              <Input value={storeName} onChange={(e) => setStoreName(e.target.value)} placeholder="Minha Loja" />
            </div>
            <div className="space-y-2">
              <Label>Produtos</Label>
              <Textarea value={products} onChange={(e) => setProducts(e.target.value)} placeholder="Descreva seus produtos..." />
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>Preço padrão (para {'{{preco}}'})</Label>
                <Input value={defaultPrice} onChange={(e) => setDefaultPrice(e.target.value)} placeholder="R$ 99,90" />
              </div>
              <div className="space-y-2">
                <Label>Cores disponíveis</Label>
                <Input value={availableColors} onChange={(e) => setAvailableColors(e.target.value)} placeholder="Preto, Branco, Azul" />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Link do produto</Label>
              <Input value={productLink} onChange={(e) => setProductLink(e.target.value)} placeholder="https://minhaloja.com/produto" />
            </div>
            <Button onClick={saveStore}><Save className="mr-1 h-4 w-4" /> Salvar</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="keywords">
        <Card>
          <CardHeader>
            <CardTitle>Dicionário de Palavras-chave</CardTitle>
            <CardDescription>Defina quais palavras ativam cada categoria (separadas por vírgula)</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {CATEGORIES.map((cat) => (
              <div key={cat} className="space-y-1">
                <Label>{cat}</Label>
                <Input
                  value={keywords[cat] || ''}
                  onChange={(e) => setKeywords((prev) => ({ ...prev, [cat]: e.target.value }))}
                  placeholder="palavra1, palavra2, palavra3"
                />
              </div>
            ))}
            <Button onClick={saveKeywords}><Save className="mr-1 h-4 w-4" /> Salvar Palavras-chave</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="whatsapp">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Integração WhatsApp Cloud API
              {whatsappConnected ? (
                <Badge className="bg-accent text-accent-foreground"><Wifi className="mr-1 h-3 w-3" /> Conectado</Badge>
              ) : (
                <Badge variant="secondary"><WifiOff className="mr-1 h-3 w-3" /> Desconectado</Badge>
              )}
            </CardTitle>
            <CardDescription>Configure quando tiver sua conta Meta Business verificada</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">Como configurar:</p>
              <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                <li>Acesse <strong>developers.facebook.com</strong></li>
                <li>Crie um app do tipo "Business"</li>
                <li>Adicione o produto "WhatsApp"</li>
                <li>Copie o <strong>Access Token</strong> (permanente)</li>
                <li>Copie o <strong>Phone Number ID</strong></li>
                <li>Cole nos campos abaixo e salve</li>
              </ol>
            </div>
            <div className="space-y-2">
              <Label>Access Token</Label>
              <Input type="password" value={whatsappToken} onChange={(e) => setWhatsappToken(e.target.value)} placeholder="EAAxxxxxxx..." />
            </div>
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input value={whatsappPhoneId} onChange={(e) => setWhatsappPhoneId(e.target.value)} placeholder="1234567890" />
            </div>
            <Button onClick={saveStore}><Save className="mr-1 h-4 w-4" /> Salvar Configuração</Button>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="notifications">
        <Card>
          <CardHeader>
            <CardTitle>Notificações</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Notificações do navegador</p>
                <p className="text-sm text-muted-foreground">Receba alertas quando um lead clicar "Quero comprar"</p>
              </div>
              <Switch checked={notificationsEnabled} onCheckedChange={setNotificationsEnabled} />
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
