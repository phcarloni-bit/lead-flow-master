import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, ShoppingCart, Headphones, DollarSign } from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface Metrics {
  interactions: number;
  buyClicks: number;
  manualAssists: number;
  sales: number;
}

interface RecentLog {
  id: string;
  contact_name: string;
  message_received: string;
  category_assigned: string | null;
  status: string;
  created_at: string;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  auto_replied: { label: 'Respondida', variant: 'secondary' },
  waiting: { label: 'Aguardando', variant: 'outline' },
  assumed: { label: 'Atendimento', variant: 'default' },
  sold: { label: 'Venda', variant: 'default' },
};

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>({ interactions: 0, buyClicks: 0, manualAssists: 0, sales: 0 });
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);

  const fetchData = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data: logs } = await supabase
      .from('interaction_logs')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    if (logs) {
      setRecentLogs(logs);
      setMetrics({
        interactions: logs.length,
        buyClicks: logs.filter((l) => l.clicked_buy).length,
        manualAssists: logs.filter((l) => l.status === 'assumed').length,
        sales: logs.filter((l) => l.status === 'sold').length,
      });
    }
  };

  useEffect(() => {
    fetchData();

    const channel = supabase
      .channel('dashboard-logs')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'interaction_logs' }, () => fetchData())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const metricCards = [
    { label: 'Interações Hoje', value: metrics.interactions, icon: MessageSquare, color: 'text-primary' },
    { label: 'Quero Comprar', value: metrics.buyClicks, icon: ShoppingCart, color: 'text-accent' },
    { label: 'Atendimentos', value: metrics.manualAssists, icon: Headphones, color: 'text-muted-foreground' },
    { label: 'Vendas', value: metrics.sales, icon: DollarSign, color: 'text-accent' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => (
          <Card key={m.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
              <m.icon className={`h-5 w-5 ${m.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold" style={{ fontFamily: "'Space Grotesk', sans-serif" }}>{m.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Últimas Interações</CardTitle>
        </CardHeader>
        <CardContent>
          {recentLogs.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">
              Nenhuma interação registrada hoje. Use o Simulador para testar!
            </p>
          ) : (
            <div className="space-y-3">
              {recentLogs.map((log) => {
                const s = statusLabels[log.status] || statusLabels.auto_replied;
                return (
                  <div key={log.id} className="flex items-center justify-between rounded-lg border p-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{log.contact_name}</span>
                        {log.category_assigned && (
                          <Badge variant="secondary" className="text-xs">{log.category_assigned}</Badge>
                        )}
                      </div>
                      <p className="truncate text-sm text-muted-foreground">{log.message_received}</p>
                    </div>
                    <div className="flex items-center gap-3 pl-4">
                      <Badge variant={s.variant}>{s.label}</Badge>
                      <span className="text-xs text-muted-foreground">
                        {format(new Date(log.created_at), 'HH:mm', { locale: ptBR })}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
