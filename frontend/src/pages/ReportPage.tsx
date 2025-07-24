import React from 'react';
import ReportFilter from '../components/reports/ReportFilter';

const ReportPage: React.FC = () => (
  <div>
    <h1 className="text-3xl font-bold text-gray-800 mb-6">Reports</h1>
    <ReportFilter />
  </div>
);

export default ReportPage;