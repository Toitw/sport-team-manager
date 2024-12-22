import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { Router as WouterRouter, Switch, Route, Redirect } from "wouter"; 
import "./index.css";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import HomePage from "./pages/HomePage";
import AuthPage from "./pages/AuthPage";
import TeamPage from "./pages/TeamPage";
import AdminPage from "./pages/AdminPage";
import MatchDetailsPage from "./pages/MatchDetailsPage";
import VerifyEmailPage from "./pages/VerifyEmailPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import { useUser } from "./hooks/use-user";
import { Loader2 } from "lucide-react";

const AppRouter = () => {
  const { user, isLoading } = useUser();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="h-8 w-8 animate-spin text-border" />
      </div>
    );
  }

  // Public routes that don't require authentication
  const publicRoutes = ["/verify-email", "/reset-password"];
  const currentPath = window.location.pathname;

  if (publicRoutes.includes(currentPath)) {
    return (
      <WouterRouter>
        <Switch>
          <Route path="/verify-email" component={VerifyEmailPage} />
          <Route path="/reset-password" component={ResetPasswordPage} />
        </Switch>
      </WouterRouter>
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
};

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <AppRouter />
      <Toaster />
    </QueryClientProvider>
  </StrictMode>
);
