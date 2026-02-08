
-- Templates de resposta por categoria
CREATE TABLE public.templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  response_text TEXT NOT NULL DEFAULT '',
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own templates" ON public.templates FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Dicionário de palavras-chave
CREATE TABLE public.keyword_dictionaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  category TEXT NOT NULL,
  keywords TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.keyword_dictionaries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own keywords" ON public.keyword_dictionaries FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Logs de interação
CREATE TABLE public.interaction_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL DEFAULT 'Simulador',
  channel TEXT NOT NULL DEFAULT 'simulator',
  message_received TEXT NOT NULL,
  category_assigned TEXT,
  response_sent TEXT,
  clicked_buy BOOLEAN NOT NULL DEFAULT false,
  status TEXT NOT NULL DEFAULT 'auto_replied',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.interaction_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own logs" ON public.interaction_logs FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Leads qualificados
CREATE TABLE public.qualified_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  contact_name TEXT NOT NULL,
  channel TEXT NOT NULL DEFAULT 'simulator',
  category TEXT,
  status TEXT NOT NULL DEFAULT 'waiting',
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  assumed_at TIMESTAMPTZ,
  sold_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.qualified_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own leads" ON public.qualified_leads FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Configuração da loja
CREATE TABLE public.store_config (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE,
  store_name TEXT NOT NULL DEFAULT '',
  products TEXT NOT NULL DEFAULT '',
  default_price TEXT NOT NULL DEFAULT '',
  available_colors TEXT NOT NULL DEFAULT '',
  product_link TEXT NOT NULL DEFAULT '',
  whatsapp_token TEXT,
  whatsapp_phone_id TEXT,
  whatsapp_connected BOOLEAN NOT NULL DEFAULT false,
  notifications_enabled BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.store_config ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own config" ON public.store_config FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Trigger para updated_at
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TRIGGER update_templates_updated_at BEFORE UPDATE ON public.templates FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_keywords_updated_at BEFORE UPDATE ON public.keyword_dictionaries FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_store_config_updated_at BEFORE UPDATE ON public.store_config FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Enable realtime for leads queue
ALTER PUBLICATION supabase_realtime ADD TABLE public.qualified_leads;
ALTER PUBLICATION supabase_realtime ADD TABLE public.interaction_logs;
