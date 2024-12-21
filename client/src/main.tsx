import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Switch, Route, Router as WouterRouter, Redirect } from "wouter"; 
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import TeamPage from "./pages/TeamPage";
import AdminPage from "./pages/AdminPage";
import MatchDetailsPage from "./pages/MatchDetailsPage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";

function AppRouter() {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <WouterRouter>
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/admin">
          {user?.role === "admin" ? <AdminPage /> : <Redirect to="/" />}
        </Route>
        <Route path="/team/:teamId/matches/:matchId">
          {(params) => <MatchDetailsPage />}
        </Route>
        <Route path="/team/:teamId/:section?">
          {(params) => <TeamPage />}
        </Route>
        <Route>404 Page Not Found</Route>
      </Switch>
    </WouterRouter>
  );
}

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>,
);