import { useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/hooks/use-toast';

export function usePushNotifications() {
  const requestPermission = useCallback(async () => {
    if (!('Notification' in window)) return false;
    if (Notification.permission === 'granted') return true;
    if (Notification.permission === 'denied') return false;
    const permission = await Notification.requestPermission();
    return permission === 'granted';
  }, []);

  const sendBrowserNotification = useCallback((title: string, body: string) => {
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try {
      new Notification(title, {
        body,
        icon: '/favicon.ico',
        badge: '/favicon.ico',
        tag: 'meraki-lead',
        renotify: true,
      });
    } catch {
      // Silent fail for environments that don't support Notification constructor
    }
  }, []);

  useEffect(() => {
    requestPermission();

    const channel = supabase
      .channel('push-notifications')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'qualified_leads' },
        (payload) => {
          const lead = payload.new as { contact_name: string; category: string | null };
          const body = lead.category
            ? `${lead.contact_name} quer comprar! (${lead.category})`
            : `${lead.contact_name} quer comprar!`;

          // Browser push notification
          sendBrowserNotification('🔔 Novo lead qualificado!', body);

          // In-app toast as fallback
          toast({
            title: '🔔 Novo lead qualificado!',
            description: body,
          });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [requestPermission, sendBrowserNotification]);

  return { requestPermission };
}
