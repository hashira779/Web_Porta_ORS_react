import React, { useState } from 'react';
import { getSalesDataByYear } from '../../api/api';
import { Sale } from '../../types';

const ReportFilter: React.FC = () => {
  const [year, setYear] = useState<string>('2025');
  const [data, setData] = useState<Sale[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const handleFetch = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setData([]);
    getSalesDataByYear(year)
      .then(response => setData(response.data))
      .catch(err => setError(err.response?.data?.detail || 'Failed to fetch report'))
      .finally(() => setLoading(false));
  };

  return (
    <div className="p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-xl font-semibold mb-4">Sales Reports</h2>
      <form onSubmit={handleFetch} className="flex items-center space-x-4">
        <select value={year} onChange={(e) => setYear(e.target.value)} className="p-2 border border-gray-300 rounded-md">
          <option value="2025">2025</option>
          <option value="2024">2024</option>
          <option value="2023">2023</option>
        </select>
        <button type="submit" className="px-4 py-2 font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700" disabled={loading}>
          {loading ? 'Loading...' : 'Fetch Report'}
        </button>
      </form>
      {error && <p className="mt-4 text-red-500">{error}</p>}
      {data.length > 0 && (
         <div className="mt-6 overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50"><tr>{Object.keys(data[0]).map(key => <th key={key} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">{key}</th>)}</tr></thead>
            <tbody className="bg-white divide-y divide-gray-200">{data.map(row => <tr key={row.ID}>{Object.values(row).map((val, i) => <td key={i} className="px-6 py-4 text-sm text-gray-900">{String(val)}</td>)}</tr>)}</tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ReportFilter;