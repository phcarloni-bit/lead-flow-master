import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';
import {
  MessageCircle,
  CheckCircle2,
  AlertTriangle,
  Power,
  Edit2,
  Check,
  Save,
  ExternalLink,
} from 'lucide-react';

export default function Integrations() {
  const [whatsappConnected, setWhatsappConnected] = useState(false);
  const [whatsappToken, setWhatsappToken] = useState('');
  const [whatsappPhoneId, setWhatsappPhoneId] = useState('');
  const [isEditingToken, setIsEditingToken] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const load = async () => {
      const { data: config } = await supabase.from('store_config').select('*').limit(1).maybeSingle();
      if (config) {
        setWhatsappConnected(config.whatsapp_connected);
        setWhatsappToken(config.whatsapp_token || '');
        setWhatsappPhoneId(config.whatsapp_phone_id || '');
      }
    };
    load();
  }, []);

  const saveWhatsApp = async () => {
    setSaving(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setSaving(false); return; }

    const { data: existing } = await supabase.from('store_config').select('id').eq('user_id', user.id).maybeSingle();
    const payload = {
      whatsapp_token: whatsappToken || null,
      whatsapp_phone_id: whatsappPhoneId || null,
      whatsapp_connected: !!(whatsappToken && whatsappPhoneId),
    };

    if (existing) {
      await supabase.from('store_config').update(payload).eq('id', existing.id);
    } else {
      await supabase.from('store_config').insert({ user_id: user.id, ...payload });
    }

    setWhatsappConnected(!!(whatsappToken && whatsappPhoneId));
    setIsEditingToken(false);
    setSaving(false);
    toast({ title: 'Integração salva!' });
  };

  const toggleConnection = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const newState = !whatsappConnected;
    const { data: existing } = await supabase.from('store_config').select('id').eq('user_id', user.id).maybeSingle();
    if (existing) {
      await supabase.from('store_config').update({ whatsapp_connected: newState }).eq('id', existing.id);
    }
    setWhatsappConnected(newState);
    toast({ title: newState ? 'WhatsApp ativado!' : 'WhatsApp desativado' });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Canais Conectados</h2>
        <p className="text-muted-foreground text-sm">Gerencie por onde o Meraki AutoLead pode responder.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* WhatsApp Card */}
        <Card className={whatsappConnected ? 'border-green-200' : 'opacity-90'}>
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-green-500/10 rounded-lg">
                  <MessageCircle className="h-7 w-7 text-green-500" />
                </div>
                <div>
                  <CardTitle className="text-lg">WhatsApp Cloud API</CardTitle>
                  <CardDescription>Meta Business Platform</CardDescription>
                </div>
              </div>
              {whatsappConnected ? (
                <Badge className="bg-green-100 text-green-700 border-green-200">
                  <CheckCircle2 className="mr-1 h-3 w-3" /> Ativo
                </Badge>
              ) : (
                <Badge variant="secondary">
                  <AlertTriangle className="mr-1 h-3 w-3" /> Inativo
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Setup guide */}
            <div className="rounded-lg bg-muted p-4 text-sm space-y-2">
              <p className="font-medium">Como configurar:</p>
              <ol className="list-decimal pl-4 space-y-1 text-muted-foreground">
                <li>Acesse <strong>developers.facebook.com</strong></li>
                <li>Crie um app do tipo "Business"</li>
                <li>Adicione o produto "WhatsApp"</li>
                <li>Copie o <strong>Access Token</strong> permanente</li>
                <li>Copie o <strong>Phone Number ID</strong></li>
              </ol>
              <a
                href="https://developers.facebook.com/docs/whatsapp/cloud-api/get-started"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-primary text-xs hover:underline mt-2"
              >
                <ExternalLink className="h-3 w-3" /> Documentação oficial
              </a>
            </div>

            {/* Token field */}
            <div className="space-y-2">
              <Label>Access Token</Label>
              <div className="flex gap-2">
                <Input
                  type={isEditingToken ? 'text' : 'password'}
                  value={whatsappToken}
                  onChange={(e) => setWhatsappToken(e.target.value)}
                  placeholder="EAAxxxxxxx..."
                  disabled={!isEditingToken && !!whatsappToken}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsEditingToken(!isEditingToken)}
                >
                  {isEditingToken ? <Check className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            {/* Phone ID */}
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input
                value={whatsappPhoneId}
                onChange={(e) => setWhatsappPhoneId(e.target.value)}
                placeholder="1234567890"
              />
            </div>

            <div className="flex gap-2">
              <Button onClick={saveWhatsApp} disabled={saving}>
                <Save className="mr-1 h-4 w-4" /> {saving ? 'Salvando...' : 'Salvar'}
              </Button>
              {whatsappToken && whatsappPhoneId && (
                <Button variant="outline" onClick={toggleConnection}>
                  <Power className="mr-1 h-4 w-4" />
                  {whatsappConnected ? 'Desativar' : 'Ativar'}
                </Button>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Instagram Card - Coming soon */}
        <Card className="opacity-70">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-tr from-yellow-400/10 via-red-500/10 to-purple-600/10 rounded-lg">
                  <svg className="h-7 w-7 text-pink-500" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/>
                  </svg>
                </div>
                <div>
                  <CardTitle className="text-lg">Instagram DM</CardTitle>
                  <CardDescription>Meta Business Platform</CardDescription>
                </div>
              </div>
              <Badge variant="secondary">Em breve</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              A integração com Instagram Direct será liberada em breve. Será possível receber e responder mensagens automaticamente pelo Instagram.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
