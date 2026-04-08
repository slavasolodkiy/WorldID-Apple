import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { AppLayout } from "@/components/layout/AppLayout";
import { AuthProvider, useAuth } from "@/providers/AuthProvider";
import LoginPage from "@/pages/login";

import Home from "@/pages/home";
import Verify from "@/pages/verify";
import Apps from "@/pages/apps";
import Profile from "@/pages/profile";
import Send from "@/pages/wallet/send";
import Receive from "@/pages/wallet/receive";
import Transactions from "@/pages/transactions";
import Notifications from "@/pages/notifications";

const queryClient = new QueryClient();

function Router() {
  const { userId, isReady, login } = useAuth();

  if (!isReady) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  if (!userId) {
    return <LoginPage onLogin={login} />;
  }

  return (
    <AppLayout>
      <Switch>
        <Route path="/" component={Home} />
        <Route path="/verify" component={Verify} />
        <Route path="/apps" component={Apps} />
        <Route path="/profile" component={Profile} />
        <Route path="/wallet/send" component={Send} />
        <Route path="/wallet/receive" component={Receive} />
        <Route path="/transactions" component={Transactions} />
        <Route path="/notifications" component={Notifications} />
        <Route component={NotFound} />
      </Switch>
    </AppLayout>
  );
}

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
            <Router />
          </WouterRouter>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthProvider>
  );
}

export default App;
