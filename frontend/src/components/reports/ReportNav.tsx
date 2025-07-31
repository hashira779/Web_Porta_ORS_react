import React from 'react';
import { NavLink } from 'react-router-dom';

interface ReportNavProps {
    activeReport?: string;
}

const ReportNav: React.FC<ReportNavProps> = ({ activeReport }) => {
    return (
        <div className="flex space-x-4 border-b border-gray-200 pb-4">
            <NavLink
                to="/reports/daily"
                className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-md ${
                        isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                    }`
                }
            >
                Daily
            </NavLink>
            <NavLink
                to="/reports/monthly"
                className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-md ${
                        isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                    }`
                }
            >
                Monthly
            </NavLink>
            <NavLink
                to="/reports/yearly"
                className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-md ${
                        isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                    }`
                }
            >
                Yearly
            </NavLink>
            <NavLink
                to="/reports/custom"
                className={({ isActive }) =>
                    `px-4 py-2 text-sm font-medium rounded-md ${
                        isActive ? 'bg-indigo-100 text-indigo-700' : 'text-gray-600 hover:bg-gray-100'
                    }`
                }
            >
                Custom
            </NavLink>
        </div>
    );
};

export default ReportNav;