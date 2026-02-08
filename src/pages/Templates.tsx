import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { DEFAULT_TEMPLATES } from '@/lib/classification-engine';
import { toast } from '@/hooks/use-toast';
import { Save } from 'lucide-react';

interface Template {
  id: string;
  category: string;
  response_text: string;
  is_active: boolean;
}

export default function Templates() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTemplates = async () => {
    const { data } = await supabase.from('templates').select('*').order('category');
    if (data && data.length > 0) {
      setTemplates(data);
    } else {
      // Seed defaults
      setTemplates(DEFAULT_TEMPLATES.map((t, i) => ({ ...t, id: `default-${i}` })));
    }
    setLoading(false);
  };

  useEffect(() => { fetchTemplates(); }, []);

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
      toast({ title: 'Templates salvos!', description: 'Suas respostas foram atualizadas.' });
      fetchTemplates();
    }
  };

  const updateTemplate = (index: number, field: keyof Template, value: string | boolean) => {
    setTemplates((prev) => prev.map((t, i) => (i === index ? { ...t, [field]: value } : t)));
  };

  if (loading) return <p className="text-muted-foreground">Carregando...</p>;

  return (
    <div className="space-y-4">
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
          <CardContent>
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
