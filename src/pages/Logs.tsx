import { useEffect, useState } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { format, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Search, X } from 'lucide-react';

interface LogEntry {
  id: string;
  contact_name: string;
  message_received: string;
  category_assigned: string | null;
  response_sent: string | null;
  clicked_buy: boolean;
  status: string;
  created_at: string;
  channel: string;
}

export default function Logs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [searchText, setSearchText] = useState('');
  const [dateFrom, setDateFrom] = useState(() => format(subDays(new Date(), 14), 'yyyy-MM-dd'));
  const [dateTo, setDateTo] = useState(() => format(new Date(), 'yyyy-MM-dd'));
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [channelFilter, setChannelFilter] = useState('all');

  const fetchLogs = async () => {
    const startDate = new Date(dateFrom);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(dateTo);
    endDate.setHours(23, 59, 59, 999);

    let query = supabase
      .from('interaction_logs')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .lte('created_at', endDate.toISOString())
      .order('created_at', { ascending: false })
      .limit(500);

    if (categoryFilter && categoryFilter !== 'all') {
      query = query.eq('category_assigned', categoryFilter);
    }
    if (channelFilter && channelFilter !== 'all') {
      query = query.eq('channel', channelFilter);
    }

    const { data } = await query;
    if (data) setLogs(data);
  };

  useEffect(() => {
    fetchLogs();
  }, [dateFrom, dateTo, categoryFilter, channelFilter]);

  const filteredLogs = searchText.trim()
    ? logs.filter(
        (l) =>
          l.message_received.toLowerCase().includes(searchText.toLowerCase()) ||
          l.contact_name.toLowerCase().includes(searchText.toLowerCase()) ||
          (l.response_sent && l.response_sent.toLowerCase().includes(searchText.toLowerCase()))
      )
    : logs;

  const totals = {
    total: filteredLogs.length,
    buyClicks: filteredLogs.filter((l) => l.clicked_buy).length,
    autoReplied: filteredLogs.filter((l) => l.status === 'auto_replied').length,
    sales: filteredLogs.filter((l) => l.status === 'sold').length,
  };

  const clearFilters = () => {
    setSearchText('');
    setDateFrom(format(subDays(new Date(), 14), 'yyyy-MM-dd'));
    setDateTo(format(new Date(), 'yyyy-MM-dd'));
    setCategoryFilter('all');
    setChannelFilter('all');
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-4">
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
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-accent">{totals.sales}</p>
            <p className="text-xs text-muted-foreground">Vendas</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar por mensagem, contato..."
            className="pl-9"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
          />
        </div>
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-muted-foreground">De</span>
          <Input type="date" className="w-40" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          <span className="text-xs text-muted-foreground">até</span>
          <Input type="date" className="w-40" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
        </div>
        <Select value={categoryFilter} onValueChange={setCategoryFilter}>
          <SelectTrigger className="w-36">
            <SelectValue placeholder="Categoria" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todas</SelectItem>
            <SelectItem value="Preço">Preço</SelectItem>
            <SelectItem value="Cores">Cores</SelectItem>
            <SelectItem value="Tamanhos">Tamanhos</SelectItem>
            <SelectItem value="Pagamento">Pagamento</SelectItem>
            <SelectItem value="Frete">Frete</SelectItem>
            <SelectItem value="Trocas">Trocas</SelectItem>
            <SelectItem value="Outro">Outro</SelectItem>
          </SelectContent>
        </Select>
        <Select value={channelFilter} onValueChange={setChannelFilter}>
          <SelectTrigger className="w-32">
            <SelectValue placeholder="Canal" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos</SelectItem>
            <SelectItem value="simulator">Simulador</SelectItem>
            <SelectItem value="whatsapp">WhatsApp</SelectItem>
          </SelectContent>
        </Select>
        <Button variant="ghost" size="sm" onClick={clearFilters}>
          <X className="mr-1 h-4 w-4" /> Limpar
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Data/Hora</TableHead>
                <TableHead>Contato</TableHead>
                <TableHead>Canal</TableHead>
                <TableHead>Mensagem</TableHead>
                <TableHead>Resposta</TableHead>
                <TableHead>Categoria</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Comprar?</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    Nenhum registro encontrado
                  </TableCell>
                </TableRow>
              ) : (
                filteredLogs.map((log) => (
                  <TableRow key={log.id}>
                    <TableCell className="whitespace-nowrap text-xs">
                      {format(new Date(log.created_at), 'dd/MM HH:mm', { locale: ptBR })}
                    </TableCell>
                    <TableCell className="text-sm">{log.contact_name}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="text-xs">{log.channel}</Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate text-sm">{log.message_received}</TableCell>
                    <TableCell>
                      {log.category_assigned ? (
                        <Badge variant="secondary">{log.category_assigned}</Badge>
                      ) : (
                        <span className="text-xs text-muted-foreground">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={log.status === 'sold' ? 'default' : 'outline'} className="text-xs">
                        {log.status === 'auto_replied' ? 'Auto' : log.status === 'sold' ? 'Venda' : log.status === 'assumed' ? 'Atendido' : log.status}
                      </Badge>
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
