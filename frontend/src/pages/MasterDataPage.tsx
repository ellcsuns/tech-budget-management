import { useState, useEffect } from 'react';
import { technologyDirectionApi, userAreaApi, financialCompanyApi } from '../services/api';

export default function MasterDataPage() {
  const [activeTab, setActiveTab] = useState<'tech' | 'areas' | 'companies'>('tech');
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      let response;
      switch (activeTab) {
        case 'tech':
          response = await technologyDirectionApi.getAll();
          break;
        case 'areas':
          response = await userAreaApi.getAll();
          break;
        case 'companies':
          response = await financialCompanyApi.getAll();
          break;
      }
      setItems(response.data);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">Datos Maestros</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('tech')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'tech'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Direcciones Tecnológicas
            </button>
            <button
              onClick={() => setActiveTab('areas')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'areas'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Áreas de Usuario
            </button>
            <button
              onClick={() => setActiveTab('companies')}
              className={`px-6 py-3 text-sm font-medium ${
                activeTab === 'companies'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              Empresas Financieras
            </button>
          </nav>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="text-center py-8">Cargando...</div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {items.map((item) => (
                  <tr key={item.id}>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.code}</td>
                    <td className="px-6 py-4 text-sm text-gray-900">{item.name}</td>
                    <td className="px-6 py-4 text-sm text-gray-500">{item.description || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}
