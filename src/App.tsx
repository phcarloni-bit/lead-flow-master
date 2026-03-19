import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Session } from "@supabase/supabase-js";
import AppLayout from "./components/AppLayout";
import OnboardingWizard from "./components/OnboardingWizard";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import LeadQueue from "./pages/LeadQueue";
import ChatSimulator from "./pages/ChatSimulator";
import Templates from "./pages/Templates";
import Integrations from "./pages/Integrations";
import Logs from "./pages/Logs";
import SettingsPage from "./pages/SettingsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AuthGuard({ children }: { children: React.ReactNode }) {
  return <AppLayout>{children}</AppLayout>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={<AuthGuard><Dashboard /></AuthGuard>} />
          <Route path="/leads" element={<AuthGuard><LeadQueue /></AuthGuard>} />
          <Route path="/simulator" element={<AuthGuard><ChatSimulator /></AuthGuard>} />
          <Route path="/templates" element={<AuthGuard><Templates /></AuthGuard>} />
          <Route path="/integrations" element={<AuthGuard><Integrations /></AuthGuard>} />
          <Route path="/logs" element={<AuthGuard><Logs /></AuthGuard>} />
          <Route path="/settings" element={<AuthGuard><SettingsPage /></AuthGuard>} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
