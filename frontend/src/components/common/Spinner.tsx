// src/components/common/Spinner.tsx
import React from 'react';

interface SpinnerProps {
    size?: 'sm' | 'md' | 'lg';
    fullScreen?: boolean;
}

const Spinner: React.FC<SpinnerProps> = ({ size = 'md', fullScreen = false }) => {
    const sizes = {
        sm: 'h-4 w-4',
        md: 'h-8 w-8',
        lg: 'h-12 w-12'
    };

    return (
        <div className={`flex ${fullScreen ? 'min-h-screen' : ''} items-center justify-center`}>
            <div
                className={`${sizes[size]} animate-spin rounded-full border-4 border-solid border-indigo-600 border-t-transparent`}
            />
        </div>
    );
};

export default Spinner;