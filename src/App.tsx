import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import "./App.css";
import { AppLayout } from "@/components/layout/AppLayout";
import { useAuth, AuthProvider } from "@/hooks/useAuth";
import { AuditPage } from "@/pages/AuditPage";
import { AuthSetupPage } from "@/pages/AuthSetupPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { LoginPage } from "@/pages/LoginPage";
import { ModelDetailPage } from "@/pages/ModelDetailPage";
import { ModelsPage } from "@/pages/ModelsPage";
import { PasswordResetPage } from "@/pages/PasswordResetPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { StatisticsPage } from "@/pages/StatisticsPage";

function FullScreenMessage({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background text-muted-foreground">
      <p className="text-sm">{message}</p>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.state === "loading") {
    return <FullScreenMessage message="Checking authentication status..." />;
  }

  if (auth.authEnabled && !auth.isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function PublicAuthRoute({ children }: { children: React.ReactNode }) {
  const auth = useAuth();

  if (auth.state === "loading") {
    return <FullScreenMessage message="Loading authentication..." />;
  }

  if (auth.authEnabled && auth.isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

function AppRoutes() {
  return (
    <BrowserRouter>
      <Routes>
        <Route
          path="/login"
          element={
            <PublicAuthRoute>
              <LoginPage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/auth/setup"
          element={
            <PublicAuthRoute>
              <AuthSetupPage />
            </PublicAuthRoute>
          }
        />
        <Route
          path="/password-reset"
          element={
            <PublicAuthRoute>
              <PasswordResetPage />
            </PublicAuthRoute>
          }
        />

        <Route
          element={
            <ProtectedRoute>
              <AppLayout />
            </ProtectedRoute>
          }
        >
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/profiles" element={<ModelsPage />} />
          <Route path="/profiles/:id" element={<ModelDetailPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

function App() {
  return (
    <AuthProvider>
      <AppRoutes />
    </AuthProvider>
  );
}

export default App;
