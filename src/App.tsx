import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AppLayout } from "@/components/layout/AppLayout";
import { DashboardPage } from "@/pages/DashboardPage";
import { ModelsPage } from "@/pages/ModelsPage";
import { ModelDetailPage } from "@/pages/ModelDetailPage";
import { StatisticsPage } from "@/pages/StatisticsPage";
import { RequestLogsPage } from "@/pages/RequestLogsPage";
import { AuditPage } from "@/pages/AuditPage";
import { SettingsPage } from "@/pages/SettingsPage";
import { EndpointsPage } from "@/pages/EndpointsPage";
import "./App.css";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/models" element={<ModelsPage />} />
          <Route path="/models/:id" element={<ModelDetailPage />} />
          <Route path="/endpoints" element={<EndpointsPage />} />
          <Route path="/statistics" element={<StatisticsPage />} />
          <Route path="/request-logs" element={<RequestLogsPage />} />
          <Route path="/audit" element={<AuditPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

