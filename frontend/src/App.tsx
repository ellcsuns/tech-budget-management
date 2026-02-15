import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
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

function App() {
  return (
    <Router>
      <AuthProvider>
        <Routes>
          {/* Public route */}
          <Route path="/login" element={<LoginPage />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Navigate to="/dashboard" replace />
              </ProtectedRoute>
            }
          />

          <Route
            path="/dashboard"
            element={
              <ProtectedRoute menuCode="dashboard" permissionType="VIEW">
                <Layout>
                  <Dashboard />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/budgets"
            element={
              <ProtectedRoute menuCode="budgets" permissionType="VIEW">
                <Layout>
                  <BudgetsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/master-data"
            element={
              <ProtectedRoute menuCode="master-data" permissionType="VIEW">
                <Layout>
                  <MasterDataPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/transactions"
            element={
              <ProtectedRoute menuCode="transactions" permissionType="VIEW">
                <Layout>
                  <TransactionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/metadata"
            element={
              <ProtectedRoute menuCode="master-data" permissionType="VIEW">
                <Layout>
                  <MetadataConfigPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/exchange-rates"
            element={
              <ProtectedRoute menuCode="conversion-rates" permissionType="VIEW">
                <Layout>
                  <ExchangeRatePage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/users"
            element={
              <ProtectedRoute menuCode="users" permissionType="VIEW">
                <Layout>
                  <UserManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/roles"
            element={
              <ProtectedRoute menuCode="roles" permissionType="VIEW">
                <Layout>
                  <RoleManagementPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/plan-values"
            element={
              <ProtectedRoute menuCode="plan-values" permissionType="VIEW">
                <Layout>
                  <PlanValuesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/expenses"
            element={
              <ProtectedRoute menuCode="expenses" permissionType="VIEW">
                <Layout>
                  <ExpensesPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/committed-transactions"
            element={
              <ProtectedRoute menuCode="committed-transactions" permissionType="VIEW">
                <Layout>
                  <CommittedTransactionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/real-transactions"
            element={
              <ProtectedRoute menuCode="real-transactions" permissionType="VIEW">
                <Layout>
                  <RealTransactionsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/savings"
            element={
              <ProtectedRoute menuCode="budgets" permissionType="VIEW">
                <Layout>
                  <SavingsPage />
                </Layout>
              </ProtectedRoute>
            }
          />

          {/* Catch all - redirect to dashboard */}
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </AuthProvider>
    </Router>
  );
}

export default App;
