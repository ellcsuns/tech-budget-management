import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import MasterDataPage from './pages/MasterDataPage';
import TransactionsPage from './pages/TransactionsPage';
import MetadataConfigPage from './pages/MetadataConfigPage';
import ExchangeRatePage from './pages/ExchangeRatePage';

function App() {
  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/master-data" element={<MasterDataPage />} />
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/metadata" element={<MetadataConfigPage />} />
          <Route path="/exchange-rates" element={<ExchangeRatePage />} />
        </Routes>
      </Layout>
    </Router>
  );
}

export default App;
