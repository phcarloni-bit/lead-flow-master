import { useEffect, useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { MessageSquare, ShoppingCart, Headphones, DollarSign, TrendingUp, TrendingDown } from 'lucide-react';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, LineChart, Line } from 'recharts';

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
  clicked_buy: boolean;
}

interface WeeklyData {
  name: string;
  interacoes: number;
  vendas: number;
  cliques: number;
}

const statusLabels: Record<string, { label: string; variant: 'default' | 'secondary' | 'outline' }> = {
  auto_replied: { label: 'Respondida', variant: 'secondary' },
  waiting: { label: 'Aguardando', variant: 'outline' },
  assumed: { label: 'Atendimento', variant: 'default' },
  sold: { label: 'Venda', variant: 'default' },
};

const DAY_NAMES = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

export default function Dashboard() {
  const [metrics, setMetrics] = useState<Metrics>({ interactions: 0, buyClicks: 0, manualAssists: 0, sales: 0 });
  const [yesterdayMetrics, setYesterdayMetrics] = useState<Metrics>({ interactions: 0, buyClicks: 0, manualAssists: 0, sales: 0 });
  const [recentLogs, setRecentLogs] = useState<RecentLog[]>([]);
  const [weeklyLogs, setWeeklyLogs] = useState<RecentLog[]>([]);

  const fetchData = async () => {
    const today = startOfDay(new Date());
    const yesterday = startOfDay(subDays(new Date(), 1));
    const weekAgo = startOfDay(subDays(new Date(), 6));

    // Fetch today's logs
    const { data: todayLogs } = await supabase
      .from('interaction_logs')
      .select('*')
      .gte('created_at', today.toISOString())
      .order('created_at', { ascending: false })
      .limit(20);

    // Fetch yesterday's logs for trend
    const { data: yesterdayLogs } = await supabase
      .from('interaction_logs')
      .select('*')
      .gte('created_at', yesterday.toISOString())
      .lt('created_at', today.toISOString());

    // Fetch last 7 days for charts
    const { data: weekLogs } = await supabase
      .from('interaction_logs')
      .select('*')
      .gte('created_at', weekAgo.toISOString())
      .order('created_at', { ascending: true });

    if (todayLogs) {
      setRecentLogs(todayLogs);
      setMetrics({
        interactions: todayLogs.length,
        buyClicks: todayLogs.filter((l) => l.clicked_buy).length,
        manualAssists: todayLogs.filter((l) => l.status === 'assumed').length,
        sales: todayLogs.filter((l) => l.status === 'sold').length,
      });
    }

    if (yesterdayLogs) {
      setYesterdayMetrics({
        interactions: yesterdayLogs.length,
        buyClicks: yesterdayLogs.filter((l) => l.clicked_buy).length,
        manualAssists: yesterdayLogs.filter((l) => l.status === 'assumed').length,
        sales: yesterdayLogs.filter((l) => l.status === 'sold').length,
      });
    }

    if (weekLogs) {
      setWeeklyLogs(weekLogs);
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

  // Build weekly chart data from real logs
  const weeklyChartData: WeeklyData[] = useMemo(() => {
    const days: WeeklyData[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = subDays(new Date(), i);
      const dayStart = startOfDay(date);
      const dayEnd = startOfDay(subDays(date, -1));
      const dayLogs = weeklyLogs.filter(l => {
        const t = new Date(l.created_at);
        return t >= dayStart && t < dayEnd;
      });
      days.push({
        name: DAY_NAMES[date.getDay()],
        interacoes: dayLogs.length,
        vendas: dayLogs.filter(l => l.status === 'sold').length,
        cliques: dayLogs.filter(l => l.clicked_buy).length,
      });
    }
    return days;
  }, [weeklyLogs]);

  const getTrend = (current: number, previous: number) => {
    if (previous === 0) return current > 0 ? '+100%' : '0%';
    const pct = Math.round(((current - previous) / previous) * 100);
    return pct >= 0 ? `+${pct}%` : `${pct}%`;
  };

  const metricCards = [
    { label: 'Interações Hoje', value: metrics.interactions, icon: MessageSquare, color: 'text-primary', trend: getTrend(metrics.interactions, yesterdayMetrics.interactions) },
    { label: 'Quero Comprar', value: metrics.buyClicks, icon: ShoppingCart, color: 'text-accent', trend: getTrend(metrics.buyClicks, yesterdayMetrics.buyClicks) },
    { label: 'Atendimentos', value: metrics.manualAssists, icon: Headphones, color: 'text-muted-foreground', trend: getTrend(metrics.manualAssists, yesterdayMetrics.manualAssists) },
    { label: 'Vendas', value: metrics.sales, icon: DollarSign, color: 'text-accent', trend: getTrend(metrics.sales, yesterdayMetrics.sales) },
  ];

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      {/* Metric Cards with Trends */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {metricCards.map((m) => {
          const isUp = m.trend.startsWith('+') && m.trend !== '+0%';
          const isDown = m.trend.startsWith('-');
          return (
            <Card key={m.label}>
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">{m.label}</CardTitle>
                <m.icon className={`h-5 w-5 ${m.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{m.value}</div>
                <div className={`flex items-center gap-1 text-xs mt-1 ${isUp ? 'text-green-600' : isDown ? 'text-red-500' : 'text-muted-foreground'}`}>
                  {isUp && <TrendingUp className="h-3 w-3" />}
                  {isDown && <TrendingDown className="h-3 w-3" />}
                  <span>{m.trend} vs ontem</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Eficiência do Bot</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" dy={10} />
                  <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                  <Tooltip
                    cursor={{ className: 'fill-muted/50' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Bar dataKey="interacoes" fill="hsl(var(--muted-foreground))" radius={[4, 4, 0, 0]} name="Interações" />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Vendas" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Intenção de Compra</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={weeklyChartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} className="stroke-muted" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" dy={10} />
                  <YAxis axisLine={false} tickLine={false} className="text-xs fill-muted-foreground" />
                  <Tooltip
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                  />
                  <Line
                    type="monotone"
                    dataKey="cliques"
                    stroke="hsl(var(--accent))"
                    strokeWidth={3}
                    dot={false}
                    activeDot={{ r: 5, strokeWidth: 0 }}
                    name="Cliques Comprar"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Logs */}
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
