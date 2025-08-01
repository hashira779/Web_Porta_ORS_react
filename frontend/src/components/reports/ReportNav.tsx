import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

interface ReportNavProps {
    activeReport?: string;
}

const ReportNav: React.FC<ReportNavProps> = ({ activeReport }) => {
    const { currentUser, loading } = useAuth(); // Added loading to handle initial state

    // Define report navigation items with permissions
    const reportItems = [
        { to: '/reports/DailyReport', label: 'Daily1', permission: 'view_daily_reports' },
        { to: '/reports/monthly', label: 'Monthly', permission: 'view_monthly_reports' },
        { to: '/reports/yearly', label: 'Yearly', permission: 'view_yearly_reports' },
        { to: '/reports/custom', label: 'Custom', permission: 'view_custom_reports' },
    ];

    // Filter items based on user permissions
    const filteredReportItems = React.useMemo(() => {
        if (loading || !currentUser) return []; // Return empty if loading or no user

        // Admin bypass: Show all items if role is 'admin'
        if (currentUser.role?.name === 'admin') {
            return reportItems;
        }

        // For non-admins, check specific permissions
        const userPermissions = new Set(currentUser.role?.permissions?.map(p => p.name) || []);
        return reportItems.filter(item =>
            userPermissions.has(item.permission)
        );
    }, [currentUser, loading]);

    const getIsActive = (path: string) => {
        return activeReport === path.split('/').pop() || undefined;
    };

    return (
        <nav className="w-full">
            <div className="flex flex-wrap gap-2 border-b border-gray-200 pb-4">
                {filteredReportItems.length > 0 ? (
                    filteredReportItems.map((item) => (
                        <NavLink
                            key={item.to}
                            to={item.to}
                            className={({ isActive }) =>
                                `px-3 py-2 text-sm font-medium rounded-md transition-colors ${
                                    (isActive || getIsActive(item.to))
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'text-gray-600 hover:bg-gray-100'
                                }`
                            }
                        >
                            {item.label}
                        </NavLink>
                    ))
                ) : (
                    <p className="text-gray-500">No reports available.</p>
                )}
            </div>
        </nav>
    );
};

export default ReportNav;