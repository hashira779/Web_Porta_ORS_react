import React from 'react';
import { useParams } from 'react-router-dom';
import { PresentationChartBarIcon } from '@heroicons/react/24/outline';
import DailyReport from '../../components/reports/DailyReportPage';
import MonthlyReport from '../../components/reports/MonthlyReport';
import YearlyReport from '../../components/reports/YearlyReport';
import CustomReport from '../../components/reports/CustomReport';
import ReportNav from '../../components/reports/ReportNav';

const ReportPage: React.FC = () => {
    const { reportType } = useParams<{ reportType?: string }>();

    const renderReport = () => {
        switch (reportType) {
            case 'daily':
                return <DailyReport />;
            // case 'monthly':
            //     return <MonthlyReport />;
            // case 'yearly':
            //     return <YearlyReport />;
            // case 'custom':
            //     return <CustomReport />;
            default:
                return (
                    <div className="space-y-6">
                        <DailyReport />
                        {/*<MonthlyReport />*/}
                        {/*<YearlyReport />*/}
                        {/*<CustomReport />*/}
                    </div>
                );
        }
    };

    return (
        <div className="p-6">
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 flex items-center">
                    <PresentationChartBarIcon className="w-8 h-8 mr-3 text-indigo-600" />
                    {reportType ? `${reportType.charAt(0).toUpperCase() + reportType.slice(1)} Reports` : 'All Reports'}
                </h1>
                <p className="mt-2 text-sm text-gray-500">
                    Generate and view reports. Data is scoped based on your user role.
                </p>
            </div>

            <ReportNav activeReport={reportType} />

            <div className="mt-8">
                {renderReport()}
            </div>
        </div>
    );
};

export default ReportPage;