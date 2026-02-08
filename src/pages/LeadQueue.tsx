import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { ShoppingCart, UserCheck, DollarSign } from 'lucide-react';

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

export default function LeadQueue() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [history, setHistory] = useState<LogEntry[]>([]);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const fetchLeads = async () => {
    const { data } = await supabase
      .from('qualified_leads')
      .select('*')
      .order('clicked_at', { ascending: false });
    if (data) setLeads(data);
  };

  useEffect(() => {
    fetchLeads();
    const channel = supabase
      .channel('lead-queue')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'qualified_leads' }, (payload) => {
        fetchLeads();
        toast({ title: '🔔 Novo lead!', description: `${(payload.new as Lead).contact_name} quer comprar!` });
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

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

  const assumeLead = async (lead: Lead) => {
    await supabase.from('qualified_leads').update({ status: 'assumed', assumed_at: new Date().toISOString() }).eq('id', lead.id);
    fetchLeads();
    toast({ title: 'Atendimento assumido', description: `Você está atendendo ${lead.contact_name}` });
  };

  const registerSale = async (lead: Lead) => {
    await supabase.from('qualified_leads').update({ status: 'sold', sold_at: new Date().toISOString() }).eq('id', lead.id);
    await supabase.from('interaction_logs').update({ status: 'sold' }).eq('contact_name', lead.contact_name);
    fetchLeads();
    toast({ title: '💰 Venda registrada!', description: `Venda de ${lead.contact_name} registrada com sucesso` });
  };

  const statusConfig: Record<string, { label: string; className: string }> = {
    waiting: { label: 'Aguardando', className: 'bg-accent text-accent-foreground' },
    assumed: { label: 'Em atendimento', className: 'bg-primary text-primary-foreground' },
    sold: { label: 'Venda realizada', className: 'bg-accent text-accent-foreground' },
  };

  return (
    <div className="space-y-4">
      {leads.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <ShoppingCart className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">Nenhum lead na fila. Use o Simulador para gerar leads!</p>
          </CardContent>
        </Card>
      ) : (
        leads.map((lead) => {
          const sc = statusConfig[lead.status] || statusConfig.waiting;
          return (
            <Card key={lead.id} className="cursor-pointer transition-shadow hover:shadow-md" onClick={() => openHistory(lead)}>
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10">
                    <ShoppingCart className="h-5 w-5 text-accent" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{lead.contact_name}</span>
                      <Badge className={sc.className}>{sc.label}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {lead.category && `${lead.category} · `}
                      {formatDistanceToNow(new Date(lead.clicked_at), { addSuffix: true, locale: ptBR })}
                    </p>
                  </div>
                </div>
                <div className="flex gap-2" onClick={(e) => e.stopPropagation()}>
                  {lead.status === 'waiting' && (
                    <Button size="sm" variant="outline" onClick={() => assumeLead(lead)}>
                      <UserCheck className="mr-1 h-4 w-4" /> Assumir
                    </Button>
                  )}
                  {lead.status !== 'sold' && (
                    <Button size="sm" onClick={() => registerSale(lead)}>
                      <DollarSign className="mr-1 h-4 w-4" /> Registrar Venda
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })
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
