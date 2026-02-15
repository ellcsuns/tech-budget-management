interface TotalCellProps {
  total: number;
  currency: string;
}

export default function TotalCell({ total, currency }: TotalCellProps) {
  return (
    <td className="px-4 py-2 text-sm text-right bg-gray-100 font-medium border border-gray-200">
      {total.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
      <span className="ml-1 text-xs text-gray-500">{currency}</span>
    </td>
  );
}
