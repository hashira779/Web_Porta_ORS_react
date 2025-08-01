import React from 'react';
import { useParams } from 'react-router-dom';
import { PresentationChartBarIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../../context/AuthContext';
import DailyReport from '../../components/reports/DailyReportPage';
import MonthlyReport from '../../components/reports/MonthlyReport';
import YearlyReport from '../../components/reports/YearlyReport';
import TelegramReport from '../../components/reports/SendTelegramReportPage';
import CustomReport from '../../components/reports/CustomReport';
import ReportNav from '../../components/reports/ReportNav';

const ReportPage: React.FC = () => {
    const { reportType } = useParams<{ reportType?: string }>();
    const { currentUser, loading } = useAuth();

    // Define permissions mapping
    const reportPermissions = {
        DailyReport: 'view_daily_reports',
        monthly: 'view_monthly_reports',
        yearly: 'view_yearly_reports',
        custom: 'view_custom_reports',
        TelegramReport: 'view_telegram_reports',
    } as const; // Makes the keys readonly and literal types

    // Type guard for valid report types
    const isValidReportType = (type: string | undefined): type is keyof typeof reportPermissions => {
        return type === 'DailyReport' || type === 'monthly' || type === 'yearly' || type === 'custom'|| type === 'TelegramReport';
    };

    // Check if user has permission for the specific report type
    const hasPermission = (type: string | undefined) => {
        if (loading || !currentUser) return false;
        if (!type) return true; // No specific type (default view) is allowed for 'view_reports'
        if (!isValidReportType(type)) return false; // Invalid type, deny access
        const requiredPermission = reportPermissions[type];
        const userPermissions = new Set(currentUser.role?.permissions?.map(p => p.name) || []);
        return userPermissions.has(requiredPermission) || userPermissions.has('view_reports') || currentUser.role?.name === 'admin';
    };

    const renderReport = () => {
        if (loading) {
            return <div className="text-center text-gray-500">Loading...</div>;
        }

        if (reportType && !hasPermission(reportType)) {
            return (
                <div className="text-center text-red-500">
                    You do not have permission to view this report.
                </div>
            );
        }

        switch (reportType) {
            case 'DailyReport':
                return <DailyReport />;
            case 'monthly':
                return <MonthlyReport />;
            case 'yearly':
                return <YearlyReport />;
            case 'TelegramReport':
                return <TelegramReport />;
            // case 'custom':
            //     return <CustomReport />;
            default:
                return (
                    <div className="space-y-6">
                        {hasPermission('DailyReport') && <DailyReport />}
                        {hasPermission('monthly') && <MonthlyReport />}
                        {hasPermission('yearly') && <YearlyReport />}
                        {hasPermission('TelegramReport') && <TelegramReport />}
                        {/*{hasPermission('custom') && <CustomReport />}*/}
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