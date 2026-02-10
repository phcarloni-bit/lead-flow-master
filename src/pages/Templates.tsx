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
import { Save, Sparkles, Loader2, Instagram, Globe } from 'lucide-react';

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
  const [url, setUrl] = useState('https://www.instagram.com/siloueteshapewear');
  const [isGenerating, setIsGenerating] = useState(false);

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
    if (!url.trim()) {
      toast({ title: 'URL obrigatória', description: 'Digite a URL do Instagram ou site da loja.', variant: 'destructive' });
      return;
    }

    setIsGenerating(true);
    try {
      const { data, error } = await supabase.functions.invoke('generate-templates', {
        body: { url: url.trim() },
      });

      if (error) {
        throw new Error(error.message || 'Erro ao gerar templates');
      }

      if (data?.error) {
        toast({ title: 'Erro da IA', description: data.error, variant: 'destructive' });
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

  const saveAll = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { toast({ title: 'Erro', description: 'Faça login para salvar', variant: 'destructive' }); return; }

    // Delete existing and re-insert
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
      // Also save keywords if available
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
    <div className="space-y-4">
      {/* AI Import Section */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="h-5 w-5 text-primary" />
            <h3 className="font-semibold text-sm">Importar do Instagram / Site</h3>
          </div>
          <p className="text-xs text-muted-foreground mb-3">
            Digite a URL do perfil do Instagram ou site. A IA irá buscar informações públicas para gerar os templates automaticamente.
          </p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                {url.includes('instagram') ? <Instagram className="h-4 w-4" /> : <Globe className="h-4 w-4" />}
              </div>
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                className="pl-9"
                placeholder="https://www.instagram.com/sua_loja"
                disabled={isGenerating}
              />
            </div>
            <Button onClick={handleGenerateWithAI} disabled={isGenerating}>
              {isGenerating ? (
                <>
                  <Loader2 className="mr-1 h-4 w-4 animate-spin" /> Analisando...
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

      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-muted-foreground">
            Variáveis disponíveis: <code className="rounded bg-muted px-1">{'{{preco}}'}</code>{' '}
            <code className="rounded bg-muted px-1">{'{{cores_disponiveis}}'}</code>{' '}
            <code className="rounded bg-muted px-1">{'{{link_produto}}'}</code>
          </p>
        </div>
        <Button onClick={saveAll}>
          <Save className="mr-1 h-4 w-4" /> Salvar Todos
        </Button>
      </div>

      {templates.map((t, i) => (
        <Card key={t.id}>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base">{t.category}</CardTitle>
              <Badge variant={t.is_active ? 'default' : 'secondary'}>{t.is_active ? 'Ativo' : 'Inativo'}</Badge>
            </div>
            <Switch checked={t.is_active} onCheckedChange={(v) => updateTemplate(i, 'is_active', v)} />
          </CardHeader>
          <CardContent className="space-y-3">
            {t.keywords && t.keywords.length > 0 && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Palavras-chave:</p>
                <div className="flex flex-wrap gap-1">
                  {t.keywords.map((k, ki) => (
                    <Badge key={ki} variant="outline" className="text-xs">{k}</Badge>
                  ))}
                </div>
              </div>
            )}
            <Textarea
              value={t.response_text}
              onChange={(e) => updateTemplate(i, 'response_text', e.target.value)}
              rows={3}
              placeholder="Digite a resposta automática..."
            />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
