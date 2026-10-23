import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HashRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthProvider";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import ChildrenPage from "./pages/ChildrenPage";
import FinancePage from "./pages/FinancePage";
import StaffPage from "./pages/StaffPage";
import SettingsPage from "./pages/SettingsPage";
import HelpPage from "./pages/HelpPage";
import NewEntryPage from "./pages/NewEntryPage";
import ReportsPage from "./pages/ReportsPage";
import NotFound from "./pages/NotFound";
import SuperDashboard from "./pages/super-admin/SuperDashboard";

import { AppModeProvider } from "./context/AppModeProvider";
import { ThemeProvider } from "./components/ThemeProvider";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <ThemeProvider defaultTheme="dark">
      <AppModeProvider>
        <AuthProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <HashRouter>
              <Routes>
                <Route path="/" element={<LoginPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/admin" element={<DashboardPage />} />
                <Route path="/admin/children" element={<ChildrenPage />} />
                <Route path="/admin/staff" element={<StaffPage />} />
                <Route path="/admin/finance" element={<FinancePage />} />
                <Route path="/admin/settings" element={<SettingsPage />} />
                <Route path="/admin/help" element={<HelpPage />} />
                <Route path="/admin/new-entry" element={<NewEntryPage />} />
                <Route path="/admin/reports" element={<ReportsPage />} />
                <Route path="/super-admin" element={<SuperDashboard />} />
                <Route path="*" element={<NotFound />} />
              </Routes>
            </HashRouter>
          </TooltipProvider>
        </AuthProvider>
      </AppModeProvider>
    </ThemeProvider>
  </QueryClientProvider>
  );
};

export default App;
