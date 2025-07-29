import React from 'react';
import EnhancedReportPage from '../components/reports/EnhancedReportPage';
import { PresentationChartBarIcon } from '@heroicons/react/24/outline';

const ReportPage: React.FC = () => (
    <div>
        <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                <PresentationChartBarIcon className="w-8 h-8 mr-3 text-indigo-600" />
                Reports
            </h1>
            <p className="mt-2 text-sm text-gray-500">
                Generate and view reports. Data is scoped based on your user role.
            </p>
        </div>
        <EnhancedReportPage />
    </div>
);

export default ReportPage;