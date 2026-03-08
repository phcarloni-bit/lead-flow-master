import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShoppingCart, UserCheck, DollarSign, MessageCircle, Filter, Archive, Inbox, XCircle, Clock } from 'lucide-react';

interface Lead {
  id: string;
  contact_name: string;
  channel: string;
  category: string | null;
  status: string;
  clicked_at: string;
}

interface LogEntry {
  id: string;
  message_received: string;
  response_sent: string | null;
  category_assigned: string | null;
  created_at: string;
}

type StatusFilter = 'active' | 'waiting' | 'assumed' | 'sold' | 'archived';
type PlatformFilter = 'all' | 'whatsapp' | 'instagram';

export default function LeadQueue() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('active');
  const [platformFilter, setPlatformFilter] = useState<PlatformFilter>('all');
  const [lastMessages, setLastMessages] = useState<Record<string, string>>({});

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('qualified_leads')
      .select('*')
      .order('clicked_at', { ascending: false });
    if (data) {
      setLeads(data);
      // Fetch last message for each lead
      const msgMap: Record<string, string> = {};
      for (const lead of data.slice(0, 50)) {
        const { data: logs } = await supabase
          .from('interaction_logs')
          .select('message_received')
          .eq('contact_name', lead.contact_name)
          .order('created_at', { ascending: false })
          .limit(1);
        if (logs && logs.length > 0) {
          msgMap[lead.id] = logs[0].message_received;
        }
      }
      setLastMessages(msgMap);
    }
  };

  useEffect(() => {
    fetchLeads();
    const channel = supabase
      .channel('lead-queue')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qualified_leads' }, () => fetchLeads())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  const filteredLeads = leads.filter((l) => {
    // Status filter
    if (statusFilter === 'active' && l.status === 'archived') return false;
    if (statusFilter !== 'active' && l.status !== statusFilter) return false;
    // Platform filter
    if (platformFilter !== 'all') {
      const isWA = l.channel.includes('whatsapp');
      const isIG = l.channel.includes('instagram');
      if (platformFilter === 'whatsapp' && !isWA) return false;
      if (platformFilter === 'instagram' && !isIG) return false;
    }
    return true;
  });

  const openHistory = async (lead: Lead) => {
    setSelectedLead(lead);
    const { data } = await supabase
      .from('interaction_logs')
      .select('*')
      .eq('contact_name', lead.contact_name)
      .order('created_at', { ascending: true });
    setHistory(data || []);
    setDrawerOpen(true);
  };

  const updateStatus = async (lead: Lead, newStatus: string) => {
    const updates: Record<string, any> = { status: newStatus };
    if (newStatus === 'assumed') updates.assumed_at = new Date().toISOString();
    if (newStatus === 'sold') updates.sold_at = new Date().toISOString();

    await supabase.from('qualified_leads').update(updates).eq('id', lead.id);
    if (newStatus === 'sold') {
      await supabase.from('interaction_logs').update({ status: 'sold' }).eq('contact_name', lead.contact_name);
    }
    fetchLeads();

    const labels: Record<string, string> = {
      assumed: `Você está atendendo ${lead.contact_name}`,
      sold: `Venda de ${lead.contact_name} registrada!`,
      archived: `${lead.contact_name} arquivado`,
      waiting: `${lead.contact_name} reaberto`,
    };
    toast({ title: newStatus === 'sold' ? '💰 Venda registrada!' : 'Status atualizado', description: labels[newStatus] || '' });
  };

  const openWhatsApp = (lead: Lead) => {
    // Extract any phone-like info from contact_name or open generic wa.me
    updateStatus(lead, 'assumed');
    window.open('https://wa.me/', '_blank');
  };

  const statusConfig: Record<string, { label: string; icon: React.ReactNode; className: string }> = {
    waiting: { label: 'Novo', icon: <Inbox className="h-3 w-3" />, className: 'bg-blue-100 text-blue-700' },
    assumed: { label: 'Em Atendimento', icon: <UserCheck className="h-3 w-3" />, className: 'bg-amber-100 text-amber-700' },
    sold: { label: 'Vendido', icon: <DollarSign className="h-3 w-3" />, className: 'bg-green-100 text-green-700' },
    archived: { label: 'Arquivado', icon: <Archive className="h-3 w-3" />, className: 'bg-muted text-muted-foreground' },
  };

  return (
    <div className="space-y-4 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-lg font-bold">Fila de Leads</h2>
          <p className="text-sm text-muted-foreground">Gerencie oportunidades de alta intenção.</p>
        </div>

        <div className="flex gap-2">
          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={(v) => setStatusFilter(v as StatusFilter)}>
            <SelectTrigger className="w-40">
              <Filter className="mr-1 h-3.5 w-3.5" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Todos (Ativos)</SelectItem>
              <SelectItem value="waiting">🆕 Novos</SelectItem>
              <SelectItem value="assumed">⏳ Em Atendimento</SelectItem>
              <SelectItem value="sold">💰 Vendidos</SelectItem>
              <SelectItem value="archived">📂 Arquivados</SelectItem>
            </SelectContent>
          </Select>

          {/* Platform Filter */}
          <div className="flex items-center bg-card p-1 rounded-lg border">
            <button
              onClick={() => setPlatformFilter('all')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${platformFilter === 'all' ? 'bg-muted text-foreground' : 'text-muted-foreground hover:text-foreground'}`}
            >
              Todos
            </button>
            <button
              onClick={() => setPlatformFilter('whatsapp')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${platformFilter === 'whatsapp' ? 'bg-green-50 text-green-700' : 'text-muted-foreground hover:text-foreground'}`}
            >
              <MessageCircle className="h-3.5 w-3.5" /> WA
            </button>
            <button
              onClick={() => setPlatformFilter('instagram')}
              className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1 transition-all ${platformFilter === 'instagram' ? 'bg-pink-50 text-pink-700' : 'text-muted-foreground hover:text-foreground'}`}
            >
              IG
            </button>
          </div>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Exibindo {filteredLeads.length} {filteredLeads.length === 1 ? 'lead' : 'leads'}
      </p>

      {filteredLeads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            {statusFilter === 'archived' ? (
              <Archive className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            ) : (
              <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            )}
            <p className="text-muted-foreground">
              {statusFilter === 'archived' ? 'Nenhum lead arquivado.' : 'Nenhum lead encontrado com os filtros atuais.'}
            </p>
            {(platformFilter !== 'all' || statusFilter !== 'active') && (
              <Button variant="link" size="sm" onClick={() => { setPlatformFilter('all'); setStatusFilter('active'); }} className="mt-2">
                Limpar filtros
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {filteredLeads.map((lead) => {
            const sc = statusConfig[lead.status] || statusConfig.waiting;
            const isWA = lead.channel.includes('whatsapp');
            return (
              <Card
                key={lead.id}
                className={`cursor-pointer transition-all hover:shadow-md ${lead.status === 'archived' ? 'opacity-60' : ''}`}
                onClick={() => openHistory(lead)}
              >
                <CardContent className="flex flex-col md:flex-row items-start md:items-center justify-between p-4 gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="relative">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-bold text-accent">
                        {lead.contact_name.charAt(0).toUpperCase()}
                      </div>
                      <span className={`absolute -bottom-1 -right-1 w-4 h-4 flex items-center justify-center rounded-full text-white text-[8px] font-bold ${isWA ? 'bg-green-500' : 'bg-pink-500'}`}>
                        {isWA ? 'W' : 'I'}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{lead.contact_name}</span>
                        <Badge className={`text-[10px] px-1.5 py-0 gap-0.5 ${sc.className}`}>
                          {sc.icon} {sc.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {formatDistanceToNow(new Date(lead.clicked_at), { addSuffix: true, locale: ptBR })}
                        {lead.category && <><span>·</span><span>{lead.category}</span></>}
                      </div>
                    </div>
                  </div>

                  {/* Last message */}
                  {lastMessages[lead.id] && (
                    <div className="flex-1 px-3 text-sm text-muted-foreground bg-muted/50 py-2 rounded-lg truncate max-w-xs hidden md:block">
                      "{lastMessages[lead.id]}"
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex items-center gap-1.5" onClick={(e) => e.stopPropagation()}>
                    {lead.status !== 'archived' && lead.status !== 'sold' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => isWA ? openWhatsApp(lead) : updateStatus(lead, 'assumed')}
                        className={isWA ? 'text-green-600 border-green-200 hover:bg-green-50' : 'text-pink-600 border-pink-200 hover:bg-pink-50'}
                      >
                        {isWA ? <MessageCircle className="mr-1 h-3.5 w-3.5" /> : <span className="mr-1">IG</span>}
                        {lead.status === 'assumed' ? 'Continuar' : 'Atender'}
                      </Button>
                    )}
                    {lead.status !== 'sold' && (
                      <Button size="icon" variant="ghost" onClick={() => updateStatus(lead, 'sold')} title="Registrar Venda" className="text-green-600 hover:bg-green-50">
                        <DollarSign className="h-4 w-4" />
                      </Button>
                    )}
                    {lead.status !== 'archived' ? (
                      <Button size="icon" variant="ghost" onClick={() => updateStatus(lead, 'archived')} title="Arquivar" className="text-muted-foreground hover:text-destructive hover:bg-destructive/10">
                        <XCircle className="h-4 w-4" />
                      </Button>
                    ) : (
                      <Button size="icon" variant="ghost" onClick={() => updateStatus(lead, 'waiting')} title="Reabrir" className="text-muted-foreground hover:text-blue-600 hover:bg-blue-50">
                        <Inbox className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[80vh]">
          <DrawerHeader>
            <DrawerTitle>Conversa com {selectedLead?.contact_name}</DrawerTitle>
            <DrawerDescription>Histórico completo da interação</DrawerDescription>
          </DrawerHeader>
          <div className="space-y-3 overflow-y-auto p-4">
            {history.map((entry) => (
              <div key={entry.id} className="space-y-2">
                <div className="flex justify-start">
                  <div className="max-w-[75%] rounded-2xl rounded-bl-sm bg-muted px-4 py-2 text-sm">
                    {entry.message_received}
                  </div>
                </div>
                {entry.response_sent && (
                  <div className="flex justify-end">
                    <div className="max-w-[75%] rounded-2xl rounded-br-sm bg-primary px-4 py-2 text-sm text-primary-foreground">
                      {entry.response_sent}
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}
