import { lazy, Suspense, type ReactElement } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { ProfileProvider } from "@/context/ProfileContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LegacyAuditRedirect, LegacyRequestLogsRedirect } from "@/lib/legacyObservabilityRoutes";
import "./App.css";

const DashboardPage = lazy(() =>
  import("@/pages/DashboardPage").then((module) => ({ default: module.DashboardPage }))
);
const ModelsPage = lazy(() =>
  import("@/pages/ModelsPage").then((module) => ({ default: module.ModelsPage }))
);
const ModelDetailPage = lazy(() =>
  import("@/pages/ModelDetailPage").then((module) => ({ default: module.ModelDetailPage }))
);
const EndpointsPage = lazy(() =>
  import("@/pages/EndpointsPage").then((module) => ({ default: module.EndpointsPage }))
);
const StatisticsPage = lazy(() =>
  import("@/pages/StatisticsPage").then((module) => ({ default: module.StatisticsPage }))
);
const ObservabilityLogsPage = lazy(() =>
  import("@/pages/ObservabilityLogsPage").then((module) => ({ default: module.ObservabilityLogsPage }))
);
const SettingsPage = lazy(() =>
  import("@/pages/SettingsPage").then((module) => ({ default: module.SettingsPage }))
);
const PricingTemplatesPage = lazy(() =>
  import("@/pages/PricingTemplatesPage").then((module) => ({ default: module.PricingTemplatesPage }))
);

const routeFallback = (
  <div className="py-10 text-center text-sm text-muted-foreground">Loading...</div>
);

function withRouteSuspense(element: ReactElement) {
  return <Suspense fallback={routeFallback}>{element}</Suspense>;
}

function App() {
  return (
    <ProfileProvider>
      <BrowserRouter>
        <Routes>
          <Route element={<AppLayout />}>
            <Route path="/" element={<Navigate to="/dashboard" replace />} />
            <Route path="/dashboard" element={withRouteSuspense(<DashboardPage />)} />
            <Route path="/models" element={withRouteSuspense(<ModelsPage />)} />
            <Route path="/models/:id" element={withRouteSuspense(<ModelDetailPage />)} />
            <Route path="/endpoints" element={withRouteSuspense(<EndpointsPage />)} />
            <Route path="/statistics" element={withRouteSuspense(<StatisticsPage />)} />
            <Route path="/logs" element={withRouteSuspense(<ObservabilityLogsPage />)} />
            <Route path="/request-logs" element={<LegacyRequestLogsRedirect />} />
            <Route path="/audit" element={<LegacyAuditRedirect />} />
            <Route path="/settings" element={withRouteSuspense(<SettingsPage />)} />
            <Route path="/pricing-templates" element={withRouteSuspense(<PricingTemplatesPage />)} />
          </Route>
        </Routes>
      </BrowserRouter>
    </ProfileProvider>
  );
}

export default App;
