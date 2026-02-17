import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { I18nProvider } from './contexts/I18nContext';
import { ActiveBudgetProvider } from './contexts/ActiveBudgetContext';
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import MasterDataPage from './pages/MasterDataPage';
import TransactionsPage from './pages/TransactionsPage';
import MetadataConfigPage from './pages/MetadataConfigPage';
import ExchangeRatePage from './pages/ExchangeRatePage';
import UserManagementPage from './pages/UserManagementPage';
import RoleManagementPage from './pages/RoleManagementPage';
import CommittedTransactionsPage from './pages/CommittedTransactionsPage';
import RealTransactionsPage from './pages/RealTransactionsPage';
import PlanValuesPage from './pages/PlanValuesPage';
import ExpensesPage from './pages/ExpensesPage';
import BudgetsPage from './pages/BudgetsPage';
import SavingsPage from './pages/SavingsPage';
import ReportsPage from './pages/ReportsPage';
import DeferralsPage from './pages/DeferralsPage';
import ConfigurationPage from './pages/ConfigurationPage';
import TranslationsPage from './pages/TranslationsPage';
import BudgetComparePage from './pages/BudgetComparePage';
import DetailedReportsPage from './pages/DetailedReportsPage';
import ApprovalsPage from './pages/ApprovalsPage';
import AuditPage from './pages/AuditPage';
import ErrorBoundary from './components/ErrorBoundary';
import ToastContainer from './components/Toast';

function App() {
  return (
    <ErrorBoundary>
    <ToastContainer />
    <Router>
      <AuthProvider>
        <I18nProvider>
          <ActiveBudgetProvider>
            <Routes>
              <Route path="/login" element={<LoginPage />} />
              <Route path="/" element={<ProtectedRoute><Navigate to="/dashboard" replace /></ProtectedRoute>} />

              <Route path="/dashboard" element={<ProtectedRoute menuCode="dashboard" permissionType="VIEW"><Layout><Dashboard /></Layout></ProtectedRoute>} />
              <Route path="/budgets" element={<ProtectedRoute menuCode="budgets" permissionType="VIEW"><Layout><BudgetsPage /></Layout></ProtectedRoute>} />
              <Route path="/budget-compare" element={<ProtectedRoute menuCode="budgets" permissionType="VIEW"><Layout><BudgetComparePage /></Layout></ProtectedRoute>} />
              <Route path="/master-data" element={<ProtectedRoute menuCode="master-data" permissionType="VIEW"><Layout><MasterDataPage /></Layout></ProtectedRoute>} />
              <Route path="/transactions" element={<ProtectedRoute menuCode="transactions" permissionType="VIEW"><Layout><TransactionsPage /></Layout></ProtectedRoute>} />
              <Route path="/metadata" element={<ProtectedRoute menuCode="master-data" permissionType="VIEW"><Layout><MetadataConfigPage /></Layout></ProtectedRoute>} />
              <Route path="/exchange-rates" element={<ProtectedRoute menuCode="conversion-rates" permissionType="VIEW"><Layout><ExchangeRatePage /></Layout></ProtectedRoute>} />
              <Route path="/users" element={<ProtectedRoute menuCode="users" permissionType="VIEW"><Layout><UserManagementPage /></Layout></ProtectedRoute>} />
              <Route path="/roles" element={<ProtectedRoute menuCode="roles" permissionType="VIEW"><Layout><RoleManagementPage /></Layout></ProtectedRoute>} />
              <Route path="/plan-values" element={<ProtectedRoute menuCode="plan-values" permissionType="VIEW"><Layout><PlanValuesPage /></Layout></ProtectedRoute>} />
              <Route path="/expenses" element={<ProtectedRoute menuCode="expenses" permissionType="VIEW"><Layout><ExpensesPage /></Layout></ProtectedRoute>} />
              <Route path="/committed-transactions" element={<ProtectedRoute menuCode="committed-transactions" permissionType="VIEW"><Layout><CommittedTransactionsPage /></Layout></ProtectedRoute>} />
              <Route path="/real-transactions" element={<ProtectedRoute menuCode="real-transactions" permissionType="VIEW"><Layout><RealTransactionsPage /></Layout></ProtectedRoute>} />
              <Route path="/savings" element={<ProtectedRoute menuCode="budgets" permissionType="VIEW"><Layout><SavingsPage /></Layout></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute menuCode="reports" permissionType="VIEW"><Layout><ReportsPage /></Layout></ProtectedRoute>} />
              <Route path="/detailed-reports" element={<ProtectedRoute menuCode="reports" permissionType="VIEW"><Layout><DetailedReportsPage /></Layout></ProtectedRoute>} />
              <Route path="/deferrals" element={<ProtectedRoute menuCode="budgets" permissionType="VIEW"><Layout><DeferralsPage /></Layout></ProtectedRoute>} />
              <Route path="/configuration" element={<ProtectedRoute menuCode="users" permissionType="VIEW"><Layout><ConfigurationPage /></Layout></ProtectedRoute>} />
              <Route path="/translations" element={<ProtectedRoute menuCode="users" permissionType="VIEW"><Layout><TranslationsPage /></Layout></ProtectedRoute>} />
              <Route path="/approvals" element={<ProtectedRoute menuCode="approvals" permissionType="VIEW"><Layout><ApprovalsPage /></Layout></ProtectedRoute>} />
              <Route path="/audit" element={<ProtectedRoute menuCode="audit" permissionType="VIEW"><Layout><AuditPage /></Layout></ProtectedRoute>} />
              <Route path="*" element={<Navigate to="/dashboard" replace />} />
            </Routes>
          </ActiveBudgetProvider>
        </I18nProvider>
      </AuthProvider>
    </Router>
    </ErrorBoundary>
  );
}

export default App;
