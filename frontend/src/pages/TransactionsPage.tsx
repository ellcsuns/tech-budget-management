import { useI18n } from '../contexts/I18nContext';

export default function TransactionsPage() {
  const { t } = useI18n();
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold">{t('menu.committedTransactions')}</h1>
      <div className="bg-white rounded-lg shadow p-6">
        <p className="text-gray-600">{t('msg.loading')}</p>
      </div>
    </div>
  );
}
