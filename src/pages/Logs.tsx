import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface LogEntry {
  id: string;
  contact_name: string;
  message_received: string;
  category_assigned: string | null;
  response_sent: string | null;
  clicked_buy: boolean;
  status: string;
  created_at: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [dateFilter, setDateFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');

  const fetchLogs = async () => {
    let query = supabase.from('interaction_logs').select('*').order('created_at', { ascending: false }).limit(200);
    if (dateFilter) {
      const start = new Date(dateFilter);
      start.setHours(0, 0, 0, 0);
      const end = new Date(dateFilter);
      end.setHours(23, 59, 59, 999);
      query = query.gte('created_at', start.toISOString()).lte('created_at', end.toISOString());
    }
    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category_assigned', categoryFilter);
    }
    const { data } = await query;
    if (data) setLogs(data);
  };

  useEffect(() => { fetchLogs(); }, [dateFilter, categoryFilter]);

  const totals = {
    total: logs.length,
    buyClicks: logs.filter((l) => l.clicked_buy).length,
    autoReplied: logs.filter((l) => l.status === 'auto_replied').length,
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totals.total}</p>
            <p className="text-xs text-muted-foreground">Total Interações</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{totals.buyClicks}</p>
            <p className="text-xs text-muted-foreground">Clicaram Comprar</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold">{totals.autoReplied}</p>
            <p className="text-xs text-muted-foreground">Respostas Auto</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap gap-3">
        <Input type="date" className="w-44" value={dateFilter} onChange={(e) => setDateFilter(e.target.value)} />
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Preço">Preço</SelectItem>
            <SelectItem value="Cores">Cores</SelectItem>
            <SelectItem value="Tamanhos">Tamanhos</SelectItem>
            <SelectItem value="Pagamento">Pagamento</SelectItem>
            <SelectItem value="Frete">Frete</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Comprar?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {logs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="py-8 text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                logs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">{log.contact_name}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{log.message_received}</TableCell>
                    <TableCell>
                      {log.category_assigned ? (
                        <Badge variant="secondary">{log.category_assigned}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      {log.clicked_buy ? (
                        <Badge className="bg-accent text-accent-foreground">Sim</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">Não</span>
                      )}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
