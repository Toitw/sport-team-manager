import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router as WouterRouter, Switch, Route } from "wouter"; 
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "./components/ui/toaster";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import TeamPage from "./pages/TeamPage";
import AdminPage from "./pages/AdminPage";
import OrganizationsPage from "./pages/OrganizationsPage";
import MatchDetailsPage from "./pages/MatchDetailsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";

import "./index.css";

function App() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <AppRouter />
        <Toaster />
      </QueryClientProvider>
    </StrictMode>
  );
}

function AppRouter() {
  const { user, isLoading, error } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (error) {
    console.error('Authentication error:', error);
    return <AuthPage />;
  }

  const publicRoutes = ["/auth", "/verify-email", "/reset-password"];
  const currentPath = window.location.pathname;

  if (!user && !publicRoutes.some(route => currentPath.startsWith(route))) {
    window.location.href = "/auth";
    return null;
  }

  return (
    <WouterRouter>
      <div className="min-h-screen bg-background">
        <Switch>
          <Route path="/auth" component={AuthPage} />
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
          <Route path="/" component={HomePage} />
          <Route path="/admin">
            {user?.role === "admin" ? <AdminPage /> : <HomePage />}
          </Route>
          <Route path="/organizations" component={OrganizationsPage} />
          <Route path="/team/:teamId/matches/:matchId" component={MatchDetailsPage} />
          <Route path="/team/:teamId/:section?" component={TeamPage} />
          <Route>
            <div className="flex items-center justify-center min-h-screen">
              <h1 className="text-2xl font-bold">404 Page Not Found</h1>
            </div>
          </Route>
        </Switch>
      </div>
    </WouterRouter>
  );
}

const rootElement = document.getElementById("root");
if (!rootElement) {
  throw new Error("Failed to find the root element");
}

createRoot(rootElement).render(<App />);