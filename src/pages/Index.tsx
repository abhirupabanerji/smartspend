import { useAuth } from "@/lib/auth-context";
import { TransactionProvider } from "@/lib/transaction-context";
import AuthPage from "./AuthPage";
import DashboardLayout from "@/components/DashboardLayout";
import DashboardHome from "./DashboardHome";
import InsightsPage from "./InsightsPage";
import RecurringPage from "./RecurringPage";
import AnomalyPage from "./AnomalyPage";
import HistoryPage from "./HistoryPage";
import { Routes, Route } from "react-router-dom";

const Index = () => {
  const { user } = useAuth();

  if (!user) return <AuthPage />;

  return (
    <TransactionProvider>
      <Routes>
        <Route element={<DashboardLayout />}>
          <Route index element={<DashboardHome />} />
          <Route path="insights" element={<InsightsPage />} />
          <Route path="recurring" element={<RecurringPage />} />
          <Route path="anomaly" element={<AnomalyPage />} />
          <Route path="history" element={<HistoryPage />} />
        </Route>
      </Routes>
    </TransactionProvider>
  );
};

export default Index;
