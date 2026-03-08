import { useState } from 'react';
import { ArrowRight, Sparkles, Globe, CheckCircle2, Loader2, Play, PenTool, Zap } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

interface GeneratedTemplate {
  category: string;
  response_text: string;
  is_active: boolean;
  keywords: string[];
}

interface OnboardingWizardProps {
  onComplete: () => void;
  onSkip: () => void;
}

export default function OnboardingWizard({ onComplete, onSkip }: OnboardingWizardProps) {
  const [step, setStep] = useState(1);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [generatedData, setGeneratedData] = useState<GeneratedTemplate[] | null>(null);

  const handleAnalyze = async () => {
    if (!url.trim()) return;
    setIsLoading(true);
    setError('');

    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Não autenticado');

      const { data, error: fnError } = await supabase.functions.invoke('generate-templates', {
        body: { urls: [url.trim()] },
      });

      if (fnError) throw fnError;
      if (!data?.templates?.length) throw new Error('Nenhum template gerado');

      const templates = data.templates as GeneratedTemplate[];
      setGeneratedData(templates);

      // Save templates to DB
      const templateRows = templates.map((t) => ({
        user_id: user.id,
        category: t.category,
        response_text: t.response_text,
        is_active: t.is_active,
      }));

      // Delete existing and insert new
      await supabase.from('templates').delete().eq('user_id', user.id);
      await supabase.from('templates').insert(templateRows);

      // Save keywords
      const keywordRows = templates
        .filter((t) => t.keywords?.length)
        .map((t) => ({
          user_id: user.id,
          category: t.category,
          keywords: t.keywords,
        }));
      await supabase.from('keyword_dictionaries').delete().eq('user_id', user.id);
      if (keywordRows.length) await supabase.from('keyword_dictionaries').insert(keywordRows);

      // Save store URL
      const { data: existingConfig } = await supabase
        .from('store_config')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (existingConfig) {
        await supabase.from('store_config').update({ product_link: url.trim() }).eq('id', existingConfig.id);
      } else {
        await supabase.from('store_config').insert({ user_id: user.id, product_link: url.trim() });
      }

      setStep(3);
    } catch (err: any) {
      console.error(err);
      const msg = err?.message || '';
      if (msg.includes('429') || msg.includes('rate')) {
        setError('Limite de requisições excedido. Tente novamente em 1 minuto.');
      } else if (msg.includes('402')) {
        setError('Créditos de IA esgotados.');
      } else {
        setError('Não conseguimos analisar essa URL. Verifique se o link está correto.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const finish = () => {
    toast({ title: 'Configuração concluída!', description: `${generatedData?.length || 0} templates gerados com IA.` });
    onComplete();
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-background/80 backdrop-blur-md animate-in fade-in duration-500 p-4">
      <div className="bg-card w-full max-w-3xl rounded-[2rem] shadow-2xl overflow-hidden relative flex flex-col max-h-[90vh] border border-border ring-1 ring-border/50">
        {/* Progress Bar */}
        <div className="h-1 bg-muted w-full shrink-0">
          <div
            className="h-full bg-primary transition-all duration-1000 ease-in-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>

        <div className="p-8 md:p-16 text-center overflow-y-auto flex flex-col justify-center min-h-[500px]">
          {/* STEP 1: CHOICE */}
          {step === 1 && (
            <div className="space-y-10 animate-in zoom-in duration-500">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl font-semibold text-foreground tracking-tighter" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>
                  Olá.
                </h1>
                <p className="text-xl text-muted-foreground font-light">
                  Como você gostaria de configurar seu especialista virtual?
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto pt-4">
                {/* Option A: Magic */}
                <button
                  onClick={() => setStep(2)}
                  className="group relative bg-sidebar text-sidebar-foreground p-8 rounded-3xl text-left hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 overflow-hidden"
                >
                  <div className="absolute top-0 right-0 p-32 bg-sidebar-primary/5 rounded-full blur-3xl -mr-16 -mt-16 transition-transform group-hover:scale-150 duration-700" />
                  <div className="relative z-10 h-full flex flex-col justify-between">
                    <div className="w-12 h-12 bg-sidebar-accent rounded-2xl flex items-center justify-center mb-6">
                      <Sparkles size={24} className="text-yellow-300" />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Importar Inteligência</h3>
                      <p className="text-sidebar-foreground/70 text-sm leading-relaxed">
                        Cole o link do seu Instagram ou Site. A IA cria todos os scripts de venda em segundos.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center text-sm font-medium text-yellow-300 gap-2 opacity-80 group-hover:opacity-100">
                      Recomendado <ArrowRight size={16} />
                    </div>
                  </div>
                </button>

                {/* Option B: Manual */}
                <button
                  onClick={onSkip}
                  className="group bg-card border border-border text-foreground p-8 rounded-3xl text-left hover:shadow-xl hover:border-primary/20 transition-all duration-300"
                >
                  <div className="h-full flex flex-col justify-between">
                    <div className="w-12 h-12 bg-muted rounded-2xl flex items-center justify-center mb-6 text-muted-foreground group-hover:text-primary group-hover:bg-primary/10 transition-colors">
                      <PenTool size={24} />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold mb-2">Configuração Manual</h3>
                      <p className="text-muted-foreground text-sm leading-relaxed">
                        Comece com modelos padrão e edite cada resposta manualmente no painel.
                      </p>
                    </div>
                    <div className="mt-6 flex items-center text-sm font-medium text-muted-foreground group-hover:text-foreground gap-2 transition-colors">
                      Iniciar Manualmente <ArrowRight size={16} />
                    </div>
                  </div>
                </button>
              </div>
            </div>
          )}

          {/* STEP 2: INPUT URL */}
          {step === 2 && (
            <div className="space-y-8 animate-in slide-in-from-right-8 duration-500 max-w-xl mx-auto">
              <div className="text-left space-y-2">
                <button onClick={() => setStep(1)} className="text-sm text-muted-foreground hover:text-foreground flex items-center gap-1 mb-4 transition-colors">
                  ← Voltar
                </button>
                <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Qual é a sua loja?</h2>
                <p className="text-muted-foreground">Cole o endereço para a IA ler as informações públicas.</p>
              </div>

              <div className="relative group">
                <div className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-primary transition-colors">
                  <Globe size={20} />
                </div>
                <input
                  type="text"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="ex: instagram.com/minhaloja"
                  className="w-full pl-12 pr-4 py-5 text-lg border-2 border-border rounded-2xl focus:border-primary focus:ring-4 focus:ring-ring/20 outline-none transition-all bg-muted focus:bg-card placeholder:text-muted-foreground/50"
                  onKeyDown={(e) => e.key === 'Enter' && handleAnalyze()}
                  autoFocus
                />
              </div>

              {error && (
                <div className="bg-destructive/10 text-destructive p-4 rounded-xl text-sm flex items-center gap-2">
                  <div className="w-1.5 h-1.5 bg-destructive rounded-full" />
                  {error}
                </div>
              )}

              <div className="pt-4">
                {isLoading ? (
                  <button disabled className="w-full bg-primary/10 text-primary py-4 rounded-2xl font-medium flex items-center justify-center gap-3 cursor-wait">
                    <Loader2 size={20} className="animate-spin" />
                    Analisando seu negócio...
                  </button>
                ) : (
                  <button
                    onClick={handleAnalyze}
                    disabled={!url.trim()}
                    className="w-full bg-primary text-primary-foreground py-4 rounded-2xl text-lg font-medium hover:bg-primary/90 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-primary/20 active:scale-[0.98]"
                  >
                    Gerar Inteligência
                  </button>
                )}
                <p className="text-center text-xs text-muted-foreground/50 mt-4">
                  Powered by Lovable AI
                </p>
              </div>
            </div>
          )}

          {/* STEP 3: SUCCESS */}
          {step === 3 && (
            <div className="space-y-8 animate-in zoom-in duration-500 flex flex-col items-center">
              <div className="w-24 h-24 bg-accent/10 text-accent rounded-full flex items-center justify-center mx-auto mb-2 animate-bounce shadow-sm">
                <CheckCircle2 size={48} />
              </div>

              <div className="space-y-2">
                <h2 className="text-3xl font-bold text-foreground" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>Configuração Concluída.</h2>
                <p className="text-muted-foreground max-w-md mx-auto">
                  A IA gerou <strong>{generatedData?.length} modelos</strong> personalizados com o tom de voz da sua marca.
                </p>
              </div>

              <div className="bg-card p-6 rounded-2xl text-left max-w-lg mx-auto border border-border shadow-xl shadow-muted/50 w-full relative overflow-hidden">
                <div className="absolute top-0 left-0 w-1 h-full bg-accent" />
                <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3 flex items-center gap-1">
                  <Zap size={12} className="fill-current" />
                  Exemplo de Resposta Gerada
                </p>
                <p className="text-muted-foreground italic leading-relaxed">"{generatedData?.[0]?.response_text}"</p>
              </div>

              <div className="pt-6 w-full max-w-xs">
                <button
                  onClick={finish}
                  className="w-full bg-sidebar text-sidebar-foreground py-4 rounded-2xl text-lg font-medium hover:opacity-90 transition-all shadow-xl active:scale-[0.98] flex items-center justify-center gap-2"
                >
                  <Play size={20} className="fill-current" />
                  Ir para o Painel
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
