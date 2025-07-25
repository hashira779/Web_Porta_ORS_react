import React from 'react';

type CalSpinProps = {
    size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
    color?: 'primary' | 'secondary' | 'danger' | 'success' | 'warning';
    className?: string;
};

const CalSpin: React.FC<CalSpinProps> = ({
                                             size = 'md',
                                             color = 'primary',
                                             className = ''
                                         }) => {
    const sizeClasses = {
        xs: 'h-3 w-3',
        sm: 'h-4 w-4',
        md: 'h-5 w-5',
        lg: 'h-6 w-6',
        xl: 'h-8 w-8'
    };

    const colorClasses = {
        primary: 'text-indigo-600',
        secondary: 'text-gray-600',
        danger: 'text-red-600',
        success: 'text-green-600',
        warning: 'text-yellow-600'
    };

    return (
        <div className={`inline-flex items-center justify-center ${className}`}>
            <svg
                className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`}
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
            >
                <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                />
                <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                />
            </svg>
            <span className="sr-only">Loading...</span>
        </div>
    );
};

export default CalSpin;