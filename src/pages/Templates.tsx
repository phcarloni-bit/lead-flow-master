import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TEMPLATES } from '@/lib/classification-engine';
import { toast } from '@/hooks/use-toast';
import { Save, Sparkles, Loader2, Instagram, Globe, AlertCircle, RotateCcw } from 'lucide-react';

interface Template {
  id: string;
  category: string;
  response_text: string;
  is_active: boolean;
  keywords?: string[];
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [url, setUrl] = useState('https://www.silouete.com.br/');

  const fetchTemplates = async () => {
    const { data } = await supabase.from('templates').select('*').order('category');
    if (data && data.length > 0) {
      setTemplates(data);
    } else {
      setTemplates(DEFAULT_TEMPLATES.map((t, i) => ({ ...t, id: `default-${i}` })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

  const handleGenerateWithAI = async () => {
    setIsGenerating(true);
    try {
      const urls = [url];
      if (!url.includes('instagram')) {
        urls.push('https://www.instagram.com/siloueteshapewear');
      }

      const { data, error } = await supabase.functions.invoke('generate-templates', {
        body: { urls },
      });

      if (error) {
        const status = (error as any)?.status || (error as any)?.context?.status;
        if (status === 429) {
          toast({ title: '⏳ Limite de requisições', description: 'Muitas requisições seguidas. Aguarde alguns minutos e tente novamente.', variant: 'destructive' });
          return;
        }
        if (status === 402) {
          toast({ title: '💳 Créditos esgotados', description: 'Seus créditos de IA acabaram. Adicione mais créditos ao workspace para continuar.', variant: 'destructive' });
          return;
        }
        throw new Error(error.message || 'Erro ao gerar templates');
      }

      if (data?.error) {
        if (data.error.includes('Limite de requisições') || data.error.includes('rate')) {
          toast({ title: '⏳ Limite de requisições', description: 'Muitas requisições seguidas. Aguarde alguns minutos e tente novamente.', variant: 'destructive' });
        } else if (data.error.includes('Créditos') || data.error.includes('créditos')) {
          toast({ title: '💳 Créditos esgotados', description: 'Seus créditos de IA acabaram. Adicione mais créditos ao workspace para continuar.', variant: 'destructive' });
        } else {
          toast({ title: 'Erro da IA', description: data.error, variant: 'destructive' });
        }
        return;
      }

      if (data?.templates) {
        const generated: Template[] = data.templates.map((t: Template & { keywords?: string[] }, i: number) => ({
          id: `ai-${i}`,
          category: t.category,
          response_text: t.response_text,
          is_active: t.is_active,
          keywords: t.keywords,
        }));

        setTemplates(generated);
        toast({ title: 'Templates gerados! ✨', description: 'Revise os textos e clique em "Salvar Todos" para persistir.' });
      }
    } catch (err) {
      console.error(err);
      toast({ title: 'Erro', description: err instanceof Error ? err.message : 'Erro ao gerar templates', variant: 'destructive' });
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRestoreDefaults = () => {
    if (window.confirm('Isso irá restaurar todos os textos originais da Silouete (Prazos, 12x Sem Juros, etc). Suas edições atuais serão perdidas. Confirmar?')) {
      setTemplates(DEFAULT_TEMPLATES.map((t, i) => ({ ...t, id: `default-${i}` })));
      toast({ title: 'Padrões restaurados', description: 'Templates originais da Silouete foram carregados. Salve para persistir.' });
    }
  };

  const saveAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: 'Erro', description: 'Faça login para salvar', variant: 'destructive' }); return; }

    await supabase.from('templates').delete().eq('user_id', user.id);

    const rows = templates.map((t) => ({
      user_id: user.id,
      category: t.category,
      response_text: t.response_text,
      is_active: t.is_active,
    }));

    const { error } = await supabase.from('templates').insert(rows);
    if (error) {
      toast({ title: 'Erro ao salvar', description: error.message, variant: 'destructive' });
    } else {
      const keywordTemplates = templates.filter(t => t.keywords && t.keywords.length > 0);
      if (keywordTemplates.length > 0) {
        await supabase.from('keyword_dictionaries').delete().eq('user_id', user.id);
        const keywordRows = keywordTemplates.map(t => ({
          user_id: user.id,
          category: t.category,
          keywords: t.keywords!,
        }));
        await supabase.from('keyword_dictionaries').insert(keywordRows);
      }

      toast({ title: 'Templates salvos!', description: 'Suas respostas e palavras-chave foram atualizadas.' });
      fetchTemplates();
    }
  };

  const updateTemplate = (index: number, field: keyof Template, value: string | boolean) => {
    setTemplates((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-start">
        <div>
          <h2 className="text-2xl font-bold">Respostas Automáticas</h2>
          <p className="text-muted-foreground text-sm">Configure o que o bot responde para cada tipo de dúvida.</p>
        </div>
        <Button onClick={saveAll}>
          <Save className="mr-1 h-4 w-4" /> Salvar Todos
        </Button>
      </div>

      {/* AI Import Section */}
      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-accent/5">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4 items-end md:items-center justify-between">
            <div className="space-y-2 flex-1 w-full">
              <h3 className="flex items-center gap-2 font-semibold text-primary">
                <Sparkles className="h-5 w-5" />
                Importar do Instagram / Site
              </h3>
              <p className="text-xs text-muted-foreground">
                Digite a URL do perfil do Instagram ou Site. A IA irá raciocinar sobre as informações públicas para configurar o bot.
              </p>
              <div className="relative flex-1">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {url.includes('instagram') ? <Instagram className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
                </div>
                <Input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="pl-9"
                  placeholder="https://www.instagram.com/sua_loja"
                />
              </div>
            </div>
            <Button onClick={handleGenerateWithAI} disabled={isGenerating} className="h-10 whitespace-nowrap">
              {isGenerating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Pensando...
                </>
              ) : (
                <>
                  <Sparkles className="mr-1 h-4 w-4" /> Gerar com IA
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* CTA Banner + Restaurar Padrões */}
      <div className="flex items-center justify-between bg-muted/50 p-4 rounded-lg border">
        <div className="flex items-center gap-3 text-sm text-muted-foreground">
          <AlertCircle className="shrink-0 h-5 w-5 text-yellow-500" />
          <p>Todas as respostas incluirão o botão <strong className="text-foreground">"Quero Comprar"</strong> automaticamente.</p>
        </div>
        <Button variant="link" size="sm" onClick={handleRestoreDefaults} className="text-xs gap-1 shrink-0">
          <RotateCcw className="h-3 w-3" />
          Restaurar Padrões Silouete
        </Button>
      </div>

      <p className="text-sm text-muted-foreground">
        Variáveis disponíveis: <code className="rounded bg-muted px-1">{'{{preco}}'}</code>{' '}
        <code className="rounded bg-muted px-1">{'{{cores_disponiveis}}'}</code>{' '}
        <code className="rounded bg-muted px-1">{'{{link_produto}}'}</code>
      </p>

      {/* Grid 2 colunas */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {templates.map((t, i) => (
          <Card key={t.id} className={!t.is_active ? 'opacity-70' : ''}>
            <CardHeader className="flex flex-row items-center justify-between pb-2 bg-muted/30 rounded-t-lg">
              <div className="flex items-center gap-2">
                <span className={`h-2 w-2 rounded-full ${t.is_active ? 'bg-green-500' : 'bg-muted-foreground/30'}`} />
                <CardTitle className="text-base">{t.category}</CardTitle>
              </div>
              <Switch checked={t.is_active} onCheckedChange={(v) => updateTemplate(i, 'is_active', v)} />
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-medium">Palavras-chave</p>
                <div className="flex flex-wrap gap-1">
                  {t.keywords && t.keywords.length > 0 ? (
                    t.keywords.map((k, ki) => (
                      <Badge key={ki} variant="outline" className="text-xs">{k}</Badge>
                    ))
                  ) : (
                    <span className="text-muted-foreground text-xs italic">Nenhuma (Padrão)</span>
                  )}
                </div>
              </div>
              <div>
                <p className="text-xs text-muted-foreground mb-1 uppercase font-medium">Mensagem</p>
                <Textarea
                  value={t.response_text}
                  onChange={(e) => updateTemplate(i, 'response_text', e.target.value)}
                  disabled={!t.is_active}
                  rows={4}
                  placeholder="Digite a resposta automática..."
                />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
